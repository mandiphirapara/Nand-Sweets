'use client';

import React from 'react';

export default function AdminDashboard() {
  return (
    <>
      <h1 style={{ marginBottom: '40px' }}>Dashboard Overview</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
        {/* Quick Stats Cards */}
        <div className="glass-panel">
          <h3 style={{ color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '1rem' }}>Today's Sales</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--success)' }}>₹0.00</p>
        </div>
        <div className="glass-panel">
          <h3 style={{ color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '1rem' }}>Low Stock Items</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>0</p>
        </div>
        <div className="glass-panel">
          <h3 style={{ color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '1rem' }}>Total Categories</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>0</p>
        </div>
        <div className="glass-panel">
          <h3 style={{ color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '1rem' }}>Total Items</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>0</p>
        </div>
      </div>
      
      <div style={{ marginTop: '40px' }} className="glass-panel">
        <h2>Welcome to Nand Sweets Management</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '16px' }}>
          Use the sidebar to navigate through categories, items, and stock management. 
          Once products are added, you can start recording sales via the Point of Sale system.
        </p>
      </div>
    </>
  );
}
