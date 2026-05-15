import type { ReactNode } from "react";

import { addDaysToIsoDate, todayIsoDate } from "@/lib/date";

export const inputClassName = "app-input mt-1 w-full";

type AppButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const buttonVariantClass: Record<AppButtonVariant, string> = {
  primary: "app-button-primary",
  secondary: "app-button-secondary",
  ghost: "app-button-ghost",
  danger: "app-button-danger",
};

export function AppButton({
  children,
  className = "",
  variant = "secondary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: AppButtonVariant;
}) {
  return (
    <button
      className={`${buttonVariantClass[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

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
          <p className="app-eyebrow">{eyebrow}</p>
        ) : null}
        <h1 className="mt-1 text-3xl font-semibold text-[#2c2925]">{title}</h1>
        <p className="app-muted mt-2 max-w-2xl text-sm leading-6">
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
      className={`app-card p-5 ${className}`}
    >
      {title || eyebrow || action ? (
        <div className="flex items-start justify-between gap-4">
          <div>
            {eyebrow ? (
              <p className="app-eyebrow">{eyebrow}</p>
            ) : null}
            {title ? (
              <h2 className="mt-1 text-xl font-semibold text-[#2c2925]">
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
  return (
    <p className="rounded-xl border border-[#ded6ca] bg-[var(--color-surface-muted)] px-3 py-2 text-sm text-[#766f66]">
      {message}
    </p>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <p className="rounded-xl border border-dashed border-[#d8d0c3] bg-[var(--color-app-bg-soft)] px-3 py-3 text-sm text-[#766f66]">
      {message}
    </p>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <p className="rounded-xl border border-[#e7c5c9] bg-[#fff4f3] px-3 py-2 text-sm text-[#9d515b]">
      {message}
    </p>
  );
}

export function NoticeState({ message }: { message: string }) {
  return (
    <p className="rounded-xl border border-[var(--color-primary-ring)] bg-[var(--color-primary-soft)] px-3 py-2 text-sm text-[var(--color-primary-strong)]">
      {message}
    </p>
  );
}

export function AppCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={`app-card p-5 ${className}`}>{children}</section>;
}

export function Badge({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <span className={`app-pill ${className}`}>{children}</span>;
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
    <label className={`block text-sm font-medium text-[#3b3732] ${className}`}>
      {label}
      <input
        className={inputClassName}
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
    <div className={`text-sm font-medium text-[#3b3732] ${className}`}>
      <span className="block">{label}</span>
      <div className="mt-1 flex items-center gap-2">
        <AppButton
          className="min-h-10 px-3"
          onClick={() => onChange(addDaysToIsoDate(value, -1))}
          type="button"
        >
          Prev
        </AppButton>
        <input
          className="app-input h-10"
          onChange={(event) => onChange(event.target.value)}
          type="date"
          value={value}
        />
        <AppButton
          className="min-h-10 px-3"
          onClick={() => onChange(todayIsoDate())}
          type="button"
        >
          Today
        </AppButton>
        <AppButton
          className="min-h-10 px-3"
          onClick={() => onChange(addDaysToIsoDate(value, 1))}
          type="button"
        >
          Next
        </AppButton>
      </div>
    </div>
  );
}
