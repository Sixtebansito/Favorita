import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SESSION_COOKIE_NAME = 'auth_session';
const secretKey = process.env.SESSION_SECRET || 'default_secret_key_change_in_production';
const key = new TextEncoder().encode(secretKey);

// Define las rutas que requieren estar logeado
const protectedRoutes = ['/dashboard', '/guias', '/semanas', '/prefacturas', '/tarifario', '/admin'];
const publicRoutes = ['/login'];

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route));
  const isPublicRoute = publicRoutes.some(route => path.startsWith(route));

  // Obtener la cookie de sesión
  const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  let session = null;

  if (cookie) {
    try {
      const { payload } = await jwtVerify(cookie, key, {
        algorithms: ['HS256'],
      });
      session = payload;
    } catch (err) {
      // Token inválido o expirado
      session = null;
    }
  }

  // Redirigir a login si es ruta protegida y no hay sesión válida
  if (isProtectedRoute && !session) {
    return NextResponse.redirect(new URL('/login', request.nextUrl));
  }

  // Si está logeado y trata de ir a login o a la raíz "/", mandar al dashboard
  if (session && (isPublicRoute || path === '/')) {
    return NextResponse.redirect(new URL('/dashboard', request.nextUrl));
  }

  // Si la ruta es de admin, asegurar que el usuario sea ADMIN
  if (path.startsWith('/admin') && session?.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/dashboard', request.nextUrl));
  }
  
  if (path.startsWith('/tarifario') && session?.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', request.nextUrl));
  }

  return NextResponse.next();
}

// Opcional: configurar en qué rutas corre el middleware
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
