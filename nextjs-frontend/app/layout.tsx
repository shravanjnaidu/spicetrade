import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BigSpice — Buy & Sell Spices",
  description:
    "The leading B2B marketplace for spices, herbs, and agricultural commodities.",
  icons: { icon: "/logos/bigspicebubble.png" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="flex flex-col min-h-screen bg-white">{children}</body>
    </html>
  );
}
