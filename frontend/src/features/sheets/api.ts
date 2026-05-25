import type { Sheet, SheetDetail, SheetSlotsUpdate } from "./types";
import { apiRequest } from "@/lib/api";

export function listSheets(): Promise<Sheet[]> {
  return apiRequest<Sheet[]>("/api/sheets");
}

export function getSheet(sheetId: number): Promise<SheetDetail> {
  return apiRequest<SheetDetail>(`/api/sheets/${sheetId}`);
}

export function createSheet(
  name: string,
  contextCategoryId?: number | null,
): Promise<SheetDetail> {
  return apiRequest<SheetDetail>("/api/sheets", {
    body: JSON.stringify({ name, context_category_id: contextCategoryId ?? null }),
    method: "POST",
  });
}

export function updateSheet(
  sheetId: number,
  input: {
    name?: string;
    context_category_id?: number | null;
  },
): Promise<SheetDetail> {
  return apiRequest<SheetDetail>(`/api/sheets/${sheetId}`, {
    body: JSON.stringify(input),
    method: "PATCH",
  });
}

export function deleteSheet(sheetId: number): Promise<void> {
  return apiRequest<void>(`/api/sheets/${sheetId}`, {
    method: "DELETE",
  });
}

export function updateSheetSlots(
  sheetId: number,
  payload: SheetSlotsUpdate,
): Promise<SheetDetail> {
  return apiRequest<SheetDetail>(`/api/sheets/${sheetId}/slots`, {
    body: JSON.stringify(payload),
    method: "PUT",
  });
}

export function moveSheetLeft(sheetId: number): Promise<Sheet[]> {
  return apiRequest<Sheet[]>(`/api/sheets/${sheetId}/move-left`, {
    method: "POST",
  });
}

export function moveSheetRight(sheetId: number): Promise<Sheet[]> {
  return apiRequest<Sheet[]>(`/api/sheets/${sheetId}/move-right`, {
    method: "POST",
  });
}

export function resetDefaultSheets(): Promise<Sheet[]> {
  return apiRequest<Sheet[]>("/api/sheets/reset-default", {
    method: "POST",
  });
}
