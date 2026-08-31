'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';

export async function crearUsuario(data: { name: string; email: string; password: string; role: string }) {
  try {
    const existing = await prisma.user.findUnique({
      where: { email: data.email }
    });
    if (existing) return { error: 'El correo electrónico ya está registrado.' };

    const hashedPassword = await bcrypt.hash(data.password, 10);
    
    await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword, 
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
    
    const hashedPassword = await bcrypt.hash(nuevaPassword, 10);
    
    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword }
    });
    revalidatePath('/usuarios');
    return { success: true };
  } catch (error: any) {
    return { error: 'No se pudo actualizar la contraseña.' };
  }
}

export async function toggleStatusUsuario(id: string, isActive: boolean) {
  try {
    await prisma.user.update({
      where: { id },
      data: { isActive }
    });
    revalidatePath('/usuarios');
    return { success: true };
  } catch (error: any) {
    return { error: 'No se pudo actualizar el estado del usuario.' };
  }
}
