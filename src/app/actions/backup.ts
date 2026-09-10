'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { sendBackupEmail } from '@/lib/email';
import { getUserSession } from './auth';

export async function generateBackupData() {
  try {
    const [
      users,
      transportistas,
      cabezales,
      tarifarios,
      guiaPrecios,
      guias,
      cierresSemana,
      liquidaciones,
      guiasAdicionales,
      catalogoAdicionales,
    ] = await Promise.all([
      prisma.user.findMany(),
      prisma.transportista.findMany(),
      prisma.cabezal.findMany(),
      prisma.tarifario.findMany(),
      prisma.guiaPrecio.findMany(),
      prisma.guia.findMany(),
      prisma.cierreSemana.findMany(),
      prisma.liquidacion.findMany(),
      prisma.guiaAdicional.findMany(),
      prisma.adicionalCatalogo.findMany(),
    ]);

    return {
      metadata: {
        timestamp: new Date().toISOString(),
        version: '1.0',
      },
      data: {
        users,
        transportistas,
        cabezales,
        tarifarios,
        guiaPrecios,
        guias,
        cierresSemana,
        liquidaciones,
        guiasAdicionales,
        catalogoAdicionales,
      }
    };
  } catch (error) {
    console.error('Error generando datos de backup:', error);
    throw new Error('No se pudo generar la copia de seguridad.');
  }
}

export async function registrarBackupManual() {
  const session = await getUserSession();
  if (session?.role !== 'ADMIN') return { error: 'No autorizado' };

  try {
    await prisma.backupHistory.create({
      data: {
        tipo: 'MANUAL',
      }
    });
    revalidatePath('/base-de-datos');
    return { success: true };
  } catch (error) {
    return { error: 'Error registrando historial' };
  }
}

export async function obtenerHistorialYConfiguracion() {
  const session = await getUserSession();
  if (session?.role !== 'ADMIN') return { error: 'No autorizado' };

  try {
    const historial = await prisma.backupHistory.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    let configDestino = await prisma.configuracion.findUnique({ where: { clave: 'BACKUP_EMAIL_DESTINO' } });
    let configEstado = await prisma.configuracion.findUnique({ where: { clave: 'BACKUP_EMAIL_ESTADO' } });

    return { 
      historial, 
      config: {
        destino: configDestino?.valor || '',
        estado: configEstado?.valor === 'true'
      }
    };
  } catch (error) {
    return { error: 'Error obteniendo datos' };
  }
}

export async function guardarConfiguracion(destino: string, estado: boolean) {
  const session = await getUserSession();
  if (session?.role !== 'ADMIN') return { error: 'No autorizado' };

  try {
    await prisma.configuracion.upsert({
      where: { clave: 'BACKUP_EMAIL_DESTINO' },
      update: { valor: destino },
      create: { clave: 'BACKUP_EMAIL_DESTINO', valor: destino, descripcion: 'Correo destino para backups automáticos' }
    });

    await prisma.configuracion.upsert({
      where: { clave: 'BACKUP_EMAIL_ESTADO' },
      update: { valor: estado.toString() },
      create: { clave: 'BACKUP_EMAIL_ESTADO', valor: estado.toString(), descripcion: 'Estado del envío automático de backups (true/false)' }
    });

    revalidatePath('/base-de-datos');
    return { success: true };
  } catch (error) {
    return { error: 'Error guardando configuración' };
  }
}
