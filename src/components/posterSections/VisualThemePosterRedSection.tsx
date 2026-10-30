import { getClubFirstMatchPresentation } from '../../utils/clubFirstMatchPresentation';
// VisualThemePosterRedSection — bloc « visualTheme === 'poster-red' » de VisualExporterModal.
// Extrait automatiquement lors du découpage : aucune logique modifiée.

import { Trophy, Home, Plane, CheckCircle2, XCircle } from 'lucide-react';
import { getFontFamilyClass } from '../../utils/fontUtils';
import { getAdaptivePosterCardSizing } from '../../utils/posterAdaptiveSizing';
import { isMatchWin, isClubHomeMatch, isMatchLive, isMatchFinished } from '../../utils/matchStatus';
import { isExemptItem } from '../../utils/socialCaptionGenerator';
import { getLayer3PositionClass, getLayer3TransformOrigin, getLayer3Transform, getLayer4PositionClass, getLayer4TransformOrigin } from '../../utils/posterLayerHelpers';
import { formatPosterMatchDate } from '../../utils/posterFormattingHelpers';
import { AutoFitTeamName } from '../AutoFitTeamName';
import { PosterMedia } from './PosterMedia';

export interface VisualThemePosterRedSectionProps {
  [key: string]: any;
}

export function VisualThemePosterRedSection(props: VisualThemePosterRedSectionProps) {
  const {
    effectiveBgUrl,
    layer1Grayscale,
    layer1Contrast,
    layer1Brightness,
    layer1Blur,
    layer1Scale,
    showStudioLayer3,
    effectiveLayer3Url,
    studioLayer3Pos,
    effectiveCategoryConfig,
    studioLayer3Scale,
    showStudioLayer4,
    effectiveLayer4Url,
    studioLayer4Pos,
    studioLayer4Scale,
    content,
    aspectRatio,
    key,
    layer2PrimaryColor,
    text,
    layer2FontHeader,
    layer2BadgeBgColor,
    layer2BadgeTextColor,
    displayedMatches,
    badgeTitle,
    contentType,
    matches,
    posterFilter,
    layer2FontBody,
    layer2TextColor,
    name,
    title,
    results,
    displayedResults,
    safeClubName,
    safeShortName,
    resultDisplayMode,
    specificNotification,
    p,
  } = props;
  const bgGrayscale = effectiveCategoryConfig?.categoryTheme?.backgroundGrayscale ?? false;
  const bgContrast = effectiveCategoryConfig?.categoryTheme?.backgroundContrast ?? 1;
  const bgVignette = effectiveCategoryConfig?.categoryTheme?.backgroundVignette;
  const victoryContext = contentType === 'notification' ? Boolean(specificNotification?.isWin)
    : contentType === 'results' && displayedResults.some(r => isMatchWin(r, safeClubName, safeShortName));

  return (
                    <>
                      {/* Photo background with grayscale, blur, scale, brightness, contrast (Calque 1) */}
                      <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <PosterMedia
                          src={effectiveBgUrl}
                          alt="Fond affiche basket"
                          className="w-full h-full object-cover pointer-events-none transition-all duration-75"
                          style={{
                            filter: `brightness(${layer1Brightness}) blur(${layer1Blur}px) grayscale(${bgGrayscale ? 100 : 0}%) contrast(${bgContrast})`,
                            transform: `scale(${layer1Scale})`,
                          }}
                        />
                      </div>

                      {/* Radial vignette overlay for maximum readability & high contrast */}
                      <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          background: `radial-gradient(circle at center, rgba(0,0,0,${(bgVignette ?? 0.8) * 0.25}) 0%, rgba(0,0,0,${bgVignette ?? 0.8}) 100%)`,
                        }}
                      />

                      {/* Subtle sports lighting accent */}
                      <div className="absolute -top-20 left-1/2 transform -translate-x-1/2 w-[600px] h-[300px] bg-red-600/20 blur-3xl pointer-events-none" />

                      {/* STUDIO LAYER 3: position libre identique à l'aperçu TV (x/y/scale du Studio) */}
                      {showStudioLayer3 && effectiveCategoryConfig.layer3?.enabled !== false && (!effectiveCategoryConfig.layer3?.onlyOnVictory || victoryContext) && Boolean(effectiveLayer3Url) && (
                        <div
                          className="absolute pointer-events-none z-10"
                          style={{
                            left: `${effectiveCategoryConfig.layer3?.x ?? 50}%`,
                            top: `${effectiveCategoryConfig.layer3?.y ?? 50}%`,
                            transform: `translate(-50%, -50%) ${effectiveCategoryConfig.layer3?.flipHorizontal ? 'scaleX(-1)' : ''} ${effectiveCategoryConfig.layer3?.rotation ? `rotate(${effectiveCategoryConfig.layer3.rotation}deg)` : ''}`,
                            opacity: effectiveCategoryConfig.layer3?.opacity ?? 0.9,
                            width: `${16 * (effectiveCategoryConfig.layer3?.scale ?? 1)}rem`,
                            maxWidth: '96%',
                          }}
                        >
                          <PosterMedia
                            src={effectiveLayer3Url}
                            alt="Calque 3"
                            className="w-full h-auto object-contain"
                            style={
                              effectiveCategoryConfig.layer3?.shadowIntensity !== undefined
                                ? { filter: `drop-shadow(0 ${Math.round(8 + 16 * (effectiveCategoryConfig.layer3?.shadowIntensity ?? 0))}px ${Math.round(12 + 20 * (effectiveCategoryConfig.layer3?.shadowIntensity ?? 0))}px rgba(0,0,0,${(0.3 + 0.55 * (effectiveCategoryConfig.layer3?.shadowIntensity ?? 0)).toFixed(2)}))` }
                                : undefined
                            }
                          />
                        </div>
                      )}

                      {/* STUDIO LAYER 4: position libre identique à l'aperçu TV (x/y/scale du Studio) */}
                      {showStudioLayer4 && effectiveCategoryConfig.layer4?.enabled !== false && (!effectiveCategoryConfig.layer4?.onlyOnVictory || victoryContext) && Boolean(effectiveLayer4Url) && (
                        <div
                          className="absolute pointer-events-none z-10"
                          style={{
                            left: `${effectiveCategoryConfig.layer4?.x ?? 50}%`,
                            top: `${effectiveCategoryConfig.layer4?.y ?? 50}%`,
                            transform: `translate(-50%, -50%) ${effectiveCategoryConfig.layer4?.flipHorizontal ? 'scaleX(-1)' : ''} ${effectiveCategoryConfig.layer4?.rotation ? `rotate(${effectiveCategoryConfig.layer4.rotation}deg)` : ''}`,
                            opacity: effectiveCategoryConfig.layer4?.opacity ?? 0.95,
                            width: `${16 * (effectiveCategoryConfig.layer4?.scale ?? 1)}rem`,
                            maxWidth: '96%',
                          }}
                        >
                          <PosterMedia
                            src={effectiveLayer4Url}
                            alt="Calque 4"
                            className="w-full h-auto object-contain"
                            style={
                              effectiveCategoryConfig.layer4?.shadowIntensity !== undefined
                                ? { filter: `drop-shadow(0 ${Math.round(8 + 16 * (effectiveCategoryConfig.layer4?.shadowIntensity ?? 0))}px ${Math.round(12 + 20 * (effectiveCategoryConfig.layer4?.shadowIntensity ?? 0))}px rgba(0,0,0,${(0.3 + 0.55 * (effectiveCategoryConfig.layer4?.shadowIntensity ?? 0)).toFixed(2)}))` }
                                : undefined
                            }
                          />
                        </div>
                      )}

                      {/* 3 Zebra White Stripes in Bottom Right (Positioned at background layer z-10, behind pastilles and content) */}
                      <div
                        className={`absolute pointer-events-none z-10 flex flex-col -rotate-45 ${
                          aspectRatio === '16:9'
                            ? '-bottom-8 -right-8 gap-4'
                            : '-bottom-10 -right-10 gap-6'
                        }`}
                      >
                        <div className={`${aspectRatio === '16:9' ? 'w-[260px] h-6' : 'w-[360px] h-8'} bg-white shadow-lg`} />
                        <div className={`${aspectRatio === '16:9' ? 'w-[260px] h-6' : 'w-[360px] h-8'} bg-white shadow-lg`} />
                        <div className={`${aspectRatio === '16:9' ? 'w-[260px] h-6' : 'w-[360px] h-8'} bg-white shadow-lg`} />
                      </div>

                      {/* CONTENT WRAPPER */}
                      <div className="relative z-20 w-full h-full flex flex-col items-center justify-between">

                        {/* TOP SECTION: 6 RED STRIPES & HEADER BADGE */}
                        <div className="w-full flex flex-col items-center">

                          {/* 6 Slanted Red Stripes (Exact Match to Photos) */}
                          <div className={`flex gap-3.5 transform -skew-x-[25deg] ${aspectRatio === '16:9' ? 'mb-2' : 'mb-3.5'} z-10`}>
                            {[...Array(6)].map((_, i) => (
                              <div
                                key={i}
                                className={`${aspectRatio === '16:9' ? 'w-4 h-7' : 'w-5 h-10'} rounded-[2px] shadow-[0_4px_8px_rgba(0,0,0,0.6)]`}
                                style={{ backgroundColor: layer2PrimaryColor }}
                              />
                            ))}
                          </div>

                          {/* Header Badge: DOMICILE / EXTÉRIEUR / EXEMPT / RÉSULTATS */}
                          <div
                            className={`font-black uppercase tracking-wider text-center border-t-2 border-white/20 z-10 ${getFontFamilyClass(layer2FontHeader)}`}
                            style={{
                              maxWidth: '90%',
                              overflowWrap: 'anywhere',
                              background: `linear-gradient(180deg, ${layer2BadgeBgColor} 0%, ${layer2BadgeBgColor}dd 100%)`,
                              color: layer2BadgeTextColor,
                              fontSize: aspectRatio === '16:9' ? '44px' : (aspectRatio === '1:1' ? '50px' : (displayedMatches.length >= 6 ? '54px' : '62px')),
                              padding: aspectRatio === '16:9' ? '8px 56px' : (displayedMatches.length >= 6 ? '10px 70px' : '14px 84px'),
                              borderRadius: '26px',
                              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.6), inset 0 2px 0 rgba(255, 255, 255, 0.25)',
                              marginBottom: aspectRatio === '16:9' ? '12px' : (displayedMatches.length >= 6 ? '20px' : (aspectRatio === '1:1' ? '24px' : '32px')),
                              lineHeight: '1.2',
                            }}
                          >
                            {badgeTitle}
                          </div>
                        </div>

                                                {/* MATCHES LIST BODY — cartes identiques à l'aperçu TV (MatchesSlide poster-red) */}
                        {contentType === 'matches' &&
                          (() => {
                            const sortedMatches = [...displayedMatches];
                            const sizing0 = getAdaptivePosterCardSizing(sortedMatches.length, aspectRatio);
                            const half = Math.ceil(sortedMatches.length / 2);
                            const leftMatches = sizing0.columns === 1 ? sortedMatches : sortedMatches.slice(0, half);
                            const rightMatches = sizing0.columns === 1 ? [] : sortedMatches.slice(half);
                            const count = sortedMatches.length;

                            const renderPosterCard = (m) => {
                              const isHome = isClubHomeMatch(m, safeClubName, safeShortName);
                              const isExempt = posterFilter === 'exempt' || isExemptItem(m);
                              const isLive = isMatchLive(m);
                              const isFinished = isMatchFinished(m);
                              const hasScore = m.homeScore !== undefined && m.awayScore !== undefined;
                              const isWin = isMatchWin(m, safeClubName, safeShortName);

                              const { teamLeft, teamRight, scoreText } = getClubFirstMatchPresentation(m, safeClubName, safeShortName, isExempt);
                              const dateText = formatPosterMatchDate(m.date).split('|')[0].trim();

                              const sizing = getAdaptivePosterCardSizing(count, aspectRatio);
                              const pillH = sizing.pillHeight;
                              const pillHeight = pillH + 'px';
                              const headerFontSize = Math.max(sizing.headerFontSize, Math.min(Math.round(pillH * 0.36), 46)) + 'px';
                              const canvasW = aspectRatio === '16:9' ? 1920 : 1080;
                              const centerFontSize = Math.max(sizing.centerFontSize, Math.min(Math.round(pillH * 0.42), Math.round(canvasW * 0.055))) + 'px';

                              return (
                                <div key={m.id} className="flex flex-col gap-1.5 w-full flex-1 justify-center min-h-0">
                                  {/* Date centrée ; statut à gauche et lieu à droite. */}
                                  <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 px-1 w-full min-w-0">
                                    <div className="min-w-0 justify-self-start">
                                      {isLive ? <span className="text-sm font-black text-white bg-red-600 rounded-full px-2 py-1">EN COURS</span>
                                        : isFinished ? <span className={'text-sm font-black rounded-full px-2 py-1 text-white ' + (isWin ? 'bg-emerald-600' : 'bg-rose-600')}>{isWin ? 'VICTOIRE' : 'DÉFAITE'}</span> : null}
                                    </div>
                                    <span className={'text-center text-slate-200 font-semibold uppercase tracking-wider ' + getFontFamilyClass(layer2FontBody)} style={{fontSize: `calc(${headerFontSize} * 0.65)`}}>{dateText}</span>
                                    <span className={'justify-self-end inline-flex items-center justify-center w-8 h-8 rounded-full border ' + (isHome ? 'text-emerald-400 border-emerald-400/60 bg-emerald-500/20' : 'text-sky-400 border-sky-400/60 bg-sky-500/20')} title={isHome ? 'Match à Domicile' : "Match à l'Extérieur"}>
                                      {isHome ? <Home className="w-5 h-5"/> : <Plane className="w-5 h-5 -rotate-45"/>}
                                    </span>
                                  </div>

                                  {/* Rangée de Pilules : club en ROUGE, adversaire en ANTHRACITE, heure au centre */}
                                  <div className="flex items-center justify-between gap-3 w-full min-w-0">
                                    <div
                                      className={
                                        'flex-1 min-w-0 font-black uppercase tracking-wider px-4 rounded-full shadow-lg text-center flex items-center justify-center border ' +
                                        getFontFamilyClass(layer2FontHeader) +
                                        ' bg-gradient-to-r from-red-600 via-rose-600 to-red-600 text-white ring-2 ring-red-400/80 border-red-500'
                                      }
                                      style={{ height: pillHeight }}
                                    >
                                      <AutoFitTeamName
                                        name={teamLeft}
                                        count={count}
                                        aspectRatio={aspectRatio}
                                        fontHeader={layer2FontHeader}
                                        pillHeight={pillH}
                                        textColor="#ffffff"
                                      />
                                    </div>

                                    {isLive ? (
                                      <div
                                        className="shrink-0 bg-gradient-to-br from-red-600 via-rose-600 to-red-700 text-white font-mono font-black shadow-xl text-center border-2 border-red-300 flex flex-col items-center justify-center rounded-full animate-pulse px-3"
                                        style={{ height: pillHeight, fontSize: centerFontSize }}
                                      >
                                        <span className="text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                                          EN COURS
                                        </span>
                                        <span className="font-black leading-none">
                                          {hasScore ? scoreText : (m.time || 'EN COURS')}
                                        </span>
                                      </div>
                                    ) : isFinished && hasScore ? (
                                      <div
                                        className="shrink-0 bg-white text-slate-950 font-mono font-black shadow-xl text-center border-2 border-white flex flex-col items-center justify-center rounded-full px-3"
                                        style={{ height: pillHeight, fontSize: centerFontSize }}
                                      >
                                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none -mb-0.5">
                                          SCORE
                                        </span>
                                        <span className="font-black leading-none">{scoreText}</span>
                                      </div>
                                    ) : (
                                      <div
                                        className="shrink-0 bg-white text-slate-950 font-mono font-black shadow-xl text-center border-2 border-white flex items-center justify-center rounded-full px-3"
                                        style={{ height: pillHeight, fontSize: centerFontSize }}
                                      >
                                        {m.time || 'VS'}
                                      </div>
                                    )}

                                    <div
                                      className={
                                        'flex-1 min-w-0 font-black uppercase tracking-wider px-4 rounded-full shadow-lg text-center flex items-center justify-center border ' +
                                        getFontFamilyClass(layer2FontHeader) +
                                        ' bg-slate-900/95 text-slate-200 border-slate-700/80'
                                      }
                                      style={{ height: pillHeight }}
                                    >
                                      <AutoFitTeamName
                                        name={teamRight}
                                        isExempt={isExempt}
                                        count={count}
                                        aspectRatio={aspectRatio}
                                        fontHeader={layer2FontHeader}
                                        pillHeight={pillH}
                                        textColor="#e2e8f0"
                                      />
                                    </div>
                                  </div>
                                </div>
                              );
                            };

                            return (
                              <div
                                className={
                                  'w-full flex-1 flex my-auto min-h-0 overflow-hidden ' +
                                  (rightMatches.length > 0 ? 'flex-row px-2' : 'flex-col justify-center')
                                }
                              style={{ gap: sizing0.gapY + 'px' }}
                              >
                                <div
                                  className={
                                    rightMatches.length > 0
                                      ? 'flex-1 min-w-0 flex flex-col justify-between min-h-0'
                                      : 'w-full flex flex-col justify-center min-h-0'
                                  }
                                style={{ gap: sizing0.gapY + 'px' }}
                                >
                                  {leftMatches.map(renderPosterCard)}
                                </div>
                                {rightMatches.length > 0 && (
                                  <div className="flex-1 min-w-0 flex flex-col justify-between min-h-0" style={{ gap: sizing0.gapY + 'px' }}>
                                    {rightMatches.map(renderPosterCard)}
                                  </div>
                                )}
                              </div>
                            );
                          })()}
{/* RESULTS LIST BODY — cartes identiques à l'aperçu TV (ResultsSlide poster-red) */}
                        {contentType === 'results' &&
                          (() => {
                            const sortedResults = [...displayedResults];
                            const sizing0 = getAdaptivePosterCardSizing(sortedResults.length, aspectRatio);
                            // 4:5 portrait : resultats empiles de HAUT en BAS en 1 colonne (ordre chronologique lisible)
                            const half = Math.ceil(sortedResults.length / 2);
                            const leftResults = sizing0.columns === 1 ? sortedResults : sortedResults.slice(0, half);
                            const rightResults = sizing0.columns === 1 ? [] : sortedResults.slice(half);
                            const count = sortedResults.length;

                            const renderPosterCard = (r) => {
                              const isWin = isMatchWin(r, safeClubName, safeShortName);
                              const isHome = isClubHomeMatch(r, safeClubName, safeShortName);
                              const { teamLeft, teamRight, scoreText } = getClubFirstMatchPresentation(r, safeClubName, safeShortName);
                              const matchDateText = r.date ? formatPosterMatchDate(r.date, r.time).split('|')[0].trim() : '';

                              const hasScore = r.homeScore !== undefined && r.awayScore !== undefined;
                              const scoreDisplay = hasScore ? scoreText : (isWin ? 'VICTOIRE' : 'DÉFAITE');

                              const sizing = getAdaptivePosterCardSizing(count, aspectRatio);
                              const pillH = sizing.pillHeight;
                              const pillHeight = pillH + 'px';
                              const canvasW = aspectRatio === '16:9' ? 1920 : 1080;
                              const headerFontSize = Math.max(sizing.headerFontSize, Math.min(Math.round(pillH * 0.36), 46)) + 'px';
                              const scoreFontSize = Math.min(Math.round(pillH * 0.52), Math.round(canvasW * 0.06)) + 'px';
                              const statusFontSize = Math.round(pillH * 0.34) + 'px';

                              return (
                                <div key={r.id} className="flex flex-col gap-1.5 w-full flex-1 justify-center min-h-0 min-w-0">
                                  {/* Date centrée, score dans l'ordre club / adversaire. */}
                                  <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 px-1 w-full min-w-0">
                                    <div className="min-w-0 justify-self-start">
                                      {resultDisplayMode !== 'score' && <span className={'font-black uppercase rounded-full px-2 py-1 text-white ' + (isWin ? 'bg-emerald-600' : 'bg-rose-600')} style={{fontSize:statusFontSize}}>{isWin ? 'VICTOIRE' : 'DÉFAITE'}</span>}
                                    </div>
                                    <span className={'text-center text-amber-400 font-semibold uppercase tracking-wider ' + getFontFamilyClass(layer2FontBody)} style={{fontSize:headerFontSize}}>{matchDateText || 'Date à confirmer'}</span>
                                    <span className={'justify-self-end inline-flex items-center justify-center w-8 h-8 rounded-full border ' + (isHome ? 'text-emerald-400 border-emerald-400/60 bg-emerald-500/20' : 'text-sky-400 border-sky-400/60 bg-sky-500/20')} title={isHome ? 'Match à Domicile' : "Match à l'Extérieur"}>
                                      {isHome ? <Home className="w-5 h-5"/> : <Plane className="w-5 h-5 -rotate-45"/>}
                                    </span>
                                  </div>

                                  {/* Rangée de Pilules : club en ROUGE, adversaire en ANTHRACITE, score au centre */}
                                  <div className="flex items-center justify-between gap-3 w-full min-w-0">
                                    <div
                                      className={
                                        'flex-1 min-w-0 font-black uppercase tracking-wider px-4 rounded-full shadow-lg text-center flex items-center justify-center border ' +
                                        getFontFamilyClass(layer2FontHeader) +
                                        ' bg-gradient-to-r from-red-600 via-rose-600 to-red-600 text-white ring-2 ring-red-400/80 border-red-500'
                                      }
                                      style={{ height: pillHeight }}
                                    >
                                      <AutoFitTeamName
                                        name={teamLeft}
                                        count={count}
                                        aspectRatio={aspectRatio}
                                        fontHeader={layer2FontHeader}
                                        pillHeight={pillH}
                                        textColor="#ffffff"
                                      />
                                    </div>

                                    <div
                                      className={
                                        'shrink-0 bg-white text-slate-950 font-mono font-black shadow-xl text-center border-2 border-white flex items-center justify-center rounded-full px-3 ' +
                                        (resultDisplayMode === 'status' || !hasScore ? getFontFamilyClass(layer2FontBody) : '')
                                      }
                                      style={{
                                        height: pillHeight,
                                        fontSize: (resultDisplayMode === 'status' || !hasScore) ? statusFontSize : scoreFontSize,
                                        color: (resultDisplayMode === 'status' || !hasScore) ? (isWin ? '#047857' : '#be123c') : (layer2BadgeBgColor || '#111111'),
                                      }}
                                    >
                                      {resultDisplayMode === 'status' || !hasScore ? (isWin ? 'VICTOIRE' : 'DÉFAITE') : scoreDisplay}
                                    </div>

                                    <div
                                      className={
                                        'flex-1 min-w-0 font-black uppercase tracking-wider px-4 rounded-full shadow-lg text-center flex items-center justify-center border ' +
                                        getFontFamilyClass(layer2FontHeader) +
                                        ' bg-slate-900/95 text-slate-200 border-slate-700/80'
                                      }
                                      style={{ height: pillHeight }}
                                    >
                                      <AutoFitTeamName
                                        name={teamRight}
                                        count={count}
                                        aspectRatio={aspectRatio}
                                        fontHeader={layer2FontHeader}
                                        pillHeight={pillH}
                                        textColor="#e2e8f0"
                                      />
                                    </div>
                                  </div>
                                </div>
                              );
                            };

                            return (
                              <div
                                className={
                                  'w-full flex-1 flex my-auto min-h-0 overflow-hidden ' +
                                  (rightResults.length > 0 ? 'flex-row px-2' : 'flex-col justify-center')
                                }
                                style={{ gap: sizing0.gapY + 'px' }}
                              >
                                <div
                                  className={
                                    rightResults.length > 0
                                      ? 'flex-1 min-w-0 flex flex-col justify-between min-h-0'
                                      : 'w-full flex flex-col justify-center min-h-0'
                                  }
                                  style={{ gap: sizing0.gapY + 'px' }}
                                >
                                  {leftResults.map(renderPosterCard)}
                                </div>
                                {rightResults.length > 0 && (
                                  <div className="flex-1 min-w-0 flex flex-col justify-between min-h-0" style={{ gap: sizing0.gapY + 'px' }}>
                                    {rightResults.map(renderPosterCard)}
                                  </div>
                                )}
                              </div>
                            );
                          })()}

{/* NOTIFICATION BODY */}
                        {contentType === 'notification' && specificNotification && (
                          <div className="w-full flex-1 flex flex-col items-center justify-center text-center my-4">
                            <div
                              className={`w-28 h-28 rounded-3xl flex items-center justify-center mb-4 shadow-xl ${
                                specificNotification.isWin ? 'bg-emerald-500' : 'bg-red-600'
                              }`}
                            >
                              <Trophy className="w-16 h-16 text-white" />
                            </div>
                            <h4 className="font-montserrat font-black text-5xl tracking-wider text-white uppercase drop-shadow-md">
                              {specificNotification.isWin ? 'VICTOIRE DU CLUB !' : 'COUP DE SIFFLET FINAL'}
                            </h4>
                            <div className="font-montserrat font-bold text-slate-300 text-2xl mt-2">
                              {specificNotification.category || specificNotification.team}
                            </div>

                            <div className="w-full max-w-[920px] bg-black/60 rounded-3xl border-2 border-white/20 p-8 my-6 flex items-center justify-center gap-6 backdrop-blur-md">
                              <div className="flex-1 font-montserrat font-extrabold text-2xl text-right truncate">
                                {specificNotification.ourTeam || safeShortName}
                              </div>
                              <div className="px-8 py-2 bg-red-600 rounded-2xl text-6xl font-black font-teko text-white border-2 border-red-500 shadow-md">
                                {specificNotification.ourScore} : {specificNotification.opponentScore}
                              </div>
                              <div className="flex-1 font-montserrat font-extrabold text-2xl text-left truncate text-slate-300">
                                {specificNotification.opponent || 'Adversaire'}
                              </div>
                            </div>
                          </div>
                        )}

                      </div>
                    </>
                    );
}
