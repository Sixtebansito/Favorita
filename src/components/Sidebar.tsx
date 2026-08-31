'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Truck, FileText, Settings, Users, FileSpreadsheet, LogOut } from 'lucide-react';
import { logout } from '@/app/actions/auth';
import Image from 'next/image';

export default function Sidebar({ user }: { user: any }) {
  const pathname = usePathname();

  const isAdmin = user.role === 'ADMIN';

  const navItems = [
    { href: '/', label: 'Inicio', icon: Home, show: true },
    { href: '/guias/registro', label: 'Registro de Guías', icon: FileText, show: true },
    { href: '/semanas', label: 'Semanas (Cierres)', icon: FileSpreadsheet, show: true },
    { href: '/prefacturas', label: 'Prefacturas', icon: FileSpreadsheet, show: true },
    { href: '/transportistas', label: 'Transportistas', icon: Truck, show: true },
    { href: '/tarifario', label: 'Tarifarios', icon: FileSpreadsheet, show: isAdmin },
    { href: '/usuarios', label: 'Usuarios', icon: Users, show: isAdmin },

  ];

  return (
    <aside className="sidebar">
      <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'center' }}>
        <div className="sidebar-text" style={{ position: 'relative', width: '60px', height: '60px', marginBottom: '0.5rem' }}>
          <Image src="/logo.jpg" alt="Logo" fill sizes="60px" unoptimized style={{ objectFit: 'contain' }} />
        </div>
        <p className="sidebar-text" style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', textAlign: 'center' }}>Gestión de Transporte</p>
      </div>
      
      <div style={{ padding: '1.5rem 1rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', borderBottom: '1px solid var(--border)' }}>
        <p className="sidebar-text" style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--foreground)', textTransform: 'uppercase', paddingLeft: '0.5rem', marginBottom: '0.25rem' }}>
          {user.name}
        </p>
        <p className="sidebar-text" style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', paddingLeft: '0.5rem' }}>
          Rol: {isAdmin ? 'Administrador' : 'Usuario'}
        </p>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {navItems.filter(item => item.show).map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/');
            
            return (
              <Link 
                key={item.href} 
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.5rem 0.75rem',
                  borderRadius: 'var(--radius)',
                  color: isActive ? 'var(--foreground)' : 'var(--muted-foreground)',
                  backgroundColor: isActive ? 'var(--muted)' : 'transparent',
                  fontWeight: 500,
                  fontSize: '0.875rem',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'var(--muted)';
                    e.currentTarget.style.color = 'var(--foreground)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--muted-foreground)';
                  }
                }}
              >
                <Icon size={16} />
                <span className="sidebar-text">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
        
      <div style={{ padding: '1rem', borderTop: '1px solid var(--border)', backgroundColor: 'var(--background)' }}>
        <button 
            onClick={() => logout()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.5rem 0.75rem',
              borderRadius: 'var(--radius)',
              color: '#ef4444',
              backgroundColor: 'transparent',
              fontWeight: 500,
              fontSize: '0.875rem',
              transition: 'all 0.2s ease',
              border: 'none',
              cursor: 'pointer',
              width: '100%',
              textAlign: 'left'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#fee2e2';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
          <LogOut size={16} />
          <span className="sidebar-text">Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}
