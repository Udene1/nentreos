import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

import MUIProvider from "@/components/MUIProvider";
import SWRegistration from "@/components/SWRegistration";
import { Toaster } from "react-hot-toast";

export const viewport = {
  themeColor: "#1e3a8a",
};

export const metadata: Metadata = {
  title: "NEntreOS - Nigerian Entrepreneurship Operating System",
  description: "Advanced inventory, AI payment chasers, and tax compliance for Nigerian SMEs",
  manifest: "/manifest.json",
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
        className={`${inter.variable} ${outfit.variable} antialiased`}
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
