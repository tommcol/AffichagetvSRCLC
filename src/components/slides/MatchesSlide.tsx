import React from 'react';
import { Calendar, MapPin, Clock, Home, Plane, Download, CheckCircle2, XCircle, AlertCircle, Share2 } from 'lucide-react';
import { MatchItem, ClubSettings } from '../../types';

interface MatchesSlideProps {
  matches: MatchItem[];
  clubSettings: ClubSettings;
  onDownloadVisual: () => void;
  backgroundUrl?: string;
  hideShareButton?: boolean;
}

export const MatchesSlide: React.FC<MatchesSlideProps> = ({ matches, clubSettings, onDownloadVisual, backgroundUrl, hideShareButton }) => {
  const homeMatches = matches.filter((m) => m.isHomeMatch);
  const awayMatches = matches.filter((m) => !m.isHomeMatch);

  return (
    <div className="relative w-full h-full flex flex-col justify-between overflow-hidden">
      {/* Optional custom visual background support */}
      {backgroundUrl && (
        <div className="absolute inset-0 z-0 pointer-events-none">
          <img
            src={backgroundUrl}
            alt="Support Visuel Matchs"
            className="w-full h-full object-cover opacity-25"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-slate-950/70" />
        </div>
      )}
      <div className="relative z-10 w-full h-full flex flex-col justify-between p-6 md:p-10 max-w-7xl mx-auto">
      {/* Slide Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5 text-orange-400 font-bold text-xs md:text-sm uppercase tracking-widest font-bebas">
            <Calendar className="w-4 h-4" /> PROGRAMME DU WEEK-END • FFBB
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-white font-bebas tracking-wide mt-1">
            LES RENCONTRES À VENIR DU CLUB
          </h2>
          <p className="text-slate-400 text-sm mt-0.5">
            Venez encourager nos équipes à domicile ou suivez les déplacements !
          </p>
        </div>

        {/* Passerelle Réseaux Sociaux Button */}
        {!hideShareButton && (
          <button
            onClick={onDownloadVisual}
            className="self-start sm:self-center px-4 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 via-rose-600 to-orange-600 hover:from-pink-500 hover:to-orange-500 text-white font-bold text-xs md:text-sm flex items-center gap-2 shadow-lg shadow-pink-600/20 transition-all hover:scale-105"
            id="btn-download-matches-visual"
            title="Passerelle Réseaux Sociaux : Générer pour Instagram, TikTok et Facebook"
          >
            <Share2 className="w-4 h-4" />
            <span>Passerelle Réseaux (Insta • TikTok • FB)</span>
          </button>
        )}
      </div>

      {/* Main Grid: Domicile vs Extérieur */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 my-6 flex-1 items-start">
        {/* DOMICILE COLUMN */}
        <div className="bg-slate-900/70 border border-slate-800/90 rounded-3xl p-5 shadow-xl backdrop-blur-sm flex flex-col">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
                <Home className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-lg font-black uppercase font-bebas text-white tracking-wide">
                  À DOMICILE • {clubSettings.gymnasiumDefault}
                </h3>
                <span className="text-xs text-slate-400">Buvette & supporters bienvenus</span>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-orange-500/15 text-orange-300 text-xs font-bold">
              {homeMatches.length} Matchs
            </span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto pr-1">
            {homeMatches.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">
                Aucun match à domicile ce weekend
              </div>
            ) : (
              homeMatches.map((m) => {
                const isFinished = m.status === 'finished';
                const isWin = m.result === 'win';
                const isLoss = m.result === 'loss';

                return (
                  <div
                    key={m.id}
                    className={`relative p-4 rounded-2xl border transition-all ${
                      isFinished
                        ? isWin
                          ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-50'
                          : 'bg-rose-950/40 border-rose-500/50 text-rose-50'
                        : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-semibold mb-2">
                      <span className="px-2.5 py-0.5 rounded-md bg-slate-800 text-orange-300 font-bold">
                        {m.category}
                      </span>
                      <span className="text-slate-400">{m.competition}</span>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1">
                        <div className="text-base font-black text-white font-bebas tracking-wide">
                          {m.teamHome} <span className="text-orange-400">VS</span> {m.teamAway}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                          <span className="flex items-center gap-1 font-mono text-slate-300">
                            <Clock className="w-3.5 h-3.5 text-orange-400" />
                            {m.time}
                          </span>
                          <span className="flex items-center gap-1 truncate">
                            <MapPin className="w-3.5 h-3.5 text-slate-500" />
                            {m.gymnasium}
                          </span>
                        </div>
                      </div>

                      {/* Status / Score / Result Badge */}
                      <div>
                        {isFinished ? (
                          <div
                            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase font-bebas flex items-center gap-1.5 shadow-md ${
                              isWin
                                ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                                : 'bg-rose-600 text-white shadow-rose-600/30'
                            }`}
                          >
                            {isWin ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                            <span>
                              {isWin ? 'Victoire' : 'Défaite'} {m.homeScore}:{m.awayScore}
                            </span>
                          </div>
                        ) : (
                          <div className="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs font-mono font-bold text-amber-300">
                            À venir
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* EXTÉRIEUR COLUMN */}
        <div className="bg-slate-900/70 border border-slate-800/90 rounded-3xl p-5 shadow-xl backdrop-blur-sm flex flex-col">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                <Plane className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-lg font-black uppercase font-bebas text-white tracking-wide">
                  À L'EXTÉRIEUR • DÉPLACEMENTS
                </h3>
                <span className="text-xs text-slate-400">Soutenons nos joueurs en déplacement</span>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-300 text-xs font-bold">
              {awayMatches.length} Matchs
            </span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto pr-1">
            {awayMatches.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">
                Aucun match à l'extérieur ce weekend
              </div>
            ) : (
              awayMatches.map((m) => {
                const isFinished = m.status === 'finished';
                const isWin = m.result === 'win';
                const isLoss = m.result === 'loss';

                return (
                  <div
                    key={m.id}
                    className={`relative p-4 rounded-2xl border transition-all ${
                      isFinished
                        ? isWin
                          ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-50'
                          : 'bg-rose-950/40 border-rose-500/50 text-rose-50'
                        : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-semibold mb-2">
                      <span className="px-2.5 py-0.5 rounded-md bg-slate-800 text-blue-300 font-bold">
                        {m.category}
                      </span>
                      <span className="text-slate-400">{m.competition}</span>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1">
                        <div className="text-base font-black text-white font-bebas tracking-wide">
                          {m.teamHome} <span className="text-slate-500">VS</span> {m.teamAway}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                          <span className="flex items-center gap-1 font-mono text-slate-300">
                            <Clock className="w-3.5 h-3.5 text-blue-400" />
                            {m.time}
                          </span>
                          <span className="flex items-center gap-1 truncate">
                            <MapPin className="w-3.5 h-3.5 text-slate-500" />
                            {m.gymnasium} ({m.city})
                          </span>
                        </div>
                      </div>

                      {/* Status / Score / Result Badge */}
                      <div>
                        {isFinished ? (
                          <div
                            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase font-bebas flex items-center gap-1.5 shadow-md ${
                              isWin
                                ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                                : 'bg-rose-600 text-white shadow-rose-600/30'
                            }`}
                          >
                            {isWin ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                            <span>
                              {isWin ? 'Victoire' : 'Défaite'} {m.homeScore}:{m.awayScore}
                            </span>
                          </div>
                        ) : (
                          <div className="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs font-mono font-bold text-slate-300">
                            À venir
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Footer hint */}
      <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-800/70">
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" /> Vert : Victoire
          <span className="w-2 h-2 rounded-full bg-rose-500 ml-2" /> Rouge : Défaite
        </span>
        <span className="font-mono">Synchronisation FFBB automatique active</span>
      </div>
      </div>
    </div>
  );
};
