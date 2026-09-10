'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function updateTarifarioNombre(id: string, nombre: string) {
  try {
    if (!nombre.trim()) {
      return { success: false, error: 'El nombre no puede estar vacío' };
    }
    await prisma.tarifario.update({
      where: { id },
      data: { nombre },
    });
    revalidatePath('/tarifario');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: 'Error al actualizar el nombre del tarifario' };
  }
}

export async function updatePrecioTarifario(id: string, descripcion: string, valor: number) {
  try {
    if (!descripcion.trim() || valor < 0) {
      return { success: false, error: 'Datos inválidos' };
    }
    await prisma.guiaPrecio.update({
      where: { id },
      data: { descripcion, valor },
    });
    revalidatePath('/tarifario');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: 'Error al actualizar el precio' };
  }
}
