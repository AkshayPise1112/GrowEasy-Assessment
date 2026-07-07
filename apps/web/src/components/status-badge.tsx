import type { CrmStatus } from "@/lib/types";

const statusLabels: Record<CrmStatus, string> = {
  GOOD_LEAD_FOLLOW_UP: "Good Lead",
  DID_NOT_CONNECT: "Not Dialed",
  BAD_LEAD: "Bad Lead",
  SALE_DONE: "Sale Done",
};

const statusStyles: Record<CrmStatus, string> = {
  GOOD_LEAD_FOLLOW_UP: "bg-[var(--badge-success)] text-[var(--badge-success-text)]",
  DID_NOT_CONNECT: "bg-[var(--badge-neutral)] text-[var(--muted-foreground)]",
  BAD_LEAD: "bg-[var(--badge-danger)] text-[var(--badge-danger-text)]",
  SALE_DONE: "bg-[var(--badge-info)] text-[var(--badge-info-text)]",
};

export function StatusBadge({ status }: { status: CrmStatus | "" }) {
  if (!status) {
    return (
      <span className="inline-flex rounded-full bg-[var(--badge-neutral)] px-3 py-1 text-xs font-semibold text-[var(--muted-foreground)]">
        Not Dialed
      </span>
    );
  }

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[status]}`}>
      {statusLabels[status]}
    </span>
  );
}
