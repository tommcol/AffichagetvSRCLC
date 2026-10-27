import React from 'react';
import { Volume2, Award, Calendar, Trophy, Sparkles } from 'lucide-react';
import { MatchItem, SponsorItem } from '../types';

interface TickerTVProps {
  tickerText: string;
  nextMatch?: MatchItem;
  sponsors: SponsorItem[];
}

export const TickerTV: React.FC<TickerTVProps> = ({ tickerText, nextMatch, sponsors }) => {
  const topSponsorsNames = sponsors
    .filter((s) => s.tier === 'gold' || s.tier === 'silver')
    .map((s) => s.name)
    .join(' • ');

  return (
    <footer className="relative z-30 bg-slate-950 border-t border-slate-800/90 text-slate-200 py-2.5 px-4 overflow-hidden flex items-center shadow-2xl">
      {/* Static Label Badge on the left */}
      <div className="flex-shrink-0 flex items-center gap-2 pr-4 border-r border-slate-800 mr-3 bg-slate-950 z-10">
        <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-ping" />
        <span className="font-bebas text-sm tracking-wider uppercase text-orange-400 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" /> FLASH CLUB
        </span>
      </div>

      {/* Marquee Ticker Track */}
      <div className="overflow-hidden whitespace-nowrap flex-1 relative">
        <div className="inline-flex animate-marquee items-center gap-8 text-sm font-semibold text-slate-300">
          <span>{tickerText}</span>
          {nextMatch && (
            <span className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/40">
              <Calendar className="w-3.5 h-3.5" />
              Prochain Match Domicile : {nextMatch.category} vs {nextMatch.teamAway} ({nextMatch.time} au {nextMatch.gymnasium})
            </span>
          )}
          {topSponsorsNames && (
            <span className="inline-flex items-center gap-1.5 text-amber-400">
              <Award className="w-3.5 h-3.5" />
              Partenaires Privilégiés : {topSponsorsNames}
            </span>
          )}
          <span>🏀 Suivez tous les scores en direct sur FFBB.com & l'application FFBB officielle</span>
        </div>
      </div>

      {/* Fully Kiosk TV indicator Badge */}
      <div className="hidden md:flex items-center gap-2 pl-3 border-l border-slate-800 ml-3 text-xs text-slate-500 flex-shrink-0">
        <span className="w-2 h-2 rounded-full bg-emerald-500" />
        <span className="font-mono">Kiosk Mode</span>
      </div>
    </footer>
  );
};
