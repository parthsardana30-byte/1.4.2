import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TokenLab — JWT Authentication Demo",
  description: "A secure, hands-on demonstration of JWT login, signed claims, session cookies, and protected API routes.",
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
