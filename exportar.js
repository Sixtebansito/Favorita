const { execSync } = require('child_process');
const fs = require('fs');

const DB_PATH = './dev.db';
const OUTPUT_FILE = './backup.json';

const tables = [
  'User',
  'Transportista',
  '_UserToTransportista',
  'Cabezal',
  'Tarifario',
  'GuiaPrecio',
  'CierreSemana',
  'Liquidacion',
  'Guia',
  'GuiaAdicional',
  'AdicionalCatalogo'
];

console.log('Iniciando extracción desde dev.db...');

const backup = {};

for (const table of tables) {
  try {
    const output = execSync(`sqlite3 -json ${DB_PATH} "SELECT * FROM ${table}"`, { encoding: 'utf-8' });
    if (output.trim()) {
      backup[table] = JSON.parse(output);
    } else {
      backup[table] = [];
    }
    console.log(`✅ Tabla ${table} exportada (${backup[table].length} registros).`);
  } catch (error) {
    console.error(`❌ Error exportando la tabla ${table}: ${error.message}`);
    backup[table] = [];
  }
}

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(backup, null, 2));
console.log(`\n🎉 Respaldo completo guardado en ${OUTPUT_FILE}`);
