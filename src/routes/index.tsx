import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nimbus · Stock Control for small teams" },
      {
        name: "description",
        content:
          "Nimbus tracks stock counts, stock in and out, returns and low-stock alerts in one calm dashboard.",
      },
      { property: "og:title", content: "Nimbus · Stock Control for small teams" },
      {
        property: "og:description",
        content:
          "Nimbus tracks stock counts, stock in and out, returns and low-stock alerts in one calm dashboard.",
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

function Landing() {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="h-14 border-b border-ink/10 glass flex items-center justify-between px-6">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-lg bg-ink grid place-items-center">
            <span className="text-paper font-semibold text-[13px] font-display">N</span>
          </div>
          <div className="leading-none">
            <div className="text-[13px] font-semibold font-display">Nimbus</div>
            <div className="text-[11px] text-ink/55">Stock Control</div>
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
          Nimbus keeps a running count of every product, records each stock in, stock out and
          return, and warns you before anything runs out.
        </p>
        <div className="mt-7 flex gap-2">
          <Link
            to="/auth"
            className="text-sm rounded-lg px-4 py-2 bg-ink text-paper ring-1 ring-ink"
          >
            Start counting
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
      </main>
    </div>
  );
}
