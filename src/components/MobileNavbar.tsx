'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, FileText, FileSpreadsheet, Truck, Users, Settings, LogOut, Menu, X } from 'lucide-react';
import { logout } from '@/app/actions/auth';
import { useState, useEffect } from 'react';

export default function MobileNavbar({ user }: { user: any }) {
  const pathname = usePathname();
  const isAdmin = user.role === 'ADMIN';
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Close drawer when route changes
  useEffect(() => {
    setIsDrawerOpen(false);
  }, [pathname]);

  const mainNavItems = [
    { href: '/', label: 'Inicio', icon: Home, show: true },
    { href: '/guias/registro', label: 'Registro', icon: FileText, show: true },
    { href: '/semanas', label: 'Semanas', icon: FileSpreadsheet, show: true },
    { href: '/prefacturas', label: 'Prefacturas', icon: FileSpreadsheet, show: true },
  ];

  const moreNavItems = [
    { href: '/transportistas', label: 'Transportistas', icon: Truck, show: true },
    { href: '/tarifario', label: 'Tarifarios', icon: FileSpreadsheet, show: isAdmin },
    { href: '/usuarios', label: 'Usuarios', icon: Users, show: isAdmin },

  ];

  return (
    <div className="mobile-navbar-container">
      {/* Bottom Navigation Bar */}
      <nav className="mobile-navbar">
        {mainNavItems.filter(item => item.show).map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/');
          
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`mobile-nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              <span>{item.label}</span>
            </Link>
          );
        })}
        
        {/* "More" Button */}
        <button 
          className={`mobile-nav-item ${isDrawerOpen ? 'active' : ''}`}
          onClick={() => setIsDrawerOpen(!isDrawerOpen)}
        >
          {isDrawerOpen ? <X size={24} strokeWidth={2.5} /> : <Menu size={24} strokeWidth={2} />}
          <span>Menú</span>
        </button>
      </nav>

      {/* Drawer Overlay */}
      {isDrawerOpen && (
        <div className="mobile-drawer-overlay" onClick={() => setIsDrawerOpen(false)} />
      )}

      {/* Drawer Content */}
      <div className={`mobile-drawer ${isDrawerOpen ? 'open' : ''}`}>
        <div className="mobile-drawer-header">
          <p className="mobile-drawer-title">{user.name}</p>
          <p className="mobile-drawer-subtitle">{isAdmin ? 'Administrador' : 'Usuario'}</p>
        </div>
        <div className="mobile-drawer-content">
          {moreNavItems.filter(item => item.show).map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/');
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`mobile-drawer-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
          
          <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
            <button 
              className="mobile-drawer-item text-danger"
              onClick={() => logout()}
            >
              <LogOut size={20} />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
