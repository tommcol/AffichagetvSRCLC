import React, { useState } from 'react';
import { Cake, Sparkles, Gift, PartyPopper, Calendar, LayoutGrid, Image as ImageIcon } from 'lucide-react';
import { BirthdayItem, ClubSettings } from '../../types';

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
  const [layoutMode, setLayoutMode] = useState<'poster' | 'cards'>('poster');

  // Title logic: check if there are feminine categories or custom
  const hasFeminine = birthdays.some((b) =>
    /u[0-9]+f|filles|féminine|femme/i.test(b.teamCategory) ||
    /louise|emma|fantine|juliette|clara|sarah|chloe|manon|jade|lisa|lea/i.test(b.fullName)
  );
  
  const defaultHeaderTitle = hasFeminine && birthdays.every((b) =>
    /u[0-9]+f|filles|féminine|femme/i.test(b.teamCategory) ||
    /louise|emma|fantine|juliette|clara|sarah|chloe|manon|jade|lisa|lea/i.test(b.fullName)
  )
    ? 'Elles fêtent leurs anniversaire cette semaine'
    : 'Ils & Elles fêtent leur anniversaire cette semaine';

  return (
    <div className="relative w-full h-full flex flex-col justify-between overflow-hidden bg-slate-950">
      {/* Background Image - Poster Style */}
      {backgroundUrl ? (
        <div className="absolute inset-0 z-0 pointer-events-none">
          <img
            src={backgroundUrl}
            alt="Support Visuel Anniversaires"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          {/* Subtle gradient vignette to guarantee text legibility on left and logo on right */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/40 to-black/70" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />
        </div>
      ) : (
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-purple-950 via-slate-950 to-pink-950" />
      )}

      {/* Slide Layout Container */}
      <div className="relative z-10 w-full h-full flex flex-col justify-between p-6 md:p-12 lg:p-16">
        
        {/* Top Header - Poster Title (Matching Anniversaire j1.png) */}
        <div className="w-full flex items-start justify-between">
          <div className="max-w-4xl">
            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white font-fredoka tracking-wide leading-tight drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)]">
              {defaultHeaderTitle}
            </h1>
          </div>

          {/* Discreet layout switcher */}
          <div className="hidden sm:flex items-center gap-1 bg-black/40 backdrop-blur-md border border-white/20 rounded-full p-1 text-xs text-white/80">
            <button
              onClick={() => setLayoutMode('poster')}
              className={`px-3 py-1 rounded-full font-bold flex items-center gap-1.5 transition-all ${
                layoutMode === 'poster' ? 'bg-pink-600 text-white shadow-md' : 'hover:bg-white/10'
              }`}
              title="Affiche Poster (Style Visual J1)"
            >
              <ImageIcon className="w-3.5 h-3.5" /> Affiche
            </button>
            <button
              onClick={() => setLayoutMode('cards')}
              className={`px-3 py-1 rounded-full font-bold flex items-center gap-1.5 transition-all ${
                layoutMode === 'cards' ? 'bg-pink-600 text-white shadow-md' : 'hover:bg-white/10'
              }`}
              title="Grille de Cartes"
            >
              <LayoutGrid className="w-3.5 h-3.5" /> Cartes
            </button>
          </div>
        </div>

        {/* Center Content: Poster Mode vs Cards Mode */}
        {layoutMode === 'poster' ? (
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
        ) : (
          /* Cards Mode */
          <div className="my-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 w-full">
            {birthdays.map((b, idx) => (
              <div
                key={b.id}
                className="relative rounded-3xl p-6 border border-white/20 shadow-2xl backdrop-blur-md bg-black/60 flex flex-col items-center text-center"
              >
                <Cake className="w-10 h-10 text-pink-400 mb-2" />
                <h3 className="text-2xl font-black text-white font-bebas tracking-wide">
                  {b.fullName}
                </h3>
                <div className="px-3 py-1 rounded-xl bg-pink-950/80 border border-pink-500/40 text-xs font-bold text-pink-200 mt-2">
                  {b.teamCategory}
                </div>
                {b.birthDayFormatted && (
                  <div className="mt-4 text-xs text-amber-300 font-medium flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    <span>{b.birthDayFormatted}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Bottom Right - Club Logo (Matching Anniversaire j1.png) */}
        <div className="w-full flex items-end justify-between pt-4">
          <div className="text-xs text-slate-300/80 font-medium flex items-center gap-2 drop-shadow-md">
            <Sparkles className="w-4 h-4 text-pink-400" />
            <span>N'oubliez pas de leur souhaiter un bon anniversaire au gymnase !</span>
          </div>

          {clubSettings?.logoUrl ? (
            <div className="relative group">
              <img
                src={clubSettings.logoUrl}
                alt={clubSettings.name}
                className="h-16 sm:h-24 md:h-32 object-contain filter drop-shadow-[0_6px_16px_rgba(0,0,0,0.9)] max-w-[200px]"
                referrerPolicy="no-referrer"
              />
            </div>
          ) : (
            <div className="bg-black/80 border border-white/20 p-3 rounded-2xl text-white font-black text-sm tracking-widest font-bebas">
              {clubSettings?.shortName || 'SRC BASKET'}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

