CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile select" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  sku text NOT NULL,
  category text,
  supplier text,
  unit text DEFAULT 'pcs',
  quantity integer NOT NULL DEFAULT 0,
  reorder_point integer NOT NULL DEFAULT 10,
  unit_cost numeric(12,2) DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, sku)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own products select" ON public.products FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own products insert" ON public.products FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own products update" ON public.products FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own products delete" ON public.products FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('in','out','return')),
  quantity integer NOT NULL CHECK (quantity > 0),
  reference text,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX stock_movements_user_created_idx ON public.stock_movements (user_id, created_at DESC);
GRANT SELECT, INSERT ON public.stock_movements TO authenticated;
GRANT ALL ON public.stock_movements TO service_role;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own movements select" ON public.stock_movements FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own movements insert" ON public.stock_movements FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.apply_stock_movement()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  delta integer;
  current_qty integer;
BEGIN
  SELECT quantity INTO current_qty FROM public.products WHERE id = NEW.product_id AND user_id = NEW.user_id FOR UPDATE;
  IF current_qty IS NULL THEN
    RAISE EXCEPTION 'Product not found';
  END IF;
  IF NEW.type = 'out' THEN
    delta := -NEW.quantity;
    IF current_qty + delta < 0 THEN
      RAISE EXCEPTION 'Not enough stock: only % available', current_qty;
    END IF;
  ELSE
    delta := NEW.quantity;
  END IF;
  UPDATE public.products SET quantity = quantity + delta, updated_at = now() WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$;
CREATE TRIGGER apply_stock_movement_trg
AFTER INSERT ON public.stock_movements
FOR EACH ROW EXECUTE FUNCTION public.apply_stock_movement();