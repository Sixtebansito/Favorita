'use server';

import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';

const SESSION_COOKIE_NAME = 'auth_session';

export async function login(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Por favor, ingrese email y contraseña' };
  }

  // Busca el usuario en la BD (En prod las contraseñas deben estar hasheadas con bcrypt, pero aquí haremos una validación simple según el esquema actual)
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user || user.password !== password) {
    return { error: 'Credenciales inválidas' };
  }

  // Crear la sesión en cookie
  const sessionData = JSON.stringify({
    id: user.id,
    role: user.role,
    name: user.name
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionData, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // 1 semana
    path: '/',
  });

  return { success: true };
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  redirect('/login');
}

export async function getUserSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE_NAME);
  if (!session?.value) return null;

  try {
    const data = JSON.parse(session.value);
    return data as { id: string; role: string; name: string };
  } catch (error) {
    return null;
  }
}
