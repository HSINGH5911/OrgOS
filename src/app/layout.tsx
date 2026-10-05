import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OrgOS - Operating System for Student Organizations",
  description: "The all-in-one operating platform for student organizations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
