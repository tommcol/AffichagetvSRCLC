import React from 'react';
import { Trophy, CheckCircle2, XCircle, Download, Award, TrendingUp, Sparkles, Share2 } from 'lucide-react';
import { MatchItem, ClubSettings } from '../../types';
import { isVideoMedia } from '../../utils/mediaUtils';

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

  // Adaptive sizing helper based on results count for clear TV visibility from afar
  const getResultsSizing = (count: number) => {
    if (count <= 2) {
      return {
        gridClass: 'grid-cols-1 md:grid-cols-2',
        cardPadding: 'p-8 md:p-10 lg:p-12',
        categoryBadge: 'text-xl md:text-2xl lg:text-3xl px-6 py-2.5 rounded-2xl font-black font-bebas tracking-wide',
        badgeText: 'text-xl md:text-2xl lg:text-3xl px-6 py-2.5 rounded-2xl font-black font-bebas tracking-wide gap-3 shadow-xl',
        badgeIcon: 'w-6 h-6 md:w-8 md:h-8',
        competitionText: 'text-base md:text-xl lg:text-2xl text-slate-300 font-semibold mt-3',
        duelBox: 'p-8 md:p-10 lg:p-12 my-auto rounded-3xl bg-slate-950/95 border-2 border-slate-700/80 shadow-2xl',
        teamName: 'text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-black font-bebas tracking-wide leading-tight',
        scoreBox: 'px-6 py-3 md:px-8 md:py-4 bg-slate-900 rounded-2xl border-2 border-slate-700 shadow-xl',
        scoreDigit: 'text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-black font-teko leading-none tracking-tight',
        scoreSeparator: 'text-4xl md:text-5xl lg:text-6xl text-slate-500 font-bold px-2',
        footerText: 'text-sm md:text-base lg:text-lg text-slate-400 font-semibold mt-6 pt-4 border-t border-slate-800/80',
      };
    }
    if (count === 3) {
      return {
        gridClass: 'grid-cols-1 md:grid-cols-3',
        cardPadding: 'p-6 md:p-8',
        categoryBadge: 'text-base md:text-xl lg:text-2xl px-4 py-2 rounded-xl font-black font-bebas tracking-wide',
        badgeText: 'text-base md:text-xl lg:text-2xl px-4 py-2 rounded-xl font-black font-bebas tracking-wide gap-2 shadow-lg',
        badgeIcon: 'w-5 h-5 md:w-6 md:h-6',
        competitionText: 'text-sm md:text-base lg:text-lg text-slate-300 font-medium mt-2',
        duelBox: 'p-6 md:p-8 my-auto rounded-2xl bg-slate-950/90 border border-slate-700/80 shadow-xl',
        teamName: 'text-xl md:text-2xl lg:text-3xl font-black font-bebas tracking-wide leading-snug',
        scoreBox: 'px-5 py-2 md:px-6 md:py-3 bg-slate-900 rounded-xl border border-slate-700',
        scoreDigit: 'text-5xl md:text-6xl lg:text-7xl font-black font-teko leading-none',
        scoreSeparator: 'text-3xl md:text-4xl text-slate-500 font-bold px-1.5',
        footerText: 'text-xs md:text-sm lg:text-base text-slate-400 mt-4 pt-3 border-t border-slate-800/60',
      };
    }
    if (count === 4) {
      return {
        gridClass: 'grid-cols-1 sm:grid-cols-2 grid-rows-2',
        cardPadding: 'p-5 md:p-6',
        categoryBadge: 'text-sm md:text-lg px-3.5 py-1.5 rounded-xl font-black font-bebas tracking-wide',
        badgeText: 'text-sm md:text-lg px-3.5 py-1.5 rounded-xl font-black font-bebas tracking-wide gap-2 shadow-md',
        badgeIcon: 'w-4 h-4 md:w-5 md:h-5',
        competitionText: 'text-xs md:text-sm text-slate-300 font-medium mt-1.5',
        duelBox: 'p-4 md:p-6 my-auto rounded-2xl bg-slate-950/90 border border-slate-700/80 shadow-lg',
        teamName: 'text-lg md:text-2xl font-black font-bebas tracking-wide',
        scoreBox: 'px-4 py-2 bg-slate-900 rounded-xl border border-slate-700',
        scoreDigit: 'text-4xl md:text-5xl lg:text-6xl font-black font-teko leading-none',
        scoreSeparator: 'text-2xl md:text-3xl text-slate-500 font-bold px-1',
        footerText: 'text-xs md:text-sm text-slate-400 mt-3 pt-2 border-t border-slate-800/60',
      };
    }
    return {
      gridClass: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
      cardPadding: 'p-4 md:p-5',
      categoryBadge: 'text-xs md:text-sm px-3 py-1 rounded-xl font-black font-bebas tracking-wide',
      badgeText: 'text-xs md:text-sm px-3 py-1 rounded-xl font-black font-bebas tracking-wide gap-1.5 shadow-md',
      badgeIcon: 'w-4 h-4',
      competitionText: 'text-xs md:text-sm text-slate-400 font-medium mt-1',
      duelBox: 'p-3.5 md:p-4 my-auto rounded-xl bg-slate-950/90 border border-slate-800/80 shadow-md',
      teamName: 'text-base md:text-lg font-black font-bebas tracking-wide',
      scoreBox: 'px-3 py-1 bg-slate-900 rounded-lg border border-slate-700',
      scoreDigit: 'text-3xl md:text-4xl lg:text-5xl font-black font-teko leading-none',
      scoreSeparator: 'text-xl md:text-2xl text-slate-500 font-bold px-1',
      footerText: 'text-xs text-slate-500 mt-2 pt-2 border-t border-slate-800/60',
    };
  };

  const sizing = getResultsSizing(results.length);

  return (
    <div className="relative w-full h-full flex flex-col justify-between overflow-hidden">
      {backgroundUrl && (
        <div className="absolute inset-0 z-0 pointer-events-none">
          {isVideoMedia(backgroundUrl) ? (
            <video
              src={backgroundUrl}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover opacity-30"
            />
          ) : (
            <img
              src={backgroundUrl}
              alt="Support Visuel Résultats"
              className="w-full h-full object-cover opacity-25"
              referrerPolicy="no-referrer"
            />
          )}
          <div className="absolute inset-0 bg-slate-950/70" />
        </div>
      )}
      <div className="relative z-10 w-full h-full flex flex-col justify-between p-6 md:p-8 lg:p-10 xl:p-12">
      {/* Slide Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white font-bebas tracking-wide">
            RÉSULTATS DU WEEK-END
          </h2>
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
      {results.length === 0 ? (
        <div className="my-auto text-center py-16 bg-slate-900/60 border border-slate-800 rounded-3xl p-8 max-w-xl mx-auto backdrop-blur-sm">
          <Trophy className="w-12 h-12 text-emerald-400/60 mx-auto mb-3" />
          <h3 className="text-2xl font-black text-white font-bebas tracking-wide">
            AUCUN RÉSULTAT ENREGISTRÉ
          </h3>
          <p className="text-slate-400 text-sm mt-1">
            Les résultats apparaîtront dès la fin des rencontres du week-end.
          </p>
        </div>
      ) : (
      <div
        className={`grid gap-6 my-4 md:my-6 flex-1 items-stretch overflow-y-auto pr-1 min-h-0 ${sizing.gridClass}`}
      >
        {results.map((r) => {
          const isWin = r.result === 'win';

          return (
            <div
              key={r.id}
              className={`relative rounded-3xl ${sizing.cardPadding} border shadow-2xl backdrop-blur-md transition-all flex flex-col justify-between ${
                isWin
                  ? 'bg-gradient-to-br from-emerald-950/60 via-slate-900/90 to-slate-950 border-emerald-500/50 shadow-emerald-950/30'
                  : 'bg-gradient-to-br from-rose-950/60 via-slate-900/90 to-slate-950 border-rose-500/50 shadow-rose-950/30'
              }`}
            >
              {/* Category & Badge Top */}
              <div className="flex items-center justify-between gap-3 pb-3 mb-3 border-b border-slate-800/80">
                <span className={`${sizing.categoryBadge} bg-slate-800 text-white shadow-md`}>
                  {r.category}
                </span>

                <span
                  className={`${sizing.badgeText} flex items-center shadow-lg ${
                    isWin
                      ? 'bg-emerald-500 text-white shadow-emerald-500/40 ring-1 ring-emerald-400'
                      : 'bg-rose-600 text-white shadow-rose-600/40 ring-1 ring-rose-400'
                  }`}
                >
                  {isWin ? <CheckCircle2 className={sizing.badgeIcon} /> : <XCircle className={sizing.badgeIcon} />}
                  <span>{isWin ? 'VICTOIRE' : 'DÉFAITE'}</span>
                </span>
              </div>

              {/* Competition & Location */}
              <div className={`${sizing.competitionText} truncate`}>
                {r.competition} • {r.isHomeMatch ? 'À Domicile' : 'À l\'Extérieur'}
              </div>

              {/* Score Duel Display */}
              <div className={sizing.duelBox}>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 text-left min-w-0">
                    <div
                      className={`${sizing.teamName} ${
                        r.teamHome.includes(clubSettings.shortName) || r.isHomeMatch
                          ? 'text-orange-400'
                          : 'text-slate-100'
                      }`}
                    >
                      {r.teamHome}
                    </div>
                  </div>

                  {/* Digits */}
                  <div className={`flex items-center shrink-0 ${sizing.scoreBox}`}>
                    <span
                      className={`${sizing.scoreDigit} ${
                        (r.homeScore ?? 0) > (r.awayScore ?? 0)
                          ? 'text-emerald-400 drop-shadow-[0_0_20px_rgba(52,211,153,0.35)]'
                          : 'text-slate-400'
                      }`}
                    >
                      {r.homeScore ?? '-'}
                    </span>
                    <span className={sizing.scoreSeparator}>:</span>
                    <span
                      className={`${sizing.scoreDigit} ${
                        (r.awayScore ?? 0) > (r.homeScore ?? 0)
                          ? 'text-emerald-400 drop-shadow-[0_0_20px_rgba(52,211,153,0.35)]'
                          : 'text-slate-400'
                      }`}
                    >
                      {r.awayScore ?? '-'}
                    </span>
                  </div>

                  <div className="flex-1 text-right min-w-0">
                    <div
                      className={`${sizing.teamName} ${
                        r.teamAway.includes(clubSettings.shortName) || !r.isHomeMatch
                          ? 'text-orange-400'
                          : 'text-slate-100'
                      }`}
                    >
                      {r.teamAway}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer info */}
              <div className={sizing.footerText}>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-300">{r.gymnasium}</span>
                  <span className="font-mono text-slate-400 font-bold tracking-wider">{r.ffbbMatchNumber}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      )}
      </div>
    </div>
  );
};
