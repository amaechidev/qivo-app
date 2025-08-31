import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import Navbar from "@/components/Navbar";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "@/components/providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Qivo Polls",
  description: "Create and vote on polls",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className}  antialiased`}>
        <Providers>
          <Navbar />
          <main className="min-h-screen bg-gray-50">
            <TooltipProvider>
              <Toaster />
              {children}
            </TooltipProvider>
          </main>
        </Providers>
      </body>
    </html>
  );
}
