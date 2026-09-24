import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lexicon · Admin inventory operations" },
      {
        name: "description",
        content:
          "Lexicon helps admin teams track stock counts, movements, returns and reorder levels in one place.",
      },
      { property: "og:title", content: "Lexicon · Admin inventory operations" },
      {
        property: "og:description",
        content:
          "Lexicon helps admin teams track stock counts, movements, returns and reorder levels in one place.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const points = [
  { label: "Stock counts", text: "Live quantity per product with reorder points you set." },
  { label: "In · Out · Return", text: "Every movement logged with a reference and a running balance." },
  { label: "Low-stock alerts", text: "A red banner and alert list the moment a line dips below par." },
];

const faqs = [
  {
    question: "How does Lexicon work for an operator?",
    answer:
      "The operator signs in with the approved admin email and password, then adds products, logs stock movements, and tracks what is coming in, going out, or being returned.",
  },
  {
    question: "Where do stock updates happen?",
    answer:
      "Every stock action is recorded in the dashboard under Movements. The system updates the product quantity automatically based on the movement type and reference entered.",
  },
  {
    question: "How does the system know when stock is low?",
    answer:
      "Each product has a reorder point. When the quantity drops to or below that threshold, the dashboard shows a low-stock alert and highlights the affected items.",
  },
  {
    question: "Who can access the system?",
    answer:
      "This setup is designed for admin-only access. Only approved email accounts created in the backend can sign in and use the system.",
  },
  {
    question: "What is the benefit for a client or manager?",
    answer:
      "Clients and managers get a quick view of inventory health, movement history, stock movement summaries, and the ability to act before shortages affect operations.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="h-14 border-b border-ink/10 glass flex items-center justify-between px-6">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-lg bg-ink grid place-items-center">
            <span className="text-paper font-semibold text-[13px] font-display">L</span>
          </div>
          <div className="leading-none">
            <div className="text-[13px] font-semibold font-display">Lexicon</div>
            <div className="text-[11px] text-ink/55">Admin</div>
          </div>
        </div>
        <Link
          to="/auth"
          className="text-sm rounded-lg px-3 py-1.5 bg-ink text-paper ring-1 ring-ink"
        >
          Sign in
        </Link>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-20">
        <p className="text-[11px] uppercase tracking-[0.12em] text-ink/50">Warehouse operations</p>
        <h1 className="mt-3 font-display text-4xl sm:text-5xl font-semibold tracking-tight text-balance max-w-[20ch]">
          Know exactly what is on the shelf.
        </h1>
        <p className="mt-4 max-w-[60ch] text-ink/60 text-pretty">
          Lexicon keeps a running count of every product, records each stock in, stock out and
          return, and warns you before anything runs out.
        </p>
        <div className="mt-7 flex gap-2">
          <Link
            to="/auth"
            className="text-sm rounded-lg px-4 py-2 bg-ink text-paper ring-1 ring-ink"
          >
            Open dashboard
          </Link>
        </div>

        <div className="mt-16 grid sm:grid-cols-3 gap-3">
          {points.map((p) => (
            <div key={p.label} className="rounded-xl glass ring-1 ring-ink/5 px-4 py-4">
              <div className="text-[11px] uppercase tracking-[0.12em] text-ink/50">{p.label}</div>
              <p className="mt-2 text-sm text-ink/70 text-pretty">{p.text}</p>
            </div>
          ))}
        </div>

        <section className="mt-20 rounded-2xl border border-ink/10 bg-panel/40 p-6 sm:p-8">
          <div className="mb-6">
            <p className="text-[11px] uppercase tracking-[0.12em] text-ink/50">FAQ</p>
            <h2 className="mt-2 font-display text-3xl font-semibold">How the system works</h2>
          </div>

          <div className="space-y-4">
            {faqs.map((item) => (
              <div key={item.question} className="rounded-xl border border-ink/10 bg-paper/70 p-4">
                <h3 className="text-base font-semibold text-ink">{item.question}</h3>
                <p className="mt-2 text-sm text-ink/70 text-pretty">{item.answer}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
