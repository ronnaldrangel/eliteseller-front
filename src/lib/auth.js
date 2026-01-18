import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import {
  strapiAuth,
  strapiUsers,
  buildStrapiUrl,
} from "@/lib/strapi";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
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
            } catch (roleError) {
              console.error("❌ Error fetching user role:", roleError);
            }

            return {
              id: data.user.id.toString(),
              email: data.user.email,
              name: data.user.name || data.user.username,
              strapiToken: data.jwt,
              emailVerified: !!data.user.confirmed,
              role: userRole,
            };
          }

          return null;
        } catch (error) {
          console.error("❌ Authentication error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ account }) {
      if (account?.provider === "google") {
        try {
          if (!account.access_token) return false;
          const callbackUrl = buildStrapiUrl(`/api/auth/google/callback?access_token=${account.access_token}`);
          const authRes = await fetch(callbackUrl, { method: "GET", headers: { "Content-Type": "application/json" } });
          if (!authRes.ok) return false;
          const authData = await authRes.json();
          if (authData?.jwt) {
            console.log(`🌍 [Auth] Google: ${authData.user?.email}`);
          }
          return !!(authData?.jwt && authData?.user);
        } catch (error) {
          console.error("❌ Google Auth Error:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account, trigger, session }) {
      if (user) {
        token.strapiToken = user.strapiToken;
        token.strapiUserId = user.id;
        token.email = user.email;
        token.name = user.name;
        token.emailVerified = user.emailVerified;
        token.role = user.role;
      }

      if (account?.provider === "google" && !token.strapiToken) {
        try {
          const callbackUrl = buildStrapiUrl(`/api/auth/google/callback?access_token=${account.access_token}`);
          const authRes = await fetch(callbackUrl, { method: "GET", headers: { "Content-Type": "application/json" } });

          if (authRes.ok) {
            const authData = await authRes.json();
            token.strapiToken = authData.jwt;
            token.strapiUserId = authData.user.id;

            const meRes = await fetch(buildStrapiUrl("/api/users/me?populate=role"), {
              headers: { Authorization: `Bearer ${authData.jwt}` },
            });
            if (meRes.ok) {
              const meData = await meRes.json();
              token.role = meData.role?.name;
            }
          }
        } catch (error) {
          console.error("❌ JWT Sync Error:", error);
        }
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
        session.user.emailVerified = token.emailVerified;
        session.user.role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
    signUp: "/auth/register",
  },
  session: {
    strategy: "jwt",
  },
});

export async function registerUser(userData) {
  try {
    const response = await strapiAuth.register({
      username: userData.username,
      email: userData.email,
      password: userData.password,
    });

    const data = await response.json();

    if (response.ok) {
      console.log(`📝 [Auth] Registered: ${data.user?.email}`);
      return { success: true, user: data.user, jwt: data.jwt };
    } else {
      let errorMessage = data.error?.message || "Error en el registro. Por favor, intenta de nuevo.";

      if (data.error?.details?.errors?.length > 0) {
        const firstError = data.error.details.errors[0];
        if (firstError.path?.includes("email")) errorMessage = "Este email ya está registrado";
        else if (firstError.path?.includes("username")) errorMessage = "Este nombre de usuario ya está en uso";
      }

      return { success: false, error: { message: errorMessage } };
    }
  } catch (error) {
    console.error("❌ Registration Error:", error);
    return {
      success: false,
      error: { message: "Error de conexión. Por favor, verifica tu conexión a internet." },
    };
  }
}
