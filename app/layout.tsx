import type { Metadata } from "next";
import "./globals.css";

const siteUrl = "https://technova-academy-ten.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),

  title: {
    default: "TechNova Academy | Professional Technology Courses",
    template: "%s | TechNova Academy",
  },

  description:
    "TechNova Academy offers structured 12-month professional courses in artificial intelligence, machine learning, data science, robotics, aerospace engineering, space engineering and advanced technology.",

  keywords: [
    "TechNova Academy",
    "online technology courses",
    "AI course",
    "machine learning course",
    "data science course",
    "robotics course",
    "aerospace engineering course",
    "artificial intelligence course",
    "professional technology courses",
    "online engineering courses",
  ],

  authors: [
    {
      name: "TechNova Academy",
    },
  ],

  creator: "TechNova Academy",

  publisher: "TechNova Academy",

  verification: {
    google: "G_szcZim6qdf2uST5-b0YIR9K1vjnICxeKEQxXaQGJU",
  },

  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "TechNova Academy",
    title: "TechNova Academy | Professional Technology Courses",
    description:
      "Structured 12-month professional courses in AI, machine learning, data science, robotics, aerospace engineering and advanced technology.",
    locale: "en_IN",
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
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