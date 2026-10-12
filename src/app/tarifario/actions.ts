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

export async function updatePrecioTarifario(id: string, descripcion: string, valor: number, codigo?: string) {
  try {
    if (!descripcion.trim() || valor < 0) {
      return { success: false, error: 'Datos inválidos' };
    }
    const dataUpdate: any = { descripcion, valor };
    if (codigo && codigo.trim()) {
      dataUpdate.codigo = codigo.trim().toUpperCase();
    }
    await prisma.guiaPrecio.update({
      where: { id },
      data: dataUpdate,
    });
    revalidatePath('/tarifario');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: 'Error al actualizar el precio' };
  }
}
