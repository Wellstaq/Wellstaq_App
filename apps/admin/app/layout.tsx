import type { Metadata } from "next";
import { Inter, Funnel_Display } from "next/font/google";
import { Toaster } from "sonner";
import { ApiErrorNotifier } from "@/components/providers/api-error-notifier";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const funnelDisplay = Funnel_Display({ subsets: ["latin"], variable: "--font-funnel", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Wellstaq Admin", template: "%s | Wellstaq Admin" },
  description: "Internal console for managing Wellstaq organizations, users and platform events.",
  robots: { index: false, follow: false },
  icons: { icon: { url: "/icon.svg", type: "image/svg+xml", sizes: "any" } },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${funnelDisplay.variable}`} suppressHydrationWarning>
        {children}
        <ApiErrorNotifier />
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
