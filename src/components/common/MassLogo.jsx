import React from 'react';

export default function MassLogo({ size = 'md', className = '' }) {
  const sizeClasses = {
    sm: { text: '28px', triangle: 10, gap: '1px' },
    md: { text: '48px', triangle: 16, gap: '2px' },
    lg: { text: '72px', triangle: 24, gap: '3px' },
    xl: { text: '96px', triangle: 32, gap: '4px' },
  };

  const s = sizeClasses[size] || sizeClasses.md;

  return (
    <div className={`flex items-center ${className}`} style={{ fontFamily: "'Arial Black', 'Impact', sans-serif", fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1 }}>
      {/* M */}
      <span style={{ color: '#FFFFFF', fontSize: s.text }}>M</span>
      {/* A with yellow triangle replacing the inner peak */}
      <span style={{ position: 'relative', color: '#FFFFFF', fontSize: s.text }}>
        A
        {/* Yellow triangle overlay on the A's crossbar/peak area */}
        <span style={{
          position: 'absolute',
          bottom: '30%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 0,
          height: 0,
          borderLeft: `${s.triangle}px solid transparent`,
          borderRight: `${s.triangle}px solid transparent`,
          borderBottom: `${s.triangle * 1.4}px solid #FFBB28`,
          display: 'block',
          pointerEvents: 'none',
        }} />
      </span>
      {/* SS in white */}
      <span style={{ color: '#FFFFFF', fontSize: s.text }}>SS</span>
    </div>
  );
}