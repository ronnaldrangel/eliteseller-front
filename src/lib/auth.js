import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import {
  strapiAuth,
  buildStrapiUrl,
} from "@/lib/strapi";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        try {
          const response = await strapiAuth.login({
            identifier: credentials.email,
            password: credentials.password,
          });
          const data = await response.json();
          if (response.ok && data.user) {
            console.log(`🔐 [Auth] Login: ${data.user.email}`);
            let userRole = null;
            try {
              const meRes = await fetch(buildStrapiUrl("/api/users/me?populate=role"), {
                headers: { Authorization: `Bearer ${data.jwt}` },
              });
              if (meRes.ok) {
                const meData = await meRes.json();
                userRole = meData?.role?.name;
              }
            } catch (e) { }
            return {
              id: data.user.id.toString(),
              email: data.user.email,
              strapiToken: data.jwt,
              role: userRole,
            };
          }
          return null;
        } catch (error) {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async authorized({ auth }) {
      // Forzamos true para evitar el error AccessDenied automático de Auth.js
      return true;
    },
    async signIn({ account, user }) {
      if (account?.provider === "google") {
        try {
          console.log(`🔄 [Auth] Vinculando Google para: ${user?.email || "unknown"}`);
          const callbackUrl = buildStrapiUrl(`/api/auth/google/callback?access_token=${account.access_token}`);

          const authRes = await fetch(callbackUrl, {
            method: "GET",
            headers: { "Content-Type": "application/json" }
          });

          if (!authRes.ok) {
            const errorText = await authRes.text();
            console.error(`❌ [Auth] Strapi Error ${authRes.status}:`, errorText);

            // Si el error es "Email already taken", es que hay un conflicto en Strapi
            if (errorText.includes("Email already taken")) {
              console.warn("⚠️ El email ya existe. Strapi debería haberlo vinculado. Verifica Settings -> Advanced Settings en Strapi Admin.");
            }
            return false;
          }

          const authData = await authRes.json();
          if (authData?.jwt) {
            console.log(`🌍 [Auth] Google OK: ${authData.user?.email}`);
            return true;
          }
          return false;
        } catch (error) {
          console.error("❌ [Auth] Error en callback de Google:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account, trigger, session }) {
      if (user) {
        token.strapiToken = user.strapiToken;
        token.strapiUserId = user.id;
        token.role = user.role;
      }
      if (account?.provider === "google" && !token.strapiToken) {
        try {
          const callbackUrl = buildStrapiUrl(`/api/auth/google/callback?access_token=${account.access_token}`);
          const authRes = await fetch(callbackUrl, {
            method: "GET",
            headers: { "Content-Type": "application/json" }
          });
          if (authRes.ok) {
            const authData = await authRes.json();
            token.strapiToken = authData.jwt;
            token.strapiUserId = authData.user.id;
          }
        } catch (e) { }
      }
      if (trigger === "update" && session) {
        return { ...token, ...session.user };
      }
      return token;
    },
    async session({ session, token }) {
      session.strapiToken = token.strapiToken;
      if (session.user) {
        session.user.strapiUserId = token.strapiUserId;
        session.user.role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
  },
  session: { strategy: "jwt" },
});

export async function registerUser(userData) {
  try {
    const response = await strapiAuth.register(userData);
    const data = await response.json();
    if (response.ok) {
      console.log(`📝 [Auth] Registered: ${data.user?.email}`);
      return { success: true, user: data.user, jwt: data.jwt };
    }
    return { success: false, error: data.error };
  } catch (error) {
    return { success: false, error: { message: "Error de red" } };
  }
}
