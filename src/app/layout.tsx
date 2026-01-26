import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";

const googleSans = localFont({
  src: "./fonts/google.ttf",
  variable: "--font-google-sans",
  weight: "100 1000",
});

export const metadata: Metadata = {
  title: "PrepmyExam - India's Best Exam Preparation Platform",
  description: "Comprehensive preparation for Banking, SSC, UPSC, Railways, and State PSCs with AI-powered tutoring.",
  keywords: ["Bank Exam Preparation", "SSC Mock Tests", "UPSC Online Coaching", "Railways Exam Practice", "AI Tutor", "Government Jobs India", "IBPS", "SBI PO", "CGL"],
  openGraph: {
    title: "PrepmyExam - Master Your Competitive Exams",
    description: "India's Best AI-Powered Exam Preparation Platform for Banking, SSC, UPSC & More.",
    url: "https://prepmyexam.com",
    siteName: "PrepmyExam",
    images: [
      {
        url: "/og-image.png", // Assuming we might add this later or use a default
        width: 1200,
        height: 630,
        alt: "PrepmyExam Platform",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PrepmyExam - AI Powered Preparation",
    description: "Join thousands of aspirants acing their exams with PrepmyExam.",
    // images: ["/twitter-image.png"],
  },
  icons: {
    icon: "/prepmyexam.svg",
  },
};

import { LanguageProvider } from "@/context/LanguageContext";
import { PreferencesSync } from "@/components/PreferencesSync";

// ... existing imports

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(googleSans.className, "min-h-screen bg-background text-foreground antialiased font-sans")}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          storageKey="bankexam-theme"
        >
          <LanguageProvider>
            <AuthProvider>
              <PreferencesSync />
              {children}
            </AuthProvider>
          </LanguageProvider>
          <script
            dangerouslySetInnerHTML={{
              __html: `
                (function() {
                  try {
                    var savedHue = localStorage.getItem('bankexam-theme-hue-v2') || localStorage.getItem('bankexam-theme-hue');
                    if (savedHue) {
                      document.documentElement.style.setProperty('--base-hue', savedHue);
                    }
                  } catch (e) {}
                })();
              `,
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
