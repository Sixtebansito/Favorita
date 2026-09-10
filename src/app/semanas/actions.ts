'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getUserSession } from '../actions/auth';

export async function actualizarValoresMultiples(updates: { guiaId: string, nuevoValorBase: number, nuevoValorTicket: number, nuevosAdicionales: any[], cabezalId?: string }[], cierreSemanaId?: string) {
  const session = await getUserSession();
  if (!session) return { error: 'No autorizado' };

  try {
    // 1. Iterar y actualizar cada guía
    for (const update of updates) {
      const dataToUpdate: any = {
        valor_base_cobrado: update.nuevoValorBase,
        valor_ticket: update.nuevoValorTicket,
      };
      if (update.cabezalId) {
        dataToUpdate.cabezalId = update.cabezalId;
      }

      await prisma.guia.update({
        where: { id: update.guiaId },
        data: dataToUpdate
      });

      for (const adic of update.nuevosAdicionales) {
        if (adic.id.startsWith('new_') && adic.concepto) {
          await prisma.guiaAdicional.create({
            data: {
              guiaId: update.guiaId,
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
    }

    // 2. Recalcular el total del Cierre de Semana
    if (cierreSemanaId) {
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
    }

    revalidatePath('/semanas');
    return { success: true };
  } catch (error: any) {
    console.error("Error al actualizar guías:", error);
    return { error: 'Error interno al actualizar las guías' };
  }
}

export async function unirSemanas(cierreIdPrimario: string, cierreIdSecundario: string) {
  const session = await getUserSession();
  if (!session) return { error: 'No autorizado' };

  try {
    // 1. Mover todas las guías del secundario al primario
    await prisma.guia.updateMany({
      where: { cierreSemanaId: cierreIdSecundario },
      data: { cierreSemanaId: cierreIdPrimario }
    });

    // 2. Recalcular el total del primario
    const cierre = await prisma.cierreSemana.findUnique({
      where: { id: cierreIdPrimario },
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
        where: { id: cierreIdPrimario },
        data: { total: nuevoTotal, total_tickets: nuevoTotalTickets }
      });
    }

    // 3. Eliminar el secundario (ya no tiene guías)
    await prisma.cierreSemana.delete({
      where: { id: cierreIdSecundario }
    });

    revalidatePath('/semanas');
    return { success: true };
  } catch (error: any) {
    console.error("Error al unir semanas:", error);
    return { error: 'Error interno al unir las semanas' };
  }
}

export async function actualizarValorGuia(guiaId: string, nuevoValorBase: number, nuevoValorTicket: number, nuevosAdicionales: { id: string; concepto?: string; valor: number }[], cierreSemanaId: string, cabezalId?: string) {
  const session = await getUserSession();
  if (!session) return { error: 'No autorizado' };

  try {
    const dataToUpdate: any = {
      valor_base_cobrado: nuevoValorBase,
      valor_ticket: nuevoValorTicket,
    };
    if (cabezalId) {
      dataToUpdate.cabezalId = cabezalId;
    }

    // 1. Actualizar el valor base de la guía, tickets y cabezal
    await prisma.guia.update({
      where: { id: guiaId },
      data: dataToUpdate
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
  const session = await getUserSession();
  if (!session) return { error: 'No autorizado' };

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
