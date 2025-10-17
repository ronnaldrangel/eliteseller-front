import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import GithubProvider from 'next-auth/providers/github';
import axios from 'axios';
import { authenticateUser } from './login';

export default NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
    
    CredentialsProvider({
      name: 'Sign in with Email',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        return await authenticateUser(credentials?.email, credentials?.password);
      },
    }),
  ],

  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider === 'google' || account?.provider === 'github') {
        try {
          // Validar que tenemos los datos necesarios
          if (!profile?.email || !account?.access_token) {
            console.error('❌ Datos de perfil OAuth incompletos');
            return false;
          }

          console.log(`🔍 Verificando usuario en Strapi con ${account.provider}:`, profile.email);

          // Verificar si el usuario ya existe
          const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users?filters[email][$eq]=${encodeURIComponent(profile.email)}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.API_TOKEN}`,
            },
          });

          if (!res.ok) {
            console.error(`❌ Error verificando usuario: ${res.status} ${res.statusText}`);
            return false;
          }

          const users = await res.json();
          if (!Array.isArray(users)) {
            console.error('❌ Respuesta de usuarios inválida');
            return false;
          }
          
          // Si existe un usuario local con el mismo email, no permitir OAuth
          if (users.length > 0) {
            const existingUser = users[0];
            if (existingUser.provider === 'local') {
              console.error('❌ Ya existe una cuenta local con este email');
              return false;
            }
          }

          // Autenticar con el provider OAuth
          const authRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/${account.provider}/callback?access_token=${account.access_token}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.API_TOKEN}`,
            },
          });

          if (!authRes.ok) {
            console.error(`❌ Error en callback OAuth: ${authRes.status} ${authRes.statusText}`);
            return false;
          }

          const authData = await authRes.json();
          if (!authData?.jwt || !authData?.user) {
            console.error('❌ Respuesta de autenticación OAuth incompleta');
            return false;
          }
          
          console.log(`✅ Autenticación OAuth exitosa para: ${authData.user.email}`);
          return true;
        } catch (error) {
          console.error(`❌ Error en signIn con ${account.provider}:`, error.message);
          return false;
        }
      }
      return true;
    },

    async jwt({ token, user, account }) {
      try {
        // Si es un login inicial con OAuth
        if (account?.provider === 'google' || account?.provider === 'github') {
          if (!account.access_token) {
            console.error('❌ Access token OAuth faltante');
            return { ...token, error: 'OAuthError' };
          }

          const authRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/${account.provider}/callback?access_token=${account.access_token}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.API_TOKEN}`,
            },
          });

          if (!authRes.ok) {
            console.error(`❌ Error en callback OAuth JWT: ${authRes.status}`);
            return { ...token, error: 'OAuthError' };
          }

          const authData = await authRes.json();
          if (!authData?.jwt || !authData?.user) {
            console.error('❌ Datos de autenticación OAuth incompletos');
            return { ...token, error: 'OAuthError' };
          }
          
          // Decodificar el JWT de forma segura
          try {
            const jwtParts = authData.jwt.split('.');
            if (jwtParts.length !== 3) {
              throw new Error('JWT malformado');
            }
            const payload = JSON.parse(Buffer.from(jwtParts[1], 'base64').toString());
            
            token.id = authData.user.id;
            token.jwt = authData.jwt;
            token.name = authData.user.username || authData.user.email;
            token.email = authData.user.email;
            token.exp = payload.exp;
            
            console.log(`✅ JWT OAuth configurado para: ${token.email}`);
          } catch (jwtError) {
            console.error('❌ Error decodificando JWT OAuth:', jwtError.message);
            return { ...token, error: 'JWTError' };
          }
        } else if (user) {
          // Si es un login con credenciales
          if (!user.jwt || !user.id || !user.email) {
            console.error('❌ Datos de usuario incompletos');
            return { ...token, error: 'UserDataError' };
          }

          token.id = user.id;
          token.jwt = user.jwt;
          token.name = user.name || user.username || user.email;
          token.email = user.email;
          
          // Decodificar el JWT de forma segura
          try {
            const jwtParts = user.jwt.split('.');
            if (jwtParts.length !== 3) {
              throw new Error('JWT malformado');
            }
            const payload = JSON.parse(Buffer.from(jwtParts[1], 'base64').toString());
            token.exp = payload.exp;
            
            console.log(`✅ JWT credenciales configurado para: ${token.email}`);
          } catch (jwtError) {
            console.error('❌ Error decodificando JWT credenciales:', jwtError.message);
            return { ...token, error: 'JWTError' };
          }
        }
        
        // Verificar si el token ha expirado
        const now = Math.floor(Date.now() / 1000);
        if (token.exp && now >= token.exp) {
          console.log('⚠️ Token expirado para:', token.email);
          token.error = 'TokenExpired';
        }
        
        return token;
      } catch (error) {
        console.error('❌ Error en callback JWT:', error.message);
        return { ...token, error: 'JWTCallbackError' };
      }
    },

    async session({ session, token }) {
      try {
        // Validar que tenemos los datos mínimos necesarios
        if (!token || !session?.user) {
          console.error('❌ Datos de sesión incompletos');
          return null;
        }

        // Asignar datos del token a la sesión
        session.id = token.id;
        session.jwt = token.jwt;
        session.user.name = token.name || session.user.name;
        session.user.email = token.email || session.user.email;
        
        // Manejar diferentes tipos de errores
        if (token.error) {
          session.error = token.error;
          
          switch (token.error) {
            case 'TokenExpired':
              console.log('⚠️ Sesión expirada para:', session.user.email);
              break;
            case 'OAuthError':
              console.error('❌ Error OAuth en sesión para:', session.user.email);
              break;
            case 'JWTError':
              console.error('❌ Error JWT en sesión para:', session.user.email);
              break;
            default:
              console.error('❌ Error desconocido en sesión:', token.error);
          }
        }
        
        return session;
      } catch (error) {
        console.error('❌ Error en callback de sesión:', error.message);
        return null;
      }
    },
  },

  pages: {
    signIn: '/login',
  },
  
  // Añadir un JWT secreto para operaciones de NextAuth
  secret: process.env.NEXTAUTH_SECRET,
  
  // Establecer una duración de sesión para mantener la coherencia con Strapi
  session: {
    strategy: "jwt",
    // Este tiempo debe ser menor que el tiempo de expiración de Strapi
    maxAge: 7 * 24 * 60 * 60, // 30 días
  },
});