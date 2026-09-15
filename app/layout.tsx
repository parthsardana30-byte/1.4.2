import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Planora — Content Calendar",
  description: "An interactive calendar for planning, scheduling, and managing social content.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
