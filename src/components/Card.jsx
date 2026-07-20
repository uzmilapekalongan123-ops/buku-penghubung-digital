import React from 'react';

export const Card = ({ children, className = '', onClick, ...props }) => {
  return (
    <div 
      className={`glass-card fade-in ${className}`} 
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default', marginBottom: '16px' }}
      {...props}
    >
      {children}
    </div>
  );
};
