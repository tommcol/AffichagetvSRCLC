import React from 'react';
import { FontFamilyOption } from '../types';
import { getFontFamilyClass } from '../utils/fontUtils';
import { formatTeamNameForBadge } from '../utils/posterFormattingHelpers';
import { PosterAspectRatio } from '../utils/posterExporter';

/**
 * Component that dynamically adapts the font size and line height
 * according to the exact length of the team name, preventing any clipping or tiny text inside pastilles.
 */
export const AutoFitTeamName: React.FC<{
  name: string;
  isExempt?: boolean;
  isCompact?: boolean;
  pillHeight?: number; // Hauteur reelle de la pastille en px : si fournie, le texte est dimensionne pour occuper presque tout l'espace
  count?: number;
  aspectRatio?: PosterAspectRatio;
  fontHeader?: FontFamilyOption;
  textColor?: string;
}> = ({ name, isExempt, isCompact, pillHeight, count = 4, aspectRatio, fontHeader, textColor = '#ffffff' }) => {
  const originalName = (name || '').trim();
  const formattedName = formatTeamNameForBadge(originalName);
  const len = formattedName.length;

  if (isExempt || originalName.toLowerCase() === 'exempt') {
    return (
      <div className="w-full h-full flex items-center justify-center text-center px-4 pointer-events-none select-none">
        <span
          className={`font-montserrat font-black text-white uppercase tracking-wider drop-shadow-sm ${
            count >= 6 || aspectRatio === '16:9' ? 'text-[28px]' : count >= 5 ? 'text-[32px]' : 'text-[36px]'
          }`}
          style={{ lineHeight: 1.1, fontSize: pillHeight ? Math.round(pillHeight * 0.5) + 'px' : undefined }}
        >
          Exempt
        </span>
      </div>
    );
  }

  // Dynamic font sizing optimized for high legibility in 1080p pastilles
  const compactMode = isCompact || count >= 6 || (aspectRatio === '16:9' && count >= 3);
  // Dimensionnement base sur la hauteur reelle de la pastille : le texte remplit presque toute la pastille
  const sizeFromPillHeight = (h: number, nameLength: number): { fontSize: number; lineHeight: string } => {
    if (nameLength <= 10) return { fontSize: Math.round(h * 0.72), lineHeight: '1.0' };
    if (nameLength <= 16) return { fontSize: Math.round(h * 0.62), lineHeight: '1.0' };
    if (nameLength <= 22) return { fontSize: Math.round(h * 0.53), lineHeight: '0.98' };
    if (nameLength <= 28) return { fontSize: Math.round(h * 0.46), lineHeight: '0.96' };
    return { fontSize: Math.round(h * 0.42), lineHeight: '0.94' };
  };

  let fontSize = '36px';
  let lineHeight = '1.05';
  let maxHeight = '90px';

  if (pillHeight && pillHeight > 0) {
    const fitted = sizeFromPillHeight(pillHeight, len);
    fontSize = fitted.fontSize + 'px';
    lineHeight = fitted.lineHeight;
    maxHeight = Math.max(20, Math.round(pillHeight - 6)) + 'px';
  } else if (compactMode) {
    if (len <= 10) {
      fontSize = '34px';
      lineHeight = '1.1';
    } else if (len <= 16) {
      fontSize = '30px';
      lineHeight = '1.05';
    } else if (len <= 22) {
      fontSize = '27px';
      lineHeight = '1.0';
    } else if (len <= 28) {
      fontSize = '25px';
      lineHeight = '0.98';
    } else {
      fontSize = '23px';
      lineHeight = '0.95';
    }
    maxHeight = '78px';
  } else if (count === 5) {
    if (len <= 10) {
      fontSize = '37px';
      lineHeight = '1.12';
    } else if (len <= 16) {
      fontSize = '33px';
      lineHeight = '1.08';
    } else if (len <= 22) {
      fontSize = '29px';
      lineHeight = '1.02';
    } else if (len <= 28) {
      fontSize = '27px';
      lineHeight = '0.98';
    } else {
      fontSize = '24px';
      lineHeight = '0.95';
    }
    maxHeight = '84px';
  } else {
    // 1 to 4 matches
    if (len <= 10) {
      fontSize = '42px';
      lineHeight = '1.15';
    } else if (len <= 16) {
      fontSize = '36px';
      lineHeight = '1.1';
    } else if (len <= 22) {
      fontSize = '32px';
      lineHeight = '1.05';
    } else if (len <= 28) {
      fontSize = '28px';
      lineHeight = '1.0';
    } else {
      fontSize = '25px';
      lineHeight = '0.95';
    }
    maxHeight = '96px';
  }

  return (
    <div className="w-full h-full flex items-center justify-center text-center px-4 pointer-events-none select-none">
      <span
        className={`${getFontFamilyClass(fontHeader)} font-black text-center uppercase tracking-tight block max-w-full drop-shadow-sm`}
        style={{
          fontSize,
          lineHeight,
          color: textColor,
          wordBreak: 'break-word',
          overflowWrap: 'break-word',
          maxHeight,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
        title={originalName}
      >
        {formattedName}
      </span>
    </div>
  );
};
