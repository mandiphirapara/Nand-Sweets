'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Branch {
  id: string;
  name: string;
}

interface Item {
  id: string;
  name: string;
  category_id: string;
}

interface Stock {
  item_id: string;
  branch_id: string;
  quantity: number;
}

export default function ManageStock() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [stock, setStock] = useState<Record<string, number>>({}); // item_id -> quantity
  const [loading, setLoading] = useState(true);
  
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);
  const [editQuantity, setEditQuantity] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchBaseData();
  }, []);

  useEffect(() => {
    if (selectedBranch) {
      fetchStockForBranch(selectedBranch);
    } else {
      setStock({});
    }
  }, [selectedBranch]);

  async function fetchBaseData() {
    setLoading(true);
    const [branchRes, itemRes] = await Promise.all([
      supabase.from('branches').select('id, name').order('name'),
      supabase.from('items').select('id, name, category_id').order('name')
    ]);
    if (branchRes.data) {
      setBranches(branchRes.data);
      if (branchRes.data.length > 0) setSelectedBranch(branchRes.data[0].id);
    }
    if (itemRes.data) setItems(itemRes.data);
    setLoading(false);
  }

  async function fetchStockForBranch(branchId: string) {
    const { data, error } = await supabase.from('stock').select('item_id, quantity').eq('branch_id', branchId);
    if (!error && data) {
      const stockMap: Record<string, number> = {};
      data.forEach(s => stockMap[s.item_id] = s.quantity);
      setStock(stockMap);
    }
  }

  async function handleSaveStock(itemId: string) {
    const qty = parseInt(editQuantity);
    if (isNaN(qty) || qty < 0) return;

    setUpdatingItemId(itemId);

    // Upsert stock record
    const { error } = await supabase.from('stock').upsert({
      item_id: itemId,
      branch_id: selectedBranch,
      quantity: qty,
      last_updated: new Date().toISOString()
    }, { onConflict: 'item_id,branch_id' });

    if (!error) {
      setStock(prev => ({ ...prev, [itemId]: qty }));
      setUpdatingItemId(null);
    } else {
      alert('Error updating stock: ' + error.message);
      setUpdatingItemId(null);
    }
  }

  return (
    <>
      <h1 style={{ marginBottom: '40px' }}>Stock Management</h1>
      
      <div className="glass-panel" style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <label style={{ fontWeight: 'bold', color: 'var(--text-secondary)' }}>Select Branch:</label>
          <select 
            value={selectedBranch} 
            onChange={(e) => setSelectedBranch(e.target.value)}
            style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--surface-border)', minWidth: '250px' }}
          >
            {branches.length === 0 && <option value="">No branches available</option>}
            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
      </div>

      {selectedBranch && (
        <div className="glass-panel">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h2>Inventory List</h2>
              <p style={{ color: 'var(--text-secondary)' }}>Update current stock levels. Items below 10 are highlighted.</p>
            </div>
            <div style={{ flex: '1 1 250px', maxWidth: '100%' }}>
              <input 
                type="text" 
                placeholder="Search items..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--surface-border)', width: '100%' }}
              />
            </div>
          </div>
          
          {loading ? (
            <p>Loading items...</p>
          ) : items.length === 0 ? (
            <p>No items found in the catalog.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {items.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase())).map(item => {
                const currentQty = stock[item.id] || 0;
                const isLowStock = currentQty < 10;
                const isUpdating = updatingItemId === item.id;
                
                return (
                  <div key={item.id} style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--background-color)', borderRadius: '8px', border: '1px solid var(--surface-border)', borderLeft: isLowStock ? '4px solid var(--danger)' : '4px solid var(--success)' }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '1.1rem', display: 'block' }}>{item.name}</span>
                      {isLowStock && <span style={{ color: 'var(--danger)', fontSize: '0.8rem', fontWeight: 'bold' }}>Low Stock</span>}
                    </div>
                    
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: '100px' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Current Stock</span>
                        <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: isLowStock ? 'var(--danger)' : 'var(--text-primary)' }}>{currentQty}</span>
                      </div>
                      
                      {isUpdating ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          <input 
                            type="number" 
                            min="0"
                            value={editQuantity}
                            onChange={(e) => setEditQuantity(e.target.value)}
                            style={{ width: '80px', padding: '8px', borderRadius: '4px', border: '1px solid var(--primary-color)' }}
                            autoFocus
                          />
                          <button onClick={() => handleSaveStock(item.id)} className="btn-primary" style={{ padding: '8px 16px' }}>Save</button>
                          <button onClick={() => setUpdatingItemId(null)} className="btn-secondary" style={{ padding: '8px 16px' }}>Cancel</button>
                        </div>
                      ) : (
                        <button onClick={() => { setUpdatingItemId(item.id); setEditQuantity(currentQty.toString()); }} className="btn-secondary" style={{ padding: '8px 16px' }}>
                          Update Stock
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </>
  );
}
