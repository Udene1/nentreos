import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import MUIProvider from "@/components/MUIProvider";
import SWRegistration from "@/components/SWRegistration";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "NEntreOS - Nigerian Entrepreneurship Operating System",
  description: "Advanced inventory, AI payment chasers, and tax compliance for Nigerian SMEs",
  manifest: "/manifest.json",
  themeColor: "#1e3a8a",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "NEntreOS",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <MUIProvider>
          {children}
          <Toaster position="top-right" />
          <SWRegistration />
        </MUIProvider>
      </body>
    </html>
  );
}
