import os
import re

directories = ['src/app']

for root, _, files in os.walk(directories[0]):
    for file in files:
        if file.endswith('Client.tsx') or file.endswith('BackupClient.tsx'):
            path = os.path.join(root, file)
            with open(path, 'r') as f:
                content = f.read()

            if 'alert(' not in content and 'confirm(' not in content and 'window.alert(' not in content and 'window.confirm(' not in content:
                continue

            # Need to import at the top
            import_stmt = "import { confirmar, mostrarAlerta } from '@/app/utils/alerts';\n"
            if import_stmt not in content:
                # insert after last import
                parts = content.split('\n')
                last_import = 0
                for i, line in enumerate(parts):
                    if line.startswith('import '):
                        last_import = i
                parts.insert(last_import + 1, "import { confirmar, mostrarAlerta } from '@/app/utils/alerts';")
                content = '\n'.join(parts)

            # Replace confirm(...) or window.confirm(...) -> await confirmar(...)
            # Note: confirm() might contain string concatenation.
            content = re.sub(r'window\.confirm\((.*?)\)', r'await confirmar(\1)', content)
            content = re.sub(r'(?<!\.)confirm\((.*?)\)', r'await confirmar(\1)', content)

            # Replace alert(...) or window.alert(...) -> mostrarAlerta(...)
            # We want to guess the type based on the content
            def replace_alert(m):
                msg = m.group(1)
                lower_msg = msg.lower()
                if 'error' in lower_msg:
                    return f"mostrarAlerta({msg}, 'error')"
                elif 'éxito' in lower_msg or 'exito' in lower_msg or 'correctamente' in lower_msg or 'guardado' in lower_msg:
                    return f"mostrarAlerta({msg}, 'success')"
                else:
                    return f"mostrarAlerta({msg}, 'info')"

            content = re.sub(r'window\.alert\((.*?)\)', replace_alert, content)
            content = re.sub(r'(?<!\.)alert\((.*?)\)', replace_alert, content)

            with open(path, 'w') as f:
                f.write(content)
            print(f'Updated {path}')
