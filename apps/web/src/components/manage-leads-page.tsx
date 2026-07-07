"use client";

import { useMemo, useState } from "react";

import { StatusBadge } from "@/components/status-badge";
import { DataTable } from "@/components/data-table";
import type { ImportSummary, ParsedLead, SkippedRecord } from "@/lib/types";

type ManageLeadsPageProps = {
  records: ParsedLead[];
  skipped: SkippedRecord[];
  summary: ImportSummary;
  onOpenImport: () => void;
};

const PAGE_SIZE = 10;

function formatDate(value: string) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatContact(lead: ParsedLead) {
  const code = lead.country_code ? lead.country_code.replace(/^\+?/, "+") : "";
  const mobile = lead.mobile_without_country_code;
  if (!mobile) {
    return "—";
  }

  return `${code}${mobile}`;
}

export function ManageLeadsPage({ records, skipped, summary, onOpenImport }: ManageLeadsPageProps) {
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [activeTab, setActiveTab] = useState<"imported" | "skipped">("imported");

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return records;
    }

    return records.filter(
      (lead) =>
        lead.name.toLowerCase().includes(query) ||
        lead.email.toLowerCase().includes(query) ||
        lead.mobile_without_country_code.includes(query),
    );
  }, [records, search]);

  const visibleRecords = filteredRecords.slice(0, visibleCount);

  const stats = [
    { label: "Total Leads", value: summary.importedCount },
    { label: "Total Imported", value: summary.importedCount },
    { label: "Total Skipped", value: summary.skippedCount },
    {
      label: "Success Rate",
      value:
        summary.totalRows > 0
          ? `${Math.round((summary.importedCount / summary.totalRows) * 100)}%`
          : "—",
    },
  ];

  const leadColumns = [
    {
      key: "name",
      label: "Lead Name",
      width: "160px",
      render: (row: ParsedLead) => <span className="font-semibold text-[var(--foreground)]">{row.name || "—"}</span>,
    },
    {
      key: "email",
      label: "Email",
      width: "200px",
      render: (row: ParsedLead) => row.email || "—",
    },
    {
      key: "contact",
      label: "Contact",
      width: "150px",
      render: (row: ParsedLead) => formatContact(row),
    },
    {
      key: "created_at",
      label: "Date Created",
      width: "180px",
      render: (row: ParsedLead) => formatDate(row.created_at),
    },
    {
      key: "company",
      label: "Company",
      width: "140px",
      render: (row: ParsedLead) => row.company || "—",
    },
    {
      key: "crm_status",
      label: "Status",
      width: "140px",
      render: (row: ParsedLead) => <StatusBadge status={row.crm_status} />,
    },
    {
      key: "quality",
      label: "Quality",
      width: "90px",
      render: () => <span className="text-[var(--muted-foreground)]">—</span>,
    },
    {
      key: "actions",
      label: "Actions",
      width: "100px",
      render: () => (
        <button type="button" className="text-sm font-medium text-[var(--accent-strong)]">
          More &gt;
        </button>
      ),
    },
  ];

  const skippedColumns = [
    {
      key: "rowNumber",
      label: "Row",
      width: "80px",
      render: (row: SkippedRecord) => `#${row.rowNumber}`,
    },
    {
      key: "reason",
      label: "Reason",
      width: "280px",
      render: (row: SkippedRecord) => row.reason,
    },
    {
      key: "snapshot",
      label: "Source",
      width: "minmax(300px, 1fr)",
      render: (row: SkippedRecord) => (
        <span className="block truncate text-[var(--muted-foreground)]">
          {Object.entries(row.source)
            .slice(0, 3)
            .map(([k, v]) => `${k}: ${v}`)
            .join(" | ") || "—"}
        </span>
      ),
    },
  ];

  return (
    <div className="flex-1 px-4 py-6 sm:px-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Manage Your Leads</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Monitor lead status, assign tasks, and close deals faster.
        </p>
      </header>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <article
            key={stat.label}
            className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-background)] px-5 py-4 shadow-card"
          >
            <p className="text-sm text-[var(--muted-foreground)]">{stat.label}</p>
            <p className="mt-2 text-2xl font-semibold">{stat.value}</p>
          </article>
        ))}
      </div>

      <section className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-background)] shadow-card">
        <div className="flex flex-col gap-4 border-b border-[var(--card-border)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Your Leads</h2>
            <p className="text-sm text-[var(--muted-foreground)]">
              Imported {summary.importedCount} · Skipped {summary.skippedCount}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-lg border border-[var(--card-border)] bg-[var(--table-header)] p-1">
              <button
                type="button"
                onClick={() => setActiveTab("imported")}
                className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                  activeTab === "imported"
                    ? "bg-[var(--elevated)] shadow-card"
                    : "text-[var(--muted-foreground)]"
                }`}
              >
                Imported
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("skipped")}
                className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                  activeTab === "skipped"
                    ? "bg-[var(--elevated)] shadow-card"
                    : "text-[var(--muted-foreground)]"
                }`}
              >
                Skipped ({skipped.length})
              </button>
            </div>

            {activeTab === "imported" ? (
              <div className="flex items-center gap-2">
                <input
                  type="search"
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setVisibleCount(PAGE_SIZE);
                  }}
                  placeholder="Enter email or phone number..."
                  className="w-56 rounded-lg border border-[var(--card-border)] bg-[var(--elevated)] px-3 py-2 text-sm outline-none focus:border-[var(--accent-strong)]"
                />
                <button
                  type="button"
                  className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--brand)] text-white"
                  aria-label="Search"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M16 16l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            ) : null}

            <button
              type="button"
              onClick={onOpenImport}
              className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white"
            >
              Import CSV
            </button>
          </div>
        </div>

        <div className="p-5">
          {activeTab === "imported" ? (
            <>
              <DataTable
                columns={leadColumns}
                rows={visibleRecords}
                emptyMessage="No imported leads yet. Import a CSV from Lead Sources to get started."
                maxHeight={480}
              />
              {visibleCount < filteredRecords.length ? (
                <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
                    className="rounded-lg border border-[var(--card-border)] px-6 py-2 text-sm font-medium hover:bg-[var(--table-header)]"
                  >
                    Load more
                  </button>
                </div>
              ) : null}
            </>
          ) : (
            <DataTable
              columns={skippedColumns}
              rows={skipped}
              emptyMessage="No skipped records."
              maxHeight={480}
            />
          )}
        </div>
      </section>
    </div>
  );
}
