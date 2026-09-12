'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Category {
  id: string;
  name: string;
}

interface Item {
  id: string;
  category_id: string;
  name: string;
  description: string;
  ingredients: string;
  price: number;
  image_url: string;
}

export default function ManageItems() {
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const [catsRes, itemsRes] = await Promise.all([
      supabase.from('categories').select('*').order('name'),
      supabase.from('items').select('*').order('name')
    ]);
    
    if (catsRes.data) setCategories(catsRes.data);
    if (itemsRes.data) setItems(itemsRes.data);
    
    // Set default category if available
    if (catsRes.data && catsRes.data.length > 0 && !categoryId) {
      setCategoryId(catsRes.data[0].id);
    }
    
    setLoading(false);
  }

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !categoryId || !price) return;
    setIsSubmitting(true);

    let imageUrl = '';
    const existingItem = editingItemId ? items.find(i => i.id === editingItemId) : null;

    // 1. Upload Image if selected
    if (imageFile) {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('item-images')
        .upload(filePath, imageFile);

      if (uploadError) {
        alert('Error uploading image: ' + uploadError.message);
        setIsSubmitting(false);
        return;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('item-images')
        .getPublicUrl(filePath);
        
      imageUrl = publicUrl;

      // Clean up old image if editing
      if (existingItem?.image_url) {
        try {
          const oldUrlWithoutQuery = existingItem.image_url.split('?')[0];
          const oldUrlParts = oldUrlWithoutQuery.split('/');
          const oldFileName = decodeURIComponent(oldUrlParts[oldUrlParts.length - 1]);
          if (oldFileName) supabase.storage.from('item-images').remove([oldFileName]);
        } catch (err) {}
      }
    } else if (existingItem) {
      imageUrl = existingItem.image_url;
    }

    // 2. Insert or Update DB
    if (editingItemId) {
      const { error } = await supabase.from('items').update({
        name,
        category_id: categoryId,
        price: parseFloat(price),
        description,
        ingredients,
        image_url: imageUrl
      }).eq('id', editingItemId);

      if (error) {
        alert('Error updating item: ' + error.message);
      } else {
        handleCancelEdit();
        await fetchData();
      }
    } else {
      const { error } = await supabase.from('items').insert([{
        name,
        category_id: categoryId,
        price: parseFloat(price),
        description,
        ingredients,
        image_url: imageUrl
      }]);

      if (error) {
        alert('Error adding item: ' + error.message);
      } else {
        handleCancelEdit();
        await fetchData();
      }
    }
    
    setIsSubmitting(false);
  }

  function handleEditClick(item: Item) {
    setEditingItemId(item.id);
    setName(item.name);
    setCategoryId(item.category_id);
    setPrice(item.price.toString());
    setDescription(item.description || '');
    setIngredients(item.ingredients || '');
    setImageFile(null);
    const fileInput = document.getElementById('imageUpload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleCancelEdit() {
    setEditingItemId(null);
    setName('');
    setPrice('');
    setDescription('');
    setIngredients('');
    setImageFile(null);
    const fileInput = document.getElementById('imageUpload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }

  async function handleDeleteItem(item: Item) {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    // 1. Delete image from storage if it exists
    if (item.image_url) {
      try {
        const urlWithoutQuery = item.image_url.split('?')[0];
        const urlParts = urlWithoutQuery.split('/');
        const fileName = decodeURIComponent(urlParts[urlParts.length - 1]);
        
        if (fileName) {
          const { error: storageError } = await supabase.storage.from('item-images').remove([fileName]);
          if (storageError) {
            alert('Storage Deletion Failed: ' + storageError.message);
          }
        }
      } catch (err: any) {
        alert('Error parsing image URL: ' + err.message);
      }
    }

    // 2. Delete item from database
    const { error } = await supabase.from('items').delete().eq('id', item.id);
    if (!error) {
      await fetchData();
    } else {
      alert('Error deleting item from database: ' + error.message);
    }
  }

  return (
    <>
      <h1 style={{ marginBottom: '40px' }}>Manage Items</h1>
      
      <div className="glass-panel" style={{ marginBottom: '40px' }}>
        <h2>{editingItemId ? 'Edit Item' : 'Add New Item'}</h2>
        <form onSubmit={handleAddItem} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px', maxWidth: '600px' }}>
          
          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Item Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--surface-border)' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Category</label>
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--surface-border)' }}>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Price (₹)</label>
            <input type="number" min="0" step="1" value={price} onChange={(e) => setPrice(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--surface-border)' }} />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--surface-border)', fontFamily: 'inherit' }} />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Ingredients</label>
            <input type="text" value={ingredients} onChange={(e) => setIngredients(e.target.value)} placeholder="e.g. Milk, Sugar, Ghee" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--surface-border)' }} />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Product Image</label>
            <input type="file" id="imageUpload" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--surface-border)' }} />
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
            <button type="submit" className="btn-primary" disabled={isSubmitting || categories.length === 0} style={{ flex: 1 }}>
              {isSubmitting ? 'Saving...' : (editingItemId ? 'Update Item' : 'Add Item')}
            </button>
            {editingItemId && (
              <button type="button" onClick={handleCancelEdit} className="btn-secondary" style={{ flex: 1 }}>
                Cancel
              </button>
            )}
          </div>
          {categories.length === 0 && <p style={{ color: 'var(--danger)', fontSize: '0.9rem' }}>Please create a category first.</p>}
        </form>
      </div>

      <div className="glass-panel">
        <h2>Existing Items</h2>
        {loading ? (
          <p style={{ marginTop: '16px' }}>Loading items...</p>
        ) : items.length === 0 ? (
          <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>No items found.</p>
        ) : (
          <div style={{ marginTop: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {items.map(item => (
              <div key={item.id} style={{ display: 'flex', gap: '16px', padding: '16px', background: 'var(--background-color)', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
                {item.image_url ? (
                  <img src={item.image_url} alt={item.name} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '6px' }} />
                ) : (
                  <div style={{ width: '80px', height: '80px', background: '#eee', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>No Img</div>
                )}
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '4px' }}>{item.name}</h3>
                  <p style={{ color: 'var(--primary-color)', fontWeight: 'bold', marginBottom: '8px' }}>₹{item.price}</p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => handleEditClick(item)} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                      Edit
                    </button>
                    <button onClick={() => handleDeleteItem(item)} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem', color: 'var(--danger)', borderColor: 'var(--danger)' }}>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
