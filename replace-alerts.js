const fs = require('fs');
const glob = require('glob');

const files = [
  'src/app/guias/registro/RegistroGuiaClient.tsx',
  'src/app/semanas/SemanasClient.tsx',
  'src/app/prefacturas/PrefacturaClient.tsx',
  'src/app/usuarios/UsuarioClient.tsx',
  'src/app/mis-tarifarios/MisTarifariosClient.tsx',
  'src/app/transportistas/TransportistaClient.tsx',
  'src/app/bitacora/BitacoraClient.tsx',
  'src/app/gastos/GastosClient.tsx',
  'src/app/base-de-datos/BackupClient.tsx',
  'src/app/cargas/CargasClient.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Ensure Swal is imported
  if (!content.includes("import Swal from 'sweetalert2';") && (content.includes('alert(') || content.includes('confirm('))) {
    content = content.replace(/(import .*;\n)/, "$1import Swal from 'sweetalert2';\n");
    changed = true;
  }

  // Replace confirm(...)
  // from: if (confirm('msg'))
  // to: if (!(await Swal.fire({title: 'Confirmación', text: 'msg', icon: 'warning', showCancelButton: true})).isConfirmed) return;
  // This is tricky because `confirm` can be used in `if (!confirm('...')) return;`
  
  // We'll replace it manually by reading the files and applying specific regexes.
});
