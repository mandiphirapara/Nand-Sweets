'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Category {
  id: string;
  name: string;
}

export default function ManageCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    setLoading(true);
    const { data, error } = await supabase.from('categories').select('*').order('name');
    if (!error && data) {
      setCategories(data);
    }
    setLoading(false);
  }

  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    setIsSubmitting(true);
    const { error } = await supabase.from('categories').insert([{ name: newCategoryName.trim() }]);
    if (!error) {
      setNewCategoryName('');
      await fetchCategories();
    } else {
      alert('Error adding category: ' + error.message);
    }
    setIsSubmitting(false);
  }

  async function handleDeleteCategory(id: string) {
    if (!confirm('Are you sure you want to delete this category? This might fail if items are attached.')) return;
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (!error) {
      await fetchCategories();
    } else {
      alert('Error deleting category: ' + error.message);
    }
  }

  async function handleSaveEdit(id: string) {
    if (!editName.trim()) return;
    const { error } = await supabase.from('categories').update({ name: editName.trim() }).eq('id', id);
    if (!error) {
      setEditingId(null);
      await fetchCategories();
    } else {
      alert('Error updating category: ' + error.message);
    }
  }

  return (
    <>
      <h1 style={{ marginBottom: '40px' }}>Manage Categories</h1>
      
      <div className="glass-panel" style={{ marginBottom: '40px' }}>
        <h2>Add New Category</h2>
        <form onSubmit={handleAddCategory} style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
          <input 
            type="text" 
            placeholder="Category Name (e.g. Milk Sweets)" 
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid var(--surface-border)' }}
            required
          />
          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Adding...' : 'Add Category'}
          </button>
        </form>
      </div>

      <div className="glass-panel">
        <h2>Existing Categories</h2>
        {loading ? (
          <p style={{ marginTop: '16px' }}>Loading categories...</p>
        ) : categories.length === 0 ? (
          <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>No categories found.</p>
        ) : (
          <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {categories.map(cat => (
              <div key={cat.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--background-color)', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
                {editingId === cat.id ? (
                  <input 
                    type="text" 
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    style={{ flex: 1, marginRight: '16px', padding: '8px', borderRadius: '4px', border: '1px solid var(--primary-color)' }}
                  />
                ) : (
                  <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{cat.name}</span>
                )}
                
                <div style={{ display: 'flex', gap: '8px' }}>
                  {editingId === cat.id ? (
                    <>
                      <button onClick={() => handleSaveEdit(cat.id)} className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>Save</button>
                      <button onClick={() => setEditingId(null)} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <button 
                        onClick={() => { setEditingId(cat.id); setEditName(cat.name); }} 
                        className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.9rem' }}
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteCategory(cat.id)} 
                        className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.9rem', color: 'var(--danger)', borderColor: 'var(--danger)' }}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
