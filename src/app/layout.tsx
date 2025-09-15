import type { Metadata } from "next";
import Providers from "./providers";
import "./globals.css";
import { Open_Sans } from "next/font/google";

const openSans = Open_Sans({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "bookify",
  description: "bookify is a...",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div id="root" className={openSans.className}>
          <Providers>{children}</Providers>
        </div>
      </body>
    </html>
  );
}
