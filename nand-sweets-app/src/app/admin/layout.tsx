'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | undefined>('');

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

  if (loading) return null;
  
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--background-color)' }}>
      {/* Sidebar Navigation */}
      <aside className="glass-panel" style={{ width: '250px', borderRadius: '0', borderLeft: 'none', borderTop: 'none', borderBottom: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
          <img src="/NAND_LOGO_FINAL.svg" alt="Nand Sweets Logo" style={{ width: '32px', height: '32px' }} />
          <h2 style={{ margin: 0, color: 'var(--primary-color)' }}>Admin Panel</h2>
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <button onClick={() => router.push('/admin')} className="btn-secondary" style={{ textAlign: 'left', border: 'none', background: pathname === '/admin' ? 'rgba(0,0,0,0.05)' : 'transparent' }}>Dashboard</button>
          <button onClick={() => router.push('/admin/categories')} className="btn-secondary" style={{ textAlign: 'left', border: 'none', background: pathname === '/admin/categories' ? 'rgba(0,0,0,0.05)' : 'transparent' }}>Categories</button>
          <button onClick={() => router.push('/admin/items')} className="btn-secondary" style={{ textAlign: 'left', border: 'none', background: pathname === '/admin/items' ? 'rgba(0,0,0,0.05)' : 'transparent' }}>Items</button>
          <button onClick={() => router.push('/admin/branches')} className="btn-secondary" style={{ textAlign: 'left', border: 'none', background: pathname === '/admin/branches' ? 'rgba(0,0,0,0.05)' : 'transparent' }}>Branches</button>
          <button onClick={() => router.push('/admin/stock')} className="btn-secondary" style={{ textAlign: 'left', border: 'none', background: pathname === '/admin/stock' ? 'rgba(0,0,0,0.05)' : 'transparent' }}>Stock Tracking</button>
          <button onClick={() => router.push('/admin/pos')} className="btn-primary" style={{ textAlign: 'left', marginTop: '20px' }}>Point of Sale</button>
        </nav>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        <header style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '40px' }}>
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
