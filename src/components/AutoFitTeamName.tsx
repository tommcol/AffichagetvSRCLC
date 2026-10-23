import React, { useLayoutEffect, useRef } from 'react';
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
  const fittingRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const container = fittingRef.current;
    const text = container?.querySelector('span');
    if (!container || !text) return;
    let cancelled = false;
    const fit = () => {
      if (cancelled || !container.clientWidth || !container.clientHeight) return;
      let low = 8, high = Math.max(8, pillHeight ? pillHeight * .85 : 64);
      for (let i = 0; i < 10; i++) {
        const mid = (low + high) / 2;
        text.style.fontSize = `${mid}px`;
        if (text.scrollWidth <= container.clientWidth - 32 && text.scrollHeight <= container.clientHeight - 8) low = mid;
        else high = mid;
      }
      text.style.fontSize = `${Math.floor(low)}px`;
    };
    fit(); void document.fonts.ready.then(fit);
    const observer = new ResizeObserver(fit); observer.observe(container);
    return () => { cancelled = true; observer.disconnect(); };
  }, [name, pillHeight, count, aspectRatio, fontHeader]);
  const originalName = (name || '').trim();
  const formattedName = formatTeamNameForBadge(originalName);
  const len = formattedName.length;

  if (isExempt || originalName.toLowerCase() === 'exempt') {
    return (
      <div ref={fittingRef} className="w-full h-full flex items-center justify-center text-center px-4 pointer-events-none select-none">
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
  // Regle : le texte remplit au maximum la pastille SANS JAMAIS la deborder.
  // Double contrainte : hauteur (lignes x interligne) et largeur estimee de la pastille.
  const sizeFromPillHeight = (h: number, nameLength: number): { fontSize: number; lineHeight: string } => {
    const canvasWidth = aspectRatio === '16:9' ? 1920 : 1080;
    // Largeur estimee d'une demi-pastille (les 2 pastilles partagent la largeur de la carte autour de la pastille centrale)
    const estPillWidth = Math.round(canvasWidth * 0.32);
    const availH = Math.max(24, h - 12); // marge verticale de securite
    const lines = nameLength <= 8 ? 1 : 2;
    const lh = lines === 1 ? 1.0 : 0.95;
    // Contrainte verticale : toutes les lignes doivent tenir dans la hauteur disponible
    let fs = availH / (lines * lh);
    // Contrainte horizontale : les caracteres d'une ligne doivent tenir dans la largeur estimee
    const charsPerLine = Math.ceil(nameLength / lines);
    const fsWidth = (estPillWidth * 0.9) / (0.62 * charsPerLine);
    fs = Math.min(fs, fsWidth);
    return { fontSize: Math.max(14, Math.floor(fs)), lineHeight: String(lh) };
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
    <div ref={fittingRef} className="w-full h-full flex items-center justify-center text-center px-4 pointer-events-none select-none">
      <span
        className={`${getFontFamilyClass(fontHeader)} font-black text-center uppercase tracking-tight block max-w-full drop-shadow-sm`}
        style={{
          fontSize,
          lineHeight,
          color: textColor,
          wordBreak: 'break-word',
          overflowWrap: 'anywhere',
          maxHeight: 'none',
          display: 'block',
          overflow: 'visible',
        }}
        title={originalName}
      >
        {formattedName}
      </span>
    </div>
  );
};
