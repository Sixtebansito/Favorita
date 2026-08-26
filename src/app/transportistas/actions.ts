'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getUserSession } from '../actions/auth';

export async function crearTransportista(data: { name: string; ruc: string }) {
  try {
    const existing = await prisma.transportista.findUnique({
      where: { ruc: data.ruc }
    });
    if (existing) return { error: 'Esta compañía (RUC) ya está registrada en el sistema. Solicita al administrador que te la asigne a tu usuario.' };

    const session = await getUserSession();
    const userConnect = session ? {
      users: { connect: { id: session.id } }
    } : {};

    await prisma.transportista.create({
      data: {
        name: data.name,
        ruc: data.ruc,
        ...userConnect
      }
    });

    revalidatePath('/transportistas');
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function crearCabezal(data: { placa: string; transportistaId: string }) {
  try {
    const existing = await prisma.cabezal.findUnique({
      where: { placa: data.placa }
    });
    if (existing) return { error: 'La placa ya está registrada.' };

    await prisma.cabezal.create({
      data: {
        placa: data.placa,
        transportistaId: data.transportistaId
      }
    });

    revalidatePath('/transportistas');
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function eliminarCabezal(id: string) {
  try {
    await prisma.cabezal.delete({
      where: { id }
    });
    revalidatePath('/transportistas');
    return { success: true };
  } catch (error: any) {
    return { error: 'No se puede eliminar el cabezal, posiblemente ya tiene guías asociadas.' };
  }
}

export async function getLiquidacionDetalle(liquidacionId: string) {
  const liquidacion = await prisma.liquidacion.findUnique({
    where: { id: liquidacionId },
    include: {
      guias: {
        include: {
          cabezal: true,
          guiaPrecio: true,
          adicionales: true
        },
        orderBy: {
          fecha_guia: 'asc'
        }
      }
    }
  });

  if (!liquidacion) return { error: 'No se encontró la liquidación.' };

  const normales = liquidacion.guias.filter(g => !['POFASA', 'AGROPESA'].includes(g.cliente_destino.toUpperCase()));
  const adicionales = liquidacion.guias.filter(g => ['POFASA', 'AGROPESA'].includes(g.cliente_destino.toUpperCase()));

  return {
    success: true,
    liquidacion,
    reporte: {
      normales,
      adicionales,
      guiasOriginales: liquidacion.guias
    }
  };
}

export async function asignarUsuarioATransportista(transportistaId: string, userId: string) {
  try {
    await prisma.transportista.update({
      where: { id: transportistaId },
      data: {
        users: {
          connect: { id: userId }
        }
      }
    });
    revalidatePath('/transportistas');
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

