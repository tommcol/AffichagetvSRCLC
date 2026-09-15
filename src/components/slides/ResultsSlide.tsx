import React from 'react';
import { Trophy, CheckCircle2, XCircle, Download, Award, TrendingUp, Sparkles, Share2 } from 'lucide-react';
import { MatchItem, ClubSettings } from '../../types';

interface ResultsSlideProps {
  results: MatchItem[];
  clubSettings: ClubSettings;
  onDownloadVisual: () => void;
  backgroundUrl?: string;
  hideShareButton?: boolean;
}

export const ResultsSlide: React.FC<ResultsSlideProps> = ({ results, clubSettings, onDownloadVisual, backgroundUrl, hideShareButton }) => {
  const totalWins = results.filter((r) => r.result === 'win').length;
  const totalLosses = results.filter((r) => r.result === 'loss').length;
  const winRate = results.length > 0 ? Math.round((totalWins / results.length) * 100) : 0;

  return (
    <div className="relative w-full h-full flex flex-col justify-between overflow-hidden">
      {backgroundUrl && (
        <div className="absolute inset-0 z-0 pointer-events-none">
          <img
            src={backgroundUrl}
            alt="Support Visuel Résultats"
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
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs md:text-sm uppercase tracking-widest font-bebas">
            <Trophy className="w-4 h-4" /> BILAN & SCORES • FFBB
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-white font-bebas tracking-wide mt-1">
            RÉSULTATS DU WEEK-END PRÉCÉDENT
          </h2>
          <p className="text-slate-400 text-sm mt-0.5">
            Retrouvez tous les scores de nos équipes du weekend passé
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Weekend Summary Pill */}
          <div className="flex items-center gap-3 bg-slate-900/90 border border-slate-800 px-4 py-2 rounded-2xl">
            <div className="flex items-center gap-1.5 text-emerald-400 font-black text-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>{totalWins} Victoires</span>
            </div>
            <span className="text-slate-700">|</span>
            <div className="flex items-center gap-1.5 text-rose-400 font-black text-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>{totalLosses} Défaites</span>
            </div>
          </div>

          {/* Passerelle Réseaux Sociaux Button */}
          {!hideShareButton && (
            <button
              onClick={onDownloadVisual}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 via-rose-600 to-emerald-600 hover:from-pink-500 hover:to-emerald-500 text-white font-bold text-xs md:text-sm flex items-center gap-2 shadow-lg shadow-pink-600/20 transition-all hover:scale-105"
              id="btn-download-results-visual"
              title="Passerelle Réseaux Sociaux : Exporter pour Instagram, TikTok et Facebook"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">Passerelle Réseaux (Insta • TikTok • FB)</span>
              <span className="sm:hidden">Réseaux</span>
            </button>
          )}
        </div>
      </div>

      {/* Results Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 my-6 flex-1 items-start overflow-y-auto pr-1">
        {results.map((r) => {
          const isWin = r.result === 'win';

          return (
            <div
              key={r.id}
              className={`relative rounded-3xl p-5 border shadow-xl backdrop-blur-md transition-all flex flex-col justify-between ${
                isWin
                  ? 'bg-gradient-to-br from-emerald-950/60 via-slate-900/90 to-slate-950 border-emerald-500/50 shadow-emerald-950/30'
                  : 'bg-gradient-to-br from-rose-950/60 via-slate-900/90 to-slate-950 border-rose-500/50 shadow-rose-950/30'
              }`}
            >
              {/* Category & Badge Top */}
              <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-800">
                <span className="px-3 py-1 rounded-xl text-xs font-black uppercase font-bebas tracking-wide bg-slate-800 text-white">
                  {r.category}
                </span>

                <span
                  className={`px-3 py-1 rounded-xl text-xs font-black uppercase font-bebas flex items-center gap-1.5 shadow-md ${
                    isWin
                      ? 'bg-emerald-500 text-white shadow-emerald-500/40 ring-1 ring-emerald-400'
                      : 'bg-rose-600 text-white shadow-rose-600/40 ring-1 ring-rose-400'
                  }`}
                >
                  {isWin ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                  <span>{isWin ? 'VICTOIRE' : 'DÉFAITE'}</span>
                </span>
              </div>

              {/* Competition & Location */}
              <div className="text-xs text-slate-400 font-medium mb-3 truncate">
                {r.competition} • {r.isHomeMatch ? 'À Domicile' : 'À l\'Extérieur'}
              </div>

              {/* Score Duel Display */}
              <div className="bg-slate-950/90 rounded-2xl border border-slate-800/80 p-4 my-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 text-left">
                    <div
                      className={`text-sm md:text-base font-black truncate font-bebas ${
                        r.teamHome.includes(clubSettings.shortName) || r.isHomeMatch
                          ? 'text-orange-400 font-black'
                          : 'text-slate-300'
                      }`}
                    >
                      {r.teamHome}
                    </div>
                  </div>

                  {/* Digits */}
                  <div className="flex items-center gap-2 px-3 py-1 bg-slate-900 rounded-xl border border-slate-700">
                    <span
                      className={`text-2xl md:text-3xl font-black font-teko ${
                        (r.homeScore ?? 0) > (r.awayScore ?? 0) ? 'text-emerald-400' : 'text-slate-400'
                      }`}
                    >
                      {r.homeScore ?? '-'}
                    </span>
                    <span className="text-slate-600 font-bold">:</span>
                    <span
                      className={`text-2xl md:text-3xl font-black font-teko ${
                        (r.awayScore ?? 0) > (r.homeScore ?? 0) ? 'text-emerald-400' : 'text-slate-400'
                      }`}
                    >
                      {r.awayScore ?? '-'}
                    </span>
                  </div>

                  <div className="flex-1 text-right">
                    <div
                      className={`text-sm md:text-base font-black truncate font-bebas ${
                        r.teamAway.includes(clubSettings.shortName) || !r.isHomeMatch
                          ? 'text-orange-400 font-black'
                          : 'text-slate-300'
                      }`}
                    >
                      {r.teamAway}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer info */}
              <div className="text-[11px] text-slate-500 mt-2 flex items-center justify-between">
                <span>{r.gymnasium}</span>
                <span className="font-mono">{r.ffbbMatchNumber}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom ticker info */}
      <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-800/70">
        <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
          <Sparkles className="w-3.5 h-3.5" /> Bravo à l'ensemble des collectifs et aux encadrants
        </span>
        <span className="font-mono">Taux de victoire ce weekend : {winRate}%</span>
      </div>
      </div>
    </div>
  );
};
