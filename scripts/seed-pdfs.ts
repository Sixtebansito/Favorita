import fs from 'fs';
import path from 'path';
const pdfParse = require('pdf-parse');
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function render_page(pageData: any) {
    let render_options = {
        normalizeWhitespace: false,
        disableCombineTextItems: false
    };
    return pageData.getTextContent(render_options)
    .then(function(textContent: any) {
        let lastY, text = '';
        for (let item of textContent.items) {
            if (lastY == item.transform[5] || !lastY) {
                text += item.str + ' ';
            } else {
                text += '\n' + item.str + ' ';
            }
            lastY = item.transform[5];
        }
        return text;
    });
}

async function parsePDF(filePath: string, tarifarioName: string, fechaVigencia: Date) {
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdfParse(dataBuffer, { pagerender: render_page });
  
  const lines = data.text.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 0);
  
  const tarifario = await prisma.tarifario.create({
    data: {
      nombre: tarifarioName,
      fecha_vigencia: fechaVigencia,
      activo: true,
    }
  });

  console.log(`Creado tarifario ${tarifarioName}`);
  console.log(lines.slice(0, 20).join('\n'));
  
  let count = 0;
  
  for (const line of lines) {
    if (line.includes('Nombre del Local') || line.includes('Codigo') || line.includes('Tipo de Tarifa')) continue;
    if (line.includes('Valor') || line.includes('Tipo')) continue;
    
    // Buscar la parte del precio y tipo al final
    // Matcher para: {Codigo} {Nombre} {Opcional $} {Numero} {Tipo}
    const regex = /^([a-zA-Z0-9-]+)\s+(.*?)\s+\$?\s*([\d,.]+)\s+(Frío|Seco|FRIO|SECO|Frio|Frio \/ Seco|Frío \/ Seco)\s*$/i;
    const match = line.match(regex);
    
    if (match) {
      let codigo = match[1].trim();
      let descripcion = match[2].trim();
      const priceStr = match[3].trim().replace(',', '.');
      let tipoStr = match[4].trim().toUpperCase();
      
      // Remover puntos de millar si existen y convertir a float
      // Ej: 1.069 -> 1069 en Ecuador? Wait, in Ecuador it's 1.069 (thousand separator) or decimal?
      // In PDF we had $1.069 Frío for "Super Aki La Peninsula", which means 1069.
      // And we had "$ 311,00" for "CD SATELITE SANTO DOMINGO", which means 311.
      let valor = 0;
      if (priceStr.includes(',') && priceStr.includes('.')) {
        // tiene ambos, ej 1.311,00
        valor = parseFloat(priceStr.replace(/\./g, '').replace(',', '.'));
      } else if (priceStr.includes(',')) {
        // solo coma ej 311,00
        valor = parseFloat(priceStr.replace(',', '.'));
      } else if (priceStr.includes('.')) {
        // solo punto, puede ser 1.069 (mil) o 1.5 (decimal)
        // en el PDF los valores grandes son mil. Asumimos que los decimales tendrían 2 dígitos.
        // Si tiene 3 dígitos despues del punto, es mil.
        const parts = priceStr.split('.');
        if (parts[1] && parts[1].length === 3) {
          valor = parseFloat(priceStr.replace('.', ''));
        } else {
          valor = parseFloat(priceStr);
        }
      } else {
        valor = parseFloat(priceStr);
      }
      
      let tipos = [tipoStr];
      if (tipoStr.includes('/')) {
        tipos = ['FRIO', 'SECO'];
      }
      
      for (let t of tipos) {
        if (t === 'FRÍO' || t === 'FRIO') t = 'FRIO';
        if (t === 'SECO') t = 'SECO';
        
        await prisma.guiaPrecio.create({
          data: {
            tarifarioId: tarifario.id,
            codigo: codigo || `NO-COD-${count}`,
            descripcion: descripcion,
            valor: valor,
            tipo: t,
          }
        });
        count++;
      }
    }
  }
  
  console.log(`Se insertaron ${count} precios para ${tarifarioName}`);
}

async function main() {
  await parsePDF(path.join(__dirname, '../VALORES/VALORES ANTIGUOS.pdf'), 'Valores Antiguos', new Date('2023-01-01'));
  await parsePDF(path.join(__dirname, '../VALORES/ValoresNuevos.pdf'), 'Valores Nuevos Agosto', new Date('2024-08-12'));
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
