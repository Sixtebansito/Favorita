import re

with open('src/app/guias/registro/RegistroGuiaClient.tsx', 'r') as f:
    content = f.read()

autocomplete_component = """
const AutocompleteInput = ({ value, onChange, options, placeholder, style, className, onEnter, inputProps = {} }: any) => {
  const [show, setShow] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  
  const filtered = options?.filter((o: any) => 
    o.codigo.toLowerCase().includes(value.toLowerCase()) || 
    o.descripcion.toLowerCase().includes(value.toLowerCase())
  ).slice(0, 50) || []; // max 50 para no trabar

  const handleKeyDown = (e: any) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx(prev => (prev < filtered.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx(prev => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (show && activeIdx >= 0 && filtered[activeIdx]) {
        onChange(filtered[activeIdx].codigo);
        setShow(false);
        setActiveIdx(-1);
      } else {
        setShow(false);
        if (onEnter) onEnter();
      }
    }
  };

  return (
    <div style={{ position: 'relative', flex: 1, ...style }}>
      <input 
        type="text"
        className={className}
        value={value}
        onChange={(e) => {
           onChange(e.target.value.toUpperCase());
           setShow(true);
           setActiveIdx(-1);
        }}
        onFocus={() => setShow(true)}
        onBlur={() => setTimeout(() => setShow(false), 200)}
        placeholder={placeholder}
        onKeyDown={handleKeyDown}
        {...inputProps}
      />
      {show && filtered.length > 0 && value.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, zIndex: 50,
          backgroundColor: 'var(--card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', maxHeight: '250px', overflowY: 'auto',
          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)', width: 'max-content', minWidth: '100%'
        }}>
          {filtered.map((o: any, idx: number) => (
            <div 
              key={o.codigo}
              style={{ 
                padding: '0.6rem 0.8rem', cursor: 'pointer', fontSize: '0.875rem', 
                borderBottom: '1px solid var(--border)',
                backgroundColor: idx === activeIdx ? 'var(--secondary)' : 'transparent',
                display: 'flex', gap: '0.5rem', alignItems: 'center'
              }}
              onMouseEnter={() => setActiveIdx(idx)}
              onMouseDown={(e) => {
                e.preventDefault(); // evita el blur del input
                onChange(o.codigo);
                setShow(false);
              }}
            >
              <strong style={{ color: 'var(--primary)' }}>{o.codigo}</strong> 
              <span style={{ color: 'var(--foreground)' }}>- {o.descripcion}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

"""

# Insertar el componente justo despues de los imports
content = content.replace("export default function RegistroGuiaClient", autocomplete_component + "export default function RegistroGuiaClient")

# Eliminar el datalist viejo
datalist_regex = re.compile(r'<datalist id="codigos-tarifario">.*?</datalist>', re.DOTALL)
content = datalist_regex.sub('', content)

# Reemplazar el input principal
main_input_old = """              <input 
                type="text" 
                list="codigos-tarifario"
                className="form-input"
                value={nuevoCodigo} 
                onChange={(e) => setNuevoCodigo(e.target.value.toUpperCase())} 
                placeholder="Ej. 343 o 343S" 
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCodigo();
                    setTimeout(() => handleBuscarPrecio(), 50); // Small timeout to allow state update
                  }
                }}
              />"""
main_input_new = """              <AutocompleteInput 
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
content = content.replace(main_input_old, main_input_new)

# Reemplazar el input de la tabla
edit_input_old = """                                    <input 
                                      type="text" 
                                      list="codigos-tarifario"
                                      className="form-input" 
                                      value={nuevoCodigoGuia} 
                                      onChange={(e) => setNuevoCodigoGuia(e.target.value.toUpperCase())}
                                      style={{ width: '80px', padding: '0.25rem', fontSize: '0.75rem', height: '2rem' }}
                                    />"""
edit_input_new = """                                    <AutocompleteInput 
                                      className="form-input" 
                                      value={nuevoCodigoGuia} 
                                      onChange={(v: string) => setNuevoCodigoGuia(v)}
                                      options={ultimoTarifario?.precios}
                                      style={{ width: '120px' }}
                                      inputProps={{ style: { padding: '0.25rem', fontSize: '0.75rem', height: '2rem', width: '100%' } }}
                                    />"""
content = content.replace(edit_input_old, edit_input_new)

with open('src/app/guias/registro/RegistroGuiaClient.tsx', 'w') as f:
    f.write(content)
