'use server';

import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';

const SESSION_COOKIE_NAME = 'auth_session';
const secretKey = process.env.SESSION_SECRET || 'default_secret_key_change_in_production';
const key = new TextEncoder().encode(secretKey);

export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(key);
}

export async function decrypt(input: string): Promise<any> {
  try {
    const { payload } = await jwtVerify(input, key, {
      algorithms: ['HS256'],
    });
    return payload;
  } catch (error) {
    return null;
  }
}

export async function login(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Por favor, ingrese email y contraseña' };
  }

  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return { error: 'Credenciales inválidas' };
  }

  if (user.isActive === false) {
    return { error: 'Error al ingresar: Usuario Inactivo por falta de pago, Por favor comunicarse al: 0983958430' };
  }

  // Crear la sesión en cookie
  const sessionData = await encrypt({
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
    const data = await decrypt(session.value);
    if (!data) return null;
    return data as { id: string; role: string; name: string };
  } catch (error) {
    return null;
  }
}
