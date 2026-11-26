import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
});

export const metadata: Metadata = {
  title: "Chai Social · Calon",
  description:
    "Growth with heart. Built in Wales. Chai Social’s day on Whitchurch Road: sales, reviews and local signals, with nothing posted until you approve it.",
  applicationName: "Calon",
  icons: {
    icon: [
      { url: "/brand/calon-mark-app-icon.svg", type: "image/svg+xml" },
      { url: "/brand/calon-mark-app-icon.png", type: "image/png" },
    ],
    apple: "/brand/calon-mark-app-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0E2A20",
  width: "device-width",
  initialScale: 1,
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

const cacheReset = `(function(){try{var b=${JSON.stringify(process.env.NEXT_PUBLIC_BUILD_ID || "")};var k="calon-build";var p=localStorage.getItem(k);if(p&&p!==b){localStorage.removeItem("chai-social-workspace");sessionStorage.removeItem("calon-splash");}if(b)localStorage.setItem(k,b);if(navigator.serviceWorker&&navigator.serviceWorker.getRegistrations){navigator.serviceWorker.getRegistrations().then(function(rs){for(var i=0;i<rs.length;i++)rs[i].unregister();});}if(window.caches&&caches.keys){caches.keys().then(function(keys){for(var i=0;i<keys.length;i++)caches.delete(keys[i]);});}}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-GB" className={`${inter.variable} ${cormorant.variable} dark`}>
      <body className="min-h-screen bg-navy font-sans text-ink antialiased">
        <script dangerouslySetInnerHTML={{ __html: cacheReset }} />
        {children}
      </body>
    </html>
  );
}
