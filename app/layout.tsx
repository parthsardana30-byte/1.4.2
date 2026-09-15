import type { Metadata } from "next";
import "./globals.css";
import { AppProviders } from "./providers";

export const metadata: Metadata = {
  title: "Draftly — Optimized Redux workspace",
  description: "A responsive post workspace powered by normalized Redux state, memoized selectors, and efficient React rendering.",
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
      <body className="antialiased"><AppProviders>{children}</AppProviders></body>
    </html>
  );
}
