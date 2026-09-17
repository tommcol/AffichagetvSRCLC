import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Video,
  Download,
  Play,
  Pause,
  Square,
  Sparkles,
  Monitor,
  Smartphone,
  Layers,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileVideo,
  RefreshCw,
  Sliders,
  Calendar,
  Trophy,
  Camera,
  Building2,
  FolderPlus,
  Cake,
  Share2,
} from 'lucide-react';
import {
  MatchItem,
  ClubSettings,
  SponsorItem,
  ClubLogoItem,
  ClubPhotoItem,
  BirthdayItem,
  ClubEventItem,
  TeamVisualItem,
  VisualTemplatesConfig,
  ActiveMatchAlert,
} from '../types';

interface CarouselVideoExporterModalProps {
  isOpen: boolean;
  onClose: () => void;
  matches: MatchItem[];
  results: MatchItem[];
  sponsors: SponsorItem[];
  logos: ClubLogoItem[];
  photos: ClubPhotoItem[];
  birthdays: BirthdayItem[];
  events: ClubEventItem[];
  teamVisuals: TeamVisualItem[];
  visualTemplates: VisualTemplatesConfig;
  clubSettings: ClubSettings;
  activeAlerts: ActiveMatchAlert[];
}

interface SlideScene {
  id: string;
  type: 'matches' | 'results' | 'photos' | 'sponsors' | 'logos' | 'birthdays' | 'events' | 'sponsor_single' | 'logo_single';
  title: string;
  subtitle: string;
  badge: string;
  color: string;
  data: any;
}

export const CarouselVideoExporterModal: React.FC<CarouselVideoExporterModalProps> = ({
  isOpen,
  onClose,
  matches,
  results,
  sponsors,
  logos,
  photos,
  birthdays,
  events,
  clubSettings,
}) => {
  // Video settings
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [slideDuration, setSlideDuration] = useState<number>(4); // seconds per slide
  const [includeTransitions, setIncludeTransitions] = useState<boolean>(true);
  const [fps, setFps] = useState<number>(30);

  // Selected slides to include
  const [selectedTypes, setSelectedTypes] = useState<Record<string, boolean>>({
    matches: true,
    results: true,
    photos: true,
    sponsors: true,
    logos: false,
    birthdays: true,
    events: true,
  });

  // Export State
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [videoBlobUrl, setVideoBlobUrl] = useState<string | null>(null);
  const [videoBlobSize, setVideoBlobSize] = useState<string>('');
  const [exportedMime, setExportedMime] = useState<string>('video/webm');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Live Screen Capture Mode state
  const [isCapturingScreen, setIsCapturingScreen] = useState<boolean>(false);
  const screenRecorderRef = useRef<MediaRecorder | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  // Canvas and animation refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const abortRecordingRef = useRef<boolean>(false);

  // Helpers to detect video content
  const isPhotoVideo = (photo: any) => {
    return !!(photo && (photo.isVideo || photo.mediaType === 'video' || photo.imageUrl?.includes('.mp4') || photo.imageUrl?.startsWith('data:video/')));
  };

  const isSponsorVideo = (sponsor: any) => {
    return !!(sponsor && (sponsor.isVideo || sponsor.mediaType === 'video' || sponsor.logoUrl?.includes('.mp4') || sponsor.logoUrl?.startsWith('data:video/')));
  };

  const isLogoVideo = (logo: any) => {
    return !!(logo && (logo.isVideo || logo.mediaType === 'video' || logo.logoUrl?.includes('.mp4') || logo.logoUrl?.startsWith('data:video/')));
  };

  // Helper to load video elements
  const loadVideo = (url: string): Promise<HTMLVideoElement | null> => {
    return new Promise((resolve) => {
      if (!url) return resolve(null);
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.muted = true;
      video.playsInline = true;
      video.autoplay = true;
      video.onloadedmetadata = () => {
        resolve(video);
      };
      video.onerror = () => {
        resolve(null);
      };
      video.src = url;
      video.load();
    });
  };

  // Build the list of slide scenes based on user's active data and selection
  const scenes: SlideScene[] = [];

  if (selectedTypes.matches && matches.length > 0) {
    scenes.push({
      id: 'matches',
      type: 'matches',
      title: 'MATCHS DU WEEK-END',
      subtitle: `${matches.filter((m) => m.selectedForWeekend !== false).length} rencontres à l'affiche`,
      badge: 'PROGRAMME OFFICIEL',
      color: '#ea580c',
      data: matches.filter((m) => m.selectedForWeekend !== false).slice(0, 6),
    });
  }

  if (selectedTypes.results && results.length > 0) {
    scenes.push({
      id: 'results',
      type: 'results',
      title: 'DERNIERS RÉSULTATS',
      subtitle: 'Performances et scores du club',
      badge: 'SCORES DU CLUB',
      color: '#10b981',
      data: results.slice(0, 6),
    });
  }

  if (selectedTypes.photos && photos.length > 0) {
    // Up to 3 featured photos as distinct scenes
    photos.slice(0, 3).forEach((photo, idx) => {
      scenes.push({
        id: `photo-${photo.id || idx}`,
        type: 'photos',
        title: photo.title || 'VIE DU CLUB',
        subtitle: photo.caption || clubSettings.name,
        badge: 'GALERIE PHOTOS',
        color: '#f59e0b',
        data: photo,
      });
    });
  }

  if (selectedTypes.sponsors && sponsors.length > 0) {
    // 1. Grid of sponsors (static)
    scenes.push({
      id: 'sponsors',
      type: 'sponsors',
      title: 'NOS PARTENAIRES OFFICIELS',
      subtitle: 'Merci pour leur précieux soutien',
      badge: 'PARTENAIRES',
      color: '#eab308',
      data: sponsors.slice(0, 8),
    });

    // 2. Add individual video sponsors so they play completely full-screen!
    sponsors.forEach((sp, idx) => {
      if (isSponsorVideo(sp)) {
        scenes.push({
          id: `sponsor-video-${sp.id || idx}`,
          type: 'sponsor_single',
          title: sp.name,
          subtitle: sp.tagline || 'Partenaire Officiel',
          badge: 'PARTENAIRE VIDÉO',
          color: '#eab308',
          data: sp,
        });
      }
    });
  }

  if (selectedTypes.birthdays && birthdays.length > 0) {
    scenes.push({
      id: 'birthdays',
      type: 'birthdays',
      title: 'JOYEUX ANNIVERSAIRE !',
      subtitle: 'Célébrons les licenciés nés cette semaine',
      badge: 'ANNIVERSAIRES',
      color: '#ec4899',
      data: birthdays.slice(0, 4),
    });
  }

  if (selectedTypes.events && events.length > 0) {
    scenes.push({
      id: 'events',
      type: 'events',
      title: 'PROCHAINS ÉVÉNEMENTS',
      subtitle: 'Rendez-vous et animations au gymnase',
      badge: 'AGENDA DU CLUB',
      color: '#8b5cf6',
      data: events.slice(0, 4),
    });
  }

  if (selectedTypes.logos && logos.length > 0) {
    // 1. Grid of logos
    scenes.push({
      id: 'logos',
      type: 'logos',
      title: 'INSTITUTIONS & FÉDÉRATION',
      subtitle: clubSettings.name,
      badge: 'LOGOS & LIGUES',
      color: '#0284c7',
      data: logos.slice(0, 6),
    });

    // 2. Add individual video logos so they play completely full-screen!
    logos.forEach((lg, idx) => {
      if (isLogoVideo(lg)) {
        scenes.push({
          id: `logo-video-${lg.id || idx}`,
          type: 'logo_single',
          title: lg.name,
          subtitle: clubSettings.name,
          badge: 'VISUEL ANIMÉ',
          color: '#0284c7',
          data: lg,
        });
      }
    });
  }

  // Calculate estimated duration
  const totalDurationSeconds = scenes.length * slideDuration;

  // Cleanup on unmount or close
  useEffect(() => {
    return () => {
      abortRecordingRef.current = true;
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch {}
      }
      if (screenRecorderRef.current && screenRecorderRef.current.state !== 'inactive') {
        try {
          screenRecorderRef.current.stop();
        } catch {}
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // Helper to load image for canvas
  const loadImage = (url: string): Promise<HTMLImageElement | null> => {
    return new Promise((resolve) => {
      if (!url) return resolve(null);
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = url;
    });
  };

  // Supported MediaRecorder mime types detection
  const getSupportedMimeType = () => {
    const types = [
      'video/mp4;codecs=avc1',
      'video/mp4',
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm',
    ];
    for (const t of types) {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t)) {
        return t;
      }
    }
    return 'video/webm';
  };

  // -------------------------------------------------------------
  // CANVAS GENERATOR ENGINE (Auto-rendered High-Definition Video)
  // -------------------------------------------------------------
  const handleStartAutoRecording = async () => {
    if (scenes.length === 0) {
      setErrorMsg('Veuillez sélectionner au moins une catégorie avec des données à inclure.');
      return;
    }

    setErrorMsg('');
    setVideoBlobUrl(null);
    setIsRecording(true);
    setProgress(0);
    setStatusMessage('Préparation des éléments visuels et des vidéos...');
    abortRecordingRef.current = false;
    recordedChunksRef.current = [];

    // 1. Dimensions setup
    const width = aspectRatio === '16:9' ? 1920 : 1080;
    const height = aspectRatio === '16:9' ? 1080 : 1920;

    let canvas = canvasRef.current;
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvasRef.current = canvas;
    }
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) {
      setIsRecording(false);
      setErrorMsg('Impossible d\'initialiser le contexte graphique 2D');
      return;
    }

    // 2. Preload primary assets (Club logo, photo images)
    let clubLogoImg: HTMLImageElement | null = null;
    if (clubSettings.logoUrl) {
      clubLogoImg = await loadImage(clubSettings.logoUrl);
    }

    // Preload scene images and HTMLVideoElements
    const preloadedSceneImages: Record<string, HTMLImageElement | null> = {};
    const preloadedVideos: Record<string, HTMLVideoElement | null> = {};
    const sceneDurations: Record<string, number> = {};

    for (const scene of scenes) {
      let isVideo = false;
      let videoUrl = '';

      if (scene.type === 'photos' && isPhotoVideo(scene.data)) {
        isVideo = true;
        videoUrl = scene.data.imageUrl;
      } else if (scene.type === 'sponsor_single' && isSponsorVideo(scene.data)) {
        isVideo = true;
        videoUrl = scene.data.logoUrl;
      } else if (scene.type === 'logo_single' && isLogoVideo(scene.data)) {
        isVideo = true;
        videoUrl = scene.data.logoUrl;
      }

      if (isVideo && videoUrl) {
        setStatusMessage(`Chargement de la vidéo : ${scene.title}...`);
        const vidEl = await loadVideo(videoUrl);
        if (vidEl) {
          preloadedVideos[scene.id] = vidEl;
          // Rule: Read completely. Use exact duration of the video.
          sceneDurations[scene.id] = vidEl.duration && !isNaN(vidEl.duration) ? vidEl.duration : slideDuration;
        } else {
          sceneDurations[scene.id] = slideDuration;
        }
      } else {
        sceneDurations[scene.id] = slideDuration;
        if (scene.type === 'photos' && scene.data?.imageUrl) {
          preloadedSceneImages[scene.id] = await loadImage(scene.data.imageUrl);
        }
      }
    }

    const cleanupVideos = () => {
      Object.values(preloadedVideos).forEach((vid) => {
        if (vid) {
          try {
            vid.pause();
            vid.src = '';
            vid.load();
          } catch (e) {}
        }
      });
    };

    // 3. Setup MediaRecorder with canvas stream
    const mime = getSupportedMimeType();
    setExportedMime(mime);

    let stream: MediaStream;
    try {
      stream = canvas.captureStream(fps);
    } catch (e: any) {
      setIsRecording(false);
      cleanupVideos();
      setErrorMsg('Erreur lors de la capture du flux vidéo : ' + e?.message);
      return;
    }

    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(stream, {
        mimeType: mime,
        videoBitsPerSecond: 6000000, // 6 Mbps for crisp 1080p
      });
      mediaRecorderRef.current = recorder;
    } catch (e: any) {
      try {
        recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;
      } catch (err: any) {
        setIsRecording(false);
        cleanupVideos();
        setErrorMsg('Votre navigateur ne supporte pas l\'enregistrement vidéo MediaRecorder.');
        return;
      }
    }

    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        recordedChunksRef.current.push(event.data);
      }
    };

    recorder.onstop = () => {
      cleanupVideos();
      const ext = mime.includes('mp4') ? 'mp4' : 'webm';
      const blob = new Blob(recordedChunksRef.current, { type: mime });
      const url = URL.createObjectURL(blob);
      setVideoBlobUrl(url);

      const sizeMb = (blob.size / (1024 * 1024)).toFixed(1);
      setVideoBlobSize(`${sizeMb} Mo (${ext.toUpperCase()})`);
      setIsRecording(false);
      setProgress(100);
      setStatusMessage('Vidéo générée avec succès !');
    };

    recorder.start(250);

    // 4. Render loop for each scene
    const totalDurationSecondsReal = scenes.reduce((sum, s) => sum + (sceneDurations[s.id] || slideDuration), 0);
    const totalFrames = Math.round(totalDurationSecondsReal * fps);
    let currentFrame = 0;

    const renderScene = (sceneIndex: number, frameInScene: number, totalSceneFrames: number) => {
      const scene = scenes[sceneIndex];
      const progressInScene = frameInScene / totalSceneFrames; // 0 to 1

      // Background Fill (Deep Slate Gradient)
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, '#020617');
      grad.addColorStop(0.5, '#0f172a');
      grad.addColorStop(1, '#020617');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Subtle Basketball Court Line aesthetic
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, width * 0.25, 0, Math.PI * 2);
      ctx.stroke();

      // Colored Ambient Glow matching scene
      const glowGrad = ctx.createRadialGradient(width / 2, 200, 50, width / 2, 200, 600);
      glowGrad.addColorStop(0, `${scene.color}33`);
      glowGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = glowGrad;
      ctx.fillRect(0, 0, width, height);

      // HEADER BAR
      const headerH = aspectRatio === '16:9' ? 120 : 180;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(0, 0, width, headerH);
      ctx.fillStyle = scene.color;
      ctx.fillRect(0, headerH - 4, width, 4);

      // Club Logo in Header
      if (clubLogoImg) {
        const logoSize = headerH - 30;
        ctx.drawImage(clubLogoImg, 40, 15, logoSize, logoSize);
      }

      // Club Name & Scene Title
      ctx.textAlign = 'left';
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${aspectRatio === '16:9' ? 32 : 42}px 'Plus Jakarta Sans', sans-serif`;
      ctx.fillText((clubSettings.name || 'CLUB').toUpperCase(), clubLogoImg ? headerH + 30 : 50, headerH * 0.45);

      // Category Badge
      ctx.fillStyle = scene.color;
      ctx.font = `900 ${aspectRatio === '16:9' ? 18 : 22}px 'Plus Jakarta Sans', sans-serif`;
      ctx.fillText(`● ${scene.badge} — ${scene.title}`, clubLogoImg ? headerH + 30 : 50, headerH * 0.75);

      // Content Box depending on Scene Type
      const contentTop = headerH + 30;
      const contentH = height - headerH - 100;

      if (scene.type === 'matches') {
        const items: MatchItem[] = scene.data;
        const cardW = aspectRatio === '16:9' ? (width - 120) / 2 : width - 80;
        const maxCards = aspectRatio === '16:9' ? 6 : 4;

        items.slice(0, maxCards).forEach((m, idx) => {
          const col = aspectRatio === '16:9' ? idx % 2 : 0;
          const row = aspectRatio === '16:9' ? Math.floor(idx / 2) : idx;
          const x = 40 + col * (cardW + 40);
          const y = contentTop + row * (aspectRatio === '16:9' ? 160 : 220);
          const cardH = aspectRatio === '16:9' ? 140 : 190;

          // Card Background
          ctx.fillStyle = 'rgba(30, 41, 59, 0.75)';
          ctx.beginPath();
          ctx.roundRect(x, y, cardW, cardH, 16);
          ctx.fill();
          ctx.strokeStyle = m.isHomeMatch ? 'rgba(234, 88, 12, 0.5)' : 'rgba(100, 116, 139, 0.4)';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Left border accent
          ctx.fillStyle = m.isHomeMatch ? '#ea580c' : '#3b82f6';
          ctx.beginPath();
          ctx.roundRect(x, y, 8, cardH, [16, 0, 0, 16]);
          ctx.fill();

          // Match category & Competition
          ctx.textAlign = 'left';
          ctx.fillStyle = '#f97316';
          ctx.font = "bold 20px 'Plus Jakarta Sans', sans-serif";
          ctx.fillText(m.category.toUpperCase(), x + 24, y + 36);

          ctx.fillStyle = '#94a3b8';
          ctx.font = "16px 'Plus Jakarta Sans', sans-serif";
          ctx.fillText(m.competition || 'Championnat', x + 24, y + 62);

          // Teams
          ctx.fillStyle = '#ffffff';
          ctx.font = "bold 22px 'Plus Jakarta Sans', sans-serif";
          const vsText = `${m.teamHome} vs ${m.teamAway}`;
          ctx.fillText(vsText, x + 24, y + 100);

          // Time & Place
          ctx.fillStyle = '#cbd5e1';
          ctx.font = "bold 18px 'Plus Jakarta Sans', sans-serif";
          ctx.textAlign = 'right';
          ctx.fillText(`${m.time || '15:00'} • ${m.gymnasium || m.city || 'Gymnase'}`, x + cardW - 24, y + 36);
        });
      } else if (scene.type === 'results') {
        const items: MatchItem[] = scene.data;
        const cardW = aspectRatio === '16:9' ? (width - 120) / 2 : width - 80;
        const maxCards = aspectRatio === '16:9' ? 6 : 4;

        items.slice(0, maxCards).forEach((m, idx) => {
          const col = aspectRatio === '16:9' ? idx % 2 : 0;
          const row = aspectRatio === '16:9' ? Math.floor(idx / 2) : idx;
          const x = 40 + col * (cardW + 40);
          const y = contentTop + row * (aspectRatio === '16:9' ? 160 : 220);
          const cardH = aspectRatio === '16:9' ? 140 : 190;

          const isWin = m.result === 'win';

          ctx.fillStyle = 'rgba(30, 41, 59, 0.75)';
          ctx.beginPath();
          ctx.roundRect(x, y, cardW, cardH, 16);
          ctx.fill();
          ctx.strokeStyle = isWin ? 'rgba(16, 185, 129, 0.6)' : 'rgba(239, 68, 68, 0.5)';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Left border
          ctx.fillStyle = isWin ? '#10b981' : '#ef4444';
          ctx.beginPath();
          ctx.roundRect(x, y, 8, cardH, [16, 0, 0, 16]);
          ctx.fill();

          ctx.textAlign = 'left';
          ctx.fillStyle = isWin ? '#34d399' : '#f87171';
          ctx.font = "bold 20px 'Plus Jakarta Sans', sans-serif";
          ctx.fillText(`${m.category} — ${isWin ? 'VICTOIRE' : 'DÉFAITE'}`, x + 24, y + 36);

          ctx.fillStyle = '#ffffff';
          ctx.font = "bold 24px 'Plus Jakarta Sans', sans-serif";
          ctx.fillText(`${m.teamHome} vs ${m.teamAway}`, x + 24, y + 78);

          // Score Badge
          if (m.homeScore !== undefined && m.awayScore !== undefined) {
            ctx.textAlign = 'right';
            ctx.fillStyle = '#f8fafc';
            ctx.font = "bold 32px 'Plus Jakarta Sans', sans-serif";
            ctx.fillText(`${m.homeScore} - ${m.awayScore}`, x + cardW - 24, y + 54);
          }
        });
      } else if (scene.type === 'photos') {
        const photoImg = preloadedSceneImages[scene.id];
        const videoEl = preloadedVideos[scene.id];

        if (videoEl) {
          const imgW = width - 120;
          const imgH = contentH - 40;
          const imgX = 60;
          const imgY = contentTop + 20;

          ctx.save();
          ctx.beginPath();
          ctx.roundRect(imgX, imgY, imgW, imgH, 24);
          ctx.clip();

          ctx.fillStyle = '#020617';
          ctx.fillRect(imgX, imgY, imgW, imgH);

          // Center contain video frame
          const videoAspect = videoEl.videoWidth / videoEl.videoHeight || 16 / 9;
          const containerAspect = imgW / imgH;
          let drawW = imgW;
          let drawH = imgH;
          let drawX = imgX;
          let drawY = imgY;

          if (videoAspect > containerAspect) {
            drawH = imgW / videoAspect;
            drawY = imgY + (imgH - drawH) / 2;
          } else {
            drawW = imgH * videoAspect;
            drawX = imgX + (imgW - drawW) / 2;
          }

          ctx.drawImage(videoEl, drawX, drawY, drawW, drawH);

          // Gradient overlay for text caption
          const textGrad = ctx.createLinearGradient(0, height - 250, 0, height - 60);
          textGrad.addColorStop(0, 'transparent');
          textGrad.addColorStop(1, 'rgba(0,0,0,0.85)');
          ctx.fillStyle = textGrad;
          ctx.fillRect(60, height - 250, width - 120, 200);

          ctx.textAlign = 'left';
          ctx.fillStyle = '#ffffff';
          ctx.font = "bold 36px 'Plus Jakarta Sans', sans-serif";
          ctx.fillText(scene.title, 100, height - 120);

          if (scene.subtitle) {
            ctx.fillStyle = '#cbd5e1';
            ctx.font = "22px 'Plus Jakarta Sans', sans-serif";
            ctx.fillText(scene.subtitle, 100, height - 80);
          }
          ctx.restore();
        } else if (photoImg) {
          // Subtle Ken-burns zoom animation
          const zoom = 1 + progressInScene * 0.05;
          const imgW = (width - 120) * zoom;
          const imgH = (contentH - 40) * zoom;
          const imgX = (width - imgW) / 2;
          const imgY = contentTop + (contentH - imgH) / 2;

          ctx.save();
          ctx.beginPath();
          ctx.roundRect(60, contentTop, width - 120, contentH, 24);
          ctx.clip();
          ctx.drawImage(photoImg, imgX, imgY, imgW, imgH);

          // Gradient overlay for text caption
          const textGrad = ctx.createLinearGradient(0, height - 250, 0, height - 60);
          textGrad.addColorStop(0, 'transparent');
          textGrad.addColorStop(1, 'rgba(0,0,0,0.85)');
          ctx.fillStyle = textGrad;
          ctx.fillRect(60, height - 250, width - 120, 200);

          ctx.textAlign = 'left';
          ctx.fillStyle = '#ffffff';
          ctx.font = "bold 36px 'Plus Jakarta Sans', sans-serif";
          ctx.fillText(scene.title, 100, height - 120);

          if (scene.subtitle) {
            ctx.fillStyle = '#cbd5e1';
            ctx.font = "22px 'Plus Jakarta Sans', sans-serif";
            ctx.fillText(scene.subtitle, 100, height - 80);
          }
          ctx.restore();
        }
      } else if (scene.type === 'sponsor_single') {
        const videoEl = preloadedVideos[scene.id];
        if (videoEl) {
          const imgW = width - 120;
          const imgH = contentH - 40;
          const imgX = 60;
          const imgY = contentTop + 20;

          ctx.save();
          ctx.beginPath();
          ctx.roundRect(imgX, imgY, imgW, imgH, 24);
          ctx.clip();

          ctx.fillStyle = '#020617';
          ctx.fillRect(imgX, imgY, imgW, imgH);

          const videoAspect = videoEl.videoWidth / videoEl.videoHeight || 16 / 9;
          const containerAspect = imgW / imgH;
          let drawW = imgW;
          let drawH = imgH;
          let drawX = imgX;
          let drawY = imgY;

          if (videoAspect > containerAspect) {
            drawH = imgW / videoAspect;
            drawY = imgY + (imgH - drawH) / 2;
          } else {
            drawW = imgH * videoAspect;
            drawX = imgX + (imgW - drawW) / 2;
          }

          ctx.drawImage(videoEl, drawX, drawY, drawW, drawH);

          // Gradient overlay for text caption
          const textGrad = ctx.createLinearGradient(0, height - 250, 0, height - 60);
          textGrad.addColorStop(0, 'transparent');
          textGrad.addColorStop(1, 'rgba(0,0,0,0.85)');
          ctx.fillStyle = textGrad;
          ctx.fillRect(60, height - 250, width - 120, 200);

          ctx.textAlign = 'left';
          ctx.fillStyle = '#ffffff';
          ctx.font = "bold 36px 'Plus Jakarta Sans', sans-serif";
          ctx.fillText(scene.title, 100, height - 120);

          if (scene.subtitle) {
            ctx.fillStyle = '#eab308';
            ctx.font = "22px 'Plus Jakarta Sans', sans-serif";
            ctx.fillText(scene.subtitle, 100, height - 80);
          }
          ctx.restore();
        }
      } else if (scene.type === 'logo_single') {
        const videoEl = preloadedVideos[scene.id];
        if (videoEl) {
          const imgW = width - 120;
          const imgH = contentH - 40;
          const imgX = 60;
          const imgY = contentTop + 20;

          ctx.save();
          ctx.beginPath();
          ctx.roundRect(imgX, imgY, imgW, imgH, 24);
          ctx.clip();

          ctx.fillStyle = '#020617';
          ctx.fillRect(imgX, imgY, imgW, imgH);

          const videoAspect = videoEl.videoWidth / videoEl.videoHeight || 16 / 9;
          const containerAspect = imgW / imgH;
          let drawW = imgW;
          let drawH = imgH;
          let drawX = imgX;
          let drawY = imgY;

          if (videoAspect > containerAspect) {
            drawH = imgW / videoAspect;
            drawY = imgY + (imgH - drawH) / 2;
          } else {
            drawW = imgH * videoAspect;
            drawX = imgX + (imgW - drawW) / 2;
          }

          ctx.drawImage(videoEl, drawX, drawY, drawW, drawH);

          // Gradient overlay for text caption
          const textGrad = ctx.createLinearGradient(0, height - 250, 0, height - 60);
          textGrad.addColorStop(0, 'transparent');
          textGrad.addColorStop(1, 'rgba(0,0,0,0.85)');
          ctx.fillStyle = textGrad;
          ctx.fillRect(60, height - 250, width - 120, 200);

          ctx.textAlign = 'left';
          ctx.fillStyle = '#ffffff';
          ctx.font = "bold 36px 'Plus Jakarta Sans', sans-serif";
          ctx.fillText(scene.title, 100, height - 120);

          if (scene.subtitle) {
            ctx.fillStyle = '#0284c7';
            ctx.font = "22px 'Plus Jakarta Sans', sans-serif";
            ctx.fillText(scene.subtitle, 100, height - 80);
          }
          ctx.restore();
        }
      } else if (scene.type === 'sponsors') {
        const sponsorsList: SponsorItem[] = scene.data;
        const cols = aspectRatio === '16:9' ? 4 : 2;
        const cardW = (width - 120 - (cols - 1) * 30) / cols;
        const cardH = aspectRatio === '16:9' ? 180 : 200;

        sponsorsList.forEach((sp, idx) => {
          const col = idx % cols;
          const row = Math.floor(idx / cols);
          const x = 60 + col * (cardW + 30);
          const y = contentTop + row * (cardH + 30);

          ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
          ctx.beginPath();
          ctx.roundRect(x, y, cardW, cardH, 20);
          ctx.fill();

          ctx.textAlign = 'center';
          ctx.fillStyle = '#0f172a';
          ctx.font = "bold 26px 'Plus Jakarta Sans', sans-serif";
          ctx.fillText(sp.name, x + cardW / 2, y + cardH / 2 + 8);

          if (sp.tagline) {
            ctx.fillStyle = '#64748b';
            ctx.font = "16px 'Plus Jakarta Sans', sans-serif";
            ctx.fillText(sp.tagline, x + cardW / 2, y + cardH / 2 + 40);
          }
        });
      } else {
        // Generic clean placeholder for other categories (birthdays, events, logos)
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.font = "bold 42px 'Plus Jakarta Sans', sans-serif";
        ctx.fillText(scene.title, width / 2, contentTop + 120);

        ctx.fillStyle = '#94a3b8';
        ctx.font = "24px 'Plus Jakarta Sans', sans-serif";
        ctx.fillText(scene.subtitle, width / 2, contentTop + 180);
      }

      // FOOTER / PROGRESS BAR
      const footerH = 40;
      ctx.fillStyle = 'rgba(2, 6, 23, 0.9)';
      ctx.fillRect(0, height - footerH, width, footerH);

      // Slide indicator progress bar
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.fillRect(0, height - 6, width, 6);

      ctx.fillStyle = scene.color;
      const overallProgress = (currentFrame / totalFrames) * width;
      ctx.fillRect(0, height - 6, overallProgress, 6);

      // Footer branding info
      ctx.textAlign = 'center';
      ctx.fillStyle = '#94a3b8';
      ctx.font = "bold 16px 'Plus Jakarta Sans', sans-serif";
      ctx.fillText(
        `Diaporama Officiel — ${clubSettings.name} • Slide ${sceneIndex + 1}/${scenes.length}`,
        width / 2,
        height - 15
      );

      // Crossfade transition between scenes if enabled
      if (includeTransitions && frameInScene < fps * 0.5 && sceneIndex > 0) {
        // Fade in from black
        const alpha = 1 - frameInScene / (fps * 0.5);
        ctx.fillStyle = `rgba(0, 0, 0, ${alpha * 0.5})`;
        ctx.fillRect(0, 0, width, height);
      }
    };

    // Frame-by-frame rendering loop with requestAnimationFrame
    let currentSceneIndex = 0;
    let currentFrameInScene = 0;

    const getSceneFrames = (idx: number) => {
      const s = scenes[idx];
      if (!s) return 0;
      const sec = sceneDurations[s.id] || slideDuration;
      return Math.round(sec * fps);
    };

    let totalSceneFrames = getSceneFrames(0);

    const loop = () => {
      if (abortRecordingRef.current) {
        try {
          recorder.stop();
        } catch {}
        cleanupVideos();
        setIsRecording(false);
        return;
      }

      if (currentSceneIndex >= scenes.length) {
        // Finished all scenes! Stop recording
        try {
          recorder.stop();
        } catch {}
        cleanupVideos();
        return;
      }

      // Start/Play video if it is a video scene and just starting
      const activeScene = scenes[currentSceneIndex];
      const videoEl = preloadedVideos[activeScene.id];
      if (videoEl && currentFrameInScene === 0) {
        videoEl.currentTime = 0;
        videoEl.play().catch((err) => console.log('Video play error in exporter:', err));
      }

      renderScene(currentSceneIndex, currentFrameInScene, totalSceneFrames);
      currentFrameInScene++;
      currentFrame++;

      const pct = Math.min(99, Math.round((currentFrame / totalFrames) * 100));
      setProgress(pct);
      setStatusMessage(
        `Rendu vidéo HD : Diapositive ${currentSceneIndex + 1}/${scenes.length} (${scenes[currentSceneIndex].title}) • ${pct}%`
      );

      // Advance scene if frame reaches limit
      if (currentFrameInScene >= totalSceneFrames) {
        if (videoEl) {
          try {
            videoEl.pause();
          } catch (e) {}
        }
        currentSceneIndex++;
        currentFrameInScene = 0;
        if (currentSceneIndex < scenes.length) {
          totalSceneFrames = getSceneFrames(currentSceneIndex);
        }
      }

      animationFrameRef.current = requestAnimationFrame(loop);
    };

    loop();
  };

  // -------------------------------------------------------------
  // SCREEN / TAB CAPTURE ENGINE (Record live TV stream with 1 click)
  // -------------------------------------------------------------
  const handleStartScreenCapture = async () => {
    try {
      setErrorMsg('');
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: 'browser' } as any,
        audio: true,
      });

      screenStreamRef.current = stream;
      setIsCapturingScreen(true);
      recordedChunksRef.current = [];

      const mime = getSupportedMimeType();
      setExportedMime(mime);

      const recorder = new MediaRecorder(stream, { mimeType: mime });
      screenRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const ext = mime.includes('mp4') ? 'mp4' : 'webm';
        const blob = new Blob(recordedChunksRef.current, { type: mime });
        const url = URL.createObjectURL(blob);
        setVideoBlobUrl(url);
        const sizeMb = (blob.size / (1024 * 1024)).toFixed(1);
        setVideoBlobSize(`${sizeMb} Mo (${ext.toUpperCase()})`);
        setIsCapturingScreen(false);
        setStatusMessage('Capture en direct terminée !');
      };

      // If user stops sharing via browser bar
      stream.getVideoTracks()[0].onended = () => {
        if (recorder.state !== 'inactive') {
          recorder.stop();
        }
      };

      recorder.start(500);
    } catch (err: any) {
      setErrorMsg('Impossible de démarrer la capture d\'écran : ' + (err?.message || 'Accès refusé'));
      setIsCapturingScreen(false);
    }
  };

  const handleStopScreenCapture = () => {
    if (screenRecorderRef.current && screenRecorderRef.current.state !== 'inactive') {
      screenRecorderRef.current.stop();
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    setIsCapturingScreen(false);
  };

  const handleCancelAutoRecording = () => {
    abortRecordingRef.current = true;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }
    setIsRecording(false);
    setStatusMessage('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 md:p-6 overflow-y-auto animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-pink-600 to-orange-500 flex items-center justify-center shadow-lg shadow-purple-600/30">
              <FileVideo className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                Exportateur & Téléchargement Vidéo du Carrousel
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  MP4 / WebM
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Générez une vidéo fluide du carrousel de votre club pour les réseaux sociaux ou écrans TV
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-200 text-sm">
          {errorMsg && (
            <div className="p-4 rounded-2xl bg-red-950/50 border border-red-800/80 text-red-300 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. Format & Ratio Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 block flex items-center gap-2">
                <Sliders className="w-4 h-4 text-orange-400" />
                Format d'affichage
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={isRecording || isCapturingScreen}
                  onClick={() => setAspectRatio('16:9')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all font-bold text-xs ${
                    aspectRatio === '16:9'
                      ? 'bg-orange-600/20 border-orange-500 text-orange-400 shadow-md shadow-orange-600/10'
                      : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  <Monitor className="w-5 h-5" />
                  <span>16:9 Paysage (TV & Écran)</span>
                </button>

                <button
                  type="button"
                  disabled={isRecording || isCapturingScreen}
                  onClick={() => setAspectRatio('9:16')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all font-bold text-xs ${
                    aspectRatio === '9:16'
                      ? 'bg-purple-600/20 border-purple-500 text-purple-400 shadow-md shadow-purple-600/10'
                      : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  <Smartphone className="w-5 h-5" />
                  <span>9:16 Vertical (Reel / TikTok)</span>
                </button>
              </div>
            </div>

            {/* Durée par slide */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 block flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-400" />
                Rythme & Durée par diapositive
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: '3s (Dynamique)', val: 3 },
                  { label: '5s (Standard)', val: 5 },
                  { label: '8s (Lecture TV)', val: 8 },
                ].map((d) => (
                  <button
                    key={d.val}
                    type="button"
                    disabled={isRecording || isCapturingScreen}
                    onClick={() => setSlideDuration(d.val)}
                    className={`p-3 rounded-xl border text-center transition-all font-bold text-xs ${
                      slideDuration === d.val
                        ? 'bg-purple-600/20 border-purple-500 text-purple-300'
                        : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-slate-400">
                Durée totale estimée de la vidéo : <strong className="text-white">{totalDurationSeconds} secondes</strong> ({scenes.length} diapositives sélectionnées)
              </p>
            </div>
          </div>

          {/* 2. Diapositives à inclure */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 block flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              Diapositives à inclure dans la vidéo
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {[
                { key: 'matches', label: 'Matchs Week-end', count: matches.length, icon: Calendar, color: 'text-orange-400' },
                { key: 'results', label: 'Derniers Résultats', count: results.length, icon: Trophy, color: 'text-emerald-400' },
                { key: 'photos', label: 'Photos / Galerie', count: photos.length, icon: Camera, color: 'text-amber-400' },
                { key: 'sponsors', label: 'Sponsors & Partenaires', count: sponsors.length, icon: Building2, color: 'text-yellow-400' },
                { key: 'birthdays', label: 'Anniversaires', count: birthdays.length, icon: Cake, color: 'text-pink-400' },
                { key: 'events', label: 'Événements', count: events.length, icon: Sparkles, color: 'text-purple-400' },
                { key: 'logos', label: 'Banque Logos', count: logos.length, icon: FolderPlus, color: 'text-cyan-400' },
              ].map((item) => {
                const Icon = item.icon;
                const isChecked = selectedTypes[item.key] ?? false;
                return (
                  <button
                    key={item.key}
                    type="button"
                    disabled={isRecording || isCapturingScreen}
                    onClick={() =>
                      setSelectedTypes((prev) => ({
                        ...prev,
                        [item.key]: !prev[item.key],
                      }))
                    }
                    className={`p-2.5 rounded-xl border flex items-center justify-between transition-all text-xs font-bold ${
                      isChecked
                        ? 'bg-slate-800 border-slate-600 text-white shadow-sm'
                        : 'bg-slate-900/60 border-slate-800 text-slate-500 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Icon className={`w-4 h-4 ${item.color}`} />
                      <span className="truncate">{item.label}</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-400">
                      {item.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Status or Video Result Preview */}
          {isRecording && (
            <div className="p-5 rounded-2xl bg-purple-950/40 border border-purple-800/80 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-purple-200">
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-purple-400 animate-spin" />
                  <span>{statusMessage}</span>
                </div>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-purple-950/80 rounded-full h-2.5 overflow-hidden border border-purple-800/50">
                <div
                  className="bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 h-2.5 rounded-full transition-all duration-150"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleCancelAutoRecording}
                  className="px-3 py-1.5 rounded-xl bg-red-900/60 hover:bg-red-800 text-red-200 text-xs font-bold transition-all"
                >
                  Annuler le rendu
                </button>
              </div>
            </div>
          )}

          {isCapturingScreen && (
            <div className="p-5 rounded-2xl bg-amber-950/40 border border-amber-800/80 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-amber-200">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                  <span>Enregistrement en direct de votre écran / onglet en cours...</span>
                </div>
              </div>
              <p className="text-xs text-amber-300/80">
                Laissez défiler le carrousel sur votre écran puis cliquez sur Arrêter quand vous avez terminé.
              </p>
              <button
                type="button"
                onClick={handleStopScreenCapture}
                className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-600/30"
              >
                <Square className="w-4 h-4 fill-white" />
                <span>Arrêter et Télécharger la Vidéo</span>
              </button>
            </div>
          )}

          {videoBlobUrl && (
            <div className="p-5 rounded-2xl bg-emerald-950/30 border border-emerald-800/60 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>Vidéo prête au téléchargement ! Taille : {videoBlobSize}</span>
                </div>
              </div>

              {/* Video Player Preview */}
              <div className="rounded-xl overflow-hidden bg-black border border-slate-800 max-h-72 flex items-center justify-center">
                <video
                  src={videoBlobUrl}
                  controls
                  autoPlay
                  loop
                  className="max-h-72 w-auto object-contain rounded-lg"
                />
              </div>

              {/* Download Action Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                <a
                  href={videoBlobUrl}
                  download={`carrousel-${(clubSettings.name || 'club').toLowerCase().replace(/\s+/g, '-')}-${aspectRatio === '16:9' ? 'paysage' : 'story'}.${exportedMime.includes('mp4') ? 'mp4' : 'webm'}`}
                  className="flex-1 py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 active:scale-95 transition-all text-center"
                >
                  <Download className="w-5 h-5" />
                  <span>Télécharger la Vidéo ({exportedMime.includes('mp4') ? '.MP4' : '.WEBM'})</span>
                </a>

                <button
                  type="button"
                  onClick={() => setVideoBlobUrl(null)}
                  className="py-3.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all"
                >
                  Nouveau rendu
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer / Action Triggers */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/90 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all"
          >
            Fermer
          </button>

          <div className="flex items-center gap-3">
            {/* Option 2: Live Screen Capture */}
            <button
              type="button"
              disabled={isRecording || isCapturingScreen}
              onClick={handleStartScreenCapture}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-2 transition-all border border-slate-700"
              title="Capture directement l'onglet avec vos animations et vidéos intégrées"
            >
              <Video className="w-4 h-4 text-purple-400" />
              <span>Capture Écran en Direct</span>
            </button>

            {/* Option 1: Main High-Definition Render Engine */}
            <button
              type="button"
              disabled={isRecording || isCapturingScreen || scenes.length === 0}
              onClick={handleStartAutoRecording}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 hover:from-purple-500 hover:to-orange-400 text-white font-black text-xs flex items-center gap-2 shadow-xl shadow-purple-600/30 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <span>Générer la Vidéo ({totalDurationSeconds}s)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
