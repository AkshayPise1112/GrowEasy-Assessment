"use client";

type LeadSourcesPageProps = {
  onOpenImport: () => void;
};

const sourceCards = [
  {
    name: "Google Ads",
    description: "Import leads from Google Ads lead form extensions.",
    connected: true,
  },
  {
    name: "WhatsApp",
    description: "Capture leads from WhatsApp Business conversations.",
    connected: true,
  },
  {
    name: "Facebook Leads",
    description: "Sync leads from Facebook Lead Ads campaigns.",
    connected: false,
  },
  {
    name: "CSV Import",
    description: "Bulk import leads from any CSV export.",
    connected: true,
    action: true,
  },
];

export function LeadSourcesPage({ onOpenImport }: LeadSourcesPageProps) {
  return (
    <div className="flex-1 px-4 py-6 sm:px-8">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Lead Sources</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Connect, manage, and control all your lead channels from one dashboard.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
        {sourceCards.map((card) => (
          <article
            key={card.name}
            className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-background)] p-5 shadow-card"
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--table-header)] text-sm font-bold text-[var(--accent-strong)]">
                {card.name.charAt(0)}
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                  card.connected
                    ? "bg-[var(--badge-success)] text-[var(--badge-success-text)]"
                    : "bg-[var(--badge-neutral)] text-[var(--muted-foreground)]"
                }`}
              >
                {card.connected ? "Connected" : "Not connected"}
              </span>
            </div>
            <h2 className="text-base font-semibold">{card.name}</h2>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">{card.description}</p>
            {card.action ? (
              <button
                type="button"
                onClick={onOpenImport}
                className="mt-4 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Import via CSV
              </button>
            ) : (
              <button
                type="button"
                className="mt-4 rounded-lg border border-[var(--card-border)] px-4 py-2 text-sm font-medium text-[var(--muted-foreground)]"
              >
                Manage
              </button>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
