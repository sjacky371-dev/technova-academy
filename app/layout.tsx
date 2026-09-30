import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TechNova Academy",
  description:
    "Professional 12-month technology and engineering programs.",
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