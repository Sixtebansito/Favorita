'use server';

import { prisma } from '@/lib/prisma';
import { getUserSession } from '../actions/auth';

export async function generarPrefactura(transportistaId: string, fechaInicio: string, fechaFin: string, incluirActivas: boolean = false) {
  const session = await getUserSession();
  if (!session) return { error: 'No autorizado' };

  const start = new Date(fechaInicio);
  const end = new Date(fechaFin);
  // Asegurar que el end cubra todo el dia
  end.setHours(23, 59, 59, 999);

  const guias = await prisma.guia.findMany({
    where: {
      fecha_guia: {
        gte: start,
        lte: end
      },
      cabezal: {
        transportistaId: transportistaId
      },
      estado: {
        in: incluirActivas ? ['CUADRADA', 'ACTIVA'] : ['CUADRADA']
      } // Solo guías que ya fueron cerradas semanalmente, o también activas si se solicita
    },
    include: {
      cabezal: true,
      guiaPrecio: true,
      adicionales: true
    },
    orderBy: {
      fecha_guia: 'asc'
    }
  });

  const normales = guias.filter(g => {
    const desc = g.guiaPrecio?.descripcion.toUpperCase() || '';
    return !desc.includes('POFASA') && !desc.includes('AGROPESA');
  });
  
  const pofasa = guias.filter(g => {
    const desc = g.guiaPrecio?.descripcion.toUpperCase() || '';
    return desc.includes('POFASA');
  });
  
  const agropesa = guias.filter(g => {
    const desc = g.guiaPrecio?.descripcion.toUpperCase() || '';
    return desc.includes('AGROPESA');
  });

  return {
    normales,
    pofasa,
    agropesa,
    guiasOriginales: guias // pasamos las guías crudas por si necesitamos los IDs para liquidar
  };
}

export async function liquidarValores(transportistaId: string, fechaInicio: string, fechaFin: string, totalPagado: number, totalTickets: number, guiasIds: string[]) {
  const session = await getUserSession();
  if (!session) return { error: 'No autorizado' };

  try {
    const start = new Date(fechaInicio);
    const end = new Date(fechaFin);
    end.setHours(23, 59, 59, 999);

    // Creamos la liquidación
    const liquidacion = await prisma.liquidacion.create({
      data: {
        transportistaId,
        fecha_inicio: start,
        fecha_fin: end,
        total_pagado: totalPagado,
        total_tickets: totalTickets
      }
    });

    // Actualizamos las guías para enlazarlas y cambiarlas a LIQUIDADA
    await prisma.guia.updateMany({
      where: {
        id: { in: guiasIds }
      },
      data: {
        estado: 'LIQUIDADA',
        liquidacionId: liquidacion.id
      }
    });

    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
