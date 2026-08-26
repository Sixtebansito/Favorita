'use server';

import { prisma } from '@/lib/prisma';
import { getUserSession } from '../../actions/auth';

export async function lookupPrecio(codigo: string, fecha: string) {
  // Encuentra el tarifario más reciente vigente antes o en la fecha de la guía
  const fechaDate = new Date(fecha);
  
  const tarifario = await prisma.tarifario.findFirst({
    where: {
      fecha_vigencia: {
        lte: fechaDate
      },
      activo: true
    },
    orderBy: {
      fecha_vigencia: 'desc'
    }
  });

  if (!tarifario) {
    return { error: 'No se encontró un tarifario vigente para esa fecha.' };
  }

  // Ahora busca el precio en ese tarifario
  const precio = await prisma.guiaPrecio.findFirst({
    where: {
      tarifarioId: tarifario.id,
      codigo: codigo
    }
  });

  if (!precio) {
    return { error: `El código ${codigo} no existe en el tarifario "${tarifario.nombre}".` };
  }

  return { success: true, precio, tarifario };
}

export async function lookupPreciosMultiple(codigos: string[], fecha: string) {
  const fechaDate = new Date(fecha);
  const tarifario = await prisma.tarifario.findFirst({
    where: { fecha_vigencia: { lte: fechaDate }, activo: true },
    orderBy: { fecha_vigencia: 'desc' }
  });

  if (!tarifario) {
    return { error: 'No se encontró un tarifario vigente para esa fecha.' };
  }

  const precios = await prisma.guiaPrecio.findMany({
    where: {
      tarifarioId: tarifario.id,
      codigo: { in: codigos }
    }
  });

  if (precios.length === 0) {
    return { 
      error: `Ninguno de los códigos ingresados existe en el tarifario "${tarifario.nombre}".`, 
      notFound: true,
      tarifarioId: tarifario.id,
      tarifarioNombre: tarifario.nombre
    };
  }

  // Encontrar el precio mayor
  let mayorPrecio = precios[0];
  for (const p of precios) {
    if (p.valor > mayorPrecio.valor) {
      mayorPrecio = p;
    }
  }

  return { success: true, precio: mayorPrecio, tarifario, todosLosPrecios: precios };
}

export async function addPrecioToTarifario(tarifarioId: string, data: {codigo: string, tipo: string, descripcion: string, valor: number}) {
  try {
    const nuevoPrecio = await prisma.guiaPrecio.create({
      data: {
        tarifarioId,
        codigo: data.codigo,
        tipo: data.tipo,
        descripcion: data.descripcion,
        valor: data.valor
      }
    });
    return { success: true, precio: nuevoPrecio };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function registrarGuia(data: any) {
  const { cabezalId, fecha_guia, cliente_destino, codigos, adicionales, valor_ticket } = data;
  
  const lookup = await lookupPreciosMultiple(codigos, fecha_guia);
  if (lookup.error) return { error: lookup.error };
  
  const precio = lookup.precio;
  const codigosStr = codigos.join(', ');

  const nuevaGuia = await prisma.guia.create({
    data: {
      cabezalId,
      fecha_guia: new Date(fecha_guia),
      cliente_destino,
      guiaPrecioId: precio!.id,
      valor_base_cobrado: precio!.valor,
      valor_ticket: valor_ticket || 0,
      codigos_evaluados: codigosStr,
      adicionales: {
        create: adicionales.map((ad: any) => ({
          concepto: ad.concepto,
          valor: ad.valor
        }))
      }
    }
  });

  return { success: true, guiaId: nuevaGuia.id };
}

export async function getGuiasDeLaSemana() {
  const session = await getUserSession();
  if (!session) return [];
  const isAdmin = session.role === 'ADMIN';

  const guias = await prisma.guia.findMany({
    where: {
      estado: 'ACTIVA',
      ...(isAdmin ? {} : {
        cabezal: {
          transportista: {
            users: {
              some: {
                id: session.id
              }
            }
          }
        }
      })
    },
    include: {
      cabezal: {
        include: {
          transportista: true
        }
      },
      guiaPrecio: true,
      adicionales: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
  return guias;
}

export async function cerrarSemanaGlobal() {
  try {
    const session = await getUserSession();
    if (!session) return { error: 'No autorizado' };
    const isAdmin = session.role === 'ADMIN';

    const guiasActivas = await prisma.guia.findMany({
      where: { 
        estado: 'ACTIVA',
        ...(isAdmin ? {} : {
          cabezal: {
            transportista: {
              users: {
                some: {
                  id: session.id
                }
              }
            }
          }
        })
      },
      include: {
        cabezal: true,
        adicionales: true
      }
    });

    if (guiasActivas.length === 0) {
      return { error: 'No hay guías activas para cuadrar.' };
    }

    // Agrupar guías por transportistaId
    const porTransportista: Record<string, { guiasIds: string[], total: number, totalTickets: number }> = {};

    guiasActivas.forEach(g => {
      const transId = g.cabezal.transportistaId;
      if (!porTransportista[transId]) {
        porTransportista[transId] = { guiasIds: [], total: 0, totalTickets: 0 };
      }
      porTransportista[transId].guiasIds.push(g.id);
      
      const totalAdicionales = g.adicionales.reduce((acc, ad) => acc + ad.valor, 0);
      porTransportista[transId].total += (g.valor_base_cobrado + totalAdicionales);
      porTransportista[transId].totalTickets += g.valor_ticket;
    });

    for (const [transId, data] of Object.entries(porTransportista)) {
      const cierre = await prisma.cierreSemana.create({
        data: {
          transportistaId: transId,
          total: data.total,
          total_tickets: data.totalTickets
        }
      });

      await prisma.guia.updateMany({
        where: {
          id: { in: data.guiasIds }
        },
        data: {
          estado: 'CUADRADA',
          cierreSemanaId: cierre.id
        }
      });
    }

    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function eliminarGuiaActiva(guiaId: string) {
  try {
    await prisma.guiaAdicional.deleteMany({
      where: { guiaId }
    });
    await prisma.guia.delete({
      where: { id: guiaId }
    });
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function actualizarValorGuiaActiva(guiaId: string, nuevoValorBase: number, nuevoValorTicket: number, nuevosAdicionales: { id: string; concepto?: string; valor: number }[]) {
  try {
    await prisma.guia.update({
      where: { id: guiaId },
      data: { valor_base_cobrado: nuevoValorBase, valor_ticket: nuevoValorTicket }
    });
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
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
