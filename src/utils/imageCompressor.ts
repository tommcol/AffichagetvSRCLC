/**
 * Utilitaire d'optimisation et compression d'images côté client
 * Réduit la taille des photos (ex: 10 Mo -> 150 Ko) pour un chargement instantané sur TV
 * et une sauvegarde fiable sans saturer Cloudflare KV.
 */
export async function compressImageFile(
  file: File,
  maxWidth = 1920,
  maxHeight = 1080,
  quality = 0.85
): Promise<string> {
  // SVG ou types non compressibles par canvas
  if (file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg')) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve((e.target?.result as string) || '');
      reader.onerror = () => resolve(URL.createObjectURL(file));
      reader.readAsDataURL(file);
    });
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;

        // Calcul des dimensions proportionnelles
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve((e.target?.result as string) || '');
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Export en WebP (ou JPEG si non supporté) avec compression
        try {
          const compressed = canvas.toDataURL('image/webp', quality);
          resolve(compressed);
        } catch {
          const compressedJpeg = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedJpeg);
        }
      };
      img.onerror = () => {
        resolve((e.target?.result as string) || '');
      };
      img.src = (e.target?.result as string) || '';
    };
    reader.onerror = () => {
      resolve(URL.createObjectURL(file));
    };
    reader.readAsDataURL(file);
  });
}
