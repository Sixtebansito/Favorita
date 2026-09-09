import Link from 'next/link';
import { FileQuestion, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--muted)',
      padding: '1rem'
    }}>
      <div className="card" style={{
        width: '100%',
        maxWidth: '450px',
        padding: '3rem 2rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1.5rem',
        textAlign: 'center',
        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          color: '#ef4444',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '0.5rem'
        }}>
          <FileQuestion size={40} />
        </div>
        
        <div>
          <h1 style={{ fontSize: '5rem', fontWeight: 800, color: 'var(--foreground)', lineHeight: 1, marginBottom: '0.5rem' }}>404</h1>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--foreground)' }}>Página no encontrada</h2>
          <p style={{ color: 'var(--muted-foreground)', marginTop: '1rem', fontSize: '1rem', lineHeight: 1.5 }}>
            Lo sentimos, la página que estás intentando visitar no existe o ha sido movida temporalmente.
          </p>
        </div>

        <Link 
          href="/" 
          className="btn btn-primary" 
          style={{ 
            width: '100%', 
            padding: '0.875rem', 
            marginTop: '1rem', 
            display: 'inline-flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            gap: '0.5rem', 
            textDecoration: 'none',
            fontSize: '1rem'
          }}
        >
          <ArrowLeft size={18} />
          Volver al Inicio
        </Link>
      </div>
    </div>
  );
}
