"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { verifyToken } from "@/utils/auth";

export default function PasswordProtection({ children }: { children: React.ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Skip authentication check if already on login page
    if (pathname === "/login") {
      setAuthenticated(true);
      setLoading(false);
      return;
    }

    // Check for JWT token in localStorage
    const token = localStorage.getItem("token");
    
    if (!token) {
      // No token found, redirect to login
      router.push("/login");
      return;
    }

    // Verify the token
    const decodedToken = verifyToken(token);
    
    if (!decodedToken) {
      // Invalid or expired token, clear it and redirect to login
      localStorage.removeItem("token");
      router.push("/login");
      return;
    }

    // Token is valid
    setAuthenticated(true);
    setLoading(false);
  }, [router, pathname]);

  // Show nothing while checking authentication
  if (loading && pathname !== "/login") {
    return null;
  }

  // Render children only if authenticated or on login page
  return authenticated ? <>{children}</> : null;
}