import React from 'react';

export const Button = ({ 
  children, 
  onClick, 
  type = 'button', 
  variant = 'primary', 
  disabled = false, 
  loading = false,
  className = '',
  ...props 
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`btn btn-${variant} ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <svg className="animate-spin" style={{ width: '1.2rem', height: '1.2rem', marginRight: '8px', border: '2px solid transparent', borderTopColor: 'currentColor', borderRadius: '50%' }} viewBox="0 0 24 24"></svg>
          Memproses...
        </>
      ) : children}
    </button>
  );
};
