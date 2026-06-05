"use client";

import { useEffect, useState } from "react";

import {
  getBackendHealth,
  getDatabaseHealth,
  getFullExport,
  getModuleExport,
  type HealthStatus,
} from "./api";
import {
  AppButton,
  Badge,
  ErrorState,
  NoticeState,
  PageHeader,
  SectionCard,
} from "@/components/ui";
import { palettes, savedPalette, type PaletteValue } from "@/lib/palette";

const SHEETS_STARK_MODE_STORAGE_KEY = "calendar:sheets-stark-mode";

const exportModules = [
  { key: "notes", label: "Notes" },
  { key: "tasks", label: "Tasks" },
  { key: "calendar", label: "Calendar" },
  { key: "tracker", label: "Tracker" },
  { key: "categories", label: "Categories" },
  { key: "sheets", label: "Sheets" },
];

export function SettingsPage() {
  const [backendHealth, setBackendHealth] = useState<HealthStatus | null>(null);
  const [databaseHealth, setDatabaseHealth] = useState<HealthStatus | null>(null);
  const [palette, setPalette] = useState<PaletteValue>("robot-vanilla");
  const [isStarkMode, setIsStarkMode] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [diagnosticError, setDiagnosticError] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    setPalette(savedPalette());
    setIsStarkMode(
      window.localStorage.getItem(SHEETS_STARK_MODE_STORAGE_KEY) === "true",
    );
    refreshDiagnostics();
  }, []);

  async function refreshDiagnostics() {
    setDiagnosticError(null);
    try {
      const [backend, database] = await Promise.all([
        getBackendHealth(),
        getDatabaseHealth(),
      ]);
      setBackendHealth(backend);
      setDatabaseHealth(database);
    } catch (caught) {
      setDiagnosticError(
        caught instanceof Error ? caught.message : "Diagnostics failed",
      );
    }
  }

  async function downloadFullExport() {
    await downloadExport("colendar-full", getFullExport);
  }

  async function downloadModuleExport(module: string) {
    await downloadExport(`colendar-${module}`, () => getModuleExport(module));
  }

  async function downloadExport(
    name: string,
    loadExport: () => Promise<Record<string, unknown>>,
  ) {
    setIsExporting(true);
    setExportError(null);
    setNotice(null);
    try {
      const data = await loadExport();
      downloadJson(data, `${name}-${timestampForFilename()}.json`);
      setNotice("Export downloaded. Keep it somewhere safe before risky changes.");
    } catch (caught) {
      setExportError(caught instanceof Error ? caught.message : "Export failed");
    } finally {
      setIsExporting(false);
    }
  }

  const paletteLabel =
    palettes.find((item) => item.value === palette)?.label ?? "Robot Vanilla";

  return (
    <main className="app-page">
      <section className="app-container space-y-6">
        <PageHeader
          eyebrow="Settings"
          title="Settings & Utilities"
          description="Export local data, check app health, and keep the v0.1 alpha safety notes close at hand."
        />

        <SectionCard
          eyebrow="Backup"
          title="Export Local Data"
          action={
            <AppButton
              disabled={isExporting}
              onClick={downloadFullExport}
              type="button"
              variant="primary"
            >
              {isExporting ? "Exporting..." : "Download full JSON"}
            </AppButton>
          }
        >
          <div className="mt-4 space-y-4">
            <p className="app-muted text-sm leading-6">
              Exports are backup-style JSON files from the local database. They
              include archived records for completeness. Import/restore is not
              implemented yet, so keep Docker volumes and export files safe.
            </p>
            {notice ? <NoticeState message={notice} /> : null}
            {exportError ? <ErrorState message={exportError} /> : null}
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {exportModules.map((module) => (
                <AppButton
                  disabled={isExporting}
                  key={module.key}
                  onClick={() => downloadModuleExport(module.key)}
                  type="button"
                >
                  Export {module.label}
                </AppButton>
              ))}
            </div>
          </div>
        </SectionCard>

        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <SectionCard
            eyebrow="Diagnostics"
            title="App Status"
            action={
              <AppButton onClick={refreshDiagnostics} type="button">
                Refresh
              </AppButton>
            }
          >
            <div className="mt-4 grid gap-3">
              {diagnosticError ? <ErrorState message={diagnosticError} /> : null}
              <StatusRow
                label="Backend"
                value={backendHealth?.status ?? "checking"}
              />
              <StatusRow
                label="Database"
                value={databaseHealth?.database ?? "checking"}
              />
              <StatusRow label="Version" value="v0.1-alpha" />
              <StatusRow label="Palette" value={paletteLabel} />
              <StatusRow
                label="Sheets Stark Mode"
                value={isStarkMode ? "enabled" : "disabled"}
              />
              <StatusRow label="Export readiness" value="available" />
            </div>
          </SectionCard>

          <SectionCard eyebrow="Local First" title="Data Safety">
            <div className="mt-4 space-y-3 text-sm leading-6 text-[#3b3732]">
              <p>
                COlendar stores app data in the local PostgreSQL database used
                by Docker Compose. Docker volumes are the durable storage layer.
              </p>
              <p>
                Create exports before migrations, resets, experiments, or Docker
                volume changes. Deleting volumes can delete local app data.
              </p>
              <p>
                Export endpoints contain personal productivity data. Keep the app
                on trusted local machines unless auth and deployment hardening
                are added later.
              </p>
            </div>
          </SectionCard>
        </div>

        <SectionCard eyebrow="v0.1 Alpha" title="Known Limitations">
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {[
              "Local-first only",
              "No auth",
              "No import/restore yet",
              "No cloud backup",
              "No external calendar sync",
              "No mobile-first UI",
              "No notifications/reminders",
              "No production hardening",
            ].map((item) => (
              <Badge className="justify-center px-3 py-2" key={item}>
                {item}
              </Badge>
            ))}
          </div>
        </SectionCard>
      </section>
    </main>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  const isHealthy = ["ok", "connected", "available", "v0.1-alpha"].includes(value);
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-[#ded6ca] bg-[var(--color-app-bg-soft)] px-3 py-2 text-sm">
      <span className="font-medium text-[#3b3732]">{label}</span>
      <Badge
        className={
          isHealthy
            ? "border-[var(--color-primary-ring)] bg-[var(--color-primary-soft)] text-[var(--color-primary-strong)]"
            : ""
        }
      >
        {value}
      </Badge>
    </div>
  );
}

function downloadJson(data: Record<string, unknown>, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function timestampForFilename() {
  return new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
}
