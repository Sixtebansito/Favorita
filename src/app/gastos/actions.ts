'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function registrarGasto(data: {
  transportistaId: string;
  cabezalId: string | null;
  fecha: string;
  concepto: string;
  valor: number;
  descripcion: string;
}) {
  try {
    const gasto = await prisma.gasto.create({
      data: {
        transportistaId: data.transportistaId,
        cabezalId: data.cabezalId || null,
        fecha: new Date(data.fecha),
        concepto: data.concepto,
        valor: data.valor,
        descripcion: data.descripcion || null,
      },
    });

    revalidatePath('/gastos');
    return { success: true, gasto };
  } catch (error) {
    console.error('Error al registrar gasto:', error);
    return { success: false, error: 'Ocurrió un error al registrar el gasto' };
  }
}

export async function eliminarGasto(id: string) {
  try {
    await prisma.gasto.delete({
      where: { id },
    });
    revalidatePath('/gastos');
    return { success: true };
  } catch (error) {
    console.error('Error al eliminar gasto:', error);
    return { success: false, error: 'Ocurrió un error al eliminar el gasto' };
  }
}

export async function obtenerGastos(transportistaId?: string) {
  try {
    const whereClause = transportistaId ? { transportistaId } : {};
    
    const gastos = await prisma.gasto.findMany({
      where: whereClause,
      include: {
        cabezal: true,
        transportista: true,
      },
      orderBy: {
        fecha: 'desc',
      },
      take: 100, // Limitamos a los 100 más recientes para no sobrecargar
    });
    
    return { success: true, gastos };
  } catch (error) {
    console.error('Error al obtener gastos:', error);
    return { success: false, error: 'Ocurrió un error al obtener los gastos' };
  }
}

export async function cerrarGastosMensuales(
  transportistaId: string,
  mesReferencia: string,
  fechaHasta?: string
) {
  try {
    // 1. Fetch gastos activos
    const whereClause: any = {
      transportistaId,
      estado: 'ACTIVO',
    };

    if (fechaHasta) {
      whereClause.fecha = {
        lte: new Date(fechaHasta),
      };
    }

    const gastosToClose = await prisma.gasto.findMany({
      where: whereClause,
    });

    if (gastosToClose.length === 0) {
      return { success: false, error: 'No hay gastos activos para cerrar con los criterios dados.' };
    }

    const total = gastosToClose.reduce((sum, g) => sum + g.valor, 0);

    // 2. Create CierreMesGasto and update gastos in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const cierre = await tx.cierreMesGasto.create({
        data: {
          transportistaId,
          mes_referencia: mesReferencia,
          total,
        },
      });

      await tx.gasto.updateMany({
        where: { id: { in: gastosToClose.map(g => g.id) } },
        data: {
          estado: 'CERRADO',
          cierreMesGastoId: cierre.id,
        },
      });

      return cierre;
    });

    revalidatePath('/gastos');
    return { success: true, cierre: result };
  } catch (error) {
    console.error('Error al cerrar gastos:', error);
    return { success: false, error: 'Ocurrió un error al intentar cerrar los gastos.' };
  }
}

export async function obtenerCierresMensuales(transportistaId?: string) {
  try {
    const whereClause = transportistaId ? { transportistaId } : {};
    
    const cierres = await prisma.cierreMesGasto.findMany({
      where: whereClause,
      include: {
        transportista: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    return { success: true, cierres };
  } catch (error) {
    console.error('Error al obtener cierres:', error);
    return { success: false, error: 'Ocurrió un error al obtener los cierres mensuales' };
  }
}
