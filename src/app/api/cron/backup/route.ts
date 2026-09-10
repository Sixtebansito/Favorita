import { NextResponse } from 'next/server';
import { generateBackupData } from '@/app/actions/backup';
import { sendBackupEmail } from '@/lib/email';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  // Verificar autorización (Vercel Cron envía un Bearer token definido en CRON_SECRET)
  const authHeader = request.headers.get('authorization');
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Verificar si la configuración permite el envío automático
    const configEstado = await prisma.configuracion.findUnique({
      where: { clave: 'BACKUP_EMAIL_ESTADO' }
    });

    if (configEstado?.valor !== 'true') {
      return NextResponse.json({ message: 'Backup automático deshabilitado en configuración' });
    }

    const configDestino = await prisma.configuracion.findUnique({
      where: { clave: 'BACKUP_EMAIL_DESTINO' }
    });

    const destino = configDestino?.valor;

    if (!destino) {
      return NextResponse.json({ message: 'No hay un correo destino configurado' });
    }

    // 2. Generar el backup
    const backupData = await generateBackupData();
    const filename = `backup_favorita_${new Date().toISOString().split('T')[0]}.json`;

    // 3. Enviar por correo
    const emailResult = await sendBackupEmail(destino, backupData, filename);

    if (emailResult.success) {
      // 4. Registrar en el historial
      await prisma.backupHistory.create({
        data: {
          tipo: 'AUTOMATICO',
          enviadoA: destino,
        }
      });
      return NextResponse.json({ success: true, message: 'Backup enviado correctamente' });
    } else {
      return NextResponse.json({ success: false, error: emailResult.error }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Error en Cron de Backup:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
