import React, { useState, useEffect } from 'react';
import { Camera, Calendar, User, Sparkles } from 'lucide-react';
import { ClubPhotoItem } from '../../types';

interface PhotosSlideProps {
  photo?: ClubPhotoItem;
  photos: ClubPhotoItem[];
  itemIndex?: number;
  totalItems?: number;
  hideTextOverlay?: boolean;
  onVideoEnded?: () => void;
  onVideoTimeUpdate?: (progressPercent: number) => void;
}

export const PhotosSlide: React.FC<PhotosSlideProps> = ({
  photo,
  photos,
  itemIndex,
  totalItems,
  hideTextOverlay = true,
  onVideoEnded,
  onVideoTimeUpdate,
}) => {
  const [activePhotoIndex, setActivePhotoIndex] = useState<number>(0);

  useEffect(() => {
    if (photo || photos.length <= 1) return;
    const interval = setInterval(() => {
      setActivePhotoIndex((prev) => (prev + 1) % photos.length);
    }, 5500);
    return () => clearInterval(interval);
  }, [photo, photos.length]);

  const currentPhoto = photo || photos[activePhotoIndex] || photos[0];
  const currentIndex = typeof itemIndex === 'number' ? itemIndex : activePhotoIndex;
  const count = typeof totalItems === 'number' ? totalItems : photos.length;

  if (!currentPhoto) {
    return (
      <div className="w-full h-full flex items-center justify-center p-8 text-center text-slate-400 bg-slate-950">
        <div>
          <Camera className="w-16 h-16 mx-auto mb-4 text-slate-600" />
          <h3 className="text-2xl font-bebas text-slate-300">Aucune photo dans le dossier</h3>
          <p className="text-sm">Déposez vos photos dans l'espace de configuration pour alimenter le carrousel TV.</p>
        </div>
      </div>
    );
  }

  const isVid = currentPhoto.isVideo || currentPhoto.mediaType === 'video' || currentPhoto.imageUrl?.includes('.mp4') || currentPhoto.imageUrl?.startsWith('data:video/');

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-950 flex items-center justify-center select-none">
      {/* 1. Blurred Ambient Backdrop for non-16:9 images */}
      {!isVid && (
        <div
          className="absolute inset-0 bg-cover bg-center blur-2xl opacity-40 scale-110"
          style={{ backgroundImage: `url(${currentPhoto.imageUrl})` }}
        />
      )}

      {/* 2. Full-Screen High-Resolution Main Photo or Video */}
      <div className="relative w-full h-full flex items-center justify-center z-10">
        {isVid ? (
          <video
            key={currentPhoto.id}
            src={currentPhoto.imageUrl}
            autoPlay
            loop={!onVideoEnded}
            muted
            playsInline
            onTimeUpdate={(e) => {
              const vid = e.currentTarget;
              if (onVideoTimeUpdate && vid.duration) {
                onVideoTimeUpdate((vid.currentTime / vid.duration) * 100);
              }
            }}
            onEnded={onVideoEnded}
            className="w-full h-full object-contain md:object-cover transition-all duration-1000 ease-out"
          />
        ) : (
          <img
            key={currentPhoto.id}
            src={currentPhoto.imageUrl}
            alt={currentPhoto.title}
            className="w-full h-full object-contain md:object-cover transition-all duration-1000 ease-out"
            referrerPolicy="no-referrer"
          />
        )}
      </div>

        {/* Subtle Vignette overlay only if text is enabled */}
        {!hideTextOverlay && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/30 pointer-events-none" />
        )}

      {/* 3. Sleek Broadcast Caption Overlay (Hidden when hideTextOverlay is TRUE) */}
      {!hideTextOverlay && (
        <div className="absolute bottom-8 left-8 right-8 z-20 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 pointer-events-none">
          <div className="max-w-3xl">
            {currentPhoto.categoryFolder && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-600 text-white text-xs font-black uppercase tracking-wider mb-2 font-bebas shadow-lg">
                <Sparkles className="w-3 h-3" />
                <span>{currentPhoto.categoryFolder}</span>
              </div>
            )}

            <h2 className="text-3xl md:text-5xl font-black text-white font-bebas tracking-wide drop-shadow-xl leading-tight">
              {currentPhoto.title}
            </h2>

            {currentPhoto.caption && (
              <p className="text-slate-200 text-sm md:text-lg font-medium mt-1 drop-shadow max-w-2xl">
                {currentPhoto.caption}
              </p>
            )}

            <div className="flex items-center gap-4 text-xs md:text-sm text-slate-300 mt-2 font-medium drop-shadow">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-orange-400" />
                {currentPhoto.date}
              </span>
              {currentPhoto.photographer && (
                <span className="flex items-center gap-1.5 text-slate-400">
                  <User className="w-3.5 h-3.5" />
                  Photo : {currentPhoto.photographer}
                </span>
              )}
            </div>
          </div>

          {/* Slide Counter Indicator */}
          <div className="self-end px-3.5 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-xs text-slate-300 font-mono">
            Photo {currentIndex + 1} / {count}
          </div>
        </div>
      )}
    </div>
  );
};
