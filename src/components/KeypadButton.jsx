import React from 'react';

export function KeypadButton({ children, onClick, className = "" }) {
  const hasBg = className.includes('bg-');
  const hasTextCol = className.includes('text-');
  
  return (
    <button
      onClick={onClick}
      className={`h-14 flex items-center justify-center rounded-2xl text-xl font-bold transition-all active:scale-95 shadow-sm
        ${!hasBg ? 'bg-white border border-border active:bg-slate-50' : ''}
        ${!hasTextCol ? 'text-base-text' : ''}
        ${className}`}
    >
      {children}
    </button>
  );
}
