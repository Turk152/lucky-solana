import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LUCKY — The holder's draw",
  description: "Hold your tokens. Watch the draw. A new lucky wallet every three minutes. Explore the LUCKY Solana draw framework.",
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
