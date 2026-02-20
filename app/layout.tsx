import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EcoTrace — AI Content Verification",
  description:
    "We don't just detect AI — we cross-examine it. Multi-model AI content verification for images, videos, and text.",
  keywords: ["AI detection", "content verification", "deepfake", "AI-generated"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={ `${inter.variable} font-sans antialiased` }>
        { children }
      </body>
    </html>
  );
}
