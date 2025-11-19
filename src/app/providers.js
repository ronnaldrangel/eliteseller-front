"use client";

import { ChatbotProvider } from "@/contexts/chatbot-context";
import { LanguageProvider } from "@/contexts/language-context";
import { SWRConfig } from "swr";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const CenteredSpinner = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-black/80 backdrop-blur-sm">
    <div className="loader"></div>
  </div>
);

const Providers = ({ children }) => {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(false);
  }, [pathname]);

  useEffect(() => {
    const handleClick = (e) => {
      if (
        e.defaultPrevented ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return;
      }

      const anchor = e.target.closest("a");
      if (
        !anchor ||
        !anchor.href ||
        anchor.target ||
        anchor.hasAttribute("download")
      ) {
        return;
      }

      try {
        const destination = new URL(anchor.href);
        const current = new URL(window.location.href);

        if (destination.origin !== current.origin) {
          return;
        }

        const samePath = destination.pathname === current.pathname;
        const sameSearch = destination.search === current.search;

        if (samePath && sameSearch) {
          return;
        }

        setLoading(true);
      } catch (_) {
        // Ignore malformed URLs
      }
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [pathname]);

  useEffect(() => {
    const originalPush = router.push;
    const originalReplace = router.replace;

    router.push = (...args) => {
      setLoading(true);
      return originalPush.apply(router, args);
    };

    router.replace = (...args) => {
      setLoading(true);
      return originalReplace.apply(router, args);
    };

    return () => {
      router.push = originalPush;
      router.replace = originalReplace;
    };
  }, [router]);

  const fetcher = async (url) => {
    const res = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...(session?.strapiToken
          ? { Authorization: `Bearer ${session.strapiToken}` }
          : {}),
      },
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const err = new Error(
        data?.error?.message || `Fetch failed with status ${res.status}`
      );
      err.data = data;
      err.status = res.status;
      throw err;
    }
    return res.json();
  };

  return (
    <>
      {loading && <CenteredSpinner />}
      <LanguageProvider>
        <SWRConfig
          value={{ fetcher, revalidateOnFocus: false, dedupingInterval: 30000 }}
        >
          <ChatbotProvider>{children}</ChatbotProvider>
        </SWRConfig>
      </LanguageProvider>
    </>
  );
};

export default Providers;
