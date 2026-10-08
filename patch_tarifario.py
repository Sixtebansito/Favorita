import re

with open('src/app/api/tarifarios/route.ts', 'r') as f:
    content = f.read()

# 1. Initialize Set before the loop
init_set = """      const nuevoTarifario = await tx.tarifario.create({
        data: {
          nombre,
          fecha_vigencia: fechaVigencia,
          activo: true,
        }
      });

      let preciosCreados = 0;
      const addedStandardCodes = new Set<string>();"""

content = content.replace("""      const nuevoTarifario = await tx.tarifario.create({
        data: {
          nombre,
          fecha_vigencia: fechaVigencia,
          activo: true,
        }
      });

      let preciosCreados = 0;""", init_set)


# 2. Add to set inside the loop
add_to_set = """        await tx.guiaPrecio.create({
          data: {
            tarifarioId: nuevoTarifario.id,
            codigo,
            descripcion,
            valor: valorNum,
            tipo: tipo.includes('SECO') ? 'SECO' : 'FRIO'
          }
        });

        addedStandardCodes.add(codigo.toUpperCase());"""

content = content.replace("""        await tx.guiaPrecio.create({
          data: {
            tarifarioId: nuevoTarifario.id,
            codigo,
            descripcion,
            valor: valorNum,
            tipo: tipo.includes('SECO') ? 'SECO' : 'FRIO'
          }
        });""", add_to_set)

# 3. Modify the migration logic
old_migration = """      if (previousTarifario) {
        const customCodes = await tx.guiaPrecio.findMany({
          where: {
            tarifarioId: previousTarifario.id,
            userId: { not: null }
          }
        });

        for (const customCode of customCodes) {
          await tx.guiaPrecio.create({
            data: {
              tarifarioId: nuevoTarifario.id,
              userId: customCode.userId,
              codigo: customCode.codigo,
              tipo: customCode.tipo,
              descripcion: customCode.descripcion,
              valor: customCode.valor
            }
          });
          preciosCreados++;
        }
      }"""

new_migration = """      if (previousTarifario) {
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
      }"""

content = content.replace(old_migration, new_migration)

with open('src/app/api/tarifarios/route.ts', 'w') as f:
    f.write(content)
