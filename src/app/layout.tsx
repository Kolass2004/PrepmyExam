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
  title: "Examprep - India's Best Exam Preparation Platform",
  description: "Comprehensive preparation for Banking, SSC, UPSC, Railways, and State PSCs with AI-powered tutoring.",
};

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
          <AuthProvider>{children}</AuthProvider>
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
