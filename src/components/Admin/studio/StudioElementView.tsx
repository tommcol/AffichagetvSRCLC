import React from 'react';
import { StudioElement } from '../../../types';
import { getFontFamilyClass } from '../../../utils/fontUtils';

// Dessine un élément d'un template du Studio (rond, pastille, étoile, trait, texte…).
// Les tailles de police sont exprimées en % de la hauteur de l'élément lui-même (cqh),
// ce qui permet à une ligne de match de rétrécir ou grandir sans casser le texte.

export interface StudioElementViewProps {
  element: StudioElement;
  selected?: boolean;
  interactive?: boolean;
  onPointerDown?: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerMove?: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp?: (e: React.PointerEvent<HTMLDivElement>) => void;
  // Texte à afficher à la place du texte du template (données réelles ou exemples)
  textOverride?: string;
  imageUrl?: string;
}

const STAR_POINTS = '50,3 61,37 97,37 68,58 79,93 50,72 21,93 32,58 3,37 39,37';

export function StudioElementView({
  element,
  selected = false,
  interactive = false,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  textOverride,
  imageUrl,
}: StudioElementViewProps) {
  if (!element.visible && !interactive) return null;

  const hasBorder = element.strokeWidth > 0 && element.shape !== 'line' && element.shape !== 'star';
  const isStar = element.shape === 'star';
  const isText = element.shape === 'text';

  let borderRadius = '0';
  if (element.shape === 'rounded') borderRadius = '14% / 30%';
  if (element.shape === 'pill' || element.shape === 'line') borderRadius = '9999px';
  if (element.shape === 'circle') borderRadius = '50%';

  const content = textOverride ?? element.text;

  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${element.x}%`,
    top: `${element.y}%`,
    width: `${element.w}%`,
    height: `${element.h}%`,
    transform: `rotate(${element.rotation}deg)`,
    opacity: element.visible ? element.opacity : Math.min(0.25, element.opacity),
    containerType: 'size',
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    cursor: interactive ? 'move' : 'default',
    touchAction: 'none',
    userSelect: 'none',
    outline: selected ? '2px solid #38bdf8' : 'none',
    outlineOffset: selected ? '2px' : 0,
  };

  if (!isStar && !isText) {
    style.background = element.fill;
    style.borderRadius = borderRadius;
  }
  if (hasBorder) {
    style.border = `${element.strokeWidth / 10}cqmin solid ${element.stroke}`;
  }
  if (element.shadow && !isText) {
    style.boxShadow = '0 0.8cqmin 1.6cqmin rgba(0,0,0,0.45)';
  }

  return (
    <div
      style={style}
      onPointerDown={interactive ? onPointerDown : undefined}
      onPointerMove={interactive ? onPointerMove : undefined}
      onPointerUp={interactive ? onPointerUp : undefined}
      title={interactive ? element.name : undefined}
    >
      {isStar && (
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}
        >
          <polygon
            points={STAR_POINTS}
            fill={element.fill}
            stroke={element.strokeWidth > 0 ? element.stroke : 'none'}
            strokeWidth={element.strokeWidth / 2}
            strokeLinejoin="round"
            style={element.shadow ? { filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.45))' } : undefined}
          />
        </svg>
      )}
      {imageUrl && <img src={imageUrl} alt="Logo du club" draggable={false}
        className="absolute inset-0 h-full w-full object-contain" />}
      {!imageUrl && content && element.shape !== 'line' && (
        <span
          className={getFontFamilyClass(element.fontFamily)}
          style={{
            position: 'relative',
            color: element.textColor,
            fontSize: `${element.fontSize}cqh`,
            lineHeight: 1,
            padding: '0 4%',
            maxWidth: '100%',
            overflow: 'hidden',
            whiteSpace: 'pre-line',
            wordBreak: 'break-word',
          }}
        >
          {content}
        </span>
      )}
    </div>
  );
}
