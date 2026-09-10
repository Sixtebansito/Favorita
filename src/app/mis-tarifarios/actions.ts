'use server';

import { prisma } from '@/lib/prisma';
import { getUserSession } from '../actions/auth';
import { revalidatePath } from 'next/cache';

export async function addPrivateCode(codigo: string, descripcion: string, tipo: string, valor: number) {
  const session = await getUserSession();
  if (!session) return { error: 'No autorizado' };

  if (!codigo || !descripcion || valor < 0 || !tipo) {
    return { error: 'Datos inválidos' };
  }

  // Find active tarifario
  const tarifario = await prisma.tarifario.findFirst({
    where: { activo: true },
    orderBy: { fecha_vigencia: 'desc' }
  });

  if (!tarifario) {
    return { error: 'No hay un tarifario base activo para asociar el código.' };
  }

  try {
    // Check if code already exists for this user in this tarifario
    const existing = await prisma.guiaPrecio.findFirst({
      where: {
        codigo: codigo.toUpperCase(),
        tarifarioId: tarifario.id,
        userId: session.id
      }
    });

    if (existing) {
      return { error: 'Ya tienes un código privado con ese nombre en el tarifario actual.' };
    }

    await prisma.guiaPrecio.create({
      data: {
        codigo: codigo.toUpperCase(),
        descripcion: descripcion.toUpperCase(),
        tipo,
        valor,
        tarifarioId: tarifario.id,
        userId: session.id
      }
    });
    revalidatePath('/mis-tarifarios');
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function updatePrivateCode(id: string, descripcion: string, valor: number) {
  const session = await getUserSession();
  if (!session) return { error: 'No autorizado' };

  try {
    await prisma.guiaPrecio.updateMany({
      where: { id, userId: session.id },
      data: { descripcion: descripcion.toUpperCase(), valor }
    });
    revalidatePath('/mis-tarifarios');
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function deletePrivateCode(id: string) {
  const session = await getUserSession();
  if (!session) return { error: 'No autorizado' };

  try {
    await prisma.guiaPrecio.deleteMany({
      where: { id, userId: session.id }
    });
    revalidatePath('/mis-tarifarios');
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
