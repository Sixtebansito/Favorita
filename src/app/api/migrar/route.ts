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

    const data = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
    
    // Inserción en orden de dependencias
    const resultados = {};

    if (data.User?.length > 0) {
      await prisma.user.createMany({ data: data.User, skipDuplicates: true });
      resultados.User = data.User.length;
    }

    if (data.Transportista?.length > 0) {
      await prisma.transportista.createMany({ data: data.Transportista, skipDuplicates: true });
      resultados.Transportista = data.Transportista.length;
    }

    if (data._UserToTransportista?.length > 0) {
      // Relación m-n (inserción directa si es Postgres, requiere query en crudo a veces, pero Prisma puede fallar con createMany en tablas implícitas. Usamos raw)
      for (const rel of data._UserToTransportista) {
        try {
          await prisma.$executeRaw`INSERT INTO "_UserToTransportista" ("A", "B") VALUES (${rel.A}, ${rel.B}) ON CONFLICT DO NOTHING`;
        } catch (e) {}
      }
      resultados._UserToTransportista = data._UserToTransportista.length;
    }

    if (data.Cabezal?.length > 0) {
      await prisma.cabezal.createMany({ data: data.Cabezal, skipDuplicates: true });
      resultados.Cabezal = data.Cabezal.length;
    }

    if (data.Tarifario?.length > 0) {
      const tarifarios = data.Tarifario.map(t => ({...t, fecha_vigencia: new Date(t.fecha_vigencia)}));
      await prisma.tarifario.createMany({ data: tarifarios, skipDuplicates: true });
      resultados.Tarifario = tarifarios.length;
    }

    if (data.GuiaPrecio?.length > 0) {
      await prisma.guiaPrecio.createMany({ data: data.GuiaPrecio, skipDuplicates: true });
      resultados.GuiaPrecio = data.GuiaPrecio.length;
    }

    if (data.CierreSemana?.length > 0) {
      const cierres = data.CierreSemana.map(t => ({...t, fecha_cierre: new Date(t.fecha_cierre)}));
      await prisma.cierreSemana.createMany({ data: cierres, skipDuplicates: true });
      resultados.CierreSemana = cierres.length;
    }

    if (data.Liquidacion?.length > 0) {
      const liqs = data.Liquidacion.map(t => ({...t, fecha_inicio: new Date(t.fecha_inicio), fecha_fin: new Date(t.fecha_fin)}));
      await prisma.liquidacion.createMany({ data: liqs, skipDuplicates: true });
      resultados.Liquidacion = liqs.length;
    }

    if (data.AdicionalCatalogo?.length > 0) {
      await prisma.adicionalCatalogo.createMany({ data: data.AdicionalCatalogo, skipDuplicates: true });
      resultados.AdicionalCatalogo = data.AdicionalCatalogo.length;
    }

    if (data.Guia?.length > 0) {
      const guias = data.Guia.map(t => ({...t, fecha_guia: new Date(t.fecha_guia)}));
      await prisma.guia.createMany({ data: guias, skipDuplicates: true });
      resultados.Guia = guias.length;
    }

    if (data.GuiaAdicional?.length > 0) {
      await prisma.guiaAdicional.createMany({ data: data.GuiaAdicional, skipDuplicates: true });
      resultados.GuiaAdicional = data.GuiaAdicional.length;
    }

    return NextResponse.json({ 
      success: true, 
      mensaje: '¡Migración completada con éxito!',
      registros_importados: resultados 
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
