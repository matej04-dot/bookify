import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import AuthListener from "@/components/AuthListener";
import ConditionalLayout from "@/components/ConditionalLayout";

export const metadata: Metadata = {
  title: "Bookify - Discover Amazing Books",
  description: "Find and review your favorite books on Bookify",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <AuthListener />
          <ConditionalLayout>{children}</ConditionalLayout>
        </Providers>
      </body>
    </html>
  );
}
