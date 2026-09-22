'use server';

import { prisma } from '@/lib/prisma';
import { getUserSession } from '../actions/auth';
import { revalidatePath } from 'next/cache';

export async function registrarCarga(data: {
  cabezalId: string;
  fecha: string;
  descripcion: string;
  cantidad: number;
  valor: number;
}) {
  const session = await getUserSession();
  if (!session) return { error: 'No autorizado' };

  try {
    const nuevaCarga = await prisma.carga.create({
      data: {
        cabezalId: data.cabezalId,
        fecha: new Date(data.fecha),
        descripcion: data.descripcion,
        cantidad: data.cantidad,
        valor: data.valor,
      }
    });
    revalidatePath('/cargas');
    return { success: true, carga: nuevaCarga };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function obtenerCargas(transportistaId?: string) {
  const session = await getUserSession();
  if (!session) return { error: 'No autorizado' };

  try {
    const cargas = await prisma.carga.findMany({
      where: transportistaId ? { cabezal: { transportistaId } } : {},
      include: {
        cabezal: {
          include: { transportista: true }
        }
      },
      orderBy: { fecha: 'desc' }
    });
    return { success: true, cargas };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function eliminarCarga(id: string) {
  const session = await getUserSession();
  if (!session) return { error: 'No autorizado' };

  try {
    await prisma.carga.delete({
      where: { id }
    });
    revalidatePath('/cargas');
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
