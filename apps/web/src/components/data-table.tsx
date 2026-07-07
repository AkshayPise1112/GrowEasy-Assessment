"use client";

import { useMemo, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

type TableColumn<Row> = {
  key: string;
  label: string;
  width?: string;
  render: (row: Row) => React.ReactNode;
};

type DataTableProps<Row> = {
  columns: TableColumn<Row>[];
  rows: Row[];
  emptyMessage: string;
  maxHeight?: number;
};

export function DataTable<Row>({
  columns,
  rows,
  emptyMessage,
  maxHeight = 420,
}: DataTableProps<Row>) {
  const parentRef = useRef<HTMLDivElement | null>(null);

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60,
    overscan: 8,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();

  const tableWidth = useMemo(
    () => columns.map((column) => column.width ?? "minmax(140px, 1fr)").join(" "),
    [columns],
  );

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--card-border)] bg-[var(--table-header)] p-8 text-center text-sm text-[var(--muted-foreground)]">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--card-border)]">
      <div className="thin-scrollbar overflow-x-auto">
        <div className="min-w-[960px]">
          <div
            className="grid items-center gap-4 border-b border-[var(--card-border)] bg-[var(--table-header)] px-4 py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--muted-foreground)]"
            style={{ gridTemplateColumns: tableWidth }}
          >
            {columns.map((column) => (
              <div key={column.key}>{column.label}</div>
            ))}
          </div>

          <div
            ref={parentRef}
            className="thin-scrollbar overflow-y-auto"
            style={{ maxHeight }}
          >
            <div
              className="relative"
              style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
            >
              {virtualRows.map((virtualRow) => {
                const row = rows[virtualRow.index];

                if (row === undefined) {
                  return null;
                }

                return (
                  <div
                    key={virtualRow.key}
                    className="absolute left-0 top-0 grid w-full items-center gap-4 border-b border-[var(--card-border)] bg-[var(--card-background)] px-4 py-3 text-sm"
                    style={{
                      gridTemplateColumns: tableWidth,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    {columns.map((column) => (
                      <div key={column.key} className="min-w-0">
                        {column.render(row)}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
