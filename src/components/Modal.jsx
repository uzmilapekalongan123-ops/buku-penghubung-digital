import React from 'react';

export const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }} onClick={onClose}>
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '400px',
        padding: '24px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        animation: 'fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards',
        position: 'relative'
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
          borderBottom: '1px solid rgba(0,0,0,0.08)',
          paddingBottom: '12px'
        }}>
          <h3 style={{ margin: 0, color: '#1b4332', fontSize: '1.2rem', fontWeight: 600 }}>{title}</h3>
          <button 
            onClick={onClose} 
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#6c757d',
              lineHeight: 1
            }}
          >
            &times;
          </button>
        </div>
        <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {children}
        </div>
      </div>
    </div>
  );
};
