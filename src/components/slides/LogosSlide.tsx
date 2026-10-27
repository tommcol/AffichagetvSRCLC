import React from 'react';
import { Award } from 'lucide-react';
import { ClubLogoItem } from '../../types';
import { isVideoMedia } from '../../utils/mediaUtils';

interface LogosSlideProps {
  logo?: ClubLogoItem;
  logos: ClubLogoItem[];
  itemIndex?: number;
  totalItems?: number;
  onVideoEnded?: () => void;
  onVideoTimeUpdate?: (progressPercent: number) => void;
}

export const LogosSlide: React.FC<LogosSlideProps> = ({
  logo,
  logos,
  itemIndex,
  totalItems,
  onVideoEnded,
  onVideoTimeUpdate,
}) => {
  // Single logo per slide mode - 100% Pure Full-Screen Visual Image or Video without text overlays or floating pills
  if (logo) {
    const isVid = Boolean(
      logo.isVideo ||
      logo.mediaType === 'video' ||
      isVideoMedia(logo.logoUrl)
    );

    return (
      <div className="relative w-full h-full flex items-center justify-center p-4 md:p-8 bg-slate-950 overflow-hidden select-none">
        {/* Ambient dark background backdrop */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-black pointer-events-none" />

        {/* Optional blurred backdrop */}
        {!isVid && (
          <div
            className="absolute inset-0 bg-cover bg-center blur-3xl opacity-20 pointer-events-none scale-125"
            style={{ backgroundImage: `url(${logo.logoUrl})` }}
          />
        )}

        {/* Pure 100% Full-Screen Logo Image or Video */}
        {isVid ? (
          <video
            key={`logo-vid-${logo.id || logo.logoUrl}`}
            src={logo.logoUrl}
            autoPlay
            loop={!onVideoEnded}
            muted
            playsInline
            preload="auto"
            onCanPlay={(e) => {
              e.currentTarget.play().catch(() => {});
            }}
            onTimeUpdate={(e) => {
              const vid = e.currentTarget;
              if (onVideoTimeUpdate && vid.duration) {
                onVideoTimeUpdate((vid.currentTime / vid.duration) * 100);
              }
            }}
            onEnded={onVideoEnded}
            onError={() => {
              console.warn('Erreur lecture vidéo logo, passage au suivant');
              if (onVideoEnded) onVideoEnded();
            }}
            className="relative z-10 max-h-full max-w-full object-contain rounded-2xl shadow-2xl transition-all duration-700"
          />
        ) : (
          <img
            key={`logo-img-${logo.id || logo.logoUrl}`}
            src={logo.logoUrl}
            alt={logo.name}
            className="relative z-10 max-h-full max-w-full object-contain rounded-2xl shadow-2xl transition-all duration-700"
            referrerPolicy="no-referrer"
          />
        )}
      </div>
    );
  }

  // Fallback Grid display of all logos
  return (
    <div className="w-full h-full flex flex-col justify-between p-6 md:p-10 max-w-7xl mx-auto">
      {/* Slide Header */}
      <div className="border-b border-slate-800 pb-5">
        <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs md:text-sm uppercase tracking-widest font-bebas">
          <Award className="w-4 h-4" /> BANQUE LOGOS CLUB & ORGANISMES
        </div>
        <h2 className="text-3xl md:text-5xl font-black text-white font-bebas tracking-wide mt-1">
          NOS VISUELS ET INSTITUTIONS
        </h2>
        <p className="text-slate-400 text-sm mt-0.5">
          Logos et animations du club, de nos partenaires ainsi que des instances départementales et régionales
        </p>
      </div>

      {/* Main Content Area */}
      <div className="my-6 flex-1 overflow-y-auto pr-1">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {logos.map((lg) => {
            const isVid = lg.isVideo || lg.mediaType === 'video' || lg.logoUrl?.includes('.mp4') || lg.logoUrl?.startsWith('data:video/');
            return (
              <div
                key={lg.id}
                className="rounded-2xl p-4 bg-slate-900/60 border border-slate-800/80 flex flex-col items-center text-center shadow-lg hover:border-slate-700 transition-all overflow-hidden"
              >
                <div className="w-24 h-20 bg-slate-950 rounded-xl p-2 flex items-center justify-center mb-3 shadow-inner relative overflow-hidden">
                  {isVid ? (
                    <video
                      src={lg.logoUrl}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="max-h-full max-w-full object-contain rounded-lg"
                    />
                  ) : (
                    <img
                      src={lg.logoUrl}
                      alt={lg.name}
                      className="max-h-full max-w-full object-contain rounded-md"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  {isVid && (
                    <span className="absolute bottom-1 right-1 text-[8px] font-black bg-cyan-500 text-slate-950 px-1 py-0.5 rounded uppercase">
                      VIDÉO
                    </span>
                  )}
                </div>
                <h4 className="font-bebas text-sm font-black text-white truncate w-full tracking-wide">
                  {lg.name}
                </h4>
                <span className="text-[10px] text-cyan-400 font-bold uppercase mt-1 px-2 py-0.5 rounded-full bg-cyan-950/40 border border-cyan-800/40">
                  {lg.category}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
