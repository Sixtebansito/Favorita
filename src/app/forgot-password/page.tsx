'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { requestPasswordReset } from '@/app/actions/resetPassword';
import { KeyRound, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    const res = await requestPasswordReset(formData);

    if (res?.error) {
      setError(res.error);
    } else {
      setSuccess(true);
    }
    setLoading(false);
  };

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
        maxWidth: '400px',
        padding: '2.5rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1.5rem',
        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)'
      }}>
        <div style={{ width: '100%' }}>
          <button 
            onClick={() => router.push('/login')} 
            className="btn btn-ghost" 
            style={{ padding: '0.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}
          >
            <ArrowLeft size={16} /> Volver
          </button>
        </div>

        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          backgroundColor: 'var(--primary)',
          color: 'var(--primary-foreground)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '0.5rem'
        }}>
          <KeyRound size={24} />
        </div>
        
        <div style={{ textAlign: 'center', width: '100%' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem' }}>Recuperar Contraseña</h1>
          <p style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem' }}>
            Ingresa tu correo para recibir un enlace de recuperación
          </p>
        </div>

        {error && (
          <div style={{ 
            width: '100%', 
            padding: '0.75rem', 
            backgroundColor: '#fee2e2', 
            color: '#991b1b', 
            borderRadius: 'var(--radius)', 
            fontSize: '0.875rem',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        {success ? (
          <div style={{ 
            width: '100%', 
            padding: '1rem', 
            backgroundColor: '#dcfce7', 
            color: '#166534', 
            borderRadius: 'var(--radius)', 
            fontSize: '0.875rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <p>Si el correo existe en nuestra base de datos, te hemos enviado un enlace para restablecer tu contraseña.</p>
            <p>Revisa tu bandeja de entrada o carpeta de spam.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label htmlFor="email" style={{ fontSize: '0.875rem', fontWeight: 500 }}>Email</label>
              <input 
                id="email"
                name="email" 
                type="email" 
                className="form-input" 
                placeholder="tu@email.com" 
                required 
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', marginTop: '1rem', padding: '0.75rem' }}
              disabled={loading}
            >
              {loading ? 'Enviando...' : 'Enviar enlace'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
