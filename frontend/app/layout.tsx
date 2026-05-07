import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "COlendar",
  description: "Local-first personal productivity dashboard",
};

const navItems = [
  ["Home", "/"],
  ["Notes", "/notes"],
  ["Tasks", "/tasks"],
  ["Calendar", "/calendar"],
  ["Planning", "/planning"],
  ["Tracker", "/tracker"],
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <header className="border-b border-neutral-300 bg-white/95">
          <nav className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
            <Link className="text-lg font-semibold text-neutral-950" href="/">
              COlendar
            </Link>
            <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
              {navItems.map(([label, href]) => (
                <Link
                  className="rounded-md px-3 py-1.5 text-neutral-700 hover:bg-neutral-100 hover:text-teal-700"
                  href={href}
                  key={href}
                >
                  {label}
                </Link>
              ))}
            </div>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
