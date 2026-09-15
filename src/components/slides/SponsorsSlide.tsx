import React from 'react';
import { Award, Building2, ExternalLink, Heart, Sparkles, Star } from 'lucide-react';
import { SponsorItem, ClubSettings } from '../../types';

interface SponsorsSlideProps {
  sponsor?: SponsorItem;
  sponsors: SponsorItem[];
  itemIndex?: number;
  totalItems?: number;
  clubSettings: ClubSettings;
  onVideoEnded?: () => void;
  onVideoTimeUpdate?: (progressPercent: number) => void;
}

export const SponsorsSlide: React.FC<SponsorsSlideProps> = ({
  sponsor,
  sponsors,
  itemIndex,
  totalItems,
  clubSettings,
  onVideoEnded,
  onVideoTimeUpdate,
}) => {
  // Single sponsor per slide mode - 100% Pure Full-Screen Visual Image or Video without text overlays or cards
  if (sponsor) {
    const isVid = sponsor.isVideo || sponsor.mediaType === 'video' || sponsor.logoUrl?.includes('.mp4') || sponsor.logoUrl?.startsWith('data:video/');
    return (
      <div className="relative w-full h-full flex items-center justify-center p-4 md:p-8 bg-slate-950 overflow-hidden select-none">
        {/* Ambient dark background backdrop */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-black pointer-events-none" />

        {/* Optional blurred backdrop */}
        {!isVid && (
          <div
            className="absolute inset-0 bg-cover bg-center blur-3xl opacity-20 pointer-events-none scale-125"
            style={{ backgroundImage: `url(${sponsor.logoUrl})` }}
          />
        )}

        {/* Pure 100% Full-Screen Sponsor Image/Logo or Video */}
        {isVid ? (
          <video
            src={sponsor.logoUrl}
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
            className="relative z-10 max-h-full max-w-full object-contain rounded-2xl shadow-2xl transition-all duration-700"
          />
        ) : (
          <img
            src={sponsor.logoUrl}
            alt={sponsor.name}
            className="relative z-10 max-h-full max-w-full object-contain rounded-2xl shadow-2xl transition-all duration-700"
            referrerPolicy="no-referrer"
          />
        )}
      </div>
    );
  }

  // Grid mode fallback
  const goldSponsors = sponsors.filter((s) => s.tier === 'gold');
  const silverSponsors = sponsors.filter((s) => s.tier === 'silver');
  const otherSponsors = sponsors.filter((s) => s.tier === 'bronze' || s.tier === 'partenaire');

  return (
    <div className="w-full h-full flex flex-col justify-between p-6 md:p-10 max-w-7xl mx-auto">
      {/* Slide Header */}
      <div className="border-b border-slate-800 pb-5">
        <div className="flex items-center gap-2 text-amber-400 font-bold text-xs md:text-sm uppercase tracking-widest font-bebas">
          <Award className="w-4 h-4" /> SOUTIENS ET MÉCÈNES DU CLUB
        </div>
        <h2 className="text-3xl md:text-5xl font-black text-white font-bebas tracking-wide mt-1">
          MERCI À NOS PARTENAIRES & SPONSORS
        </h2>
        <p className="text-slate-400 text-sm mt-0.5">
          Ils s'engagent chaque jour aux côtés de nos jeunes basketteurs et de la vie du club
        </p>
      </div>

      {/* Main Content Area */}
      <div className="my-6 space-y-6 flex-1 overflow-y-auto pr-1">
        {/* GOLD / MAJOR SPONSORS */}
        {goldSponsors.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-black uppercase font-bebas flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 fill-amber-400" /> Partenaires Majeurs Officiels
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {goldSponsors.map((sp) => (
                <div
                  key={sp.id}
                  className="relative rounded-3xl p-6 bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-amber-950/20 border border-amber-500/30 shadow-xl flex items-center gap-5 hover:border-amber-400/50 transition-all"
                >
                  <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl bg-white p-3 flex items-center justify-center flex-shrink-0 shadow-md">
                    <img
                      src={sp.logoUrl}
                      alt={sp.name}
                      className="max-h-full max-w-full object-contain rounded-lg"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl md:text-2xl font-black text-white font-bebas tracking-wide truncate">
                        {sp.name}
                      </h3>
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-bold uppercase">
                        Gold
                      </span>
                    </div>
                    {sp.tagline && (
                      <p className="text-xs md:text-sm text-slate-300 font-medium mt-1 leading-snug">
                        {sp.tagline}
                      </p>
                    )}
                    {sp.categoryFolder && (
                      <span className="inline-block text-[11px] text-amber-400/80 font-mono mt-2">
                        📁 Dossier : {sp.categoryFolder}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SILVER & LOCAL SPONSORS */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-xs font-black uppercase font-bebas flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-orange-400" /> Artisans, Commerçants & Équipementiers Locaux
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...silverSponsors, ...otherSponsors].map((sp) => (
              <div
                key={sp.id}
                className="rounded-2xl p-4 bg-slate-900/60 border border-slate-800/80 flex flex-col items-center text-center shadow-lg hover:border-slate-700 transition-all"
              >
                <div className="w-20 h-16 bg-white rounded-xl p-2 flex items-center justify-center mb-3 shadow-inner">
                  <img
                    src={sp.logoUrl}
                    alt={sp.name}
                    className="max-h-full max-w-full object-contain rounded-md"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <h4 className="font-bebas text-base font-black text-white truncate w-full tracking-wide">
                  {sp.name}
                </h4>
                {sp.tagline && (
                  <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-tight">
                    {sp.tagline}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Slide Footer with call to action */}
      <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-800/70">
        <span className="flex items-center gap-2">
          <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
          Vous souhaitez devenir sponsor du club ? Contactez-nous à la buvette ou par email à contact@{clubSettings.shortName.toLowerCase().replace(/\s+/g, '')}.fr
        </span>
        <span className="font-mono text-orange-400">Total : {sponsors.length} Partenaires</span>
      </div>
    </div>
  );
};
