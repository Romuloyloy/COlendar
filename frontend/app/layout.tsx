import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "COlendar",
  description: "Personal productivity dashboard skeleton",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <header className="border-b border-neutral-300 bg-white">
          <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <Link className="text-lg font-semibold text-neutral-950" href="/">
              COlendar
            </Link>
            <div className="flex items-center gap-4 text-sm font-medium">
              <Link className="text-neutral-700 hover:text-teal-700" href="/">
                Home
              </Link>
              <Link className="text-neutral-700 hover:text-teal-700" href="/notes">
                Notes
              </Link>
            </div>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
