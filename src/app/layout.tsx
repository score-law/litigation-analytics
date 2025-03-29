import type { Metadata } from "next";
import "./globals.scss";

// components
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import PasswordProtection from "@/components/PasswordProtection";
//import { PostHogProvider } from "@/components/PostHogProvider";

export const metadata: Metadata = {
  title: "Score",
  description: "Get detailed information on lawyers and law firms in your area.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {/*<PostHogProvider>*/}
          <PasswordProtection>
            <NavBar />
            <main>{children}</main>
            <Footer />
          </PasswordProtection>
        {/*</PostHogProvider>*/}
      </body>
    </html>
  );
}
