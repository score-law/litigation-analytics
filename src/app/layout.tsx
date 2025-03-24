import type { Metadata } from "next";
import Script from "next/script";
import "./globals.scss";

//components
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
//import PasswordProtection from "@/components/PasswordProtection";

export const metadata: Metadata = {
  title: "Score",
  description: "Get detailed information on lawyers and law firms in your area.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Script
          strategy="afterInteractive"
          src={`https://www.googletagmanager.com/gtag/js?id=G-21TM0ZKBFH`}
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-21TM0ZKBFH', {
              page_path: window.location.pathname,
              debug_mode: ${process.env.NODE_ENV === 'development'}
            });
          `}
        </Script>
        
        {/*<PasswordProtection>*/}
          <NavBar />
          <main>{children}</main>
          <Footer />
        {/*</PasswordProtection>*/}
      </body>
    </html>
  );
}