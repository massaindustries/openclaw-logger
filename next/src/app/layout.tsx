import type { Metadata } from "next";
import { Google_Sans_Flex, Google_Sans_Code } from "next/font/google";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const googleSansFlex = Google_Sans_Flex({
  variable: "--font-google-sans-flex",
  subsets: ["latin"],
  // Provide a simple fallback to avoid override warnings
  fallback: ["system-ui", "sans-serif"],
});

const googleSansCode = Google_Sans_Code({
  variable: "--font-google-sans-code",
  subsets: ["latin"],
  fallback: ["monospace", "sans-serif"],
});

export const metadata: Metadata = {
  title: "Log Viewer - AI Session Dashboard",
  description: "Visualizza e analizza le sessioni AI con contesto intelligente",
  icons: {
    icon: "/pixel-lobster.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${googleSansFlex.variable} ${googleSansCode.variable} antialiased h-screen min-h-screen`}
      >
        <NextThemesProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>
            {children}
          </TooltipProvider>
        </NextThemesProvider>
      </body>
    </html>
  );
}
