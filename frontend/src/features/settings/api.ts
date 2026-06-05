import { apiRequest } from "@/lib/api";

export type ExportData = Record<string, unknown>;

export type HealthStatus = {
  status?: string;
  service?: string;
  database?: string;
};

export function getFullExport() {
  return apiRequest<ExportData>("/api/export/full");
}

export function getModuleExport(module: string) {
  return apiRequest<ExportData>(`/api/export/${module}`);
}

export function getBackendHealth() {
  return apiRequest<HealthStatus>("/health");
}

export function getDatabaseHealth() {
  return apiRequest<HealthStatus>("/health/db");
}
