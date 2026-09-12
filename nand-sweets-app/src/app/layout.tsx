import type { Metadata } from "next";
import { Inter, Berkshire_Swash } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
});

const berkshire = Berkshire_Swash({
  weight: '400',
  variable: "--font-heading",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nand Sweets | Pure Ghee Sweets",
  description: "Handcrafted pure ghee sweets and namkeen from Nand Sweets.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${berkshire.variable}`}>
      <body>{children}</body>
    </html>
  );
}
