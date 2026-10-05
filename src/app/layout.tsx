import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: "#020617",
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
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${inter.className} antialiased min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white`}
      >
        {children}
      </body>
    </html>
  );
}
