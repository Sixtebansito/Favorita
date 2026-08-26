'use client';

import { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';

export default function TarifariosPage() {
  const [file, setFile] = useState<File | null>(null);
  const [nombre, setNombre] = useState('');
  const [fecha, setFecha] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !nombre || !fecha) {
      setMessage({ type: 'error', text: 'Por favor completa todos los campos' });
      return;
    }

    setLoading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('nombre', nombre);
    formData.append('fecha_vigencia', fecha);

    try {
      const response = await fetch('/api/tarifarios', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: `¡Tarifario subido exitosamente! Se importaron ${data.count} precios.` });
        setFile(null);
        setNombre('');
        setFecha('');
      } else {
        setMessage({ type: 'error', text: data.error || 'Error al subir el tarifario' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error de conexión con el servidor' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <header>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem', letterSpacing: '-0.025em' }}>Gestión de Tarifarios</h1>
        <p style={{ color: 'var(--muted-foreground)' }}>Sube los archivos Excel con los precios de las guías (Nuevos/Antiguos).</p>
      </header>

      <section className="card" style={{ padding: '1.5rem' }}>
        <div className="card-header" style={{ padding: '0 0 1.5rem 0' }}>
          <h2 className="card-title" style={{ fontSize: '1.25rem' }}>Subir Nuevo Tarifario</h2>
        </div>
        
        {message && (
          <div style={{ 
            padding: '1rem', 
            borderRadius: 'var(--radius)', 
            marginBottom: '1.5rem',
            backgroundColor: message.type === 'success' ? '#dcfce7' : '#fee2e2',
            color: message.type === 'success' ? '#166534' : '#991b1b',
            border: `1px solid ${message.type === 'success' ? '#bbf7d0' : '#f87171'}`,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: 500
          }}>
            {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="nombre">Nombre del Tarifario</label>
            <input 
              id="nombre"
              type="text" 
              className="form-input" 
              placeholder="Ej. Valores Agosto 2024"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="fecha">Fecha de Inicio de Vigencia</label>
            <input 
              id="fecha"
              type="date" 
              className="form-input" 
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              required
            />
            <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', marginTop: '0.25rem' }}>
              Las guías registradas a partir de esta fecha usarán estos precios.
            </p>
          </div>

          <div className="form-group">
            <label className="form-label">Archivo Excel (.xlsx, .xls)</label>
            <div style={{
              border: '2px dashed var(--border)',
              borderRadius: 'var(--radius)',
              padding: '2rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem',
              cursor: 'pointer',
              backgroundColor: file ? 'var(--muted)' : 'transparent',
              transition: 'background-color 0.2s ease, border-color 0.2s ease'
            }}
            onClick={() => document.getElementById('file-upload')?.click()}
            >
              <Upload size={32} color={file ? 'var(--primary)' : 'var(--muted-foreground)'} />
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontWeight: 500, color: 'var(--foreground)' }}>
                  {file ? file.name : 'Haz clic para seleccionar el archivo Excel'}
                </p>
                {!file && <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', marginTop: '0.25rem' }}>El archivo debe contener columnas como: Código, Nombre, Valor, Tipo</p>}
              </div>
              <input 
                id="file-upload"
                type="file" 
                accept=".xlsx, .xls, .csv" 
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ marginTop: '0.5rem', alignSelf: 'flex-start' }}
            disabled={loading}
          >
            {loading ? 'Procesando...' : (
              <>
                <FileText size={18} />
                Subir y Procesar Tarifario
              </>
            )}
          </button>
        </form>
      </section>
    </div>
  );
}
