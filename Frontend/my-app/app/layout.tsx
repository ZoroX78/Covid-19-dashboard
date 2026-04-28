import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Or Geist, depending on your setup
import "./globals.css";
import TopHeader from "@/app/components/TopHeader";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PandemicWatch | Global Health Intelligence",
  description: "High-level telemetry of global infection vectors and recovery rates.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="antialiased text-gray-900 bg-[#F8F9FA]">
      <body className={inter.className} >
        <div className="flex min-h-screen">
          

          {/* Main App Area */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Global Header */}
            <TopHeader />
            
            {/* Main Content Area (Dynamic based on route) */}
            <main className="flex-1 p-6 md:p-8 overflow-y-auto">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}