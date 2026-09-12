'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface Branch {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
}

interface Item {
  id: string;
  name: string;
  category_id: string;
  price: number;
  image_url: string;
}

interface CartItem extends Item {
  cartQty: number;
}

export default function POS() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedSale, setCompletedSale] = useState<{ id: string, token: string, items: CartItem[], total: number } | null>(null);
  
  const [customerPhone, setCustomerPhone] = useState('');
  const [isSendingWa, setIsSendingWa] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const [branchRes, catRes, itemRes] = await Promise.all([
      supabase.from('branches').select('*').order('name'),
      supabase.from('categories').select('*').order('name'),
      supabase.from('items').select('*').order('name')
    ]);

    if (branchRes.data) {
      setBranches(branchRes.data);
      if (branchRes.data.length > 0) setSelectedBranch(branchRes.data[0].id);
    }
    if (catRes.data) setCategories(catRes.data);
    if (itemRes.data) setItems(itemRes.data);
  }

  const filteredItems = items.filter(item => {
    const matchesCategory = selectedCategory ? item.category_id === selectedCategory : true;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  function addToCart(item: Item) {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, cartQty: i.cartQty + 250 } : i);
      }
      return [...prev, { ...item, cartQty: 500 }];
    });
  }

  function updateCartQtyDirectly(id: string, val: string) {
    setCart(prev => {
      return prev.map(item => {
        if (item.id === id) {
          return { ...item, cartQty: val === '' ? 0 : parseInt(val) || 0 };
        }
        return item;
      });
    });
  }

  function updateCartQty(id: string, delta: number) {
    setCart(prev => {
      return prev.map(item => {
        if (item.id === id) {
          const newQty = item.cartQty + delta;
          return newQty > 0 ? { ...item, cartQty: newQty } : item;
        }
        return item;
      }).filter(item => item.cartQty > 0);
    });
  }

  function removeFromCart(id: string) {
    setCart(prev => prev.filter(item => item.id !== id));
  }

  const cartTotal = cart.reduce((sum, item) => sum + ((item.price * item.cartQty) / 1000), 0);

  async function handleCheckout() {
    if (!selectedBranch) return alert('Please select a branch first.');
    if (cart.length === 0) return alert('Cart is empty.');
    
    const invalidItem = cart.find(item => item.cartQty <= 0 || isNaN(item.cartQty));
    if (invalidItem) {
      return alert(`Oops! Please enter a valid weight for ${invalidItem.name} before checking out.`);
    }
    
    setIsProcessing(true);

    try {
      // 1. Create Sale Record
      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .insert([{ branch_id: selectedBranch, total_amount: cartTotal }])
        .select()
        .single();
        
      if (saleError || !saleData) throw new Error(saleError?.message || 'Failed to create sale record');

      // 2. Create Sale Items
      const saleItemsToInsert = cart.map(item => ({
        sale_id: saleData.id,
        item_id: item.id,
        quantity: item.cartQty,
        price: item.price,
        price_at_time: item.price
      }));

      const { error: saleItemsError } = await supabase.from('sale_items').insert(saleItemsToInsert);
      if (saleItemsError) throw new Error(saleItemsError.message);

      // 3. Deduct Stock
      for (const item of cart) {
        // First get current stock
        const { data: stockData } = await supabase
          .from('stock')
          .select('quantity')
          .eq('branch_id', selectedBranch)
          .eq('item_id', item.id)
          .single();
          
        const currentQty = stockData?.quantity || 0;
        
        // Then update it
        await supabase.from('stock').upsert({
          branch_id: selectedBranch,
          item_id: item.id,
          quantity: Math.max(0, currentQty - (item.cartQty / 1000)),
          last_updated: new Date().toISOString()
        }, { onConflict: 'branch_id,item_id' });
      }

      setCompletedSale({
        id: saleData.id,
        token: saleData.id.split('-')[0].toUpperCase(),
        items: [...cart],
        total: cartTotal
      });
      setCart([]);
    } catch (err: any) {
      alert('Checkout Failed: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  }

  function createReceiptPDFBlob() {
    if (!completedSale) return null;
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [80, 150] });
    const dateStr = new Date().toLocaleDateString('en-IN');
    
    // Header
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(16);
    pdf.text("Nand Sweets", 40, 15, { align: "center" });
    
    // Sub-header
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.text(`Token: ${completedSale.token}`, 5, 22);
    pdf.text(`Date: ${dateStr}`, 75, 22, { align: "right" });
    
    pdf.setLineWidth(0.5);
    pdf.line(5, 25, 75, 25);
    
    // Table Headers
    pdf.setFont("helvetica", "bold");
    pdf.text("Item", 5, 30);
    pdf.text("Rate", 35, 30, { align: "center" });
    pdf.text("Qty", 48, 30, { align: "center" });
    pdf.text("Total", 75, 30, { align: "right" });
    
    pdf.line(5, 33, 75, 33);
    
    let y = 38;
    completedSale.items.forEach(item => {
      pdf.setFont("helvetica", "normal");
      
      let name = item.name;
      if (name.length > 15) name = name.substring(0, 15) + '...';
      
      const qtyStr = (item.cartQty / 1000) + ' Kg';
      const itemTotal = (item.price * item.cartQty) / 1000;
      
      pdf.text(name, 5, y);
      pdf.text(`Rs.${item.price}`, 35, y, { align: "center" });
      pdf.text(qtyStr, 48, y, { align: "center" });
      pdf.text(`Rs.${itemTotal}`, 75, y, { align: "right" });
      y += 6;
    });
    
    pdf.line(5, y, 75, y);
    y += 6;
    
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.text("Total:", 5, y);
    pdf.text(`Rs.${completedSale.total}`, 75, y, { align: "right" });
    
    y += 12;
    pdf.setFont("helvetica", "italic");
    pdf.setFontSize(9);
    pdf.text("Thank you for visiting!", 40, y, { align: "center" });

    return pdf.output('blob');
  }

  async function generatePDF() {
    if (!completedSale) return;
    const pdfBlob = createReceiptPDFBlob();
    if (!pdfBlob) return;
    
    // Quick download of the blob
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `NandSweets_Bill_${completedSale.token}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  async function sendWhatsApp() {
    if (!completedSale) return;
    if (!customerPhone || customerPhone.length < 10) {
      alert("Please enter a valid 10-digit mobile number.");
      return;
    }
    
    setIsSendingWa(true);
    try {
      // 1. Generate Native PDF Blob (Tiny Size)
      const pdfBlob = createReceiptPDFBlob();
      if (!pdfBlob) throw new Error("Failed to generate PDF");
      
      const fileName = `receipt-${completedSale.token}.pdf`;

      // 2. Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(fileName, pdfBlob, { 
          contentType: 'application/pdf',
          upsert: true 
        });
        
      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw new Error("Failed to upload receipt PDF.");
      }

      // 3. Get Branded URL instead of direct Supabase URL
      const brandedLink = `${window.location.origin}/receipt/${completedSale.token}`;

      // 4. Construct WhatsApp Message
      const dateStr = new Date().toLocaleDateString('en-IN');
      let text = `*Nand Sweets - Order Receipt*\nToken: ${completedSale.token}\nDate: ${dateStr}\n\n*Items:*\n`;
      completedSale.items.forEach(item => {
        text += `- ${item.name}  |  ₹${item.price}/Kg  |  ${item.cartQty / 1000} Kg  |  ₹${(item.price * item.cartQty) / 1000}\n`;
      });
      text += `\n*Total: ₹${completedSale.total}*\n\nView & Download your Bill here:\n${brandedLink}\n\nThank you for choosing Nand Sweets!`;
      
      // Clean up phone number (remove spaces, etc)
      let phone = customerPhone.replace(/\D/g, '');
      if (phone.length === 10) phone = '91' + phone; // Add India code by default if 10 digits
      
      const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
      window.open(url, '_blank');
      
    } catch (err: any) {
      alert("Failed to send WhatsApp: " + err.message);
    } finally {
      setIsSendingWa(false);
    }
  }

  return (
    <>
      <div style={{ display: 'flex', gap: '24px', height: 'calc(100vh - 80px)' }}>
        
        {/* LEFT: PRODUCTS */}
        <div style={{ flex: '2', minHeight: 0, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1>Point of Sale</h1>
          <select 
            value={selectedBranch} 
            onChange={(e) => setSelectedBranch(e.target.value)}
            style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--surface-border)' }}
          >
            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>

          <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px' }}>
            <button 
              onClick={() => setSelectedCategory(null)} 
              className={`btn-secondary ${!selectedCategory ? 'active' : ''}`}
              style={{ whiteSpace: 'nowrap' }}
            >
              All Items
            </button>
            {categories.map(c => (
              <button 
                key={c.id} 
                onClick={() => setSelectedCategory(c.id)} 
                className={`btn-secondary ${selectedCategory === c.id ? 'active' : ''}`}
                style={{ whiteSpace: 'nowrap' }}
              >
                {c.name}
              </button>
            ))}
          </div>

          <div style={{ paddingBottom: '10px' }}>
            <input 
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--surface-border)', fontSize: '1rem' }}
            />
          </div>

          <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', alignContent: 'start', gap: '16px', overflowY: 'auto', paddingRight: '10px' }}>
            {filteredItems.map(item => (
              <div 
                key={item.id} 
                onClick={() => addToCart(item)}
                style={{ 
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: '200px',
                  background: 'var(--surface-color)', 
                  border: '1px solid var(--surface-border)', 
                  borderRadius: '8px', 
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'transform 0.1s'
                }}
                onMouseOver={e => e.currentTarget.style.transform = 'scale(1.02)'}
                onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                {item.image_url ? (
                  <img src={item.image_url} style={{ width: '100%', height: '120px', minHeight: '120px', objectFit: 'cover' }} alt={item.name} />
                ) : (
                  <div style={{ width: '100%', height: '120px', background: '#eee' }}></div>
                )}
                <div style={{ padding: '12px', textAlign: 'center' }}>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem' }}>{item.name}</h4>
                  <p style={{ margin: 0, color: 'var(--primary-color)', fontWeight: 'bold' }}>₹{item.price}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: CART */}
        <div className="glass-panel" style={{ flex: '1', minWidth: '350px', display: 'flex', flexDirection: 'column', height: '100%' }}>
          <h2 style={{ marginBottom: '16px', borderBottom: '1px solid var(--surface-border)', paddingBottom: '16px' }}>Current Bill</h2>
          
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', paddingRight: '5px' }}>
            {cart.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: '40px' }}>Cart is empty</p>
            ) : (
              cart.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontWeight: 'bold', display: 'block' }}>{item.name}</span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>₹{item.price}/Kg</span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input 
                      type="number" 
                      value={item.cartQty === 0 ? '' : item.cartQty} 
                      onChange={(e) => updateCartQtyDirectly(item.id, e.target.value)} 
                      style={{ width: '60px', padding: '4px', textAlign: 'center', borderRadius: '4px', border: '1px solid #ccc' }}
                      min="0" step="250"
                    />
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Grams</span>
                    <button onClick={() => removeFromCart(item.id)} style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', marginLeft: '8px', fontSize: '1.2rem' }}>×</button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div style={{ marginTop: 'auto', borderTop: '1px solid var(--surface-border)', paddingTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', fontSize: '1.5rem', fontWeight: 'bold' }}>
              <span>Total:</span>
              <span>₹{cartTotal}</span>
            </div>
            
            <button 
              onClick={handleCheckout} 
              className="btn-primary" 
              style={{ width: '100%', padding: '16px', fontSize: '1.2rem', display: 'flex', justifyContent: 'center' }}
              disabled={cart.length === 0 || isProcessing || !selectedBranch}
            >
              {isProcessing ? 'Processing...' : 'Complete Checkout'}
            </button>
          </div>
        </div>

      </div>
      
      {completedSale && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
            <div style={{ background: '#fff', padding: '30px', borderRadius: '12px', width: '400px', maxWidth: '100%', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
              
              {/* Bill to capture as PDF */}
              <div id="receipt-card" style={{ padding: '20px', border: '1px dashed #ccc', marginBottom: '24px', background: '#fff' }}>
                <h2 style={{ textAlign: 'center', color: 'var(--primary-color)', marginBottom: '8px', fontFamily: 'var(--font-heading)' }}>Nand Sweets</h2>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666', fontSize: '0.9rem', marginBottom: '12px' }}>
                  <span>Token: <strong style={{ color: '#000' }}>{completedSale.token}</strong></span>
                  <span>Date: {new Date().toLocaleDateString('en-IN')}</span>
                </div>
                
                <div style={{ borderTop: '1px solid #eee', borderBottom: '1px solid #eee', padding: '8px 0', marginBottom: '8px', display: 'flex', fontWeight: 'bold', fontSize: '0.9rem' }}>
                  <span style={{ flex: 2 }}>Item</span>
                  <span style={{ flex: 1, textAlign: 'center' }}>Rate</span>
                  <span style={{ flex: 1, textAlign: 'center' }}>Qty</span>
                  <span style={{ flex: 1, textAlign: 'right' }}>Amount</span>
                </div>
                
                <div style={{ borderBottom: '1px solid #eee', paddingBottom: '12px', marginBottom: '12px' }}>
                  {completedSale.items.map((item, idx) => (
                     <div key={idx} style={{ display: 'flex', fontSize: '0.95rem', marginBottom: '6px' }}>
                       <span style={{ flex: 2 }}>{item.name}</span>
                       <span style={{ flex: 1, textAlign: 'center', color: '#666' }}>₹{item.price}</span>
                       <span style={{ flex: 1, textAlign: 'center' }}>{item.cartQty / 1000} Kg</span>
                       <span style={{ flex: 1, textAlign: 'right', fontWeight: '500' }}>₹{(item.price * item.cartQty) / 1000}</span>
                     </div>
                  ))}
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.2rem' }}>
                  <span>Total:</span>
                  <span style={{ color: 'var(--primary-color)' }}>₹{completedSale.total}</span>
                </div>
                <p style={{ textAlign: 'center', color: '#888', fontSize: '0.85rem', marginTop: '20px', fontStyle: 'italic' }}>Thank you for visiting!</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button onClick={generatePDF} className="btn-secondary" style={{ padding: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                Download PDF Bill
              </button>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px', borderTop: '1px solid #eee', paddingTop: '16px' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Customer WhatsApp No.</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    type="text" 
                    placeholder="e.g. 9876543210" 
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
                  />
                </div>
                <button 
                  onClick={sendWhatsApp} 
                  disabled={isSendingWa}
                  className="btn-primary" 
                  style={{ background: '#25D366', color: '#fff', borderColor: '#25D366', padding: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                  {isSendingWa ? 'Generating Link...' : 'Send WhatsApp Bill'}
                </button>
              </div>
              
              <button onClick={() => { setCompletedSale(null); setCustomerPhone(''); }} className="btn-secondary" style={{ marginTop: '16px', border: 'none', background: '#f5f5f5' }}>
                  Start New Sale
                </button>
              </div>

            </div>
          </div>
        )}
    </>
  );
}
