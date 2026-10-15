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

  return (
                    <>
                      {/* Photo background with grayscale, blur, scale, brightness, contrast (Calque 1) */}
                      <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <img
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
                      {showStudioLayer3 && Boolean(effectiveLayer3Url) && (
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
                          <img
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
                      {showStudioLayer4 && Boolean(effectiveLayer4Url) && (
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
                          <img
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
                              const isHome = Boolean(m.isHomeMatch);
                              const isExempt = posterFilter === 'exempt' || isExemptItem(m);
                              const isLive = isMatchLive(m);
                              const isFinished = isMatchFinished(m);
                              const hasScore = m.homeScore !== undefined && m.awayScore !== undefined;
                              const isWin = isMatchWin(m, safeClubName, safeShortName);

                              const teamLeft = isHome ? m.category : (m.teamHome || 'Notre Club');
                              const teamRight = isExempt ? 'Exempt' : (isHome ? (m.teamAway || 'Adversaire') : m.category);
                              const dateText = formatPosterMatchDate(m.date, m.time);

                              const sizing = getAdaptivePosterCardSizing(count, aspectRatio);
                              const pillH = sizing.pillHeight;
                              const pillHeight = pillH + 'px';
                              const headerFontSize = Math.max(sizing.headerFontSize, Math.min(Math.round(pillH * 0.36), 46)) + 'px';
                              const centerFontSize = Math.max(sizing.centerFontSize, Math.round(pillH * 0.42)) + 'px';

                              return (
                                <div key={m.id} className="flex flex-col gap-1.5 w-full flex-1 justify-center min-h-0">
                                  {/* Intitulé : Catégorie dorée • Date & Heure • Badge Domicile/Extérieur */}
                                  <div className="flex items-center justify-between gap-2 px-1">
                                    <div
                                      className={
                                        'flex items-center gap-2 font-black uppercase tracking-wider text-white ' +
                                        getFontFamilyClass(layer2FontBody)
                                      }
                                      style={{ fontSize: headerFontSize }}
                                    >
                                      <span className="text-amber-400 tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                                        {m.category}
                                      </span>

                                      {isLive ? (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-red-600 text-white font-black text-sm uppercase tracking-wider animate-pulse shadow-lg border border-red-400 shrink-0">
                                          <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                                          <span>EN COURS</span>
                                        </span>
                                      ) : isFinished ? (
                                        <span
                                          className={
                                            'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-sm font-black uppercase tracking-wider shrink-0 ' +
                                            (isWin ? 'bg-emerald-600/90 text-white' : 'bg-rose-600/90 text-white')
                                          }
                                        >
                                          {isWin ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                          <span>{isWin ? 'VICTOIRE' : 'DÉFAITE'}</span>
                                        </span>
                                      ) : null}

                                      {dateText && !isLive && (
                                        <>
                                          <span className="text-slate-500">•</span>
                                          <span className="text-slate-200 font-semibold" style={{ fontSize: '0.65em' }}>
                                            {dateText}
                                          </span>
                                        </>
                                      )}
                                    </div>

                                    {isHome ? (
                                      <span
                                        className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-400/60 shadow-md shrink-0"
                                        title="Match à Domicile"
                                      >
                                        <Home className="w-5 h-5 text-emerald-400" />
                                      </span>
                                    ) : (
                                      <span
                                        className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-sky-500/20 border border-sky-400/60 shadow-md shrink-0"
                                        title="Match à l'Extérieur"
                                      >
                                        <Plane className="w-5 h-5 text-sky-400 -rotate-45" />
                                      </span>
                                    )}
                                  </div>

                                  {/* Rangée de Pilules : club en ROUGE, adversaire en ANTHRACITE, heure au centre */}
                                  <div className="flex items-center justify-between gap-3 w-full min-w-0">
                                    <div
                                      className={
                                        'flex-1 min-w-0 font-black uppercase tracking-wider px-4 rounded-full shadow-lg text-center flex items-center justify-center border ' +
                                        getFontFamilyClass(layer2FontHeader) +
                                        (isHome
                                          ? ' bg-gradient-to-r from-red-600 via-rose-600 to-red-600 text-white ring-2 ring-red-400/80 border-red-500'
                                          : ' bg-slate-900/95 text-slate-200 border-slate-700/80')
                                      }
                                      style={{ height: pillHeight }}
                                    >
                                      <AutoFitTeamName
                                        name={teamLeft}
                                        count={count}
                                        aspectRatio={aspectRatio}
                                        fontHeader={layer2FontHeader}
                                        pillHeight={pillH}
                                        textColor={isHome ? '#ffffff' : '#e2e8f0'}
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
                                          {hasScore ? m.homeScore + ' - ' + m.awayScore : (m.time || 'EN COURS')}
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
                                        <span className="font-black leading-none">{m.homeScore} - {m.awayScore}</span>
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
                                        (!isHome
                                          ? ' bg-gradient-to-r from-red-600 via-rose-600 to-red-600 text-white ring-2 ring-red-400/80 border-red-500'
                                          : ' bg-slate-900/95 text-slate-200 border-slate-700/80')
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
                                        textColor={!isHome ? '#ffffff' : '#e2e8f0'}
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
{/* RESULTS LIST BODY */}
                        {contentType === 'results' && (
                          <div
                            className={`w-full flex-1 ${
                              aspectRatio === '16:9' && displayedResults.length >= 4
                                ? 'grid grid-cols-2 gap-x-8 gap-y-3 items-center my-auto px-2'
                                : `flex flex-col justify-center my-1 ${
                                    aspectRatio === '16:9'
                                      ? 'max-w-[88%] mx-auto pr-16 gap-3'
                                      : displayedResults.length >= 6
                                      ? 'gap-2.5'
                                      : displayedResults.length === 5
                                      ? 'gap-3.5'
                                      : displayedResults.length === 4
                                      ? 'gap-5'
                                      : 'gap-7'
                                  }`
                            }`}
                          >
                            {displayedResults.map((r) => {
                              const isWin = isMatchWin(r, safeClubName, safeShortName);
                              const isHomeClub = isClubHomeMatch(r, safeClubName, safeShortName);
                              const teamLeft = isHomeClub ? r.category : (r.teamHome || 'Notre Club');
                              const teamRight = isHomeClub ? (r.teamAway || 'Adversaire') : r.category;
                              const matchDateText = r.date ? formatPosterMatchDate(r.date, r.time).split('|')[0].trim() : '';

                              const hasScore = r.homeScore !== undefined && r.awayScore !== undefined;
                              const scoreDisplay = hasScore ? `${r.homeScore} - ${r.awayScore}` : (isWin ? 'VICTOIRE' : 'DÉFAITE');
                              const count = displayedResults.length;

                              const pillH = aspectRatio === '16:9' ? (count >= 4 ? 70 : 80) : (count >= 6 ? 80 : count === 5 ? 90 : count === 4 ? 102 : 112);
                              const pillHeight = pillH + 'px';
                              const scoreFontSize = Math.round(pillH * 0.52) + 'px';
                              const headerFontSize = aspectRatio === '16:9' ? '30px' : (count >= 6 ? '34px' : count === 5 ? '38px' : count === 4 ? '42px' : (aspectRatio === '1:1' ? '36px' : '46px'));
                              const headerMb = aspectRatio === '16:9' ? 'mb-1' : (count >= 5 ? 'mb-1.5' : 'mb-2.5');

                              return (
                                <div key={r.id} className="w-full flex flex-col items-center">
                                  {/* Date / Category */}
                                  <div
                                    className={`${getFontFamilyClass(layer2FontBody)} font-bold text-center ${headerMb} drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)] flex items-center justify-center gap-3`}
                                    style={{
                                      fontSize: headerFontSize,
                                      color: layer2TextColor,
                                      letterSpacing: '0.8px',
                                    }}
                                  >
                                    <span>{matchDateText || r.category}</span>
                                    {resultDisplayMode !== 'score' && (
                                      <>
                                        <span>•</span>
                                        <span className={isWin ? 'text-emerald-400 font-extrabold' : 'text-rose-400 font-extrabold'}>
                                          {isWin ? 'VICTOIRE' : 'DÉFAITE'}
                                        </span>
                                      </>
                                    )}
                                  </div>

                                  {/* Row */}
                                  <div className="w-full flex items-center justify-between gap-4">
                                    <div
                                      className="flex-1 rounded-full flex items-center justify-center border-t-2 border-white/25"
                                      style={{
                                        height: pillHeight,
                                        background: `linear-gradient(180deg, ${layer2BadgeBgColor || '#c80815'} 0%, ${layer2BadgeBgColor || '#c80815'}dd 100%)`,
                                        boxShadow: '0 8px 18px rgba(0, 0, 0, 0.4)',
                                      }}
                                    >
                                      <AutoFitTeamName name={teamLeft} count={count} aspectRatio={aspectRatio} fontHeader={layer2FontHeader} pillHeight={pillH} textColor={layer2BadgeTextColor} />
                                    </div>

                                    <div
                                      className={`px-6 rounded-full font-black flex items-center justify-center shrink-0 shadow-md ${
                                        resultDisplayMode === 'status' || !hasScore ? 'font-sans uppercase tracking-wider' : 'font-mono font-black'
                                      }`}
                                      style={{
                                        height: pillHeight,
                                        fontSize: (resultDisplayMode === 'status' || !hasScore) ? Math.round(pillH * 0.34) + 'px' : scoreFontSize,
                                        backgroundColor: layer2BadgeTextColor === '#000000' ? '#f8fafc' : '#ffffff',
                                        color: (resultDisplayMode === 'status' || !hasScore)
                                          ? (isWin ? '#047857' : '#be123c')
                                          : (layer2BadgeBgColor || '#111111'),
                                      }}
                                    >
                                      {resultDisplayMode === 'status' || !hasScore
                                        ? (isWin ? 'VICTOIRE' : 'DÉFAITE')
                                        : scoreDisplay}
                                    </div>

                                    <div
                                      className="flex-1 rounded-full flex items-center justify-center border-t-2 border-white/25"
                                      style={{
                                        height: pillHeight,
                                        background: `linear-gradient(180deg, ${layer2BadgeBgColor || '#c80815'} 0%, ${layer2BadgeBgColor || '#c80815'}dd 100%)`,
                                        boxShadow: '0 8px 18px rgba(0, 0, 0, 0.4)',
                                      }}
                                    >
                                      <AutoFitTeamName name={teamRight} count={count} aspectRatio={aspectRatio} fontHeader={layer2FontHeader} pillHeight={pillH} textColor={layer2BadgeTextColor} />
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

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