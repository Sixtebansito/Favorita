import re

with open('src/app/guias/registro/RegistroGuiaClient.tsx', 'r') as f:
    content = f.read()

# 1. Update AutocompleteInput definition
old_auto = """const AutocompleteInput = ({ value, onChange, options, placeholder, style, className, onEnter, inputProps = {} }: any) => {"""
new_auto = """const AutocompleteInput = ({ value, onChange, options, placeholder, style, className, onEnter, onSelect, inputProps = {} }: any) => {"""
content = content.replace(old_auto, new_auto)

# 2. Update AutocompleteInput Enter logic
old_enter = """    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (show && activeIdx >= 0 && filtered[activeIdx]) {
        onChange(filtered[activeIdx].codigo);
        setShow(false);
        setActiveIdx(-1);
      } else {
        setShow(false);
        if (onEnter) onEnter();
      }
    }"""
new_enter = """    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (show && activeIdx >= 0 && filtered[activeIdx]) {
        const selectedCode = filtered[activeIdx].codigo;
        onChange(selectedCode);
        setShow(false);
        setActiveIdx(-1);
        if (onSelect) onSelect(selectedCode);
      } else {
        setShow(false);
        if (onEnter) onEnter();
      }
    }"""
content = content.replace(old_enter, new_enter)

# 3. Update AutocompleteInput Click logic
old_click = """              onMouseDown={(e) => {
                e.preventDefault(); // evita el blur del input
                onChange(o.codigo);
                setShow(false);
              }}"""
new_click = """              onMouseDown={(e) => {
                e.preventDefault(); // evita el blur del input
                onChange(o.codigo);
                setShow(false);
                if (onSelect) onSelect(o.codigo);
              }}"""
content = content.replace(old_click, new_click)

# 4. Update handleGuardarNuevoCodigo
old_guardar = """  const handleGuardarNuevoCodigo = async (guiaId: string) => {
    if (!nuevoCodigoGuia.trim()) {"""
new_guardar = """  const handleGuardarNuevoCodigo = async (guiaId: string, directCode?: string) => {
    const codeToSave = directCode || nuevoCodigoGuia;
    if (!codeToSave.trim()) {"""
content = content.replace(old_guardar, new_guardar)

# And replace `nuevoCodigoGuia.trim().toUpperCase()` inside it
content = content.replace("""const res = await cambiarCodigoGuiaActiva(guiaId, nuevoCodigoGuia.trim().toUpperCase());""", """const res = await cambiarCodigoGuiaActiva(guiaId, codeToSave.trim().toUpperCase());""")
content = content.replace("""mostrarAlerta(`Código actualizado correctamente a ${nuevoCodigoGuia.trim().toUpperCase()}. Precio base: $${res.base}, Ticket: $${res.ticket}.`, 'success');""", """mostrarAlerta(`Código actualizado correctamente a ${codeToSave.trim().toUpperCase()}. Precio base: $${res.base}, Ticket: $${res.ticket}.`, 'success');""")


# 5. Update handleAddCodigo
old_add = """  const handleAddCodigo = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!nuevoCodigo.trim()) return;
    const code = nuevoCodigo.trim().toUpperCase();
    if (!codigos.includes(code)) {
      setCodigos([...codigos, code]);
    }
    setNuevoCodigo('');
    setPrecioPreview(null);
  };"""
new_add = """  const handleAddCodigo = (e?: React.FormEvent, directCode?: string) => {
    e?.preventDefault();
    const targetCode = (directCode || nuevoCodigo).trim().toUpperCase();
    if (!targetCode) return;
    
    setCodigos(prev => prev.includes(targetCode) ? prev : [...prev, targetCode]);
    setNuevoCodigo('');
    setPrecioPreview(null);
  };"""
content = content.replace(old_add, new_add)


# 6. Update instances of AutocompleteInput
old_main_input = """              <AutocompleteInput 
                className="form-input"
                value={nuevoCodigo} 
                onChange={(v: string) => setNuevoCodigo(v)} 
                options={ultimoTarifario?.precios}
                placeholder="Ej. 343 o 343S" 
                onEnter={() => {
                  handleAddCodigo();
                  setTimeout(() => handleBuscarPrecio(), 50);
                }}
              />"""
new_main_input = """              <AutocompleteInput 
                className="form-input"
                value={nuevoCodigo} 
                onChange={(v: string) => setNuevoCodigo(v)} 
                options={ultimoTarifario?.precios}
                placeholder="Ej. 343 o 343S" 
                onEnter={() => {
                  handleAddCodigo();
                  setTimeout(() => handleBuscarPrecio(), 50);
                }}
                onSelect={(code: string) => {
                  handleAddCodigo(undefined, code);
                  setTimeout(() => handleBuscarPrecio(), 50);
                }}
              />"""
content = content.replace(old_main_input, new_main_input)

old_edit_input = """                                    <AutocompleteInput 
                                      className="form-input" 
                                      value={nuevoCodigoGuia} 
                                      onChange={(v: string) => setNuevoCodigoGuia(v)}
                                      options={ultimoTarifario?.precios}
                                      style={{ width: '120px' }}
                                      inputProps={{ style: { padding: '0.25rem', fontSize: '0.75rem', height: '2rem', width: '100%' } }}
                                    />"""
new_edit_input = """                                    <AutocompleteInput 
                                      className="form-input" 
                                      value={nuevoCodigoGuia} 
                                      onChange={(v: string) => setNuevoCodigoGuia(v)}
                                      options={ultimoTarifario?.precios}
                                      style={{ width: '120px' }}
                                      inputProps={{ style: { padding: '0.25rem', fontSize: '0.75rem', height: '2rem', width: '100%' } }}
                                      onSelect={(code: string) => handleGuardarNuevoCodigo(guia.id, code)}
                                    />"""
content = content.replace(old_edit_input, new_edit_input)

with open('src/app/guias/registro/RegistroGuiaClient.tsx', 'w') as f:
    f.write(content)
