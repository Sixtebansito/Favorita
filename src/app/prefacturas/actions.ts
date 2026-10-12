'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getUserSession } from '../actions/auth';

export async function generarPrefactura(
  transportistaId: string, 
  fechaInicio?: string, 
  fechaFin?: string, 
  incluirActivas: boolean = false, 
  cabezalId?: string,
  cierreSemanaId?: string
) {
  const session = await getUserSession();
  if (!session) return { error: 'No autorizado' };

  let whereClause: any = {};

  if (cierreSemanaId && cierreSemanaId !== 'MANUAL_DATES') {
    if (cierreSemanaId === 'ALL_PENDIENTES') {
      whereClause = {
        cierreSemanaId: { not: null },
        estado: 'CUADRADA',
        cabezal: cabezalId ? {
          id: cabezalId,
          transportistaId: transportistaId
        } : {
          transportistaId: transportistaId
        }
      };
    } else {
      whereClause = {
        cierreSemanaId: cierreSemanaId,
        estado: 'CUADRADA',
        ...(cabezalId ? { cabezalId } : {})
      };
    }
  } else {
    const start = new Date(fechaInicio || '');
    const end = new Date(fechaFin || '');
    end.setHours(23, 59, 59, 999);

    whereClause = {
      fecha_guia: {
        gte: start,
        lte: end
      },
      cabezal: cabezalId ? {
        id: cabezalId,
        transportistaId: transportistaId
      } : {
        transportistaId: transportistaId
      },
      estado: {
        in: incluirActivas ? ['CUADRADA', 'ACTIVA'] : ['CUADRADA']
      }
    };
  }

  const guias = await prisma.guia.findMany({
    where: whereClause,
    include: {
      cabezal: true,
      guiaPrecio: true,
      adicionales: true
    },
    orderBy: {
      fecha_guia: 'asc'
    }
  });

  const isPofasa = (g: any) => {
    const desc = g.guiaPrecio?.descripcion?.toUpperCase() || '';
    const dest = g.cliente_destino?.toUpperCase() || '';
    return desc.includes('POFASA') || dest.includes('POFASA');
  };

  const isAgropesa = (g: any) => {
    const desc = g.guiaPrecio?.descripcion?.toUpperCase() || '';
    const dest = g.cliente_destino?.toUpperCase() || '';
    return desc.includes('AGROPESA') || dest.includes('AGROPESA');
  };

  const pofasa = guias.filter(g => isPofasa(g));
  const agropesa = guias.filter(g => !isPofasa(g) && isAgropesa(g));
  const normales = guias.filter(g => !isPofasa(g) && !isAgropesa(g));

  const normalesCabezal = normales.filter(g => (g.cabezal?.tipo?.toUpperCase() || 'CABEZAL') !== 'OTAWA');
  const normalesOtawa = normales.filter(g => g.cabezal?.tipo?.toUpperCase() === 'OTAWA');
  const pofasaCabezal = pofasa;
  const agropesaCabezal = agropesa;

  return {
    normalesCabezal,
    normalesOtawa,
    pofasaCabezal,
    agropesaCabezal,
    guiasOriginales: guias // pasamos las guías crudas por si necesitamos los IDs para liquidar
  };
}

export async function liquidarValores(
  transportistaId: string, 
  fechaInicio: string | undefined, 
  fechaFin: string | undefined, 
  totalPagado: number, 
  totalTickets: number, 
  guiasIds: string[]
) {
  const session = await getUserSession();
  if (!session) return { error: 'No autorizado' };

  try {
    let start: Date | null = fechaInicio && !isNaN(new Date(fechaInicio).getTime()) ? new Date(fechaInicio) : null;
    let end: Date | null = fechaFin && !isNaN(new Date(fechaFin).getTime()) ? new Date(fechaFin) : null;

    if ((!start || !end) && guiasIds.length > 0) {
      const guiasFechas = await prisma.guia.findMany({
        where: { id: { in: guiasIds } },
        select: { fecha_guia: true },
        orderBy: { fecha_guia: 'asc' }
      });
      if (guiasFechas.length > 0) {
        if (!start) start = guiasFechas[0].fecha_guia;
        if (!end) end = guiasFechas[guiasFechas.length - 1].fecha_guia;
      }
    }

    if (!start) start = new Date();
    if (!end) end = new Date();
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

    revalidatePath('/semanas');
    revalidatePath('/prefacturas');
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
