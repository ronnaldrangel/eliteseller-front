import { NextResponse } from "next/server";

const STRAPI_URL = process.env.STRAPI_API_URL || "http://localhost:1337";
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

export async function GET() {
    try {
        const qs = new URLSearchParams();
        qs.set("pagination[pageSize]", "1");
        qs.set("sort", "createdAt:desc");
        qs.set("fields[0]", "isActive");
        qs.set("fields[1]", "topbarContent");
        qs.set("populate[logo_dark][fields][0]", "url");
        qs.set("populate[logo_light][fields][0]", "url");
        qs.set("populate[icon_dark][fields][0]", "url");
        qs.set("populate[icon_light][fields][0]", "url");

        const res = await fetch(`${STRAPI_URL}/api/config-apps?${qs.toString()}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${STRAPI_API_TOKEN}`,
            },
            cache: "no-store",
        });

        if (!res.ok) {
            return NextResponse.json({ error: "Failed to fetch config" }, { status: res.status });
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("Error fetching topbar config:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
