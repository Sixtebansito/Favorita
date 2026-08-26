'use server';

import { prisma } from '@/lib/prisma';

export async function generarPrefactura(transportistaId: string, fechaInicio: string, fechaFin: string) {
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
      estado: 'CUADRADA' // Solo guías que ya fueron cerradas semanalmente pero no liquidadas
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

  const normales = guias.filter(g => !['POFASA', 'AGROPESA'].includes(g.cliente_destino.toUpperCase()));
  const adicionales = guias.filter(g => ['POFASA', 'AGROPESA'].includes(g.cliente_destino.toUpperCase()));

  return {
    normales,
    adicionales,
    guiasOriginales: guias // pasamos las guías crudas por si necesitamos los IDs para liquidar
  };
}

export async function liquidarValores(transportistaId: string, fechaInicio: string, fechaFin: string, totalPagado: number, totalTickets: number, guiasIds: string[]) {
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
