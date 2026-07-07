"use client";

import { useDropzone } from "react-dropzone";

import { downloadSampleCsv, requiredHeaders } from "@/lib/sample-csv";
import type { PreviewRow } from "@/lib/types";

type ImportState = "idle" | "parsing" | "preview" | "uploading" | "error";

type ImportCsvModalProps = {
  open: boolean;
  file: File | null;
  columns: string[];
  previewRows: PreviewRow[];
  state: ImportState;
  error: string;
  progressMessage: string;
  processedBatches: number;
  totalBatches: number;
  onClose: () => void;
  onDrop: (files: File[]) => void;
  onRemoveFile: () => void;
  onConfirmImport: () => void;
};

export function ImportCsvModal({
  open,
  file,
  columns,
  previewRows,
  state,
  error,
  progressMessage,
  processedBatches,
  totalBatches,
  onClose,
  onDrop,
  onRemoveFile,
  onConfirmImport,
}: ImportCsvModalProps) {
  const { getRootProps, getInputProps, isDragActive, open: openFilePicker } = useDropzone({
    onDrop,
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
    accept: {
      "text/csv": [".csv"],
      "application/vnd.ms-excel": [".csv"],
    },
    noClick: true,
    disabled: state === "uploading" || state === "parsing",
  });

  if (!open) {
    return null;
  }

  const showPreview = file && (state === "preview" || state === "uploading" || state === "error");
  const progressPercent =
    totalBatches > 0 ? Math.round((processedBatches / totalBatches) * 100) : state === "uploading" ? 8 : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close modal backdrop"
        className="absolute inset-0 bg-[var(--modal-backdrop)]"
        onClick={state === "uploading" ? undefined : onClose}
      />

      <div className="relative z-10 flex max-h-[90vh] w-full max-w-[720px] flex-col overflow-hidden rounded-2xl bg-[var(--card-background)] shadow-2xl">
        <div className="flex items-start justify-between border-b border-[var(--card-border)] px-6 py-5">
          <div>
            <h2 className="text-xl font-semibold">Import Leads via CSV</h2>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Upload a CSV file to bulk import leads into your system.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={state === "uploading"}
            className="rounded-lg p-1.5 text-[var(--muted-foreground)] hover:bg-[var(--table-header)] disabled:opacity-40"
            aria-label="Close"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="thin-scrollbar flex-1 overflow-y-auto px-6 py-5">
          {!showPreview ? (
            <>
              <div
                {...getRootProps()}
                onClick={openFilePicker}
                className={`cursor-pointer rounded-xl border border-dashed px-6 py-10 text-center transition ${
                  isDragActive
                    ? "border-[var(--accent-strong)] bg-[var(--accent)]"
                    : "border-[var(--card-border)] bg-[var(--table-header)]"
                }`}
              >
                <input {...getInputProps()} />
                <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-xl border border-[var(--card-border)] bg-[var(--elevated)]">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path
                      d="M12 16V8m0 0l-3 3m3-3l3 3M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <p className="text-lg font-semibold">
                  {isDragActive ? "Drop your CSV file here" : "Drop your CSV file here"}
                </p>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">or click to browse files</p>
                <span className="mt-4 inline-block rounded-full bg-[var(--elevated)] px-3 py-1 text-xs text-[var(--muted-foreground)] shadow-card">
                  Supported file: .csv (max 5MB)
                </span>
              </div>

              <div className="mt-5 rounded-xl border border-[var(--card-border)] bg-[var(--table-header)] px-4 py-4">
                <p className="text-sm font-medium">Required headers</p>
                <p className="mt-2 text-xs leading-relaxed text-[var(--muted-foreground)]">
                  {requiredHeaders.join(", ")}
                </p>
                <p className="mt-2 text-xs text-[var(--muted-foreground)]">
                  Template includes default + custom CRM fields to reduce upload errors.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    void downloadSampleCsv().catch(() => undefined);
                  }}
                  className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-[var(--accent-strong)] hover:underline"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path
                      d="M12 3v12m0 0l-4-4m4 4l4-4M4 19h16"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Download Sample CSV Template
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="mb-4 flex items-center gap-3 rounded-xl border border-[var(--card-border)] bg-[var(--table-header)] px-4 py-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[var(--elevated)] text-xs font-bold text-[var(--accent-strong)]">
                  CSV
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{file?.name}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Size: {((file?.size ?? 0) / 1024).toFixed(2)} KB
                  </p>
                </div>
                {state !== "uploading" ? (
                  <button
                    type="button"
                    onClick={onRemoveFile}
                    className="rounded-lg p-1.5 text-[var(--muted-foreground)] hover:bg-[var(--elevated)]"
                    aria-label="Remove file"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </button>
                ) : null}
              </div>

              <ModalPreviewTable columns={columns} rows={previewRows} />

              {state === "uploading" ? (
                <div className="mt-4 rounded-xl border border-[var(--card-border)] bg-[var(--table-header)] px-4 py-4">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium">AI processing...</span>
                    <span className="text-[var(--muted-foreground)]">{progressPercent}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[var(--elevated)]">
                    <div
                      className="h-full rounded-full bg-[var(--primary)] transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-[var(--muted-foreground)]">{progressMessage}</p>
                </div>
              ) : null}

              {error ? (
                <div className="mt-4 rounded-xl bg-[var(--badge-danger)] px-4 py-3 text-sm text-[var(--badge-danger-text)]">
                  {error}
                </div>
              ) : null}
            </>
          )}

          {state === "parsing" ? (
            <p className="mt-4 text-center text-sm text-[var(--muted-foreground)]">Parsing CSV preview...</p>
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-[var(--card-border)] px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={state === "uploading"}
            className="rounded-lg border border-[var(--card-border)] px-5 py-2.5 text-sm font-medium disabled:opacity-50"
          >
            Cancel
          </button>
          {showPreview ? (
            <button
              type="button"
              onClick={onConfirmImport}
              disabled={state === "uploading" || previewRows.length === 0}
              className="rounded-lg bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {state === "uploading" ? "Uploading..." : "Upload File"}
            </button>
          ) : (
            <button
              type="button"
              onClick={openFilePicker}
              disabled={state === "parsing"}
              className="rounded-lg bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              Upload File
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ModalPreviewTable({ columns, rows }: { columns: string[]; rows: PreviewRow[] }) {
  const displayColumns = columns.length > 0 ? columns : ["Column 1"];

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--card-border)]">
      <div className="thin-scrollbar max-h-[280px] overflow-auto">
        <table className="w-full min-w-[600px] border-collapse text-left text-sm">
          <thead className="sticky top-0 z-10 bg-[var(--table-header)]">
            <tr>
              {displayColumns.map((column) => (
                <th
                  key={column}
                  className="whitespace-nowrap border-b border-[var(--card-border)] px-4 py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--muted-foreground)]"
                >
                  {column.replaceAll("_", " ")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-[var(--card-border)] last:border-0">
                {displayColumns.map((column) => (
                  <td key={column} className="whitespace-nowrap px-4 py-3 text-[var(--muted-foreground)]">
                    {row.values[column] || "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
