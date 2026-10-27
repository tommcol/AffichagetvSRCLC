import { FontFamilyOption } from '../types';

export interface FontDefinition {
  id: FontFamilyOption;
  name: string;
  category: 'Sport Impact' | 'Chiffres & Scores' | 'Moderne & Pro' | 'Festif & Urbain';
  sampleText: string;
  className: string;
}

export const AVAILABLE_FONTS: FontDefinition[] = [
  { id: 'Bebas Neue', name: 'Bebas Neue', category: 'Sport Impact', sampleText: 'MATCHS DU CLUB', className: 'font-bebas tracking-wide' },
  { id: 'Teko', name: 'Teko', category: 'Chiffres & Scores', sampleText: '84 : 76', className: 'font-teko tracking-wider' },
  { id: 'Montserrat', name: 'Montserrat', category: 'Moderne & Pro', sampleText: 'BASKET BALL', className: 'font-montserrat font-black' },
  { id: 'Outfit', name: 'Outfit', category: 'Moderne & Pro', sampleText: 'CHAMPIONNAT', className: 'font-outfit font-bold' },
  { id: 'Oswald', name: 'Oswald', category: 'Sport Impact', sampleText: 'CHAMPIONS REGION', className: 'font-oswald font-bold' },
  { id: 'Anton', name: 'Anton', category: 'Sport Impact', sampleText: 'VICTOIRE 92-80', className: 'font-anton' },
  { id: 'Russo One', name: 'Russo One', category: 'Sport Impact', sampleText: 'POWER BASKET', className: 'font-russo' },
  { id: 'Kanit', name: 'Kanit', category: 'Moderne & Pro', sampleText: 'SAISON 2026', className: 'font-kanit font-black' },
  { id: 'Poppins', name: 'Poppins', category: 'Festif & Urbain', sampleText: 'ANNIVERSAIRES', className: 'font-poppins font-bold' },
  { id: 'Changa', name: 'Changa', category: 'Sport Impact', sampleText: 'PLAYOFFS ELITE', className: 'font-changa font-black' },
  { id: 'Fredoka', name: 'Fredoka', category: 'Festif & Urbain', sampleText: 'BON ANNIVERSAIRE', className: 'font-fredoka font-bold' },
  { id: 'Permanent Marker', name: 'Permanent Marker', category: 'Festif & Urbain', sampleText: 'STREET BASKET', className: 'font-marker' },
];

export const getFontFamilyClass = (font?: FontFamilyOption): string => {
  const match = AVAILABLE_FONTS.find((f) => f.id === font);
  return match ? match.className : 'font-outfit font-bold';
};

// Global cache for inlined font CSS used in html-to-image (to avoid cross-origin sheet.cssRules errors)
let cachedFontEmbedCSS: string | null = null;

export const getExportFontEmbedCSS = async (): Promise<string> => {
  if (cachedFontEmbedCSS !== null) {
    return cachedFontEmbedCSS;
  }

  try {
    const linkEl = typeof document !== 'undefined'
      ? document.querySelector<HTMLLinkElement>('link[href*="fonts.googleapis.com"]')
      : null;
    const fontUrl = linkEl?.href ||
      'https://fonts.googleapis.com/css2?family=Anton&family=Bebas+Neue&family=Changa:wght@600;700;800&family=Fredoka:wght@600;700&family=Kanit:wght@600;700;800;900&family=Montserrat:wght@700;800;900&family=Oswald:wght@500;600;700&family=Outfit:wght@400;500;600;700;800;900&family=Permanent+Marker&family=Poppins:wght@600;700;800;900&family=Russo+One&family=Teko:wght@600;700&display=swap';

    const res = await fetch(fontUrl);
    if (res.ok) {
      cachedFontEmbedCSS = await res.text();
      return cachedFontEmbedCSS;
    }
  } catch (err) {
    console.warn('Google Fonts prefetch notice for exporter:', err);
  }

  // Fallback to empty string to ensure html-to-image does not crawl document.styleSheets
  cachedFontEmbedCSS = '';
  return cachedFontEmbedCSS;
};
