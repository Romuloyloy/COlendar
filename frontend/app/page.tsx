import Link from "next/link";

const modules = ["Dashboard", "Notes", "Tasks", "Calendar", "Tracker"];

export default function Home() {
  return (
    <main className="min-h-screen px-6 py-8 text-neutral-900">
      <section className="mx-auto flex max-w-5xl flex-col gap-8">
        <header className="border-b border-neutral-300 pb-6">
          <p className="text-sm font-medium uppercase tracking-wide text-teal-700">
            First product module
          </p>
          <h1 className="mt-3 text-4xl font-semibold">COlendar is running</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-neutral-700">
            The app shell is alive, and the first real module is ready: notes
            with nested folders.
          </p>
          <Link
            className="mt-5 inline-flex rounded bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800"
            href="/notes"
          >
            Open Notes
          </Link>
        </header>

        <section>
          <h2 className="text-lg font-semibold">Planned module boundaries</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {modules.map((module) => (
              <div
                className="rounded border border-neutral-300 bg-white px-4 py-3 text-sm font-medium shadow-sm"
                key={module}
              >
                {module}
              </div>
            ))}
          </div>
        </section>

        <section className="rounded border border-neutral-300 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold">Backend check</h2>
          <p className="mt-2 text-sm text-neutral-700">
            Visit <code className="rounded bg-neutral-100 px-1">/health</code>{" "}
            on the backend at{" "}
            <code className="rounded bg-neutral-100 px-1">
              {process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"}
            </code>
            .
          </p>
        </section>
      </section>
    </main>
  );
}
