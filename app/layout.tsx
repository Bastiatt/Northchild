import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

/* --- Viking --- */
const viking = localFont({
  src: [
    {
      path: "../public/fonts/viking.woff",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-viking",
  display: "swap",
});

/* --- Norse --- */
const norse = localFont({
  src: [
    {
      path: "../public/fonts/norse.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/norse-bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-norse",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Northchild",
  description: "The North shall know its child.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${viking.variable} ${norse.variable}`}
    >
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}