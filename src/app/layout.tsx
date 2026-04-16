import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import HeaderBar from "@/components/HeaderBar";

export const metadata: Metadata = {
  title: "Cadence - Social Media Management",
  description: "Medical spa social media execution system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full flex">
        <Sidebar />
        <main className="flex-1 ml-60 min-h-screen bg-[#F8F9FB] flex flex-col">
          <HeaderBar />
          <div className="flex-1">{children}</div>
        </main>
      </body>
    </html>
  );
}
