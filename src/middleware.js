  import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth
  const ref = req.nextUrl.searchParams.get("ref")

  // Define protected routes
  const protectedRoutes = ["/dashboard", "/billing", "/order-confirmation"]
  const authRoutes = ["/auth/login", "/auth/register"]

  // Check if the current path is a protected route
  const isProtectedRoute = protectedRoutes.some(route =>
    pathname.startsWith(route)
  )

  // Check if the current path is an auth route
  const isAuthRoute = authRoutes.some(route =>
    pathname.startsWith(route)
  )

  let res = null
  if (isLoggedIn && isAuthRoute) {
    res = NextResponse.redirect(new URL("/select", req.url))
  }

  if (!isLoggedIn && isProtectedRoute) {
    const loginUrl = new URL("/auth/login", req.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    res = NextResponse.redirect(loginUrl)
  }

  // Restrict /super-admin to specific email - MOVED TO PAGE GATEKEEPER
  // if (isLoggedIn && pathname.startsWith("/super-admin")) {
  //   const userEmail = req.auth.user?.email;
  //   const allowedEmail = process.env.SUPER_ADMIN_EMAIL;
  //
  //   if (userEmail !== allowedEmail) {
  //     // Redirect unauthorized users to dashboard
  //     res = NextResponse.redirect(new URL("/dashboard", req.url));
  //   }
  // }

  if (!res) {
    res = NextResponse.next()
  }
  if (ref) {
    res.cookies.set("affiliate-ref-id", ref, {
      maxAge: 30 * 24 * 60 * 60,
      sameSite: "lax",
      path: "/",
      httpOnly: false,
    })
  }
  return res
})

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
  ],
}
