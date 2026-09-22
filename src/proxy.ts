import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, readSessionToken } from "@/lib/auth";

/**
 * Barreira de entrada do sistema: sem sessão válida, nada abaixo de /sistema
 * chega a ser renderizado. A checagem fina de permissão fica em cada página.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isLogin = pathname === "/sistema/entrar";
  const userId = await readSessionToken(request.cookies.get(SESSION_COOKIE)?.value);

  if (!userId && !isLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/sistema/entrar";
    url.searchParams.set("de", pathname);
    return NextResponse.redirect(url);
  }

  if (userId && isLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/sistema";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/sistema/:path*"],
};
