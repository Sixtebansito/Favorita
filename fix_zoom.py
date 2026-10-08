import re

with open('src/app/layout.tsx', 'r') as f:
    content = f.read()

# Replace metadata import with Viewport import and add viewport export
content = content.replace('import type { Metadata } from "next";', 'import type { Metadata, Viewport } from "next";')

viewport_export = """export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};
"""

content = content.replace("export const metadata: Metadata =", viewport_export + "\nexport const metadata: Metadata =")

with open('src/app/layout.tsx', 'w') as f:
    f.write(content)

with open('src/app/globals.css', 'a') as f:
    f.write('''\n
/* Evitar auto-zoom en inputs en iOS Safari */
@media screen and (max-width: 768px) {
  input, select, textarea, .form-input, .form-select {
    font-size: 16px !important;
  }
}
''')
