"use client";

import { ThemeToggle } from "@/components/theme-toggle";

type Page = "lead-sources" | "manage-leads";

type NavItem = {
  id: string;
  label: string;
  page?: Page;
};

const mainNav: NavItem[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "generate", label: "Generate Leads" },
  { id: "manage-leads", label: "Manage Leads", page: "manage-leads" },
  { id: "engage", label: "Engage Leads" },
];

const controlNav: NavItem[] = [
  { id: "team", label: "Team Members" },
  { id: "lead-sources", label: "Lead Sources", page: "lead-sources" },
  { id: "ads", label: "Ad Accounts" },
  { id: "whatsapp", label: "WhatsApp Account" },
  { id: "tele", label: "Tele Calling" },
  { id: "crm", label: "CRM Fields" },
  { id: "api", label: "API Center" },
];

type AppSidebarProps = {
  activePage: Page;
  onNavigate: (page: Page) => void;
};

export function AppSidebar({ activePage, onNavigate }: AppSidebarProps) {
  return (
    <aside className="hidden w-[248px] shrink-0 border-r border-[var(--card-border)] bg-[var(--sidebar-background)] px-4 py-6 lg:flex lg:flex-col">
      <div className="mb-6 flex items-center gap-2.5 px-2">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--brand)] text-xs font-bold text-white">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M4 18L12 6l8 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <span className="text-xl font-semibold tracking-tight">GrowEasy</span>
      </div>

      <div className="mb-6 rounded-xl border border-[var(--card-border)] bg-[var(--table-header)] px-3 py-3">
        <p className="text-sm font-semibold">Test Corp</p>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
          Owner
        </p>
      </div>

      <nav className="flex-1 space-y-6">
        <div>
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
            Main
          </p>
          <div className="space-y-0.5">
            {mainNav.map((item) => {
              const active = item.page === activePage;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => item.page && onNavigate(item.page)}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ${
                    active
                      ? "bg-[var(--accent)] text-[var(--accent-strong)]"
                      : "text-[var(--muted-foreground)] hover:bg-[var(--table-header)]"
                  }`}
                >
                  <NavIcon name={item.id} />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
            Control Center
          </p>
          <div className="space-y-0.5">
            {controlNav.map((item) => {
              const active = item.page === activePage;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => item.page && onNavigate(item.page)}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ${
                    active
                      ? "bg-[var(--accent)] text-[var(--accent-strong)]"
                      : "text-[var(--muted-foreground)] hover:bg-[var(--table-header)]"
                  }`}
                >
                  <NavIcon name={item.id} />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      <div className="mt-4 space-y-2">
        <ThemeToggle className="w-full justify-center" showLabel />
        <button
          type="button"
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-[var(--muted-foreground)] hover:bg-[var(--table-header)]"
        >
          <NavIcon name="business" />
          Business Center
        </button>
      </div>
    </aside>
  );
}

function NavIcon({ name }: { name: string }) {
  const className = "h-4 w-4 shrink-0 opacity-70";

  switch (name) {
    case "dashboard":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
          <rect x="3" y="3" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
          <rect x="13" y="3" width="8" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
          <rect x="13" y="10" width="8" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
          <rect x="3" y="13" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
    case "lead-sources":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M4 7h16M4 12h16M4 17h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case "manage-leads":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
          <ellipse cx="12" cy="6" rx="8" ry="3" stroke="currentColor" strokeWidth="1.5" />
          <path d="M4 6v6c0 1.66 3.58 3 8 3s8-1.34 8-3V6" stroke="currentColor" strokeWidth="1.5" />
          <path d="M4 12v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
    default:
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
  }
}
