import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as xlsx from 'xlsx';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const nombre = formData.get('nombre') as string | null;
    const fechaVigenciaStr = formData.get('fecha_vigencia') as string | null;

    if (!file || !nombre || !fechaVigenciaStr) {
      return NextResponse.json({ error: 'Faltan campos requeridos (file, nombre, fecha_vigencia)' }, { status: 400 });
    }

    const fechaVigencia = new Date(fechaVigenciaStr);

    // Leer el archivo Excel
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    
    // Suponemos que los datos están en la primera hoja
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    // Convertir a JSON
    // Se asume que las cabeceras son "Codigo", "Nombre", "Valor", "Tipo" (o variaciones similares)
    const rawData = xlsx.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
    
    if (rawData.length < 2) {
      return NextResponse.json({ error: 'El archivo Excel está vacío o no tiene la estructura correcta' }, { status: 400 });
    }

    // Identificar índices de las columnas (buscando en la primera fila o segunda)
    const headers = rawData[0].map(h => typeof h === 'string' ? h.toLowerCase() : '');
    
    const colCodigo = headers.findIndex(h => h.includes('codigo') || h.includes('código'));
    const colNombre = headers.findIndex(h => h.includes('nombre') || h.includes('local'));
    const colValor = headers.findIndex(h => h.includes('valor'));
    const colTipo = headers.findIndex(h => h.includes('tipo'));

    if (colNombre === -1 || colValor === -1) {
      return NextResponse.json({ error: 'No se encontraron las columnas necesarias en el Excel (Nombre, Valor)' }, { status: 400 });
    }

    // Iniciar una transacción de Prisma para crear el Tarifario y sus precios
    const result = await prisma.$transaction(async (tx) => {
      // Si hay un tarifario activo existente, podemos mantenerlo activo o marcarlo, 
      // pero el modelo dice que 'activo' es true por defecto, y validaremos por fecha.
      // Opcionalmente: marcar los demás como inactivos si así se desea, pero con la fecha basta.

      const nuevoTarifario = await tx.tarifario.create({
        data: {
          nombre,
          fecha_vigencia: fechaVigencia,
          activo: true,
        }
      });

      let preciosCreados = 0;
      const addedStandardCodes = new Set<string>();

      for (let i = 1; i < rawData.length; i++) {
        const row = rawData[i];
        
        // Evitar filas vacías
        if (!row || row.length === 0 || !row[colNombre]) continue;

        let codigo = colCodigo !== -1 ? (row[colCodigo] || '').toString().trim() : '';
        const descripcion = row[colNombre].toString().trim();
        let rawValor = row[colValor];
        let tipo = colTipo !== -1 ? (row[colTipo] || '').toString().trim().toUpperCase() : '';

        // Si no hay código pero es una fila válida (pasa en algunos locales)
        if (!codigo) {
           // Generar un código temporal o saltar
           codigo = `SIN-COD-${i}`;
        }

        // Limpiar el valor (quitar $, comas, etc)
        let valorNum = 0;
        if (typeof rawValor === 'number') {
          valorNum = rawValor;
        } else if (typeof rawValor === 'string') {
          valorNum = parseFloat(rawValor.replace(/[^\d.-]/g, ''));
        }

        // Inferir tipo si está vacío pero el código termina en S
        if (!tipo) {
          if (codigo.endsWith('S') || codigo.endsWith('s')) {
            tipo = 'SECO';
          } else {
            tipo = 'FRIO';
          }
        }

        await tx.guiaPrecio.create({
          data: {
            tarifarioId: nuevoTarifario.id,
            codigo,
            descripcion,
            valor: valorNum,
            tipo: tipo.includes('SECO') ? 'SECO' : 'FRIO'
          }
        });

        addedStandardCodes.add(codigo.toUpperCase());

        preciosCreados++;
      }

      // Migrar los códigos personalizados del tarifario anterior (si lo hay)
      const previousTarifario = await tx.tarifario.findFirst({
        where: { id: { not: nuevoTarifario.id } },
        orderBy: { fecha_vigencia: 'desc' }
      });

      if (previousTarifario) {
        const previousCodes = await tx.guiaPrecio.findMany({
          where: {
            tarifarioId: previousTarifario.id,
          }
        });

        for (const prevCode of previousCodes) {
          let shouldMigrate = false;
          
          if (prevCode.userId === null) {
            // Código base: lo pasamos si no venía en el Excel
            if (!addedStandardCodes.has(prevCode.codigo.toUpperCase())) {
              shouldMigrate = true;
            }
          } else {
            // Código personalizado: siempre se pasa al nuevo tarifario
            shouldMigrate = true;
          }

          if (shouldMigrate) {
            await tx.guiaPrecio.create({
              data: {
                tarifarioId: nuevoTarifario.id,
                userId: prevCode.userId,
                codigo: prevCode.codigo,
                tipo: prevCode.tipo,
                descripcion: prevCode.descripcion,
                valor: prevCode.valor
              }
            });
            preciosCreados++;
          }
        }
      }

      return { tarifario: nuevoTarifario, count: preciosCreados };
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Error al subir tarifario:', error);
    return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 });
  }
}
