'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function crearUsuario(data: { name: string; email: string; password: string; role: string }) {
  try {
    const existing = await prisma.user.findUnique({
      where: { email: data.email }
    });
    if (existing) return { error: 'El correo electrónico ya está registrado.' };

    // In a real application, you should hash the password here (e.g. using bcrypt)
    await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: data.password, 
        role: data.role
      }
    });

    revalidatePath('/usuarios');
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function eliminarUsuario(id: string) {
  try {
    await prisma.user.delete({
      where: { id }
    });
    revalidatePath('/usuarios');
    return { success: true };
  } catch (error: any) {
    return { error: 'No se pudo eliminar el usuario.' };
  }
}

export async function cambiarPassword(id: string, nuevaPassword: string) {
  try {
    if (!nuevaPassword || nuevaPassword.trim().length === 0) {
      return { error: 'La contraseña no puede estar vacía.' };
    }
    
    await prisma.user.update({
      where: { id },
      data: { password: nuevaPassword }
    });
    revalidatePath('/usuarios');
    return { success: true };
  } catch (error: any) {
    return { error: 'No se pudo actualizar la contraseña.' };
  }
}
