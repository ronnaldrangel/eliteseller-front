import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { buildStrapiUrl } from "@/lib/strapi";
import { isValidPhoneNumber } from "libphonenumber-js";

export async function POST(request) {
  try {
    const session = await auth();
    if (!session || !session.strapiToken || !session.user?.strapiUserId) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const rawName = body?.name;
    const rawPhone = body?.phone;

    const sanitizedName = typeof rawName === "string" ? rawName.trim() : rawName;
    const sanitizedPhone = typeof rawPhone === "string" ? rawPhone.trim() : rawPhone;

    if (typeof sanitizedName === "undefined" && typeof sanitizedPhone === "undefined") {
      return NextResponse.json({ error: "No hay campos para actualizar" }, { status: 400 });
    }

    if (sanitizedPhone && typeof sanitizedPhone === "string" && !isValidPhoneNumber(sanitizedPhone)) {
      return NextResponse.json({ error: "Numero de telefono invalido" }, { status: 400 });
    }

    const userId = session.user.strapiUserId;
    const url = buildStrapiUrl(`/api/users/${userId}`);

    const payload = {
      ...(typeof sanitizedName !== "undefined" ? { name: sanitizedName } : {}),
      ...(typeof sanitizedPhone !== "undefined" ? { phone: sanitizedPhone || "" } : {}),
    };

    const res = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.strapiToken}`,
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        { error: data?.error?.message || "Error al actualizar usuario" },
        { status: res.status }
      );
    }

    return NextResponse.json({ ok: true, user: data });
  } catch (error) {
    console.error("Error en /api/account/update:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
