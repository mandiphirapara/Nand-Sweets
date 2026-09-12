'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Phone, Mail, MapPin } from 'lucide-react';

interface Category {
  id: string;
  name: string;
}

interface Item {
  id: string;
  category_id: string;
  name: string;
  price: number;
  description: string;
  ingredients: string;
  image_url: string;
}

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [catRes, itemRes] = await Promise.all([
          supabase.from('categories').select('*').order('name'),
          supabase.from('items').select('*').order('name')
        ]);
        
        if (catRes.data) setCategories(catRes.data);
        if (itemRes.data) setItems(itemRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filteredItems = selectedCategory 
    ? items.filter(item => item.category_id === selectedCategory)
    : items;

  return (
    <>
      {/* Navigation Header */}
      <nav className="header-nav" style={{ padding: '8px 40px' }}>
        <img src="/NAND_LOGO_FINAL.svg" alt="Nand Sweets Logo" style={{ height: '90px' }} />
        <img src="/NAME.svg" alt="Nand Sweets" style={{ height: '45px' }} />
      </nav>

      {/* Hero Section */}
      <header style={{ 
        textAlign: 'center', 
        padding: '80px 20px 60px',
        backgroundColor: '#fdf5e6',
        borderBottom: '1px solid var(--surface-border)',
        position: 'relative'
      }}>
        <h1 style={{ fontSize: '3.5rem', marginBottom: '16px' }}>Handcrafted Pure Ghee Sweets</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto', lineHeight: '1.6' }}>
          Experience the authentic taste of tradition. We prepare fresh, premium quality sweets and namkeen daily using 100% pure ingredients.
        </p>
      </header>

      {/* Catalog Section */}
      <div style={{ padding: '60px 40px', maxWidth: '1280px', margin: '0 auto' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '24px' }}>Our Catalog</h2>
          
          <div style={{ display: 'inline-flex', gap: '15px', overflowX: 'auto', padding: '10px 20px', maxWidth: '100%' }}>
            <button 
              className={`btn-secondary ${selectedCategory === null ? 'active' : ''}`} 
              onClick={() => setSelectedCategory(null)}
              style={{ whiteSpace: 'nowrap' }}
            >
              All Sweets
            </button>
            {categories.map(cat => (
              <button 
                key={cat.id} 
                className={`btn-secondary ${selectedCategory === cat.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.id)}
                style={{ whiteSpace: 'nowrap' }}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px' }}>
            <h3 style={{ color: 'var(--primary-color)', fontFamily: 'var(--font-heading)' }}>Loading the sweetness...</h3>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="glass-panel" style={{ textAlign: 'center', padding: '60px' }}>
            <h3 style={{ color: 'var(--text-secondary)' }}>Our fresh batch is being prepared. Check back soon!</h3>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '30px' }}>
            {filteredItems.map(item => (
              <div key={item.id} className="product-card">
                <div 
                  style={{ 
                    height: '240px', 
                    backgroundColor: '#faf8f5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-secondary)',
                    overflow: 'hidden',
                    borderBottom: '1px solid var(--surface-border)'
                  }}
                >
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="product-image" />
                  ) : (
                    <div style={{ fontSize: '3rem', color: '#e0d8c8' }}>❀</div>
                  )}
                </div>
                
                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <h3 style={{ marginBottom: '8px', fontSize: '1.4rem' }}>{item.name}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '8px', minHeight: '44px', lineHeight: '1.5' }}>
                    {item.description}
                  </p>
                  {item.ingredients && (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '16px', fontStyle: 'italic', opacity: 0.9 }}>
                      <strong>Ingredients:</strong> {item.ingredients}
                    </p>
                  )}
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', borderTop: '1px solid var(--surface-border)', paddingTop: '16px' }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Price :</span>
                    <span style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#000000' }}>
                      ₹{item.price}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Footer */}
      <footer style={{ backgroundColor: '#1a1311', color: '#fff', padding: '40px 40px 20px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '40px', justifyContent: 'space-between' }}>
          
          <div style={{ flex: '1 1 300px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <img src="/NAND_LOGO_FINAL.svg" alt="Nand Sweets Logo" style={{ height: '70px' }} />
              <img src="/NAME.svg" alt="Nand Sweets" style={{ height: '28px' }} />
            </div>
            <p style={{ color: '#aaa', lineHeight: '1.6' }}>
              Handcrafted with love, bringing the authentic taste of tradition to your doorstep. 100% Pure Vegetarian & Premium Quality.
            </p>
          </div>

          <div style={{ flex: '1 1 300px' }}>
            <h3 style={{ color: '#fff', marginBottom: '20px', fontSize: '1.2rem', fontFamily: 'var(--font-heading)' }}>Reach Us On</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <a href="tel:+919624699887" style={{ color: '#aaa', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px', transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = 'var(--primary-color)'} onMouseOut={(e) => e.currentTarget.style.color = '#aaa'}>
                <Phone size={18} />
                +91 96246 99887
              </a>
              <a href="mailto:support.nandsweets@gmail.com" style={{ color: '#aaa', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px', transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = 'var(--primary-color)'} onMouseOut={(e) => e.currentTarget.style.color = '#aaa'}>
                <Mail size={18} />
                support.nandsweets@gmail.com
              </a>
              <a href="https://maps.app.goo.gl/VnoifGB4bHJeH3en8" target="_blank" rel="noopener noreferrer" style={{ color: '#aaa', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px', transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = 'var(--primary-color)'} onMouseOut={(e) => e.currentTarget.style.color = '#aaa'}>
                <MapPin size={18} />
                View on Google Maps
              </a>
            </div>
          </div>
          
        </div>
        
        <div style={{ textAlign: 'center', color: '#888', marginTop: '30px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: '0.9rem' }}>
          © 2026 Nand Sweets. All rights reserved.
        </div>
      </footer>
    </>
  );
}
