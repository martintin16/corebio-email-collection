import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const AUTH_ROUTES = ["/login", "/forgot-password", "/reset-password"];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getUser() (no getSession()) valida el token contra el servidor de
  // Supabase en vez de confiar ciegamente en la cookie.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  if (!user && !isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/inbox";
    return NextResponse.redirect(url);
  }

  // Capa de UX, no de seguridad: evita renderizar una pantalla de admin
  // que un user común no va a poder usar. La protección real de los
  // datos vive en el backend (RolesGuard en cada endpoint de NestJS).
  if (pathname.startsWith("/admin")) {
    const role = (user?.app_metadata as { role?: string } | undefined)?.role;
    if (role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/inbox";
      return NextResponse.redirect(url);
    }
  }

  return response;
}
