import os
import re

directories = ['src/app']

for root, _, files in os.walk(directories[0]):
    for file in files:
        if file.endswith('Client.tsx') or file.endswith('Actions.ts') or file.endswith('.tsx'):
            path = os.path.join(root, file)
            with open(path, 'r') as f:
                content = f.read()

            if 'toLocaleDateString' not in content:
                continue

            # Reemplazar para fecha_guia, fecha_vigencia, fecha_inicio, fecha_fin, fecha, fecha_cierre, fechaUltimaLiquidacion
            # Pero en la misma línea
            lines = content.split('\n')
            for i, line in enumerate(lines):
                if 'toLocaleDateString' in line and 'createdAt' not in line:
                    # reemplazar toLocaleDateString() o toLocaleDateString('es-ES') 
                    # por toLocaleDateString('es-ES', { timeZone: 'UTC' })
                    line = re.sub(r"toLocaleDateString\('es-ES'\)", r"toLocaleDateString('es-ES', { timeZone: 'UTC' })", line)
                    line = re.sub(r"toLocaleDateString\(\)", r"toLocaleDateString('es-ES', { timeZone: 'UTC' })", line)
                    lines[i] = line
                    
            content = '\n'.join(lines)

            with open(path, 'w') as f:
                f.write(content)
            print(f'Updated {path}')
