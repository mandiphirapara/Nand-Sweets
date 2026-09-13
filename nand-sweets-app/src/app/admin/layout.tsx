'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | undefined>('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    async function checkUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        if (pathname !== '/admin/login') {
           router.push('/admin/login');
        }
      } else {
        setUserEmail(session.user.email);
      }
      setLoading(false);
    }
    checkUser();
  }, [router, pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
  };

  const navigateTo = (path: string) => {
    router.push(path);
    setIsMobileMenuOpen(false);
  };

  if (loading) return null;
  
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  return (
    <div className="admin-layout">
      {/* Sidebar Navigation */}
      <aside className={`glass-panel admin-sidebar ${!isMobileMenuOpen ? 'closed' : ''}`}>
        <div className="admin-sidebar-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src="/NAND_LOGO_FINAL.svg" alt="Nand Sweets Logo" style={{ width: '32px', height: '32px' }} />
            <h2 style={{ margin: 0, color: 'var(--primary-color)' }}>Admin Panel</h2>
          </div>
          <button 
            className="mobile-menu-btn" 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary-color)' }}
          >
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
        <nav className={`admin-nav ${isMobileMenuOpen ? 'open' : ''}`} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <button onClick={() => navigateTo('/admin')} className="btn-secondary" style={{ textAlign: 'left', border: 'none', background: pathname === '/admin' ? 'rgba(0,0,0,0.05)' : 'transparent' }}>Dashboard</button>
          <button onClick={() => navigateTo('/admin/categories')} className="btn-secondary" style={{ textAlign: 'left', border: 'none', background: pathname === '/admin/categories' ? 'rgba(0,0,0,0.05)' : 'transparent' }}>Categories</button>
          <button onClick={() => navigateTo('/admin/items')} className="btn-secondary" style={{ textAlign: 'left', border: 'none', background: pathname === '/admin/items' ? 'rgba(0,0,0,0.05)' : 'transparent' }}>Items</button>
          <button onClick={() => navigateTo('/admin/branches')} className="btn-secondary" style={{ textAlign: 'left', border: 'none', background: pathname === '/admin/branches' ? 'rgba(0,0,0,0.05)' : 'transparent' }}>Branches</button>
          <button onClick={() => navigateTo('/admin/stock')} className="btn-secondary" style={{ textAlign: 'left', border: 'none', background: pathname === '/admin/stock' ? 'rgba(0,0,0,0.05)' : 'transparent' }}>Stock Tracking</button>
          <button onClick={() => navigateTo('/admin/pos')} className="btn-primary" style={{ textAlign: 'left', marginTop: '20px' }}>Point of Sale</button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <button 
            className="desktop-menu-btn" 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary-color)' }}
          >
            <Menu size={28} />
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>{userEmail}</span>
            <button className="btn-secondary" onClick={handleLogout} style={{ padding: '8px 16px' }}>Logout</button>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}
