"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import {
  archiveFolder,
  archiveNote,
  createFolder,
  createNote,
  getFolders,
  getNotes,
  updateFolder,
  updateNote,
} from "./api";
import type { Folder, Note } from "./types";

type FolderTreeItem = Folder & { depth: number; label: string };

function folderLabel(folder: Folder, folders: Folder[]): string {
  const names = [folder.name];
  let parentId = folder.parent_folder_id;

  while (parentId !== null) {
    const parent = folders.find((item) => item.id === parentId);
    if (!parent) {
      break;
    }
    names.unshift(parent.name);
    parentId = parent.parent_folder_id;
  }

  return names.join(" / ");
}

function folderTree(folders: Folder[]): FolderTreeItem[] {
  const childrenByParent = new Map<number | null, Folder[]>();
  for (const folder of folders) {
    const siblings = childrenByParent.get(folder.parent_folder_id) ?? [];
    siblings.push(folder);
    childrenByParent.set(folder.parent_folder_id, siblings);
  }

  for (const siblings of childrenByParent.values()) {
    siblings.sort((a, b) => a.name.localeCompare(b.name) || a.id - b.id);
  }

  const result: FolderTreeItem[] = [];

  function visit(parentId: number | null, depth: number) {
    for (const folder of childrenByParent.get(parentId) ?? []) {
      result.push({
        ...folder,
        depth,
        label: `${"  ".repeat(depth)}${folder.name}`,
      });
      visit(folder.id, depth + 1);
    }
  }

  visit(null, 0);
  return result;
}

function noteFolderLabel(note: Note, folders: Folder[]): string {
  if (note.folder_id === null) {
    return "No folder";
  }

  const folder = folders.find((item) => item.id === note.folder_id);
  return folder ? folderLabel(folder, folders) : "Missing folder";
}

export function NotesPage() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  const [selectedNoteId, setSelectedNoteId] = useState<number | null>(null);
  const [folderName, setFolderName] = useState("");
  const [folderParentId, setFolderParentId] = useState("");
  const [editFolderName, setEditFolderName] = useState("");
  const [editFolderParentId, setEditFolderParentId] = useState("");
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [noteFolderId, setNoteFolderId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const folderItems = useMemo(() => folderTree(folders), [folders]);
  const selectedFolder = useMemo(
    () => folders.find((folder) => folder.id === selectedFolderId) ?? null,
    [folders, selectedFolderId],
  );
  const selectedNote = useMemo(
    () => notes.find((note) => note.id === selectedNoteId) ?? null,
    [notes, selectedNoteId],
  );
  const visibleNotes = useMemo(
    () =>
      selectedFolderId === null
        ? notes
        : notes.filter((note) => note.folder_id === selectedFolderId),
    [notes, selectedFolderId],
  );

  async function loadData() {
    setError(null);
    const [folderData, noteData] = await Promise.all([getFolders(), getNotes()]);
    setFolders(folderData);
    setNotes(noteData);

    if (
      selectedFolderId !== null &&
      !folderData.some((folder) => folder.id === selectedFolderId)
    ) {
      setSelectedFolderId(null);
    }
    if (
      selectedNoteId !== null &&
      !noteData.some((note) => note.id === selectedNoteId)
    ) {
      setSelectedNoteId(null);
    }
  }

  useEffect(() => {
    loadData()
      .catch((caught: Error) => setError(caught.message))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (selectedFolder) {
      setEditFolderName(selectedFolder.name);
      setEditFolderParentId(selectedFolder.parent_folder_id?.toString() ?? "");
    } else {
      setEditFolderName("");
      setEditFolderParentId("");
    }
  }, [selectedFolder]);

  useEffect(() => {
    if (selectedNote) {
      setNoteTitle(selectedNote.title);
      setNoteContent(selectedNote.content);
      setNoteFolderId(selectedNote.folder_id?.toString() ?? "");
    }
  }, [selectedNote]);

  function resetNoteForm(folderId = selectedFolderId) {
    setSelectedNoteId(null);
    setNoteTitle("");
    setNoteContent("");
    setNoteFolderId(folderId?.toString() ?? "");
  }

  async function runAction(action: () => Promise<void>) {
    setIsSaving(true);
    setError(null);
    setNotice(null);

    try {
      await action();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCreateFolder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runAction(async () => {
      await createFolder({
        name: folderName,
        parent_folder_id: folderParentId ? Number(folderParentId) : null,
      });
      setFolderName("");
      setFolderParentId("");
      setNotice("Folder created.");
      await loadData();
    });
  }

  async function handleUpdateFolder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedFolder) {
      return;
    }

    await runAction(async () => {
      await updateFolder(selectedFolder.id, {
        name: editFolderName,
        parent_folder_id: editFolderParentId
          ? Number(editFolderParentId)
          : null,
      });
      setNotice("Folder updated.");
      await loadData();
    });
  }

  async function handleArchiveFolder() {
    if (!selectedFolder) {
      return;
    }

    await runAction(async () => {
      await archiveFolder(selectedFolder.id);
      setSelectedFolderId(null);
      setNotice("Folder archived.");
      await loadData();
    });
  }

  async function handleCreateNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runAction(async () => {
      const note = await createNote({
        title: noteTitle,
        content: noteContent,
        folder_id: noteFolderId ? Number(noteFolderId) : null,
      });
      setSelectedNoteId(note.id);
      setNotice("Note created.");
      await loadData();
    });
  }

  async function handleUpdateNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedNote) {
      return;
    }

    await runAction(async () => {
      await updateNote(selectedNote.id, {
        title: noteTitle,
        content: noteContent,
        folder_id: noteFolderId ? Number(noteFolderId) : null,
      });
      setNotice("Note updated.");
      await loadData();
    });
  }

  async function handleArchiveNote() {
    if (!selectedNote) {
      return;
    }

    await runAction(async () => {
      await archiveNote(selectedNote.id);
      resetNoteForm(null);
      setNotice("Note archived.");
      await loadData();
    });
  }

  return (
    <main className="min-h-screen px-6 py-8 text-neutral-900">
      <section className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[340px_1fr]">
        <aside className="space-y-6">
          <section className="rounded border border-neutral-300 bg-white p-4 shadow-sm">
            <h1 className="text-2xl font-semibold">Notes</h1>
            <p className="mt-2 text-sm leading-6 text-neutral-700">
              Create notes and organize them into nested folders.
            </p>
            {error ? (
              <p className="mt-4 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
                {error}
              </p>
            ) : null}
            {notice ? (
              <p className="mt-4 rounded border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-800">
                {notice}
              </p>
            ) : null}
          </section>

          <section className="rounded border border-neutral-300 bg-white p-4 shadow-sm">
            <h2 className="text-lg font-semibold">Create Folder</h2>
            <form className="mt-4 space-y-3" onSubmit={handleCreateFolder}>
              <label className="block text-sm font-medium">
                Folder name
                <input
                  className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
                  onChange={(event) => setFolderName(event.target.value)}
                  required
                  type="text"
                  value={folderName}
                />
              </label>
              <label className="block text-sm font-medium">
                Parent folder
                <select
                  className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
                  onChange={(event) => setFolderParentId(event.target.value)}
                  value={folderParentId}
                >
                  <option value="">No parent</option>
                  {folderItems.map((folder) => (
                    <option key={folder.id} value={folder.id}>
                      {folder.label}
                    </option>
                  ))}
                </select>
              </label>
              <button
                className="w-full rounded bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
                disabled={isSaving}
                type="submit"
              >
                Create Folder
              </button>
            </form>
          </section>

          <section className="rounded border border-neutral-300 bg-white p-4 shadow-sm">
            <h2 className="text-lg font-semibold">Folders</h2>
            <div className="mt-4 space-y-2">
              <button
                className={`w-full rounded border px-3 py-2 text-left text-sm ${
                  selectedFolderId === null
                    ? "border-teal-700 bg-teal-50"
                    : "border-neutral-200 hover:border-neutral-400"
                }`}
                onClick={() => {
                  setSelectedFolderId(null);
                  resetNoteForm(null);
                }}
                type="button"
              >
                All notes
              </button>
              {isLoading ? (
                <p className="text-sm text-neutral-600">Loading folders...</p>
              ) : folderItems.length === 0 ? (
                <p className="text-sm text-neutral-600">No folders yet.</p>
              ) : (
                folderItems.map((folder) => (
                  <button
                    className={`w-full rounded border px-3 py-2 text-left text-sm ${
                      selectedFolderId === folder.id
                        ? "border-teal-700 bg-teal-50"
                        : "border-neutral-200 hover:border-neutral-400"
                    }`}
                    key={folder.id}
                    onClick={() => {
                      setSelectedFolderId(folder.id);
                      resetNoteForm(folder.id);
                    }}
                    style={{ paddingLeft: `${12 + folder.depth * 18}px` }}
                    type="button"
                  >
                    {folder.name}
                  </button>
                ))
              )}
            </div>
          </section>

          {selectedFolder ? (
            <section className="rounded border border-neutral-300 bg-white p-4 shadow-sm">
              <h2 className="text-lg font-semibold">Edit Folder</h2>
              <form className="mt-4 space-y-3" onSubmit={handleUpdateFolder}>
                <label className="block text-sm font-medium">
                  Folder name
                  <input
                    className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
                    onChange={(event) => setEditFolderName(event.target.value)}
                    required
                    type="text"
                    value={editFolderName}
                  />
                </label>
                <label className="block text-sm font-medium">
                  Parent folder
                  <select
                    className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
                    onChange={(event) => setEditFolderParentId(event.target.value)}
                    value={editFolderParentId}
                  >
                    <option value="">No parent</option>
                    {folderItems
                      .filter((folder) => folder.id !== selectedFolder.id)
                      .map((folder) => (
                        <option key={folder.id} value={folder.id}>
                          {folder.label}
                        </option>
                      ))}
                  </select>
                </label>
                <div className="flex flex-wrap gap-3">
                  <button
                    className="rounded bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
                    disabled={isSaving}
                    type="submit"
                  >
                    Update Folder
                  </button>
                  <button
                    className="rounded border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
                    disabled={isSaving}
                    onClick={handleArchiveFolder}
                    type="button"
                  >
                    Archive Empty Folder
                  </button>
                </div>
              </form>
            </section>
          ) : null}
        </aside>

        <section className="grid gap-6 xl:grid-cols-[300px_1fr]">
          <section className="rounded border border-neutral-300 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">
                {selectedFolder ? selectedFolder.name : "All Notes"}
              </h2>
              <button
                className="rounded border border-neutral-300 px-3 py-1.5 text-xs font-semibold text-neutral-800 hover:bg-neutral-100"
                onClick={() => resetNoteForm()}
                type="button"
              >
                New
              </button>
            </div>
            <div className="mt-4 space-y-2">
              {isLoading ? (
                <p className="text-sm text-neutral-600">Loading notes...</p>
              ) : visibleNotes.length === 0 ? (
                <p className="text-sm text-neutral-600">No notes here yet.</p>
              ) : (
                visibleNotes.map((note) => (
                  <button
                    className={`w-full rounded border px-3 py-2 text-left text-sm ${
                      selectedNoteId === note.id
                        ? "border-teal-700 bg-teal-50"
                        : "border-neutral-200 hover:border-neutral-400"
                    }`}
                    key={note.id}
                    onClick={() => setSelectedNoteId(note.id)}
                    type="button"
                  >
                    <span className="block font-medium">{note.title}</span>
                    <span className="mt-1 block text-xs text-neutral-600">
                      {noteFolderLabel(note, folders)}
                    </span>
                  </button>
                ))
              )}
            </div>
          </section>

          <section className="rounded border border-neutral-300 bg-white p-4 shadow-sm">
            <h2 className="text-lg font-semibold">
              {selectedNote ? "Edit Note" : "Create Note"}
            </h2>
            <form
              className="mt-4 space-y-4"
              onSubmit={selectedNote ? handleUpdateNote : handleCreateNote}
            >
              <label className="block text-sm font-medium">
                Title
                <input
                  className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
                  onChange={(event) => setNoteTitle(event.target.value)}
                  required
                  type="text"
                  value={noteTitle}
                />
              </label>
              <label className="block text-sm font-medium">
                Folder
                <select
                  className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
                  onChange={(event) => setNoteFolderId(event.target.value)}
                  value={noteFolderId}
                >
                  <option value="">No folder</option>
                  {folderItems.map((folder) => (
                    <option key={folder.id} value={folder.id}>
                      {folder.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-medium">
                Content
                <textarea
                  className="mt-1 min-h-72 w-full rounded border border-neutral-300 px-3 py-2"
                  onChange={(event) => setNoteContent(event.target.value)}
                  value={noteContent}
                />
              </label>
              <div className="flex flex-wrap gap-3">
                <button
                  className="rounded bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
                  disabled={isSaving}
                  type="submit"
                >
                  {selectedNote ? "Update Note" : "Create Note"}
                </button>
                {selectedNote ? (
                  <button
                    className="rounded border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
                    disabled={isSaving}
                    onClick={handleArchiveNote}
                    type="button"
                  >
                    Archive Note
                  </button>
                ) : null}
              </div>
            </form>
          </section>
        </section>
      </section>
    </main>
  );
}
