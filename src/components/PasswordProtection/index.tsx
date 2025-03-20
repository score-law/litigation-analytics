"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function PasswordProtection({ children }: { children: React.ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const password = localStorage.getItem("password");
    if (password === process.env.NEXT_PUBLIC_PASSWORD) {
      setAuthenticated(true);
    } else if (pathname !== "/login") {
      router.push("/login");
    }
  }, [router, pathname]);

  if (!authenticated && pathname !== "/login") {
    return null;
  }

  return <>{children}</>;
}