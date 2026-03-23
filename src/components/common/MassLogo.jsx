import React from 'react';

// Logo URLs
const LOGO_DARK_BG = 'https://media.base44.com/images/public/698ba23f75eb60d9d1b501ef/ee47f0827_8b56e61b1_generated_image.png'; // negro fondo
const LOGO_YELLOW_BG = 'https://media.base44.com/images/public/698ba23f75eb60d9d1b501ef/2ae1a2532_b9ed03867_generated_image.png'; // amarillo fondo
const LOGO_WHITE_BG = 'https://media.base44.com/images/public/698ba23f75eb60d9d1b501ef/eed77ca4f_Diseosinttulo20.png'; // blanco fondo (solo MASS)
const LOGO_BLACK_FONDO_BLANCO = 'https://media.base44.com/images/public/698ba23f75eb60d9d1b501ef/eed77ca4f_Diseosinttulo20.png'; // MASS negro/amarillo

export default function MassLogo({ size = 'md', variant = 'auto', className = '' }) {
  const sizeMap = {
    sm: { height: '36px' },
    md: { height: '52px' },
    lg: { height: '72px' },
    xl: { height: '96px' },
  };

  const h = (sizeMap[size] || sizeMap.md).height;

  // variant: 'dark' = para fondos oscuros (letras blancas), 'light' = para fondos claros (letras negras), 'yellow' = fondo amarillo
  // 'auto' usa dark por defecto
  let src = LOGO_DARK_BG;
  if (variant === 'light') src = LOGO_WHITE_BG;
  else if (variant === 'yellow') src = LOGO_YELLOW_BG;
  else src = LOGO_DARK_BG;

  return (
    <img
      src={src}
      alt="Mass Soluciones"
      className={className}
      style={{ height: h, width: 'auto', objectFit: 'contain' }}
    />
  );
}