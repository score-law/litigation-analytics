import type { Metadata } from "next";
import "./globals.scss";

// components
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import PasswordProtection from "@/components/PasswordProtection";
import { PostHogProvider } from "@/components/PostHogProvider";

import { Inter } from 'next/font/google'
 
// If loading a variable font, you don't need to specify the font weight
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: "Score",
  description: "Litigation Analytics for Criminal Defense",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.className}>
      <body>
        <PostHogProvider>
          <PasswordProtection>
            <NavBar />
            <main>{children}</main>
            <Footer />
          </PasswordProtection>
        </PostHogProvider>
      </body>
    </html>
  );
}
