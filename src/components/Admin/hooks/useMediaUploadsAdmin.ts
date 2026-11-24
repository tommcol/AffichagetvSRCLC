import { useState, useRef } from 'react';
import { ClubSettings, SponsorItem, ClubLogoItem, ClubPhotoItem, ClubEventItem } from '../../../types';
import { compressImageFile } from '../../../utils/imageCompressor';

// Code déplacé tel quel depuis AdminPanel.tsx, sans changement de comportement.
interface UseMediaUploadsAdminParams {
  clubSettings: ClubSettings;
  onUpdateClubSettings: (newSettings: ClubSettings) => void;
  sponsors: SponsorItem[];
  logos: ClubLogoItem[];
  photos: ClubPhotoItem[];
  events: ClubEventItem[];
  onUpdateSponsors: (newSponsors: SponsorItem[]) => void;
  onUpdateLogos: ((newLogos: ClubLogoItem[]) => void) | undefined;
  onUpdatePhotos: (newPhotos: ClubPhotoItem[]) => void;
  onUpdateEvents: (newEvents: ClubEventItem[]) => void;
}

export function useMediaUploadsAdmin({ clubSettings, onUpdateClubSettings, sponsors, logos, photos, events, onUpdateSponsors, onUpdateLogos, onUpdatePhotos, onUpdateEvents }: UseMediaUploadsAdminParams) {
  // État glisser-déposer pour le Logo du Club
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const logoFileInputRef = useRef<HTMLInputElement>(null);

  const [newSponsorName, setNewSponsorName] = useState('');
  const [newSponsorTagline, setNewSponsorTagline] = useState('');
  const [newSponsorTier, setNewSponsorTier] = useState<'gold' | 'silver' | 'bronze' | 'partenaire'>('silver');
  const [newSponsorFolder, setNewSponsorFolder] = useState('Partenaires Locaux');

  const [newLogoName, setNewLogoName] = useState('');
  const [newLogoCategory, setNewLogoCategory] = useState<'club' | 'sponsor' | 'comite' | 'ligue' | 'autre'>('club');

  const handleAddLogo = (logoUrl: string, isVideo = false) => {
    const newLogo: ClubLogoItem = {
      id: 'logo-' + Date.now(),
      name: newLogoName.trim() || (isVideo ? 'Vidéo Logo ' + (logos.length + 1) : 'Logo ' + (logos.length + 1)),
      logoUrl,
      category: newLogoCategory,
      isTransparent: !isVideo,
      isVideo,
      mediaType: isVideo ? 'video' : 'image',
    };
    if (onUpdateLogos) {
      onUpdateLogos([...logos, newLogo]);
    }
    setNewLogoName('');
  };

  // Drag & drop and batch upload states
  const [isDraggingPhotos, setIsDraggingPhotos] = useState(false);
  const [isDraggingSponsors, setIsDraggingSponsors] = useState(false);
  const [isDraggingLogos, setIsDraggingLogos] = useState(false);
  const [isDraggingEvents, setIsDraggingEvents] = useState(false);
  const [uploadFeedback, setUploadFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [newPhotoTitle, setNewPhotoTitle] = useState('');
  const [newPhotoFolder, setNewPhotoFolder] = useState('Équipe Fanion');
  const [newPhotoCaption, setNewPhotoCaption] = useState('');

  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventTime, setNewEventTime] = useState('');
  const [newEventLocation, setNewEventLocation] = useState(clubSettings.gymnasiumDefault);
  const [newEventDesc, setNewEventDesc] = useState('');
  const [newEventBadge, setNewEventBadge] = useState('Soirée Club');

  const cleanNameFromFileName = (fileName: string): string => {
    const withoutExt = fileName.replace(/\.[^/.]+$/, '');
    const cleaned = withoutExt
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!cleaned) return 'Élément';
    return cleaned
      .split(' ')
      .map((w) => (w.length > 0 ? w.charAt(0).toUpperCase() + w.slice(1) : ''))
      .join(' ');
  };

  // Upload file asynchronously via server streaming endpoint (prevents browser RAM exhaustion / crash)
  const uploadSingleFile = async (file: File): Promise<{ url: string; isVideo: boolean; fileName: string }> => {
    const isVideo = file.type.startsWith('video/') || /\.(mp4|webm|mov|ogg|m4v)$/i.test(file.name);

    // 1. Pour les vidéos et gros fichiers : Flux binaire direct (PUT) vers R2 (contourne l'erreur 413)
    if (isVideo || file.size > 2 * 1024 * 1024) {
      try {
        const uploadUrl = `/api/upload?name=${encodeURIComponent(file.name)}&type=${encodeURIComponent(file.type || 'video/mp4')}`;
        const res = await fetch(uploadUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': file.type || 'application/octet-stream',
            'X-Filename': encodeURIComponent(file.name),
          },
          body: file,
        });

        if (res.ok) {
          const data = await res.json();
          if (data.url) {
            return {
              url: data.url,
              isVideo: data.mediaType === 'video' || isVideo,
              fileName: data.fileName || file.name,
            };
          }
        }
      } catch (err) {
        console.warn('Upload flux binaire (PUT) échoué, essai POST standard:', err);
      }
    }

    // 2. Upload standard POST FormData (images légères, logos classiques)
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          return {
            url: data.url,
            isVideo: data.mediaType === 'video' || isVideo,
            fileName: data.fileName || file.name,
          };
        }
      }
    } catch (err) {
      console.warn('Upload serveur direct indisponible, bascule sur ObjectURL/FileReader local:', err);
    }

    // 3. Safe local fallback with automatic image compression
    if (isVideo) {
      try {
        const blobUrl = URL.createObjectURL(file);
        return { url: blobUrl, isVideo: true, fileName: file.name };
      } catch {
        return { url: '', isVideo: true, fileName: file.name };
      }
    }

    try {
      const compressedUrl = await compressImageFile(file);
      return {
        url: compressedUrl,
        isVideo: false,
        fileName: file.name,
      };
    } catch {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve({
            url: (e.target?.result as string) || '',
            isVideo: false,
            fileName: file.name,
          });
        };
        reader.onerror = () => {
          resolve({
            url: URL.createObjectURL(file),
            isVideo: false,
            fileName: file.name,
          });
        };
        reader.readAsDataURL(file);
      });
    }
  };

  // Upload du logo officiel du club
  const handleLogoFileUpload = async (file: File) => {
    if (!file) return;
    setIsUploadingLogo(true);
    try {
      const res = await uploadSingleFile(file);
      if (res.url) {
        onUpdateClubSettings({
          ...clubSettings,
          logoUrl: res.url,
        });
      }
    } catch (err) {
      console.error('Erreur lors du téléversement du logo:', err);
    } finally {
      setIsUploadingLogo(false);
    }
  };

  // Upload multiple files in batch via server
  const uploadMultipleFiles = async (
    files: FileList | File[]
  ): Promise<Array<{ url: string; isVideo: boolean; fileName: string }>> => {
    const fileArray = Array.from(files).filter(
      (f) =>
        f.type.startsWith('image/') ||
        f.type.startsWith('video/') ||
        /\.(jpg|jpeg|png|webp|svg|gif|mp4|webm|mov|m4v)$/i.test(f.name)
    );
    if (fileArray.length === 0) return [];

    // Téléversement individuel fichier par fichier (idéal pour le streaming R2 sans saturation de payload)
    const results: Array<{ url: string; isVideo: boolean; fileName: string }> = [];
    for (const f of fileArray) {
      try {
        const single = await uploadSingleFile(f);
        results.push(single);
      } catch (err) {
        console.warn('Erreur téléversement fichier:', f.name, err);
      }
    }
    return results;
  };

  // Batch upload Photos & Videos (Multiple files & Drag-and-Drop)
  const handleBatchPhotosUpload = async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter(
      (f) => f.type.startsWith('image/') || f.type.startsWith('video/') || /\.(jpg|jpeg|png|webp|svg|gif|mp4|webm|mov|m4v)$/i.test(f.name)
    );
    if (fileArray.length === 0) return;

    setUploadFeedback({
      message: `⏳ Téléversement de ${fileArray.length} fichier(s) en cours...`,
      type: 'success',
    });

    try {
      const results = await uploadMultipleFiles(fileArray);
      const now = Date.now();
      const newPhotos: ClubPhotoItem[] = results.map((res, idx) => {
        const title = fileArray.length === 1 && newPhotoTitle.trim()
          ? newPhotoTitle.trim()
          : cleanNameFromFileName(res.fileName);
        return {
          id: `photo-${now}-${idx}-${Math.random().toString(36).substring(2, 7)}`,
          title,
          categoryFolder: newPhotoFolder || 'Général',
          imageUrl: res.url,
          date: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
          caption: fileArray.length === 1 && newPhotoCaption.trim() ? newPhotoCaption.trim() : undefined,
          isVideo: res.isVideo,
          mediaType: res.isVideo ? 'video' : 'image',
        };
      });

      onUpdatePhotos([...newPhotos, ...photos]);
      setNewPhotoTitle('');
      setNewPhotoCaption('');
      setUploadFeedback({
        message: `✅ ${newPhotos.length} photo(s) / vidéo(s) ajoutée(s) avec succès !`,
        type: 'success',
      });
      setTimeout(() => setUploadFeedback(null), 4000);
    } catch (err) {
      setUploadFeedback({
        message: '❌ Erreur lors du chargement des fichiers',
        type: 'error',
      });
      setTimeout(() => setUploadFeedback(null), 4000);
    }
  };

  // Batch upload Sponsors & Partners
  const handleBatchSponsorsUpload = async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter(
      (f) => f.type.startsWith('image/') || f.type.startsWith('video/') || /\.(jpg|jpeg|png|webp|svg|gif|mp4|webm|mov|m4v)$/i.test(f.name)
    );
    if (fileArray.length === 0) return;

    setUploadFeedback({
      message: `⏳ Téléversement de ${fileArray.length} partenaire(s) en cours...`,
      type: 'success',
    });

    try {
      const results = await uploadMultipleFiles(fileArray);
      const now = Date.now();
      const newSponsors: SponsorItem[] = results.map((res, idx) => {
        const name = fileArray.length === 1 && newSponsorName.trim()
          ? newSponsorName.trim()
          : cleanNameFromFileName(res.fileName);
        return {
          id: `sponsor-${now}-${idx}-${Math.random().toString(36).substring(2, 7)}`,
          name,
          tier: newSponsorTier,
          logoUrl: res.url,
          tagline: fileArray.length === 1 && newSponsorTagline.trim() ? newSponsorTagline.trim() : undefined,
          categoryFolder: newSponsorFolder,
          isVideo: res.isVideo,
          mediaType: res.isVideo ? 'video' : 'image',
        };
      });

      onUpdateSponsors([...sponsors, ...newSponsors]);
      setNewSponsorName('');
      setNewSponsorTagline('');
      setUploadFeedback({
        message: `✅ ${newSponsors.length} partenaire(s) ajouté(s) avec succès !`,
        type: 'success',
      });
      setTimeout(() => setUploadFeedback(null), 4000);
    } catch (err) {
      setUploadFeedback({
        message: '❌ Erreur lors du chargement des partenaires',
        type: 'error',
      });
      setTimeout(() => setUploadFeedback(null), 4000);
    }
  };

  // Batch upload Logos
  const handleBatchLogosUpload = async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter(
      (f) => f.type.startsWith('image/') || f.type.startsWith('video/') || /\.(jpg|jpeg|png|webp|svg|gif|mp4|webm|mov|m4v)$/i.test(f.name)
    );
    if (fileArray.length === 0) return;

    setUploadFeedback({
      message: `⏳ Téléversement de ${fileArray.length} logo(s) en cours...`,
      type: 'success',
    });

    try {
      const results = await uploadMultipleFiles(fileArray);
      const now = Date.now();
      const newLogos: ClubLogoItem[] = results.map((res, idx) => {
        const name = fileArray.length === 1 && newLogoName.trim()
          ? newLogoName.trim()
          : cleanNameFromFileName(res.fileName);
        return {
          id: `logo-${now}-${idx}-${Math.random().toString(36).substring(2, 7)}`,
          name,
          logoUrl: res.url,
          category: newLogoCategory,
          isTransparent: !res.isVideo,
          isVideo: res.isVideo,
          mediaType: res.isVideo ? 'video' : 'image',
        };
      });

      if (onUpdateLogos) {
        onUpdateLogos([...logos, ...newLogos]);
      }
      setNewLogoName('');
      setUploadFeedback({
        message: `✅ ${newLogos.length} logo(s) ajouté(s) avec succès !`,
        type: 'success',
      });
      setTimeout(() => setUploadFeedback(null), 4000);
    } catch (err) {
      setUploadFeedback({
        message: '❌ Erreur lors du chargement des logos',
        type: 'error',
      });
      setTimeout(() => setUploadFeedback(null), 4000);
    }
  };

  // Batch upload Event Posters
  const handleBatchEventsUpload = async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter(
      (f) => f.type.startsWith('image/') || f.type.startsWith('video/') || /\.(jpg|jpeg|png|webp|svg|gif|mp4|webm|mov|m4v)$/i.test(f.name)
    );
    if (fileArray.length === 0) return;

    setUploadFeedback({
      message: `⏳ Téléversement de ${fileArray.length} affiche(s) en cours...`,
      type: 'success',
    });

    try {
      const results = await uploadMultipleFiles(fileArray);
      const now = Date.now();
      const newEvents: ClubEventItem[] = results.map((res, idx) => {
        const title = fileArray.length === 1 && newEventTitle.trim()
          ? newEventTitle.trim()
          : cleanNameFromFileName(res.fileName);
        return {
          id: `event-${now}-${idx}-${Math.random().toString(36).substring(2, 7)}`,
          title,
          date: newEventDate.trim() || 'Prochainement',
          time: newEventTime.trim() || undefined,
          location: newEventLocation.trim() || clubSettings.gymnasiumDefault,
          description: newEventDesc.trim() || 'Tous les licenciés et supporters sont les bienvenus !',
          badge: newEventBadge,
          categoryFolder: 'Événements',
          imageUrl: res.url,
          isVideo: res.isVideo,
          mediaType: res.isVideo ? 'video' : 'image',
        };
      });

      onUpdateEvents([...events, ...newEvents]);
      setNewEventTitle('');
      setNewEventDate('');
      setNewEventTime('');
      setNewEventDesc('');
      setUploadFeedback({
        message: `✅ ${newEvents.length} affiche(s) d'événement(s) ajoutée(s) !`,
        type: 'success',
      });
      setTimeout(() => setUploadFeedback(null), 4000);
    } catch (err) {
      setUploadFeedback({
        message: '❌ Erreur lors du chargement des affiches',
        type: 'error',
      });
      setTimeout(() => setUploadFeedback(null), 4000);
    }
  };

  // Generic image & video upload helper via server upload
  const handleMediaFileChange = (file: File, callback: (url: string, isVideo: boolean) => void) => {
    uploadSingleFile(file).then((res) => {
      callback(res.url, res.isVideo);
    });
  };

  // Legacy helper for places that only expect an image URL but can also receive videos
  const handleImageFileChange = (file: File, callback: (dataUrl: string) => void) => {
    uploadSingleFile(file).then((res) => {
      callback(res.url);
    });
  };

  // Add a new photo/video to photos folder
  const handleAddPhoto = (imageUrl: string, isVideo = false) => {
    const newPhoto: ClubPhotoItem = {
      id: 'photo-' + Date.now(),
      title: newPhotoTitle.trim() || (isVideo ? 'Vidéo Clip Club ' : 'Photo Club ') + (photos.length + 1),
      categoryFolder: newPhotoFolder,
      imageUrl,
      date: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
      caption: newPhotoCaption.trim() || undefined,
      isVideo,
      mediaType: isVideo ? 'video' : 'image',
    };
    onUpdatePhotos([newPhoto, ...photos]);
    setNewPhotoTitle('');
    setNewPhotoCaption('');
  };

  // Add a new sponsor
  const handleAddSponsor = (logoUrl: string, isVideo = false) => {
    const newSponsor: SponsorItem = {
      id: 'sponsor-' + Date.now(),
      name: newSponsorName.trim() || 'Nouveau Partenaire',
      tier: newSponsorTier,
      logoUrl,
      tagline: newSponsorTagline.trim() || undefined,
      categoryFolder: newSponsorFolder,
      isVideo,
      mediaType: isVideo ? 'video' : 'image',
    };
    onUpdateSponsors([...sponsors, newSponsor]);
    setNewSponsorName('');
    setNewSponsorTagline('');
  };

  // Add a new event
  const handleAddEvent = (imageUrl?: string, isVideo = false) => {
    if (!newEventTitle.trim()) return;
    const newEv: ClubEventItem = {
      id: 'event-' + Date.now(),
      title: newEventTitle.trim(),
      date: newEventDate.trim() || 'Prochainement',
      time: newEventTime.trim() || undefined,
      location: newEventLocation.trim() || clubSettings.gymnasiumDefault,
      description: newEventDesc.trim() || 'Tous les licenciés et supporters sont les bienvenus !',
      badge: newEventBadge,
      categoryFolder: 'Événements',
      imageUrl: imageUrl || 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&auto=format&fit=crop&q=80',
      isVideo,
      mediaType: isVideo ? 'video' : 'image',
    };
    onUpdateEvents([...events, newEv]);
    setNewEventTitle('');
    setNewEventDate('');
    setNewEventTime('');
    setNewEventDesc('');
  };

  return {
    isDraggingLogo,
    setIsDraggingLogo,
    isUploadingLogo,
    logoFileInputRef,
    newSponsorName,
    setNewSponsorName,
    newSponsorTier,
    setNewSponsorTier,
    newLogoName,
    setNewLogoName,
    newLogoCategory,
    setNewLogoCategory,
    isDraggingPhotos,
    setIsDraggingPhotos,
    isDraggingSponsors,
    setIsDraggingSponsors,
    isDraggingLogos,
    setIsDraggingLogos,
    isDraggingEvents,
    setIsDraggingEvents,
    uploadFeedback,
    setUploadFeedback,
    newPhotoTitle,
    setNewPhotoTitle,
    newPhotoFolder,
    setNewPhotoFolder,
    newEventTitle,
    setNewEventTitle,
    newEventDate,
    setNewEventDate,
    handleLogoFileUpload,
    uploadMultipleFiles,
    handleBatchPhotosUpload,
    handleBatchSponsorsUpload,
    handleBatchLogosUpload,
    handleBatchEventsUpload,
  };
}
