import type { Folder, Note } from "./types";
import { apiRequest } from "@/lib/api";

export function getFolders(): Promise<Folder[]> {
  return apiRequest<Folder[]>("/api/folders");
}

export function createFolder(input: {
  name: string;
  parent_folder_id: number | null;
}): Promise<Folder> {
  return apiRequest<Folder>("/api/folders", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateFolder(
  folderId: number,
  input: Partial<Pick<Folder, "name" | "parent_folder_id">>,
): Promise<Folder> {
  return apiRequest<Folder>(`/api/folders/${folderId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function archiveFolder(folderId: number): Promise<void> {
  return apiRequest<void>(`/api/folders/${folderId}`, {
    method: "DELETE",
  });
}

export function getNotes(): Promise<Note[]> {
  return apiRequest<Note[]>("/api/notes");
}

export function createNote(input: {
  title: string;
  content: string;
  folder_id: number | null;
  category_id?: number | null;
}): Promise<Note> {
  return apiRequest<Note>("/api/notes", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateNote(
  noteId: number,
  input: Partial<Pick<Note, "title" | "content" | "folder_id" | "category_id">>,
): Promise<Note> {
  return apiRequest<Note>(`/api/notes/${noteId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function archiveNote(noteId: number): Promise<void> {
  return apiRequest<void>(`/api/notes/${noteId}`, {
    method: "DELETE",
  });
}
