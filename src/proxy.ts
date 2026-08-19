import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// /demo is the signed-out walkthrough: fixture data, no database access.
const PUBLIC_PATHS = ["/login", "/auth/callback", "/demo", "/portals"];

/**
 * Refreshes the Supabase session cookie on every request and keeps signed-out
 * users away from the app shell. Role enforcement itself lives in the database
 * (RLS) and in requireRole() — this only avoids a pointless render.
 *
 * It runs in front of every request, so it must never throw: a crash here
 * takes down the whole site rather than one page. Anything unexpected is
 * treated as "not signed in" and the request is allowed through, where the
 * page's own guards and the database's policies still apply.
 */
export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Misconfigured deployment: serve the app rather than a 500 on every route.
  if (!url || !anonKey) return NextResponse.next({ request });

  let response = NextResponse.next({ request });

  try {
    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(items: { name: string; value: string; options?: Record<string, unknown> }[]) {
          items.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          items.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options as never),
          );
        },
      },
    });

    // If the auth service is unreachable, treat the request as signed out
    // rather than failing the page.
    const user = await supabase.auth
      .getUser()
      .then(({ data }) => data.user)
      .catch(() => null);

    const { pathname } = request.nextUrl;
    const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

    if (!user && !isPublic) {
      const redirect = request.nextUrl.clone();
      redirect.pathname = "/login";
      redirect.searchParams.set("next", pathname);
      return NextResponse.redirect(redirect);
    }

    if (user && pathname === "/login") {
      const home = request.nextUrl.clone();
      home.pathname = "/";
      home.search = "";
      return NextResponse.redirect(home);
    }

    return response;
  } catch {
    return NextResponse.next({ request });
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|webp)$).*)"],
};
