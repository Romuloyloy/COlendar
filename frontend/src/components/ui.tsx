import type { ReactNode } from "react";

import { addDaysToIsoDate, todayIsoDate } from "@/lib/date";

type PageHeaderProps = {
  title: string;
  description: string;
  eyebrow?: string;
  actions?: ReactNode;
  children?: ReactNode;
};

export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
  children,
}: PageHeaderProps) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-normal text-teal-700">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-1 text-3xl font-semibold text-neutral-950">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-700">
          {description}
        </p>
        {children}
      </div>
      {actions}
    </header>
  );
}

type SectionCardProps = {
  title?: string;
  eyebrow?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function SectionCard({
  title,
  eyebrow,
  action,
  children,
  className = "",
}: SectionCardProps) {
  return (
    <section
      className={`rounded-md border border-neutral-300 bg-white p-5 shadow-sm ${className}`}
    >
      {title || eyebrow || action ? (
        <div className="flex items-start justify-between gap-4">
          <div>
            {eyebrow ? (
              <p className="text-xs font-semibold uppercase tracking-normal text-teal-700">
                {eyebrow}
              </p>
            ) : null}
            {title ? (
              <h2 className="mt-1 text-xl font-semibold text-neutral-950">
                {title}
              </h2>
            ) : null}
          </div>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function LoadingState({ message }: { message: string }) {
  return <p className="text-sm text-neutral-600">{message}</p>;
}

export function EmptyState({ message }: { message: string }) {
  return <p className="text-sm text-neutral-600">{message}</p>;
}

export function ErrorState({ message }: { message: string }) {
  return (
    <p className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
      {message}
    </p>
  );
}

export function NoticeState({ message }: { message: string }) {
  return (
    <p className="rounded-md border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-800">
      {message}
    </p>
  );
}

export function DateSelector({
  label,
  value,
  onChange,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <label className={`block text-sm font-medium text-neutral-800 ${className}`}>
      {label}
      <input
        className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2"
        onChange={(event) => onChange(event.target.value)}
        type="date"
        value={value}
      />
    </label>
  );
}

export function DateNavigator({
  label = "Date",
  value,
  onChange,
  className = "",
}: {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <div className={`text-sm font-medium text-neutral-800 ${className}`}>
      <span className="block">{label}</span>
      <div className="mt-1 flex items-center gap-2">
        <button
          className="h-10 rounded-md border border-neutral-300 px-3 text-sm font-semibold text-neutral-800 hover:bg-neutral-100"
          onClick={() => onChange(addDaysToIsoDate(value, -1))}
          type="button"
        >
          Prev
        </button>
        <input
          className="h-10 rounded-md border border-neutral-300 px-3 text-sm"
          onChange={(event) => onChange(event.target.value)}
          type="date"
          value={value}
        />
        <button
          className="h-10 rounded-md border border-neutral-300 px-3 text-sm font-semibold text-neutral-800 hover:bg-neutral-100"
          onClick={() => onChange(todayIsoDate())}
          type="button"
        >
          Today
        </button>
        <button
          className="h-10 rounded-md border border-neutral-300 px-3 text-sm font-semibold text-neutral-800 hover:bg-neutral-100"
          onClick={() => onChange(addDaysToIsoDate(value, 1))}
          type="button"
        >
          Next
        </button>
      </div>
    </div>
  );
}
