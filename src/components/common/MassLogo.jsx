import React from 'react';

export default function MassLogo({ className = '', textSize = 'text-2xl' }) {
  return (
    <span className={`font-black tracking-tight ${textSize} ${className}`} style={{ fontFamily: 'inherit', letterSpacing: '-0.02em' }}>
      <span style={{ color: 'inherit' }}>MAS</span>
      <span style={{ color: '#FFBB28' }}>S</span>
    </span>
  );
}