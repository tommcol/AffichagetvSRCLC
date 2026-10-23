import { toPng, toJpeg, toCanvas, getFontEmbedCSS } from 'html-to-image';

export type PosterAspectRatio = '4:5' | '9:16' | '1:1' | '16:9';

/**
 * Dimensions logiques fixes natives pour chaque format d'affiche (haute définition 1080p).
 * Ces dimensions constituent la référence universelle unique sur PC, Android, iPhone et tablette.
 */
export const POSTER_DIMENSIONS: Record<PosterAspectRatio, { width: number; height: number }> = {
  '4:5':  { width: 1080, height: 1350 },
  '1:1':  { width: 1080, height: 1080 },
  '9:16': { width: 1080, height: 1920 },
  '16:9': { width: 1920, height: 1080 },
};

const TRANSPARENT_IMAGE_FALLBACK =
  'data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>';

/**
 * Bulletproof multi-stage exporter for HTML DOM elements to high-resolution data URLs.
 * Handles mobile browsers, webview sandboxes, and bypasses CORS/font issues gracefully.
 * Renders at exact logical document dimensions (1080p) without preview scale distortion.
 */
export async function safeExportPosterToDataUrl(
  node: HTMLElement,
  aspectRatio: PosterAspectRatio = '4:5',
  targetQuality = 0.98,
  targetRatio = 1
): Promise<string> {
  const dims = POSTER_DIMENSIONS[aspectRatio] || { width: 1080, height: 1350 };
  const targetWidth = dims.width;
  const targetHeight = dims.height;

  await document.fonts.ready;
  await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
  await Promise.all(Array.from(node.querySelectorAll('img')).map(async image => {
    if (!image.complete) await image.decode();
    if (!image.naturalWidth) throw new Error('Une image de l’aperçu ne peut pas être chargée.');
  }));
  const fontEmbedCSS = await getFontEmbedCSS(node, { preferredFontFormat: 'woff2' });
  if (/url\(["']?https?:/i.test(fontEmbedCSS)) throw new Error('Une police n’a pas pu être intégrée au PNG.');
  const baseOptions = {
    cacheBust: false,
    skipFonts: false,
    fontEmbedCSS,
    width: targetWidth,
    height: targetHeight,
    pixelRatio: targetRatio,
    quality: targetQuality,
    imagePlaceholder: TRANSPARENT_IMAGE_FALLBACK,
    style: {
      transform: 'none',
      transformOrigin: 'top left',
      position: 'static',
      left: '0px',
      top: '0px',
      margin: '0px',
    },
    fetchRequestInit: {
      mode: 'cors' as RequestMode,
      cache: 'force-cache' as RequestCache,
    },
  };

  // Stage 1: High quality PNG with skipFonts (avoids Google Fonts woff2 cors crashes)
  try {
    return await toPng(node, baseOptions);
  } catch (err1) {
    console.warn('Tentative 1 export PNG haute résolution échouée, tentative 2...', err1);
  }

  // Stage 2: Balanced pixelRatio PNG
  try {
    return await toPng(node, {
      ...baseOptions,
      quality: 0.95,
    });
  } catch (err2) {
    console.warn('Tentative 2 export PNG équilibré échouée, tentative 3 avec toCanvas...', err2);
  }

  // Stage 3: toCanvas
  try {
    const canvas = await toCanvas(node, baseOptions);
    return canvas.toDataURL('image/png');
  } catch (err3) {
    console.warn('Tentative 3 export toCanvas échouée, tentative 4 avec toJpeg...', err3);
  }

  throw new Error('Impossible de produire un PNG fidèle à l’aperçu. Vérifiez le chargement des polices et des images.');
}
