import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TechNova Academy",
  description:
    "Professional 12-month technology and engineering programs.",
  verification: {
    google: "G_szcZim6qdf2uST5-b0YIR9K1vjnICxeKEQxXaQGJU",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}