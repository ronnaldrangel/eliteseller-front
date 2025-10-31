"use client";

import { ChatbotProvider } from "@/contexts/chatbot-context";
import { SWRConfig } from "swr";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const CenteredSpinner = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
    <div className="loader"></div>
  </div>
);

const Providers = ({ children }) => {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  // Solo escuchar cambios en pathname (sin searchParams)
  useEffect(() => {
    setLoading(false);
  }, [pathname]);

  useEffect(() => {
    const handleClick = (e) => {
      const target = e.target.closest("a");
      if (
        target &&
        target.href &&
        !target.target &&
        target.href.startsWith(window.location.origin)
      ) {
        const targetUrl = new URL(target.href);
        const targetPath = targetUrl.pathname;

        if (targetPath !== pathname) {
          setLoading(true);
        }
      }
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [pathname]);

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
      <SWRConfig
        value={{ fetcher, revalidateOnFocus: false, dedupingInterval: 30000 }}
      >
        <ChatbotProvider>{children}</ChatbotProvider>
      </SWRConfig>
    </>
  );
};

export default Providers;
