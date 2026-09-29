import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { Muxer, ArrayBufferTarget } from 'mp4-muxer';
import * as htmlToImage from 'html-to-image';
import {
  CarouselSlide,
  ClubSettings,
  MatchItem,
  SponsorItem,
  ClubLogoItem,
  ClubPhotoItem,
  BirthdayItem,
  ClubEventItem,
  TeamVisualItem,
  VisualTemplatesConfig,
} from '../types';
import { TVSlideRenderer } from '../components/slides/TVSlideRenderer';
import { isVideoMedia } from './mediaUtils';
import { getEffectiveCategoryConfig } from './themeUtils';

export interface ScheduledSlideItem {
  index: number;
  slide: CarouselSlide;
  durationSeconds: number;
  title: string;
  categoryName: string;
  categoryId: string;
  hasVideo: boolean;
  mediaTypes: {
    background?: 'image' | 'video' | 'none';
    mainMedia?: 'image' | 'video' | 'none';
    layer3?: 'image' | 'video' | 'none';
    layer4?: 'image' | 'video' | 'none';
    mascot?: 'image' | 'video' | 'none';
  };
}

export interface ExportProgress {
  status: 'validating' | 'preparing' | 'rendering' | 'finalizing' | 'completed' | 'error';
  currentSlideIndex: number;
  totalSlides: number;
  currentFrame: number;
  totalFrames: number;
  percent: number;
  currentSlideTitle: string;
  statusMessage: string;
  estimatedRemainingSeconds?: number;
  error?: string;
}

export interface ExportResult {
  blob: Blob;
  durationSeconds: number;
  actualMeasuredDuration: number;
  totalFrames: number;
  filename: string;
  fileSizeMb: number;
  motionVerified: boolean;
}

export interface ExportOptions {
  fps?: number;
  bitrate?: number;
  onProgress?: (progress: ExportProgress) => void;
  signal?: AbortSignal;
}

/**
 * Calcule la planification exacte de la boucle TV avec les durées réelles configurées
 */
export function calculateCarouselSchedule(
  playlist: CarouselSlide[],
  clubSettings: ClubSettings,
  visualTemplates?: VisualTemplatesConfig
): {
  items: ScheduledSlideItem[];
  totalDurationSeconds: number;
  totalSlides: number;
} {
  const defaultSlideDuration = 12;

  const items: ScheduledSlideItem[] = playlist.map((slide, idx) => {
    const duration =
      slide.durationSeconds && slide.durationSeconds > 0
        ? slide.durationSeconds
        : defaultSlideDuration;

    let categoryName = 'Diapositive';
    let categoryId = 'unknown';
    let title = slide.label || 'Diapositive TV';
    const mediaTypes: ScheduledSlideItem['mediaTypes'] = {};
    let hasVideo = false;

    if (slide.type === 'alert') {
      categoryId = 'alert';
      categoryName = 'Alerte Match';
      title = slide.alert?.team ? `Résultat • ${slide.alert.team}` : 'Alerte Match';
      if (slide.alert?.customImageUrl) {
        const isVid = isVideoMedia(slide.alert.customImageUrl);
        mediaTypes.background = isVid ? 'video' : 'image';
        if (isVid) hasVideo = true;
      }
    } else if (slide.type === 'category') {
      categoryId = slide.categoryId;
      switch (slide.categoryId) {
        case 'photos': {
          categoryName = 'Photos du Club';
          title = slide.photo?.title || 'Photo Club';
          if (slide.photo?.imageUrl) {
            const isVid = isVideoMedia(slide.photo.imageUrl);
            mediaTypes.mainMedia = isVid ? 'video' : 'image';
            if (isVid) hasVideo = true;
          }
          break;
        }
        case 'sponsors': {
          categoryName = 'Sponsors & Partenaires';
          title = slide.sponsor?.name ? `Sponsor • ${slide.sponsor.name}` : 'Partenaire du Club';
          if (slide.sponsor?.logoUrl) {
            const isVid = isVideoMedia(slide.sponsor.logoUrl);
            mediaTypes.mainMedia = isVid ? 'video' : 'image';
            if (isVid) hasVideo = true;
          }
          break;
        }
        case 'logos': {
          categoryName = 'Logos & Partenaires';
          title = slide.logo?.name || 'Logo Partenaire';
          if (slide.logo?.logoUrl) {
            const isVid = isVideoMedia(slide.logo.logoUrl);
            mediaTypes.mainMedia = isVid ? 'video' : 'image';
            if (isVid) hasVideo = true;
          }
          break;
        }
        case 'matches': {
          categoryName = 'Matchs du Week-end';
          title =
            slide.customTitle ||
            (slide.filterScope === 'home'
              ? 'Matchs à Domicile'
              : slide.filterScope === 'away'
              ? "Matchs à l'Extérieur"
              : 'Rencontres du Week-end');
          const eff = getEffectiveCategoryConfig('matches', visualTemplates, clubSettings);
          if (eff.backgroundUrl) {
            const isVid =
              eff.categoryTheme?.backgroundMediaType === 'video' ||
              isVideoMedia(eff.backgroundUrl);
            mediaTypes.background = isVid ? 'video' : 'image';
            if (isVid) hasVideo = true;
          }
          if (eff.layer3?.enabled && eff.layer3.mediaUrl) {
            const isVid = eff.layer3.mediaType === 'video' || isVideoMedia(eff.layer3.mediaUrl);
            mediaTypes.layer3 = isVid ? 'video' : 'image';
            if (isVid) hasVideo = true;
          }
          if (eff.layer4?.enabled && eff.layer4.mediaUrl) {
            const isVid = eff.layer4.mediaType === 'video' || isVideoMedia(eff.layer4.mediaUrl);
            mediaTypes.layer4 = isVid ? 'video' : 'image';
            if (isVid) hasVideo = true;
          }
          break;
        }
        case 'results': {
          categoryName = 'Résultats';
          title =
            slide.customTitle ||
            (slide.filterScope === 'home'
              ? 'Résultats à Domicile'
              : slide.filterScope === 'away'
              ? "Résultats à l'Extérieur"
              : 'Résultats du Week-end');
          const eff = getEffectiveCategoryConfig('results', visualTemplates, clubSettings);
          if (eff.backgroundUrl) {
            const isVid =
              eff.categoryTheme?.backgroundMediaType === 'video' ||
              isVideoMedia(eff.backgroundUrl);
            mediaTypes.background = isVid ? 'video' : 'image';
            if (isVid) hasVideo = true;
          }
          if (eff.layer3?.enabled && eff.layer3.mediaUrl) {
            const isVid = eff.layer3.mediaType === 'video' || isVideoMedia(eff.layer3.mediaUrl);
            mediaTypes.layer3 = isVid ? 'video' : 'image';
            if (isVid) hasVideo = true;
          }
          if (eff.layer4?.enabled && eff.layer4.mediaUrl) {
            const isVid = eff.layer4.mediaType === 'video' || isVideoMedia(eff.layer4.mediaUrl);
            mediaTypes.layer4 = isVid ? 'video' : 'image';
            if (isVid) hasVideo = true;
          }
          break;
        }
        case 'birthdays': {
          categoryName = 'Anniversaires';
          title = 'Anniversaires de la Semaine';
          const eff = getEffectiveCategoryConfig('birthdays', visualTemplates, clubSettings);
          if (eff.backgroundUrl) {
            const isVid =
              eff.categoryTheme?.backgroundMediaType === 'video' ||
              isVideoMedia(eff.backgroundUrl);
            mediaTypes.background = isVid ? 'video' : 'image';
            if (isVid) hasVideo = true;
          }
          if (eff.layer3?.enabled && eff.layer3.mediaUrl) {
            const isVid = eff.layer3.mediaType === 'video' || isVideoMedia(eff.layer3.mediaUrl);
            mediaTypes.layer3 = isVid ? 'video' : 'image';
            if (isVid) hasVideo = true;
          }
          if (eff.layer4?.enabled && eff.layer4.mediaUrl) {
            const isVid = eff.layer4.mediaType === 'video' || isVideoMedia(eff.layer4.mediaUrl);
            mediaTypes.layer4 = isVid ? 'video' : 'image';
            if (isVid) hasVideo = true;
          }
          break;
        }
        case 'events': {
          categoryName = 'Événements';
          title = slide.event?.title || 'Événement Club';
          if (slide.event?.imageUrl) {
            mediaTypes.mainMedia = 'image';
          }
          break;
        }
        case 'standby': {
          categoryName = 'Standby';
          title = clubSettings.name || 'Affichage Club';
          break;
        }
      }
    }

    return {
      index: idx + 1,
      slide,
      durationSeconds: duration,
      title,
      categoryName,
      categoryId,
      hasVideo,
      mediaTypes,
    };
  });

  const totalDurationSeconds = items.reduce((acc, item) => acc + item.durationSeconds, 0);

  return {
    items,
    totalDurationSeconds,
    totalSlides: items.length,
  };
}

/**
 * Valide l'accessibilité d'un média avant d'engager l'encodage
 */
export async function validateMediaItem(
  url: string,
  isVideo: boolean
): Promise<{ ok: boolean; error?: string }> {
  if (!url || !url.trim()) return { ok: true };
  const trimmed = url.trim();

  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return { ok: true };
  }

  if (isVideo) {
    return new Promise((resolve) => {
      const vid = document.createElement('video');
      vid.crossOrigin = 'anonymous';
      vid.muted = true;
      vid.preload = 'metadata';

      const timer = setTimeout(() => {
        cleanup();
        resolve({ ok: false, error: 'Délai de chargement dépassé (Timeout 8s)' });
      }, 8000);

      const onLoaded = () => {
        cleanup();
        resolve({ ok: true });
      };

      const onError = () => {
        cleanup();
        resolve({ ok: false, error: 'Fichier vidéo inaccessible ou bloqué par CORS' });
      };

      const cleanup = () => {
        clearTimeout(timer);
        vid.removeEventListener('loadedmetadata', onLoaded);
        vid.removeEventListener('error', onError);
        vid.removeAttribute('src');
        vid.load();
      };

      vid.addEventListener('loadedmetadata', onLoaded);
      vid.addEventListener('error', onError);
      vid.src = trimmed;
    });
  } else {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      const timer = setTimeout(() => {
        cleanup();
        resolve({ ok: false, error: 'Délai de chargement image dépassé (Timeout 8s)' });
      }, 8000);

      const onLoaded = () => {
        cleanup();
        resolve({ ok: true });
      };

      const onError = () => {
        cleanup();
        resolve({ ok: false, error: 'Image inaccessible ou bloquée par CORS' });
      };

      const cleanup = () => {
        clearTimeout(timer);
        img.removeEventListener('load', onLoaded);
        img.removeEventListener('error', onError);
      };

      img.addEventListener('load', onLoaded);
      img.addEventListener('error', onError);
      img.src = trimmed;
    });
  }
}

/**
 * Valide l'ensemble des médias du carrousel avant d'engager l'encodage
 */
export async function validateCarouselMedia(
  playlist: CarouselSlide[],
  clubSettings: ClubSettings,
  visualTemplates?: VisualTemplatesConfig,
  onProgressMessage?: (msg: string) => void
): Promise<{ ok: boolean; failedMedia: { name: string; url: string; error: string; slideTitle: string }[] }> {
  const failedMedia: { name: string; url: string; error: string; slideTitle: string }[] = [];
  const schedule = calculateCarouselSchedule(playlist, clubSettings, visualTemplates);

  for (const item of schedule.items) {
    onProgressMessage?.(`Vérification des médias : ${item.title}...`);
    const { slide } = item;

    const urlsToTest: { url: string; isVideo: boolean; label: string }[] = [];

    if (slide.type === 'category') {
      if (slide.categoryId === 'photos' && slide.photo?.imageUrl) {
        urlsToTest.push({
          url: slide.photo.imageUrl,
          isVideo: isVideoMedia(slide.photo.imageUrl),
          label: `Photo : ${slide.photo.title || 'Photo Club'}`,
        });
      } else if (slide.categoryId === 'sponsors' && slide.sponsor?.logoUrl) {
        urlsToTest.push({
          url: slide.sponsor.logoUrl,
          isVideo: isVideoMedia(slide.sponsor.logoUrl),
          label: `Sponsor : ${slide.sponsor.name || 'Partenaire'}`,
        });
      } else if (slide.categoryId === 'logos' && slide.logo?.logoUrl) {
        urlsToTest.push({
          url: slide.logo.logoUrl,
          isVideo: isVideoMedia(slide.logo.logoUrl),
          label: `Logo : ${slide.logo.name || 'Logo'}`,
        });
      } else if (['matches', 'results', 'birthdays'].includes(slide.categoryId)) {
        const cat = slide.categoryId as 'matches' | 'results' | 'birthdays';
        const eff = getEffectiveCategoryConfig(cat, visualTemplates, clubSettings);
        if (eff.backgroundUrl) {
          urlsToTest.push({
            url: eff.backgroundUrl,
            isVideo: eff.categoryTheme?.backgroundMediaType === 'video' || isVideoMedia(eff.backgroundUrl),
            label: `Fond Calque 1 (${item.title})`,
          });
        }
        if (eff.layer3?.enabled && eff.layer3.mediaUrl) {
          urlsToTest.push({
            url: eff.layer3.mediaUrl,
            isVideo: eff.layer3.mediaType === 'video' || isVideoMedia(eff.layer3.mediaUrl),
            label: `Calque 3 (${eff.layer3.name || 'Élément 1'})`,
          });
        }
        if (eff.layer4?.enabled && eff.layer4.mediaUrl) {
          urlsToTest.push({
            url: eff.layer4.mediaUrl,
            isVideo: eff.layer4.mediaType === 'video' || isVideoMedia(eff.layer4.mediaUrl),
            label: `Calque 4 (${eff.layer4.name || 'Élément 2'})`,
          });
        }
      }
    }

    for (const u of urlsToTest) {
      const res = await validateMediaItem(u.url, u.isVideo);
      if (!res.ok) {
        failedMedia.push({
          name: u.label,
          url: u.url,
          error: res.error || 'Média introuvable',
          slideTitle: item.title,
        });
      }
    }
  }

  return {
    ok: failedMedia.length === 0,
    failedMedia,
  };
}

/**
 * Positionne et attend de manière STRICTE qu'une image vidéo soit réellement disponible
 * Sans aucun fallback silencieux ni 120ms timeout arbitraire.
 */
export async function seekVideoElement(
  video: HTMLVideoElement,
  targetTime: number,
  mediaName: string = 'Vidéo'
): Promise<void> {
  if (!video) {
    throw new Error(`Élément vidéo introuvable pour "${mediaName}".`);
  }

  const duration = video.duration && isFinite(video.duration) && video.duration > 0 ? video.duration : 1;
  const time = targetTime % duration;

  if (video.error) {
    throw new Error(`Erreur sur la vidéo "${mediaName}" : ${video.error.message || 'Fichier corrompu ou illisible'}`);
  }

  // Si déjà calé et données prêtes
  if (Math.abs(video.currentTime - time) < 0.001 && video.readyState >= 2) {
    return;
  }

  return new Promise<void>((resolve, reject) => {
    let resolved = false;

    const cleanup = () => {
      clearTimeout(timeoutId);
      video.removeEventListener('seeked', onSeeked);
      video.removeEventListener('error', onError);
    };

    const onSeeked = () => {
      if (!resolved) {
        resolved = true;
        cleanup();

        if (video.readyState >= 2) {
          resolve();
        } else {
          // Attendre que la trame soit prête dans le buffer GPU/RAM
          let checkCount = 0;
          const pollReady = () => {
            if (video.readyState >= 2) {
              resolve();
            } else if (checkCount < 30) {
              checkCount++;
              setTimeout(pollReady, 20);
            } else {
              reject(new Error(`L'image de la vidéo "${mediaName}" n'a pas pu être décodée à t=${time.toFixed(2)}s.`));
            }
          };
          pollReady();
        }
      }
    };

    const onError = () => {
      if (!resolved) {
        resolved = true;
        cleanup();
        reject(new Error(`Échec de lecture sur la vidéo "${mediaName}" à t=${time.toFixed(2)}s.`));
      }
    };

    // Délai d'attente généreux de 5000ms avant rejet explicite
    const timeoutId = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        cleanup();
        if (video.readyState >= 2) {
          resolve();
        } else {
          reject(new Error(`Délai d'attente dépassé (5s) pour charger la trame vidéo "${mediaName}" à t=${time.toFixed(2)}s.`));
        }
      }
    }, 5000);

    video.addEventListener('seeked', onSeeked);
    video.addEventListener('error', onError);

    try {
      video.currentTime = time;
    } catch (err: any) {
      cleanup();
      reject(new Error(`Impossible de modifier le temps de la vidéo "${mediaName}" : ${err?.message || 'Erreur seek'}`));
    }
  });
}

/**
 * Format helper for seconds to mm:ss or "1 min 45 s"
 */
export function formatDurationToFrench(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const remSecs = Math.round(seconds % 60);
  if (mins === 0) return `${remSecs} sec`;
  if (remSecs === 0) return `${mins} min`;
  return `${mins} min ${remSecs} s`;
}

/**
 * Vérification post-exportation du fichier MP4 généré dans le navigateur
 */
export async function verifyGeneratedMp4(
  blob: Blob,
  expectedDurationSeconds: number,
  hasVideoInCarousel: boolean
): Promise<{ ok: boolean; actualDuration: number; motionVerified: boolean; error?: string }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob);
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;

    const timeout = setTimeout(() => {
      cleanup();
      resolve({
        ok: false,
        actualDuration: 0,
        motionVerified: false,
        error: 'Le fichier MP4 généré ne peut pas être relu par le navigateur (timeout 8s).',
      });
    }, 8000);

    const cleanup = () => {
      clearTimeout(timeout);
      video.removeEventListener('loadedmetadata', onMeta);
      video.removeEventListener('error', onError);
      URL.revokeObjectURL(url);
    };

    const onError = () => {
      cleanup();
      resolve({
        ok: false,
        actualDuration: 0,
        motionVerified: false,
        error: 'Le fichier MP4 généré est illisible ou corrompu.',
      });
    };

    const onMeta = async () => {
      const actualDuration = video.duration;

      if (!isFinite(actualDuration) || actualDuration <= 0) {
        cleanup();
        return resolve({
          ok: false,
          actualDuration: 0,
          motionVerified: false,
          error: 'Le fichier MP4 généré possède une durée invalide.',
        });
      }

      // 1. Contrôle strict de la durée (tolérance 1.0 seconde)
      const durationDiff = Math.abs(actualDuration - expectedDurationSeconds);
      if (durationDiff > 1.0) {
        cleanup();
        return resolve({
          ok: false,
          actualDuration,
          motionVerified: false,
          error: `La durée mesurée du MP4 (${actualDuration.toFixed(1)}s) ne correspond pas à la durée prévue (${expectedDurationSeconds.toFixed(1)}s).`,
        });
      }

      // 2. Contrôle du mouvement vidéo si la boucle contient des vidéos
      let motionVerified = true;
      if (hasVideoInCarousel && actualDuration > 1.5) {
        try {
          const testCanvas = document.createElement('canvas');
          testCanvas.width = 160;
          testCanvas.height = 90;
          const ctx = testCanvas.getContext('2d');

          if (ctx) {
            await seekVideoElement(video, 0.5, 'Test MP4');
            ctx.drawImage(video, 0, 0, 160, 90);
            const frame1 = ctx.getImageData(0, 0, 160, 90).data;

            const t2 = Math.min(actualDuration - 0.5, 3.5);
            await seekVideoElement(video, t2, 'Test MP4');
            ctx.drawImage(video, 0, 0, 160, 90);
            const frame2 = ctx.getImageData(0, 0, 160, 90).data;

            let changedPixels = 0;
            for (let i = 0; i < frame1.length; i += 16) {
              if (
                Math.abs(frame1[i] - frame2[i]) > 8 ||
                Math.abs(frame1[i + 1] - frame2[i + 1]) > 8
              ) {
                changedPixels++;
              }
            }

            if (changedPixels === 0) {
              motionVerified = false;
              console.warn('Avertissement : Les trames du MP4 semblent statiques.');
            }
          }
        } catch (e) {
          console.warn('Erreur lors du test de variation visuelle:', e);
        }
      }

      cleanup();
      resolve({
        ok: true,
        actualDuration,
        motionVerified,
      });
    };

    video.addEventListener('loadedmetadata', onMeta);
    video.addEventListener('error', onError);
    video.src = url;
  });
}

/**
 * Moteur d'exportation MP4 complet 1920x1080
 */
export async function exportCarouselToMp4(
  playlist: CarouselSlide[],
  clubSettings: ClubSettings,
  matches: MatchItem[],
  results: MatchItem[],
  sponsors: SponsorItem[],
  logos: ClubLogoItem[],
  photos: ClubPhotoItem[],
  birthdays: BirthdayItem[],
  events: ClubEventItem[],
  teamVisuals: TeamVisualItem[],
  visualTemplates: VisualTemplatesConfig,
  options: ExportOptions = {}
): Promise<ExportResult> {
  const { fps = 30, bitrate = 6_000_000, onProgress, signal } = options;

  if (typeof VideoEncoder === 'undefined') {
    throw new Error(
      "Votre navigateur ne supporte pas l'encodage vidéo matériel WebCodecs (VideoEncoder). Veuillez utiliser Chrome, Edge ou Safari récent pour générer le fichier MP4."
    );
  }

  // 1. Calcul de la planification
  onProgress?.({
    status: 'validating',
    currentSlideIndex: 0,
    totalSlides: playlist.length,
    currentFrame: 0,
    totalFrames: 0,
    percent: 0,
    currentSlideTitle: 'Validation',
    statusMessage: 'Vérification préalable de la conformité des médias...',
  });

  const schedule = calculateCarouselSchedule(playlist, clubSettings, visualTemplates);
  if (schedule.items.length === 0) {
    throw new Error('Aucune diapositive active à exporter dans le carrousel.');
  }

  // 2. Validation de l'accessibilité des médias
  const valResult = await validateCarouselMedia(
    playlist,
    clubSettings,
    visualTemplates,
    (msg) => {
      onProgress?.({
        status: 'validating',
        currentSlideIndex: 0,
        totalSlides: schedule.totalSlides,
        currentFrame: 0,
        totalFrames: 0,
        percent: 0,
        currentSlideTitle: 'Validation des médias',
        statusMessage: msg,
      });
    }
  );

  if (!valResult.ok) {
    const firstFailed = valResult.failedMedia[0];
    throw new Error(
      `Impossible d'exporter le média "${firstFailed.name}" (${firstFailed.error}) sur la diapositive "${firstFailed.slideTitle}". Veuillez le réimporter ou le remplacer.`
    );
  }

  // 3. Configuration de l'encodeur MP4
  onProgress?.({
    status: 'preparing',
    currentSlideIndex: 0,
    totalSlides: schedule.totalSlides,
    currentFrame: 0,
    totalFrames: 0,
    percent: 2,
    currentSlideTitle: 'Initialisation de l’encodeur',
    statusMessage: 'Configuration du flux vidéo H.264 1920x1080 Full HD...',
  });

  const totalFrames = schedule.items.reduce(
    (acc, item) => acc + Math.round(item.durationSeconds * fps),
    0
  );

  const muxer = new Muxer({
    target: new ArrayBufferTarget(),
    video: {
      codec: 'avc',
      width: 1920,
      height: 1080,
      frameRate: fps,
    },
    fastStart: 'in-memory',
  });

  const candidateCodecs = ['avc1.420028', 'avc1.4d002a', 'avc1.640028', 'avc1.42001f'];
  let chosenCodec = 'avc1.420028';

  for (const c of candidateCodecs) {
    try {
      const support = await VideoEncoder.isConfigSupported({
        codec: c,
        width: 1920,
        height: 1080,
        bitrate,
        framerate: fps,
      });
      if (support.supported) {
        chosenCodec = c;
        break;
      }
    } catch {
      // Continue
    }
  }

  let encoderError: Error | null = null;
  const videoEncoder = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: (e) => {
      encoderError = e;
      console.error('Erreur VideoEncoder:', e);
    },
  });

  videoEncoder.configure({
    codec: chosenCodec,
    width: 1920,
    height: 1080,
    bitrate,
    framerate: fps,
  });

  // 4. Création de la scène de rendu DOM 1920x1080 hors-écran
  const stageContainer = document.createElement('div');
  stageContainer.id = 'tv-mp4-export-stage';
  stageContainer.style.position = 'fixed';
  stageContainer.style.left = '-9999px';
  stageContainer.style.top = '0';
  stageContainer.style.width = '1920px';
  stageContainer.style.height = '1080px';
  stageContainer.style.overflow = 'hidden';
  stageContainer.style.zIndex = '-9999';
  stageContainer.style.backgroundColor = 'transparent';
  document.body.appendChild(stageContainer);

  const stageRoot: Root = createRoot(stageContainer);

  const masterCanvas = document.createElement('canvas');
  masterCanvas.width = 1920;
  masterCanvas.height = 1080;
  const masterCtx = masterCanvas.getContext('2d', { willReadFrequently: true });

  if (!masterCtx) {
    document.body.removeChild(stageContainer);
    throw new Error('Impossible d’initialiser le contexte Canvas 2D.');
  }

  let globalFrameIndex = 0;
  const startTime = Date.now();
  let hasAnyVideoInCarousel = false;

  try {
    for (let slideIdx = 0; slideIdx < schedule.items.length; slideIdx++) {
      if (signal?.aborted) {
        throw new Error('Exportation annulée par l’utilisateur.');
      }
      if (encoderError) {
        throw encoderError;
      }

      const item = schedule.items[slideIdx];
      const slideFrames = Math.round(item.durationSeconds * fps);

      onProgress?.({
        status: 'rendering',
        currentSlideIndex: slideIdx + 1,
        totalSlides: schedule.totalSlides,
        currentFrame: globalFrameIndex,
        totalFrames,
        percent: Math.round((globalFrameIndex / totalFrames) * 100),
        currentSlideTitle: item.title,
        statusMessage: `Rendu de la diapositive ${slideIdx + 1}/${schedule.totalSlides} : ${item.title} (${item.durationSeconds}s)...`,
      });

      // Rendre le composant React dans la scène
      await new Promise<void>((resolve) => {
        stageRoot.render(
          <div
            id="tv-slide-root-wrapper"
            style={{
              width: '1920px',
              height: '1080px',
              position: 'relative',
              overflow: 'hidden',
              backgroundColor: 'transparent',
            }}
          >
            <TVSlideRenderer
              slide={item.slide}
              clubSettings={clubSettings}
              matches={matches}
              results={results}
              sponsors={sponsors}
              logos={logos}
              photos={photos}
              birthdays={birthdays}
              events={events}
              teamVisuals={teamVisuals}
              visualTemplates={visualTemplates}
              hideShareButton={true}
            />
          </div>
        );
        setTimeout(resolve, 80);
      });

      if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }

      // Rendre transparents les fonds opaques des conteneurs pour préserver les vidéos en dessous
      const rootDivs = Array.from(stageContainer.querySelectorAll<HTMLDivElement>('div'));
      for (const d of rootDivs) {
        const bg = window.getComputedStyle(d).backgroundColor;
        if (
          bg.includes('rgb(17, 17, 17)') ||
          bg.includes('rgb(2, 6, 23)') ||
          bg.includes('rgb(15, 23, 42)')
        ) {
          d.style.backgroundColor = 'transparent';
        }
      }

      const videos = Array.from(stageContainer.querySelectorAll<HTMLVideoElement>('video'));
      const canvases = Array.from(stageContainer.querySelectorAll<HTMLCanvasElement>('canvas'));

      for (const v of videos) {
        v.muted = true;
        v.playsInline = true;
        if (v.readyState < 1) {
          await new Promise<void>((r) => {
            const onMeta = () => {
              v.removeEventListener('loadedmetadata', onMeta);
              r();
            };
            v.addEventListener('loadedmetadata', onMeta);
            setTimeout(r, 300);
          });
        }
      }

      const hasSlideVideo = videos.length > 0 || item.hasVideo;
      if (hasSlideVideo) hasAnyVideoInCarousel = true;

      if (!hasSlideVideo) {
        // CAS 1 : Diapositive statique
        const staticCanvas = await htmlToImage.toCanvas(stageContainer, {
          width: 1920,
          height: 1080,
          pixelRatio: 1,
          backgroundColor: '#020617',
          cacheBust: true,
        });

        masterCtx.clearRect(0, 0, 1920, 1080);
        masterCtx.drawImage(staticCanvas, 0, 0, 1920, 1080);

        for (let f = 0; f < slideFrames; f++) {
          if (signal?.aborted) throw new Error('Exportation annulée par l’utilisateur.');
          if (encoderError) throw encoderError;

          const timestampMicros = Math.round((globalFrameIndex * 1_000_000) / fps);
          const frame = new VideoFrame(masterCanvas, {
            timestamp: timestampMicros,
            duration: Math.round(1_000_000 / fps),
          });

          const isKeyFrame = globalFrameIndex % (fps * 2) === 0;
          videoEncoder.encode(frame, { keyFrame: isKeyFrame });
          frame.close();

          globalFrameIndex++;

          if (videoEncoder.encodeQueueSize > 30) {
            await new Promise((r) => setTimeout(r, 10));
          }
        }
      } else {
        // CAS 2 : Diapositive contenant une ou plusieurs vidéos
        // Capture du calque UI textuel (cartes, titres, logos) avec fond TRANSPARENT
        const uiCanvas = await htmlToImage.toCanvas(stageContainer, {
          width: 1920,
          height: 1080,
          pixelRatio: 1,
          backgroundColor: 'transparent',
          filter: (node) => {
            if (node instanceof HTMLVideoElement) return false;
            return true;
          },
        });

        for (let f = 0; f < slideFrames; f++) {
          if (signal?.aborted) throw new Error('Exportation annulée par l’utilisateur.');
          if (encoderError) throw encoderError;

          const t = f / fps;

          // Caler TOUTES les vidéos avec vérification stricte et nom du média
          for (let vIdx = 0; vIdx < videos.length; vIdx++) {
            const v = videos[vIdx];
            const vLabel = `${item.title} (Vidéo ${vIdx + 1})`;
            await seekVideoElement(v, t, vLabel);
          }

          masterCtx.clearRect(0, 0, 1920, 1080);
          masterCtx.fillStyle = '#020617';
          masterCtx.fillRect(0, 0, 1920, 1080);

          // 1. Dessiner les vidéos de fond ou de contenu principal dans l'ordre réel
          for (const v of videos) {
            if (v.readyState >= 2) {
              const rect = v.getBoundingClientRect();
              const stageRect = stageContainer.getBoundingClientRect();
              const relX = rect.left - stageRect.left;
              const relY = rect.top - stageRect.top;
              const relW = rect.width;
              const relH = rect.height;

              if (relW > 0 && relH > 0) {
                // Si la vidéo est un fond d'écran plein écran (Matchs/Résultats/Anniversaires)
                if (relW >= 1900 && relH >= 1070) {
                  masterCtx.drawImage(v, 0, 0, 1920, 1080);
                  // Teinte sombre protectrice sous les cartes
                  masterCtx.fillStyle = 'rgba(2, 6, 23, 0.70)';
                  masterCtx.fillRect(0, 0, 1920, 1080);
                } else {
                  // Vidéo sponsor ou photo centrale : dessin aux coordonnées exactes
                  masterCtx.drawImage(v, relX, relY, relW, relH);
                }
              }
            }
          }

          // 2. Dessiner le calque UI textuel (cartes de matchs, titres, logos) par-dessus
          masterCtx.drawImage(uiCanvas, 0, 0, 1920, 1080);

          // 3. Dessiner les calques Canvas superposés (Calque 3/4 détouré Chroma Key)
          for (const c of canvases) {
            if (c.width > 0 && c.height > 0) {
              const rect = c.getBoundingClientRect();
              const stageRect = stageContainer.getBoundingClientRect();
              const relX = rect.left - stageRect.left;
              const relY = rect.top - stageRect.top;
              const relW = rect.width;
              const relH = rect.height;

              if (relW > 0 && relH > 0) {
                masterCtx.drawImage(c, relX, relY, relW, relH);
              }
            }
          }

          // 4. Envoi de la trame à l'encodeur H.264
          const timestampMicros = Math.round((globalFrameIndex * 1_000_000) / fps);
          const frame = new VideoFrame(masterCanvas, {
            timestamp: timestampMicros,
            duration: Math.round(1_000_000 / fps),
          });

          const isKeyFrame = globalFrameIndex % (fps * 2) === 0;
          videoEncoder.encode(frame, { keyFrame: isKeyFrame });
          frame.close();

          globalFrameIndex++;

          if (videoEncoder.encodeQueueSize > 30) {
            await new Promise((r) => setTimeout(r, 10));
          }

          if (f % Math.max(1, Math.round(fps / 2)) === 0) {
            const elapsedSec = (Date.now() - startTime) / 1000;
            const progressRatio = globalFrameIndex / totalFrames;
            const estimatedTotalSec = progressRatio > 0 ? elapsedSec / progressRatio : 0;
            const remainingSec = Math.max(0, Math.round(estimatedTotalSec - elapsedSec));

            onProgress?.({
              status: 'rendering',
              currentSlideIndex: slideIdx + 1,
              totalSlides: schedule.totalSlides,
              currentFrame: globalFrameIndex,
              totalFrames,
              percent: Math.min(98, Math.round(progressRatio * 100)),
              currentSlideTitle: item.title,
              statusMessage: `Encodage trame ${globalFrameIndex}/${totalFrames} (${Math.round(progressRatio * 100)}%)...`,
              estimatedRemainingSeconds: remainingSec,
            });
          }
        }
      }
    }

    // 5. Finalisation du fichier MP4
    onProgress?.({
      status: 'finalizing',
      currentSlideIndex: schedule.totalSlides,
      totalSlides: schedule.totalSlides,
      currentFrame: totalFrames,
      totalFrames,
      percent: 99,
      currentSlideTitle: 'Finalisation',
      statusMessage: 'Création du conteneur MP4 et contrôle de qualité post-exportation...',
    });

    await videoEncoder.flush();
    muxer.finalize();

    const buffer = muxer.target.buffer;
    const blob = new Blob([buffer], { type: 'video/mp4' });

    // 6. Contrôle strict post-exportation dans le navigateur (relecture, durée & mouvement)
    const verification = await verifyGeneratedMp4(blob, schedule.totalDurationSeconds, hasAnyVideoInCarousel);
    if (!verification.ok) {
      throw new Error(`Échec de validation du MP4 généré : ${verification.error}`);
    }

    const sizeMb = Math.round((blob.size / (1024 * 1024)) * 100) / 100;
    const clubNameSlug = (clubSettings.shortName || clubSettings.name || 'src-basket')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-');
    const dateSlug = new Date().toISOString().slice(0, 10);
    const filename = `affichage-tv-${clubNameSlug}-${dateSlug}.mp4`;

    onProgress?.({
      status: 'completed',
      currentSlideIndex: schedule.totalSlides,
      totalSlides: schedule.totalSlides,
      currentFrame: totalFrames,
      totalFrames,
      percent: 100,
      currentSlideTitle: 'Terminé',
      statusMessage: `Exportation validée avec succès ! Fichier vérifié (${sizeMb} Mo, ${verification.actualDuration.toFixed(1)}s).`,
    });

    return {
      blob,
      durationSeconds: schedule.totalDurationSeconds,
      actualMeasuredDuration: verification.actualDuration,
      totalFrames,
      filename,
      fileSizeMb: sizeMb,
      motionVerified: verification.motionVerified,
    };
  } finally {
    try {
      stageRoot.unmount();
    } catch {}
    if (stageContainer.parentElement) {
      document.body.removeChild(stageContainer);
    }
  }
}
