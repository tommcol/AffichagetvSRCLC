import { toPng, getFontEmbedCSS } from 'html-to-image';

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

// Copy the painted document synchronously, before fonts or images are fetched.
// React can then unmount the editor without changing the document being exported.
function capturePoster(node: HTMLElement, width: number, height: number) {
  const clone = node.cloneNode(true) as HTMLElement;
  const originals = [node, ...Array.from(node.querySelectorAll('*'))];
  const copies = [clone, ...Array.from(clone.querySelectorAll('*'))];
  originals.forEach((original, index) => {
    const copy = copies[index] as HTMLElement;
    if (!copy.style) return;
    const style = getComputedStyle(original);
    for (const property of Array.from(style)) {
      copy.style.setProperty(property, style.getPropertyValue(property));
    }
    if (original instanceof HTMLImageElement) copy.setAttribute('src', original.currentSrc || original.src);
    if (original instanceof HTMLVideoElement) {
      if (original.readyState < 2 || !original.videoWidth) throw new Error('Une vidéo de l’aperçu n’est pas encore chargée. Attendez sa lecture avant de télécharger.');
      const canvas = document.createElement('canvas');
      canvas.width = original.videoWidth;
      canvas.height = original.videoHeight;
      canvas.getContext('2d')!.drawImage(original, 0, 0);
      const frame = document.createElement('img');
      frame.src = canvas.toDataURL('image/png');
      frame.alt = original.getAttribute('aria-label') || 'Image de la vidéo';
      frame.style.cssText = copy.style.cssText;
      copy.replaceWith(frame);
    }
  });
  const host = document.createElement('div');
  host.style.cssText = `position:fixed;left:-100000px;top:0;width:${width}px;height:${height}px;pointer-events:none;`;
  host.setAttribute('aria-hidden', 'true');
  Object.assign(clone.style, { width: `${width}px`, height: `${height}px`, transform: 'none', margin: '0', position: 'relative', left: '0', top: '0' });
  host.appendChild(clone);
  document.body.appendChild(host);
  return { clone, dispose: () => host.remove() };
}

/**
 * Export a stable document at its logical dimensions, with embedded fonts.
 * Fail visibly when a required resource is unavailable instead of returning a partial image.
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

  const snapshot = capturePoster(node, targetWidth, targetHeight);
  try {
    node = snapshot.clone;
    await document.fonts.ready;
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
    await Promise.all(Array.from(node.querySelectorAll('img')).map(async image => {
      if (!image.complete) await image.decode();
      if (!image.naturalWidth) throw new Error('Une image de l’aperçu ne peut pas être chargée.');
    }));
    const fontEmbedCSS = await getFontEmbedCSS(node);
    if (/url\(["']?https?:/i.test(fontEmbedCSS) || /url\(["']?["']?\s*\)/i.test(fontEmbedCSS)) throw new Error('Une police n’a pas pu être intégrée au PNG. Réessayez lorsque la connexion est disponible.');
    const baseOptions = {
      cacheBust: false,
      skipFonts: false,
      fontEmbedCSS,
      width: targetWidth,
      height: targetHeight,
      pixelRatio: targetRatio,
      quality: targetQuality,
      style: {
        transform: 'none',
        transformOrigin: 'top left',
        position: 'relative',
        left: '0px',
        top: '0px',
        margin: '0px',
      },
      fetchRequestInit: {
        mode: 'cors' as RequestMode,
        cache: 'force-cache' as RequestCache,
      },
    };

    return await toPng(node, baseOptions);
  } finally {
    snapshot.dispose();
  }
}
