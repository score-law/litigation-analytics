"use client"

import posthog from "posthog-js"
import { PostHogProvider as PHProvider, usePostHog } from "posthog-js/react"
import { Suspense, useEffect } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { verifyToken } from "@/utils/auth"

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: "/ingest",
      ui_host: "https://us.posthog.com",
      capture_pageview: false, // We capture pageviews manually
      capture_pageleave: true, // Enable pageleave capture
    })

    // After PostHog is initialized, check for existing authentication
    identifyFromExistingToken();
  }, [])

  // Function to identify user from existing token
  const identifyFromExistingToken = () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const decodedToken = verifyToken(token);
      if (!decodedToken || !decodedToken.email) return;

      // Identify the user in PostHog
      posthog.identify(decodedToken.email, {
        email: decodedToken.email,
        userId: decodedToken.userId
      });
    } catch (error) {
      console.error("Error identifying returning user in PostHog:", error);
      // Continue without identification - won't block the application
    }
  };

  return (
    <PHProvider client={posthog}>
      <SuspendedPostHogPageView />
      {children}
    </PHProvider>
  )
}

function PostHogPageView() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const posthog = usePostHog()

  useEffect(() => {
    if (pathname && posthog) {
      let url = window.origin + pathname
      const search = searchParams.toString()
      if (search) {
        url += "?" + search
      }
      posthog.capture("$pageview", { "$current_url": url })
    }
  }, [pathname, searchParams, posthog])

  return null
}

function SuspendedPostHogPageView() {
  return (
    <Suspense fallback={null}>
      <PostHogPageView />
    </Suspense>
  )
}