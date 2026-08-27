import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const backupPath = path.join(process.cwd(), 'backup.json');
    if (!fs.existsSync(backupPath)) {
      return NextResponse.json({ error: 'backup.json no encontrado' }, { status: 404 });
    }

    const data: any = JSON.parse(fs.readFileSync(backupPath, 'utf8'));

    // Helper para convertir enteros de SQLite a fechas JS para Postgres
    const parseDates = (item: any) => {
      const dateFields = ['createdAt', 'updatedAt', 'fecha_vigencia', 'fecha_guia', 'fecha_cierre', 'fecha_inicio', 'fecha_fin'];
      const parsed = { ...item };
      for (const field of dateFields) {
        if (parsed[field]) {
          parsed[field] = new Date(parsed[field]);
        }
      }
      return parsed;
    };
    
    // Inserción en orden de dependencias
    const resultados: Record<string, number> = {};

    if (data.User?.length > 0) {
      const users = data.User.map(parseDates);
      await prisma.user.createMany({ data: users, skipDuplicates: true });
      resultados.User = users.length;
    }

    if (data.Transportista?.length > 0) {
      const transportistas = data.Transportista.map(parseDates);
      await prisma.transportista.createMany({ data: transportistas, skipDuplicates: true });
      resultados.Transportista = transportistas.length;
    }

    if (data._UserToTransportista?.length > 0) {
      for (const rel of data._UserToTransportista) {
        try {
          await prisma.$executeRaw`INSERT INTO "_UserToTransportista" ("A", "B") VALUES (${rel.A}, ${rel.B}) ON CONFLICT DO NOTHING`;
        } catch (e) {}
      }
      resultados._UserToTransportista = data._UserToTransportista.length;
    }

    if (data.Cabezal?.length > 0) {
      const cabezales = data.Cabezal.map(parseDates);
      await prisma.cabezal.createMany({ data: cabezales, skipDuplicates: true });
      resultados.Cabezal = cabezales.length;
    }

    if (data.Tarifario?.length > 0) {
      const tarifarios = data.Tarifario.map(parseDates);
      await prisma.tarifario.createMany({ data: tarifarios, skipDuplicates: true });
      resultados.Tarifario = tarifarios.length;
    }

    if (data.GuiaPrecio?.length > 0) {
      const guiaPrecios = data.GuiaPrecio.map(parseDates);
      await prisma.guiaPrecio.createMany({ data: guiaPrecios, skipDuplicates: true });
      resultados.GuiaPrecio = guiaPrecios.length;
    }

    if (data.CierreSemana?.length > 0) {
      const cierres = data.CierreSemana.map(parseDates);
      await prisma.cierreSemana.createMany({ data: cierres, skipDuplicates: true });
      resultados.CierreSemana = cierres.length;
    }

    if (data.Liquidacion?.length > 0) {
      const liqs = data.Liquidacion.map(parseDates);
      await prisma.liquidacion.createMany({ data: liqs, skipDuplicates: true });
      resultados.Liquidacion = liqs.length;
    }

    if (data.AdicionalCatalogo?.length > 0) {
      const adicionales = data.AdicionalCatalogo.map(parseDates);
      await prisma.adicionalCatalogo.createMany({ data: adicionales, skipDuplicates: true });
      resultados.AdicionalCatalogo = adicionales.length;
    }

    if (data.Guia?.length > 0) {
      const guias = data.Guia.map(parseDates);
      await prisma.guia.createMany({ data: guias, skipDuplicates: true });
      resultados.Guia = guias.length;
    }

    if (data.GuiaAdicional?.length > 0) {
      const guiaAdicionales = data.GuiaAdicional.map(parseDates);
      await prisma.guiaAdicional.createMany({ data: guiaAdicionales, skipDuplicates: true });
      resultados.GuiaAdicional = guiaAdicionales.length;
    }

    return NextResponse.json({ 
      success: true, 
      mensaje: '¡Migración completada con éxito!',
      registros_importados: resultados 
    });

  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
