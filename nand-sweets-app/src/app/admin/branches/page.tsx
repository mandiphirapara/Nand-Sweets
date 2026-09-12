'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Branch {
  id: string;
  name: string;
  location: string;
}

export default function ManageBranches() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchBranches();
  }, []);

  async function fetchBranches() {
    setLoading(true);
    const { data, error } = await supabase.from('branches').select('*').order('name');
    if (!error && data) {
      setBranches(data);
    }
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);

    if (editingId) {
      const { error } = await supabase.from('branches').update({ 
        name: name.trim(), 
        location: location.trim() 
      }).eq('id', editingId);
      
      if (!error) {
        resetForm();
        await fetchBranches();
      } else {
        alert('Error updating branch: ' + error.message);
      }
    } else {
      const { error } = await supabase.from('branches').insert([{ 
        name: name.trim(), 
        location: location.trim() 
      }]);
      
      if (!error) {
        resetForm();
        await fetchBranches();
      } else {
        alert('Error adding branch: ' + error.message);
      }
    }
    setIsSubmitting(false);
  }

  function resetForm() {
    setEditingId(null);
    setName('');
    setLocation('');
  }

  function handleEditClick(branch: Branch) {
    setEditingId(branch.id);
    setName(branch.name);
    setLocation(branch.location || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this branch? All stock records associated with this branch will also be deleted!')) return;
    const { error } = await supabase.from('branches').delete().eq('id', id);
    if (!error) {
      await fetchBranches();
    } else {
      alert('Error deleting branch: ' + error.message);
    }
  }

  return (
    <>
      <h1 style={{ marginBottom: '40px' }}>Manage Branches</h1>
      
      <div className="glass-panel" style={{ marginBottom: '40px', maxWidth: '600px' }}>
        <h2>{editingId ? 'Edit Branch' : 'Add New Branch'}</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Branch Name</label>
            <input 
              type="text" 
              placeholder="e.g. Main Street Branch" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--surface-border)' }}
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Location / Address (Optional)</label>
            <textarea 
              placeholder="e.g. 123 Main St, City" 
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              rows={2}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--surface-border)', fontFamily: 'inherit' }}
            />
          </div>
          
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <button type="submit" className="btn-primary" disabled={isSubmitting} style={{ flex: 1 }}>
              {isSubmitting ? 'Saving...' : (editingId ? 'Update Branch' : 'Add Branch')}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm} className="btn-secondary" style={{ flex: 1 }}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="glass-panel">
        <h2>Existing Branches</h2>
        {loading ? (
          <p style={{ marginTop: '16px' }}>Loading branches...</p>
        ) : branches.length === 0 ? (
          <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>No branches found. Add your first branch above!</p>
        ) : (
          <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {branches.map(branch => (
              <div key={branch.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--background-color)', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
                <div>
                  <span style={{ fontWeight: 'bold', fontSize: '1.1rem', display: 'block' }}>{branch.name}</span>
                  {branch.location && <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{branch.location}</span>}
                </div>
                
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => handleEditClick(branch)} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
                    Edit
                  </button>
                  <button onClick={() => handleDelete(branch.id)} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.9rem', color: 'var(--danger)', borderColor: 'var(--danger)' }}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
