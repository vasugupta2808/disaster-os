import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import { Toaster } from "sonner";

import { AuthProvider } from "@/providers/auth-provider";
import { ThemeProvider } from "@/providers/theme-provider";

import "./globals.css";

/**
 * Root layout.
 *
 * Why AuthProvider mounts HERE and not deeper (e.g. only in the dashboard
 * route group): the public landing page and login/register pages also
 * need to know auth state - e.g. to redirect an already-logged-in user
 * away from /login. Mounting it once at the root means every route,
 * public or private, can call useAuth() safely.
 *
 * Why <Toaster /> lives here too: toast notifications (e.g. "SOS sent",
 * "Failed to load shelters") are a cross-cutting concern triggered from
 * deep inside feature components, not tied to any one page's layout.
 */

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Disaster OS - AI Disaster Response Assistant",
  description:
    "AI-powered disaster response: live alerts, nearby shelters and hospitals, " +
    "SOS emergency dispatch, and offline-ready emergency guidance.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Prevents accidental pinch-zoom-out on mobile during high-stress use
  // (e.g. someone frantically tapping the SOS button), while still
  // allowing zoom-in for accessibility.
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0d0f14" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body className={`${poppins.variable} font-sans antialiased bg-black text-white`}>
        <ThemeProvider>
          <AuthProvider>
            {children}
            <Toaster richColors position="top-right" closeButton />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
