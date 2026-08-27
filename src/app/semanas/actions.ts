'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function actualizarValorGuia(guiaId: string, nuevoValorBase: number, nuevoValorTicket: number, nuevosAdicionales: { id: string; concepto?: string; valor: number }[], cierreSemanaId: string) {
  try {
    // 1. Actualizar el valor base de la guía y tickets
    await prisma.guia.update({
      where: { id: guiaId },
      data: { 
        valor_base_cobrado: nuevoValorBase,
        valor_ticket: nuevoValorTicket
      }
    });

    // 2. Actualizar o crear los adicionales
    for (const adic of nuevosAdicionales) {
      if (adic.id.startsWith('new_') && adic.concepto) {
        await prisma.guiaAdicional.create({
          data: {
            guiaId: guiaId,
            concepto: adic.concepto,
            valor: adic.valor
          }
        });
      } else {
        await prisma.guiaAdicional.update({
          where: { id: adic.id },
          data: { valor: adic.valor }
        });
      }
    }

    // 3. Recalcular el total del Cierre de Semana
    const cierre = await prisma.cierreSemana.findUnique({
      where: { id: cierreSemanaId },
      include: {
        guias: {
          include: { adicionales: true }
        }
      }
    });

    if (cierre) {
      const nuevoTotal = cierre.guias.reduce((acc, g) => {
        const adicTotal = g.adicionales.reduce((s, a) => s + a.valor, 0);
        return acc + g.valor_base_cobrado + adicTotal;
      }, 0);
      const nuevoTotalTickets = cierre.guias.reduce((acc, g) => acc + (g.valor_ticket || 0), 0);

      await prisma.cierreSemana.update({
        where: { id: cierreSemanaId },
        data: { total: nuevoTotal, total_tickets: nuevoTotalTickets }
      });
    }

    revalidatePath('/semanas');
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function eliminarGuiaDeSemana(guiaId: string, cierreSemanaId: string) {
  try {
    // 1. Revertir la guía a ACTIVA y desligarla del cierre
    await prisma.guia.update({
      where: { id: guiaId },
      data: {
        estado: 'ACTIVA',
        cierreSemanaId: null
      }
    });

    // 2. Recalcular el Cierre de Semana
    const cierre = await prisma.cierreSemana.findUnique({
      where: { id: cierreSemanaId },
      include: {
        guias: {
          include: { adicionales: true }
        }
      }
    });

    if (cierre) {
      if (cierre.guias.length === 0) {
        // Si ya no quedan guías en este cierre, lo eliminamos
        await prisma.cierreSemana.delete({
          where: { id: cierreSemanaId }
        });
      } else {
        const nuevoTotal = cierre.guias.reduce((acc, g) => {
          const adicTotal = g.adicionales.reduce((s, a) => s + a.valor, 0);
          return acc + g.valor_base_cobrado + adicTotal;
        }, 0);
        const nuevoTotalTickets = cierre.guias.reduce((acc, g) => acc + (g.valor_ticket || 0), 0);

        await prisma.cierreSemana.update({
          where: { id: cierreSemanaId },
          data: { total: nuevoTotal, total_tickets: nuevoTotalTickets }
        });
      }
    }

    revalidatePath('/semanas');
    revalidatePath('/guias/registro'); // Also revalidate registry since it goes back there
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
