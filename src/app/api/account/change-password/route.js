import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { buildStrapiUrl } from "@/lib/strapi";

const PASSWORD_RULES = [
  { key: "length", test: (value) => value.length >= 8, message: "La contrasena debe tener al menos 8 caracteres." },
  { key: "uppercase", test: (value) => /[A-Z]/.test(value), message: "Incluye al menos una letra mayuscula." },
  { key: "number", test: (value) => /\d/.test(value), message: "Incluye al menos un numero." },
  { key: "symbol", test: (value) => /[^A-Za-z0-9]/.test(value), message: "Incluye al menos un simbolo." },
];

export async function POST(request) {
  try {
    const session = await auth();
    if (!session || !session.strapiToken) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const currentPassword = body?.currentPassword || "";
    const password = body?.password || "";
    const passwordConfirmation = body?.passwordConfirmation || "";

    if (!currentPassword || !password || !passwordConfirmation) {
      return NextResponse.json({ error: "Todos los campos son requeridos" }, { status: 400 });
    }

    if (password !== passwordConfirmation) {
      return NextResponse.json({ error: "La confirmacion no coincide con la nueva contrasena" }, { status: 400 });
    }

    if (password === currentPassword) {
      return NextResponse.json(
        { error: "La nueva contrasena debe ser distinta a la actual" },
        { status: 400 }
      );
    }

    const failedRule = PASSWORD_RULES.find((rule) => !rule.test(password));
    if (failedRule) {
      return NextResponse.json({ error: failedRule.message }, { status: 400 });
    }

    const url = buildStrapiUrl("/api/auth/change-password");
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.strapiToken}`,
      },
      body: JSON.stringify({ currentPassword, password, passwordConfirmation }),
      cache: "no-store",
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        { error: data?.error?.message || "Error al cambiar contrasena" },
        { status: res.status }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error en /api/account/change-password:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
