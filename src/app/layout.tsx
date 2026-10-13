import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: "#1B365D",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "OrgOS - Operating System for Student Organizations",
    template: "%s | OrgOS",
  },
  description: "The all-in-one operating platform for student organizations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.className} antialiased min-h-screen bg-[var(--orgos-bg-app)] text-[var(--orgos-text-primary)] selection:bg-[#1B365D] selection:text-white`}
      >
        {children}
      </body>
    </html>
  );
}
