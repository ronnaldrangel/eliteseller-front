import { Inter } from "next/font/google";
import "./globals.css";
import SessionProvider from "@/components/SessionProvider";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider"
import Providers from './providers';

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "Mi App"

export const metadata = {
  title: {
    default: `${SITE_NAME}`,
    template: `%s - ${SITE_NAME}`,
  },
  description: "Sistema desarrollado por Neopatron LTD",
  applicationName: SITE_NAME,
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" suppressHydrationWarning className={inter.variable}>
      <head>
        <title>{SITE_NAME}</title>
      </head>
      <body
        className={`antialiased bg-background text-foreground ${inter.variable}`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <SessionProvider>
            <Providers>{children}</Providers>
            <Toaster />
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
