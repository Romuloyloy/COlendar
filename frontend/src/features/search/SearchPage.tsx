"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";

import { globalSearch } from "./api";
import type { SearchResponse, SearchResult, SearchResultGroups } from "./types";
import { EmptyState, ErrorState, LoadingState, PageHeader, SectionCard } from "@/components/ui";
import { formatDisplayDate } from "@/lib/date";

const groupLabels: Array<[keyof SearchResultGroups, string]> = [
  ["notes", "Notes"],
  ["folders", "Folders"],
  ["daily_tasks", "One-time Tasks"],
  ["weekly_tasks", "Weekly Tasks"],
  ["calendar_events", "Calendar Events"],
];

export function SearchPage() {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState<SearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalResults = useMemo(() => {
    if (!response) {
      return 0;
    }
    return Object.values(response.results).reduce(
      (total, group) => total + group.length,
      0,
    );
  }, [response]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      setResponse(null);
      setError("Enter a search term.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      setResponse(await globalSearch(trimmedQuery));
    } catch (caught) {
      setResponse(null);
      setError(caught instanceof Error ? caught.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen px-6 py-8 text-neutral-900">
      <section className="mx-auto max-w-6xl">
        <div className="mb-6">
          <PageHeader
            description="Find notes, folders, tasks, and calendar events with practical keyword search."
            eyebrow="Global Search"
            title="Search"
          />
        </div>

        <div className="grid gap-5">
          <SectionCard>
            <form className="flex flex-wrap items-end gap-3" onSubmit={handleSubmit}>
              <label className="min-w-72 flex-1 text-sm font-medium text-neutral-800">
                Search query
                <input
                  className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search notes, tasks, and events"
                  type="search"
                  value={query}
                />
              </label>
              <button
                className="rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
                disabled={isLoading}
                type="submit"
              >
                {isLoading ? "Searching..." : "Search"}
              </button>
            </form>
            {error ? (
              <div className="mt-4">
                <ErrorState message={error} />
              </div>
            ) : null}
          </SectionCard>

          {isLoading ? (
            <SectionCard>
              <LoadingState message="Searching..." />
            </SectionCard>
          ) : null}

          {!isLoading && response ? (
            <div className="grid gap-5">
              <p className="text-sm text-neutral-700">
                {totalResults === 1 ? "1 result" : `${totalResults} results`} for{" "}
                <span className="font-semibold text-neutral-950">
                  {response.query}
                </span>
              </p>
              {totalResults === 0 ? (
                <SectionCard>
                  <EmptyState message="No matching notes, folders, tasks, or calendar events." />
                </SectionCard>
              ) : (
                groupLabels.map(([key, label]) => (
                  <ResultGroup
                    key={key}
                    label={label}
                    results={response.results[key]}
                  />
                ))
              )}
            </div>
          ) : null}

          {!isLoading && !response && !error ? (
            <SectionCard>
              <EmptyState message="Search across your active productivity data from here." />
            </SectionCard>
          ) : null}
        </div>
      </section>
    </main>
  );
}

function ResultGroup({
  label,
  results,
}: {
  label: string;
  results: SearchResult[];
}) {
  if (results.length === 0) {
    return null;
  }

  return (
    <SectionCard
      action={<span className="text-sm text-neutral-600">{results.length}</span>}
      title={label}
    >
      <div className="mt-4 divide-y divide-neutral-200">
        {results.map((result) => (
          <Link
            className="block py-3 hover:bg-neutral-50"
            href={result.target_url}
            key={`${result.type}-${result.id}`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-neutral-950">
                  {result.title}
                </h3>
                <p className="mt-1 text-xs font-medium uppercase tracking-normal text-teal-700">
                  {result.subtitle ?? result.type.replace("_", " ")}
                </p>
              </div>
              {result.date ? (
                <span className="text-xs font-medium text-neutral-600">
                  {formatDisplayDate(result.date)}
                </span>
              ) : null}
            </div>
            {result.preview ? (
              <p className="mt-2 text-sm leading-6 text-neutral-700">
                {result.preview}
              </p>
            ) : null}
          </Link>
        ))}
      </div>
    </SectionCard>
  );
}
