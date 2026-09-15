import React from 'react';
import { Cake, Sparkles, Calendar } from 'lucide-react';
import { BirthdayItem, ClubSettings } from '../../types';
import { isVideoMedia } from '../../utils/mediaUtils';

interface BirthdaysSlideProps {
  birthdays: BirthdayItem[];
  backgroundUrl?: string;
  clubSettings?: ClubSettings;
}

export const BirthdaysSlide: React.FC<BirthdaysSlideProps> = ({
  birthdays,
  backgroundUrl,
  clubSettings,
}) => {
  return (
    <div className="relative w-full h-full flex flex-col justify-between overflow-hidden bg-slate-950">
      {/* Background Image / Video - Full-bleed 16:9 Screen (Contained / Fitted so nothing is cropped) */}
      {backgroundUrl ? (
        <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center overflow-hidden">
          {isVideoMedia(backgroundUrl) ? (
            <>
              {/* Background ambient fill */}
              <video
                src={backgroundUrl}
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover blur-md opacity-40 scale-105"
              />
              {/* Main crisp uncropped 16:9 video */}
              <video
                src={backgroundUrl}
                autoPlay
                loop
                muted
                playsInline
                className="relative z-0 w-full h-full max-w-full max-h-full object-contain"
              />
            </>
          ) : (
            <>
              <img
                src={backgroundUrl}
                alt="Support Visuel Anniversaires"
                className="absolute inset-0 w-full h-full object-cover blur-md opacity-40 scale-105"
                referrerPolicy="no-referrer"
              />
              <img
                src={backgroundUrl}
                alt="Support Visuel Anniversaires"
                className="relative z-0 w-full h-full max-w-full max-h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </>
          )}
          {/* Subtle gradient vignette to guarantee text legibility on left */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/35 to-black/30 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/50 pointer-events-none" />
        </div>
      ) : (
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-purple-950 via-slate-950 to-pink-950" />
      )}

      {/* Slide Layout Container */}
      <div className="relative z-10 w-full h-full flex flex-col justify-between p-6 md:p-12 lg:p-16">
        
        {/* Top Header - Full Width Title (Enlarged) */}
        <div className="w-full flex items-center justify-center text-center">
          <h1 className="w-full text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black text-white font-fredoka tracking-wide leading-tight drop-shadow-[0_6px_24px_rgba(0,0,0,0.98)] whitespace-normal md:whitespace-nowrap">
            Les anniversaires de la semaine
          </h1>
        </div>

        {/* Center Content: Poster Mode list of names */}
        <div className="my-auto w-full flex flex-col justify-center items-start pl-2 md:pl-6 max-w-2xl">
          {birthdays.length === 0 ? (
            <div className="bg-black/60 border border-white/20 backdrop-blur-md rounded-3xl p-8 text-white">
              <Cake className="w-12 h-12 text-pink-400 mb-2" />
              <h3 className="text-2xl font-bold font-bebas">Aucun anniversaire cette semaine</h3>
              <p className="text-sm text-slate-300 mt-1">
                Importez votre fichier d'adhérents dans l'administration pour remplir cette affiche automatiquement.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3 md:gap-5">
              {birthdays.map((b) => {
                // Format name and team category cleanly like "Louise U9" or "Juliette U13F"
                const cleanCategory = b.teamCategory.replace(/Féminines|Masculins|Garçons|Filles/gi, '').trim();
                return (
                  <div
                    key={b.id}
                    className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white font-sans tracking-wide leading-none drop-shadow-[0_4px_14px_rgba(0,0,0,0.95)] flex items-center gap-4"
                  >
                    <span className="text-white hover:text-pink-300 transition-colors">
                      {b.fullName} {cleanCategory}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Empty bottom space to leave view clear */}
        <div className="w-full h-4" />

      </div>
    </div>
  );
};

