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
  title: "Rexon Bank Exam Prep",
  description: "Advanced bank exam preparation platform",
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
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
