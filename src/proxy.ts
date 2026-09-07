import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SESSION_COOKIE_NAME = 'auth_session';

function getSecretKey() {
  const secretKey = process.env.SESSION_SECRET || 'default_secret_key_change_in_production';
  return new TextEncoder().encode(secretKey);
}

// Define las rutas que requieren estar logeado (ahora la raíz '/' es el dashboard)
const protectedRoutes = ['/guias', '/semanas', '/prefacturas', '/tarifario', '/usuarios', '/transportistas'];
const publicRoutes = ['/login', '/forgot-password', '/reset-password'];

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isPublicRoute = publicRoutes.some(route => path.startsWith(route));
  // isProtectedRoute es true si la ruta es exactamente '/' o si empieza por alguna ruta protegida
  const isProtectedRoute = path === '/' || protectedRoutes.some(route => path.startsWith(route));

  // Obtener la cookie de sesión
  const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  let session = null;

  if (cookie) {
    try {
      const { payload } = await jwtVerify(cookie, getSecretKey(), {
        algorithms: ['HS256'],
      });
      session = payload;
    } catch (err) {
      // Token inválido o expirado
      session = null;
    }
  }

  // Redirigir a login si es ruta protegida y no hay sesión válida
  if (isProtectedRoute && !session && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.nextUrl));
  }

  // Si está logeado y trata de ir a login, mandar a la raíz (dashboard)
  if (session && isPublicRoute) {
    return NextResponse.redirect(new URL('/', request.nextUrl));
  }

  // Si la ruta es de admin (usuarios, transportistas, tarifario), asegurar que el usuario sea ADMIN
  const isAdminRoute = path.startsWith('/usuarios') || path.startsWith('/transportistas') || path.startsWith('/tarifario');
  if (isAdminRoute && session?.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/', request.nextUrl));
  }

  return NextResponse.next();
}

// Opcional: configurar en qué rutas corre el middleware
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
