'use server';

import { prisma } from '@/lib/prisma';
import { getUserSession } from '../actions/auth';
import { revalidatePath } from 'next/cache';

export async function getMantenimientos(cabezalId: string) {
  const session = await getUserSession();
  if (!session) return { error: 'No autorizado' };

  try {
    const mantenimientos = await prisma.mantenimientoCabezal.findMany({
      where: { cabezalId },
      orderBy: { fecha: 'desc' }
    });
    return { success: true, mantenimientos };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function crearMantenimiento(data: {
  cabezalId: string;
  fecha: string;
  tipo: string;
  descripcion?: string;
  kilometraje?: number;
  costo?: number;
}) {
  const session = await getUserSession();
  if (!session) return { error: 'No autorizado' };

  try {
    const mantenimiento = await prisma.mantenimientoCabezal.create({
      data: {
        cabezalId: data.cabezalId,
        fecha: new Date(data.fecha),
        tipo: data.tipo,
        descripcion: data.descripcion,
        kilometraje: data.kilometraje,
        costo: data.costo
      }
    });

    revalidatePath('/bitacora');
    return { success: true, mantenimiento };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function eliminarMantenimiento(id: string) {
  const session = await getUserSession();
  if (!session) return { error: 'No autorizado' };

  try {
    await prisma.mantenimientoCabezal.delete({
      where: { id }
    });
    
    revalidatePath('/bitacora');
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
