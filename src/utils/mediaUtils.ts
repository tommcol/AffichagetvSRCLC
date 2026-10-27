// Registre des URLs Blob associées à des vidéos
const videoBlobUrls = new Set<string>();

/**
 * Enregistre une URL blob comme étant une vidéo
 */
export function registerVideoBlob(url: string): void {
  if (url && (url.startsWith('blob:') || url.startsWith('indexeddb:'))) {
    videoBlobUrls.add(url);
  }
}

/**
 * Helper to check if a media URL or filename corresponds to a video format
 */
export function isVideoMedia(url?: string | null): boolean {
  if (!url) return false;
  if (typeof url !== 'string') return false;
  if (url.startsWith('data:video/')) return true;
  if (videoBlobUrls.has(url)) return true;
  if (/\.(mp4|webm|mov|ogg|m4v|mkv|avi|3gp)(\?.*)?$/i.test(url)) return true;
  return false;
}


