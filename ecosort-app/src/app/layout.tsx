import type { Metadata, Viewport } from "next";
import "./globals.css";
import FloatingNav from "@/components/ui/FloatingNav";

export const metadata: Metadata = {
  title: "EcoSort — AI Waste Segregation for Varanasi",
  description:
    "AI-powered waste segregation guide for Varanasi residents. Scan any item and get instant disposal instructions based on local municipal guidelines.",
  keywords: ["waste segregation", "recycling", "Varanasi", "eco", "AI", "waste management", "India"],
  authors: [{ name: "EcoSort Team" }],
  openGraph: {
    title: "EcoSort — Sort Smarter. Live Greener.",
    description: "AI-powered waste guide tailored to Varanasi's municipal guidelines.",
    type: "website",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "EcoSort",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F4F6F0" },
    { media: "(prefers-color-scheme: dark)",  color: "#0D1310" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                let theme = localStorage.getItem('ecosort_theme');
                if (!theme) {
                  theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                }
                document.documentElement.setAttribute('data-theme', theme);
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body>
        <FloatingNav />
        <main className="pt-20">
          {children}
        </main>
      </body>
    </html>
  );
}
