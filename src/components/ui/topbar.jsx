"use client";
import * as React from "react";
import { Marquee } from "@/components/ui/marquee";

export function Topbar() {
    const [config, setConfig] = React.useState(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        async function fetchConfig() {
            try {
                const res = await fetch("/api/topbar-config", {
                    method: "GET",
                    cache: "no-store",
                });

                if (res.ok) {
                    const payload = await res.json();
                    const first = Array.isArray(payload?.data) && payload.data.length > 0 ? payload.data[0] : null;
                    if (first) {
                        const attrs = first.attributes || first;
                        setConfig({
                            isActive: !!attrs.isActive,
                            topbarContent: Array.isArray(attrs.topbarContent) ? attrs.topbarContent : [],
                        });
                    }
                }
            } catch (error) {
                console.error("Error fetching topbar config:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchConfig();
    }, []);

    // Update CSS variable for topbar offset
    React.useEffect(() => {
        if (typeof document !== "undefined") {
            const root = document.documentElement;
            if (config?.isActive) {
                root.style.setProperty("--topbar-offset", "3.5rem");
            } else {
                root.style.setProperty("--topbar-offset", "0px");
            }
        }
    }, [config?.isActive]);

    // Don't render anything if not active or still loading
    if (loading || !config?.isActive) {
        return null;
    }

    return (
        <div
            className="fixed inset-x-0 top-0 z-50"
            style={{ background: "linear-gradient(90deg, rgb(62, 134, 198) 0%, rgb(166, 102, 170) 25%, rgb(236, 68, 146) 50%, rgb(238, 68, 84) 75%, rgb(240, 84, 39) 100%)" }}
        >
            <div className="flex items-center gap-3 h-14">
                <Marquee pauseOnHover className="flex-1 min-w-0 [--duration:20s] [--gap:1.5rem]">
                    {Array.isArray(config.topbarContent) && config.topbarContent.length > 0
                        ? config.topbarContent.map((t, i) => (
                            <span key={`top-${i}`} className="text-sm font-medium text-white">
                                {t}
                            </span>
                        ))
                        : (
                            <span className="text-sm font-medium text-foreground"></span>
                        )}
                </Marquee>
            </div>
        </div>
    );
}
