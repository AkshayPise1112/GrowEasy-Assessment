"use client";

import { useState } from "react";

import { AppSidebar } from "@/components/app-sidebar";
import { ImportCsvModal } from "@/components/import-csv-modal";
import { LeadSourcesPage } from "@/components/lead-sources-page";
import { ManageLeadsPage } from "@/components/manage-leads-page";
import { ThemeToggle } from "@/components/theme-toggle";
import { getImportStreamUrl } from "@/lib/api";
import { parseCsvPreview } from "@/lib/csv";
import type {
  ImportStreamEvent,
  ImportSummary,
  ParsedLead,
  PreviewRow,
  ResultEvent,
  SkippedRecord,
} from "@/lib/types";

type Page = "lead-sources" | "manage-leads";
type ImportState = "idle" | "parsing" | "preview" | "uploading" | "error";

const emptySummary: ImportSummary = {
  totalRows: 0,
  importedCount: 0,
  skippedCount: 0,
  processedBatches: 0,
  totalBatches: 0,
};

export function ImporterDashboard() {
  const [activePage, setActivePage] = useState<Page>("lead-sources");
  const [modalOpen, setModalOpen] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [totalRows, setTotalRows] = useState(0);

  const [importState, setImportState] = useState<ImportState>("idle");
  const [error, setError] = useState("");
  const [progressMessage, setProgressMessage] = useState("");
  const [processedBatches, setProcessedBatches] = useState(0);
  const [totalBatches, setTotalBatches] = useState(0);

  const [records, setRecords] = useState<ParsedLead[]>([]);
  const [skipped, setSkipped] = useState<SkippedRecord[]>([]);
  const [summary, setSummary] = useState<ImportSummary>(emptySummary);

  const resetImport = () => {
    setFile(null);
    setColumns([]);
    setPreviewRows([]);
    setTotalRows(0);
    setImportState("idle");
    setError("");
    setProgressMessage("");
    setProcessedBatches(0);
    setTotalBatches(0);
  };

  const openModal = () => {
    resetImport();
    setModalOpen(true);
  };

  const closeModal = () => {
    if (importState === "uploading") {
      return;
    }

    setModalOpen(false);
    resetImport();
  };

  const handleDrop = async (acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    if (!selectedFile) {
      return;
    }

    setError("");
    setFile(selectedFile);
    setImportState("parsing");
    setProgressMessage("Parsing CSV locally for preview.");

    try {
      const preview = await parseCsvPreview(selectedFile);
      setColumns(preview.columns);
      setPreviewRows(preview.rows);
      setTotalRows(preview.totalRows);
      setImportState("preview");
    } catch (parseError) {
      setImportState("error");
      setError(parseError instanceof Error ? parseError.message : "Failed to read CSV.");
    }
  };

  const confirmImport = async () => {
    if (!file) {
      return;
    }

    setImportState("uploading");
    setError("");
    setProgressMessage("Uploading file to backend.");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(getImportStreamUrl(), {
        method: "POST",
        body: formData,
      });

      if (!response.ok || !response.body) {
        const errorText = await response.text().catch(() => "");
        throw new Error(errorText || "Backend could not process the import.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          if (!part.trim()) {
            continue;
          }

          const event = JSON.parse(part) as ImportStreamEvent;

          if (event.type === "progress") {
            setProcessedBatches(event.processedBatches);
            setTotalBatches(event.totalBatches);
            setProgressMessage(event.message);
          }

          if (event.type === "result") {
            const finalResult = event as ResultEvent;
            setRecords(finalResult.records);
            setSkipped(finalResult.skipped);
            setSummary(finalResult.summary);
            setProcessedBatches(finalResult.summary.processedBatches);
            setTotalBatches(finalResult.summary.totalBatches);
            setProgressMessage("Import completed successfully.");
            setModalOpen(false);
            resetImport();
            setActivePage("manage-leads");
          }

          if (event.type === "error") {
            throw new Error(event.message);
          }
        }
      }
    } catch (importError) {
      setImportState("error");

      if (importError instanceof TypeError) {
        setError(
          "Could not reach the API. Make sure the backend is running on port 4000, then refresh and try again.",
        );
      } else {
        setError(importError instanceof Error ? importError.message : "Import failed.");
      }

      setProgressMessage("Import failed.");
    }
  };

  return (
    <div className="flex min-h-screen bg-[var(--page-background)]">
      <AppSidebar activePage={activePage} onNavigate={setActivePage} />

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-end border-b border-[var(--card-border)] px-4 py-3 lg:hidden">
          <ThemeToggle />
        </div>

        {activePage === "lead-sources" ? (
          <LeadSourcesPage onOpenImport={openModal} />
        ) : (
          <ManageLeadsPage
            records={records}
            skipped={skipped}
            summary={summary.totalRows > 0 ? summary : { ...summary, totalRows }}
            onOpenImport={openModal}
          />
        )}
      </div>

      <ImportCsvModal
        open={modalOpen}
        file={file}
        columns={columns}
        previewRows={previewRows}
        state={importState}
        error={error}
        progressMessage={progressMessage}
        processedBatches={processedBatches}
        totalBatches={totalBatches}
        onClose={closeModal}
        onDrop={handleDrop}
        onRemoveFile={resetImport}
        onConfirmImport={confirmImport}
      />
    </div>
  );
}
