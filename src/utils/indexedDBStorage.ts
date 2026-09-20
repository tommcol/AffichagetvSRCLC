/**
 * Service de stockage local persistant IndexedDB pour les fichiers multimédias (images & vidéos).
 * Permet de conserver les vidéos MP4/WebM téléversées en local même après rafraîchissement
 * de la page ou réouverture du navigateur sur la TV du gymnase.
 */

import { registerVideoBlob } from './mediaUtils';

const DB_NAME = 'affichage_tv_media_db';
const STORE_NAME = 'media_files';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        return reject(new Error('IndexedDB non disponible'));
      }
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbPromise;
}

/**
 * Enregistre un fichier média (vidéo ou image) dans IndexedDB
 * et retourne un ObjectURL actif tout en l'enregistrant auprès du registre vidéo.
 */
export async function saveMediaBlob(key: string, file: Blob | File): Promise<string> {
  try {
    const db = await getDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(file, key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });

    const isVideo = file.type.startsWith('video') || (file instanceof File && /\.(mp4|webm|mov|m4v)$/i.test(file.name));
    const url = URL.createObjectURL(file);
    if (isVideo) {
      registerVideoBlob(url);
    }
    return url;
  } catch (err) {
    console.warn('Erreur lors de la sauvegarde du média dans IndexedDB:', err);
    const url = URL.createObjectURL(file);
    if (file.type.startsWith('video')) registerVideoBlob(url);
    return url;
  }
}

/**
 * Récupère un fichier média depuis IndexedDB et génère une URL Blob valide
 */
export async function getMediaBlobUrl(key: string): Promise<string | null> {
  try {
    const db = await getDB();
    const blob = await new Promise<Blob | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });

    if (!blob) return null;
    const isVideo = blob.type.startsWith('video');
    const url = URL.createObjectURL(blob);
    if (isVideo) {
      registerVideoBlob(url);
    }
    return url;
  } catch (err) {
    console.warn('Erreur récupération média IndexedDB:', err);
    return null;
  }
}

/**
 * Supprime un média d'IndexedDB
 */
export async function deleteMediaBlob(key: string): Promise<void> {
  try {
    const db = await getDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Erreur suppression média IndexedDB:', err);
  }
}
