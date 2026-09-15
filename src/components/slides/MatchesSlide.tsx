import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Clock, Home, Plane, Download, CheckCircle2, XCircle, AlertCircle, Share2 } from 'lucide-react';
import { MatchItem, ClubSettings } from '../../types';
import { isMatchLive, isMatchFinished } from '../../utils/matchStatus';
import { isVideoMedia } from '../../utils/mediaUtils';

interface MatchesSlideProps {
  matches: MatchItem[];
  clubSettings: ClubSettings;
  onDownloadVisual: () => void;
  backgroundUrl?: string;
  hideShareButton?: boolean;
}

export const MatchesSlide: React.FC<MatchesSlideProps> = ({ matches, clubSettings, onDownloadVisual, backgroundUrl, hideShareButton }) => {
  // Horloge en temps réel pour actualiser automatiquement le statut "EN COURS"
  const [currentTime, setCurrentTime] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000); // vérification toutes les 30 secondes
    return () => clearInterval(timer);
  }, []);

  // Only display matches that are checked/selected for the weekend (selectedForWeekend !== false)
  const weekendMatches = matches.filter((m) => m.selectedForWeekend !== false);
  const homeMatches = weekendMatches.filter((m) => m.isHomeMatch);
  const awayMatches = weekendMatches.filter((m) => !m.isHomeMatch);

  // Adaptive sizing helper based on match count per column for distant TV viewing
  const getColumnSizing = (count: number) => {
    if (count <= 2) {
      return {
        containerLayout: 'flex-1 flex flex-col justify-evenly gap-4 md:gap-6 min-h-0',
        cardPadding: 'p-6 md:p-8 lg:p-9 rounded-3xl',
        categoryBadge: 'text-sm md:text-base lg:text-lg px-4 py-1.5 rounded-xl font-black font-bebas tracking-wide',
        competitionText: 'text-sm md:text-base lg:text-lg font-semibold text-slate-300',
        teamNames: 'text-2xl md:text-3xl lg:text-4xl font-black font-bebas tracking-wide leading-tight',
        vsBadge: 'text-xl md:text-2xl font-black px-2 text-orange-400',
        metaRow: 'mt-3 gap-5 text-sm md:text-base lg:text-lg',
        metaIcon: 'w-5 h-5 md:w-6 md:h-6',
        timeText: 'font-mono font-black text-white text-lg md:text-xl lg:text-2xl',
        statusBadge: 'px-4 py-2 md:px-5 md:py-2.5 rounded-2xl text-sm md:text-base lg:text-lg font-black font-bebas uppercase tracking-wide shadow-lg',
        statusIcon: 'w-5 h-5 md:w-6 md:h-6',
      };
    }
    if (count <= 4) {
      return {
        containerLayout: 'flex-1 flex flex-col justify-evenly gap-3 md:gap-4 min-h-0',
        cardPadding: 'p-4 md:p-5 lg:p-6 rounded-2xl',
        categoryBadge: 'text-xs md:text-sm lg:text-base px-3.5 py-1 rounded-xl font-black font-bebas tracking-wide',
        competitionText: 'text-xs md:text-sm lg:text-base font-medium text-slate-300',
        teamNames: 'text-xl md:text-2xl lg:text-3xl font-black font-bebas tracking-wide leading-snug',
        vsBadge: 'text-base md:text-lg font-black px-1.5 text-orange-400',
        metaRow: 'mt-2 gap-4 text-xs md:text-sm lg:text-base',
        metaIcon: 'w-4 h-4 md:w-5 md:h-5',
        timeText: 'font-mono font-bold text-white text-base md:text-lg lg:text-xl',
        statusBadge: 'px-3.5 py-1.5 md:px-4 md:py-2 rounded-xl text-xs md:text-sm lg:text-base font-black font-bebas uppercase tracking-wide shadow-md',
        statusIcon: 'w-4 h-4 md:w-5 md:h-5',
      };
    }
    return {
      containerLayout: 'space-y-3 flex-1 overflow-y-auto pr-1 min-h-0',
      cardPadding: 'p-3.5 md:p-4 rounded-2xl',
      categoryBadge: 'text-xs px-2.5 py-0.5 rounded-lg font-black font-bebas tracking-wide',
      competitionText: 'text-xs text-slate-400',
      teamNames: 'text-base md:text-xl font-black font-bebas tracking-wide',
      vsBadge: 'text-sm font-black px-1 text-orange-400',
      metaRow: 'mt-1.5 gap-2.5 text-xs',
      metaIcon: 'w-3.5 h-3.5',
      timeText: 'font-mono font-bold text-slate-200 text-xs md:text-sm',
      statusBadge: 'px-3 py-1 rounded-xl text-xs font-black font-bebas uppercase tracking-wide',
      statusIcon: 'w-3.5 h-3.5',
    };
  };

  const homeSizing = getColumnSizing(homeMatches.length);
  const awaySizing = getColumnSizing(awayMatches.length);

  return (
    <div className="relative w-full h-full flex flex-col justify-between overflow-hidden">
      {/* Optional custom visual background support (Image or Video) */}
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
              alt="Support Visuel Matchs"
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
            LES RENCONTRES DU WEEK-END
          </h2>
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
      {weekendMatches.length === 0 ? (
        <div className="my-auto text-center py-16 bg-slate-900/60 border border-slate-800 rounded-3xl p-8 max-w-xl mx-auto backdrop-blur-sm">
          <Calendar className="w-12 h-12 text-orange-400/60 mx-auto mb-3" />
          <h3 className="text-2xl font-black text-white font-bebas tracking-wide">
            AUCUN MATCH SÉLECTIONNÉ POUR CE WEEK-END
          </h3>
          <p className="text-slate-400 text-sm mt-1">
            Dans le panneau de configuration (onglet Matchs), cochez les rencontres que vous souhaitez afficher sur l'écran TV.
          </p>
        </div>
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 my-4 md:my-6 flex-1 items-stretch min-h-0">
        {/* DOMICILE COLUMN */}
        <div className="bg-slate-900/70 border border-slate-800/90 rounded-3xl p-6 lg:p-7 shadow-xl backdrop-blur-sm flex flex-col h-full min-h-0">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
                <Home className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <div>
                <h3 className="text-xl md:text-2xl lg:text-3xl font-black uppercase font-bebas text-white tracking-wide">
                  À DOMICILE • {clubSettings.gymnasiumDefault}
                </h3>
              </div>
            </div>
            <span className="px-3.5 py-1 rounded-full bg-orange-500/15 text-orange-300 text-xs md:text-sm font-bold font-mono">
              {homeMatches.length} Matchs
            </span>
          </div>

          <div className={homeSizing.containerLayout}>
            {homeMatches.length === 0 ? (
              <div className="my-auto text-center py-8 text-slate-500 text-base md:text-lg">
                Aucun match à domicile ce weekend
              </div>
            ) : (
              homeMatches.map((m) => {
                const isLive = isMatchLive(m, currentTime);
                const isFinished = isMatchFinished(m, currentTime);
                const isWin = m.result === 'win';
                const isClubHome = m.teamHome.toLowerCase().includes(clubSettings.shortName.toLowerCase());
                const isClubAway = m.teamAway.toLowerCase().includes(clubSettings.shortName.toLowerCase());

                return (
                  <div
                    key={m.id}
                    className={`relative ${homeSizing.cardPadding} border shadow-lg transition-all flex flex-col justify-between ${
                      isFinished
                        ? isWin
                          ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-50'
                          : 'bg-rose-950/40 border-rose-500/50 text-rose-50'
                        : 'bg-slate-950/70 border-slate-800/90 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-800/60">
                      <span className={`${homeSizing.categoryBadge} bg-slate-800 text-orange-300`}>
                        {m.category}
                      </span>
                      <span className={homeSizing.competitionText}>{m.competition}</span>
                    </div>

                    <div className="flex items-center justify-between gap-4 my-auto">
                      <div className="flex-1 min-w-0">
                        <div className={homeSizing.teamNames}>
                          <span className={isClubHome ? 'text-orange-400' : 'text-white'}>
                            {m.teamHome}
                          </span>
                          <span className={homeSizing.vsBadge}>VS</span>
                          <span className={isClubAway ? 'text-orange-400' : 'text-white'}>
                            {m.teamAway}
                          </span>
                        </div>
                        <div className={`flex items-center ${homeSizing.metaRow}`}>
                          <span className="flex items-center gap-1.5">
                            <Clock className={`${homeSizing.metaIcon} text-orange-400 shrink-0`} />
                            <span className={homeSizing.timeText}>{m.time}</span>
                          </span>
                          <span className="flex items-center gap-1.5 text-slate-300 font-medium truncate">
                            <MapPin className={`${homeSizing.metaIcon} text-slate-400 shrink-0`} />
                            <span className="truncate">{m.gymnasium}</span>
                          </span>
                        </div>
                      </div>

                      {/* Status / Score / Result Badge */}
                      <div className="shrink-0">
                        {isLive ? (
                          <div
                            className={`${homeSizing.statusBadge} bg-red-600 text-white shadow-md flex items-center gap-2`}
                          >
                            <span className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-white animate-pulse shrink-0"></span>
                            <span>En cours</span>
                          </div>
                        ) : isFinished ? (
                          m.result && m.homeScore !== undefined && m.awayScore !== undefined ? (
                            <div
                              className={`${homeSizing.statusBadge} ${
                                isWin
                                  ? 'bg-emerald-600 text-white shadow-emerald-600/40 ring-1 ring-emerald-400'
                                  : 'bg-rose-600 text-white shadow-rose-600/40 ring-1 ring-rose-400'
                              } flex items-center gap-2`}
                            >
                              {isWin ? <CheckCircle2 className={homeSizing.statusIcon} /> : <XCircle className={homeSizing.statusIcon} />}
                              <span>
                                {isWin ? 'Victoire' : 'Défaite'} {m.homeScore}:{m.awayScore}
                              </span>
                            </div>
                          ) : (
                            <div className={`${homeSizing.statusBadge} bg-slate-800 text-slate-200 border border-slate-700 flex items-center gap-2`}>
                              <CheckCircle2 className={homeSizing.statusIcon} />
                              <span>Terminé</span>
                            </div>
                          )
                        ) : (
                          <div className={`${homeSizing.statusBadge} bg-slate-800/90 border border-slate-700 text-amber-300 flex items-center gap-2`}>
                            <Clock className={homeSizing.statusIcon} />
                            <span>À venir</span>
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
        <div className="bg-slate-900/70 border border-slate-800/90 rounded-3xl p-6 lg:p-7 shadow-xl backdrop-blur-sm flex flex-col h-full min-h-0">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                <Plane className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <div>
                <h3 className="text-xl md:text-2xl lg:text-3xl font-black uppercase font-bebas text-white tracking-wide">
                  À L'EXTÉRIEUR • DÉPLACEMENTS
                </h3>
              </div>
            </div>
            <span className="px-3.5 py-1 rounded-full bg-blue-500/15 text-blue-300 text-xs md:text-sm font-bold font-mono">
              {awayMatches.length} Matchs
            </span>
          </div>

          <div className={awaySizing.containerLayout}>
            {awayMatches.length === 0 ? (
              <div className="my-auto text-center py-8 text-slate-500 text-base md:text-lg">
                Aucun match à l'extérieur ce weekend
              </div>
            ) : (
              awayMatches.map((m) => {
                const isLive = isMatchLive(m, currentTime);
                const isFinished = isMatchFinished(m, currentTime);
                const isWin = m.result === 'win';
                const isClubHome = m.teamHome.toLowerCase().includes(clubSettings.shortName.toLowerCase());
                const isClubAway = m.teamAway.toLowerCase().includes(clubSettings.shortName.toLowerCase());

                return (
                  <div
                    key={m.id}
                    className={`relative ${awaySizing.cardPadding} border shadow-lg transition-all flex flex-col justify-between ${
                      isFinished
                        ? isWin
                          ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-50'
                          : 'bg-rose-950/40 border-rose-500/50 text-rose-50'
                        : 'bg-slate-950/70 border-slate-800/90 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-800/60">
                      <span className={`${awaySizing.categoryBadge} bg-slate-800 text-blue-300`}>
                        {m.category}
                      </span>
                      <span className={awaySizing.competitionText}>{m.competition}</span>
                    </div>

                    <div className="flex items-center justify-between gap-4 my-auto">
                      <div className="flex-1 min-w-0">
                        <div className={awaySizing.teamNames}>
                          <span className={isClubHome ? 'text-orange-400' : 'text-white'}>
                            {m.teamHome}
                          </span>
                          <span className={awaySizing.vsBadge}>VS</span>
                          <span className={isClubAway ? 'text-orange-400' : 'text-white'}>
                            {m.teamAway}
                          </span>
                        </div>
                        <div className={`flex items-center ${awaySizing.metaRow}`}>
                          <span className="flex items-center gap-1.5">
                            <Clock className={`${awaySizing.metaIcon} text-blue-400 shrink-0`} />
                            <span className={awaySizing.timeText}>{m.time}</span>
                          </span>
                          <span className="flex items-center gap-1.5 text-slate-300 font-medium truncate">
                            <MapPin className={`${awaySizing.metaIcon} text-slate-400 shrink-0`} />
                            <span className="truncate">{m.gymnasium} ({m.city})</span>
                          </span>
                        </div>
                      </div>

                      {/* Status / Score / Result Badge */}
                      <div className="shrink-0">
                        {isLive ? (
                          <div
                            className={`${awaySizing.statusBadge} bg-red-600 text-white shadow-md flex items-center gap-2`}
                          >
                            <span className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-white animate-pulse shrink-0"></span>
                            <span>En cours</span>
                          </div>
                        ) : isFinished ? (
                          m.result && m.homeScore !== undefined && m.awayScore !== undefined ? (
                            <div
                              className={`${awaySizing.statusBadge} ${
                                isWin
                                  ? 'bg-emerald-600 text-white shadow-emerald-600/40 ring-1 ring-emerald-400'
                                  : 'bg-rose-600 text-white shadow-rose-600/40 ring-1 ring-rose-400'
                              } flex items-center gap-2`}
                            >
                              {isWin ? <CheckCircle2 className={awaySizing.statusIcon} /> : <XCircle className={awaySizing.statusIcon} />}
                              <span>
                                {isWin ? 'Victoire' : 'Défaite'} {m.homeScore}:{m.awayScore}
                              </span>
                            </div>
                          ) : (
                            <div className={`${awaySizing.statusBadge} bg-slate-800 text-slate-200 border border-slate-700 flex items-center gap-2`}>
                              <CheckCircle2 className={awaySizing.statusIcon} />
                              <span>Terminé</span>
                            </div>
                          )
                        ) : (
                          <div className={`${awaySizing.statusBadge} bg-slate-800/90 border border-slate-700 text-slate-300 flex items-center gap-2`}>
                            <Clock className={awaySizing.statusIcon} />
                            <span>À venir</span>
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
      )}
      </div>
    </div>
  );
};
