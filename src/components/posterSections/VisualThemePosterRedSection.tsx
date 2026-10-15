// VisualThemePosterRedSection — bloc « visualTheme === 'poster-red' » de VisualExporterModal.
// Extrait automatiquement lors du découpage : aucune logique modifiée.

import { Trophy, Home } from 'lucide-react';
import { getFontFamilyClass } from '../../utils/fontUtils';
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

  return (
                    <>
                      {/* Photo background with grayscale, blur, scale, brightness, contrast (Calque 1) */}
                      <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <img
                          src={effectiveBgUrl}
                          alt="Fond affiche basket"
                          className="w-full h-full object-cover pointer-events-none transition-all duration-75"
                          style={{
                            filter: `${layer1Grayscale ? 'grayscale(100%)' : 'grayscale(0%)'} contrast(${layer1Contrast}) brightness(${layer1Brightness}) blur(${layer1Blur}px)`,
                            transform: `scale(${layer1Scale})`,
                          }}
                        />
                      </div>

                      {/* Radial vignette overlay for maximum readability & high contrast */}
                      <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          background: 'radial-gradient(circle at center, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.8) 100%)',
                        }}
                      />

                      {/* Subtle sports lighting accent */}
                      <div className="absolute -top-20 left-1/2 transform -translate-x-1/2 w-[600px] h-[300px] bg-red-600/20 blur-3xl pointer-events-none" />

                      {/* STUDIO LAYER 3: ÉLÉMENT LIBRE / DÉCOR GRAPHISME */}
                      {showStudioLayer3 && Boolean(effectiveLayer3Url) && (
                        <div
                          className={`absolute pointer-events-none z-10 transition-all ${getLayer3PositionClass(studioLayer3Pos)}`}
                          style={{
                            opacity: effectiveCategoryConfig.layer3?.opacity ?? 0.9,
                            transform: getLayer3Transform(
                              studioLayer3Scale,
                              effectiveCategoryConfig.layer3?.flipHorizontal
                            ),
                            transformOrigin: getLayer3TransformOrigin(studioLayer3Pos),
                            maxHeight: '38%',
                            maxWidth: '38%',
                          }}
                        >
                          <img
                            src={effectiveLayer3Url}
                            alt="Calque 3"
                            className="max-h-full max-w-full object-contain filter drop-shadow-[0_8px_24px_rgba(0,0,0,0.85)]"
                          />
                        </div>
                      )}

                      {/* STUDIO LAYER 4: SPONSOR / PARTENAIRE DU CLUB */}
                      {showStudioLayer4 && Boolean(effectiveLayer4Url) && (
                        <div
                          className={`absolute pointer-events-none z-10 transition-all ${getLayer4PositionClass(studioLayer4Pos)}`}
                          style={{
                            opacity: effectiveCategoryConfig.layer4?.opacity ?? 0.95,
                            transform: `scale(${studioLayer4Scale})`,
                            transformOrigin: getLayer4TransformOrigin(studioLayer4Pos),
                            maxHeight: '22%',
                            maxWidth: '28%',
                          }}
                        >
                          <img
                            src={effectiveLayer4Url}
                            alt="Calque 4"
                            className="max-h-full max-w-full object-contain filter drop-shadow-[0_4px_16px_rgba(0,0,0,0.75)]"
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

                        {/* MATCHES LIST BODY */}
                        {contentType === 'matches' && (
                          <div
                            className={`w-full flex-1 ${
                              aspectRatio === '16:9' && displayedMatches.length >= 4
                                ? 'grid grid-cols-2 gap-x-8 gap-y-3 items-center my-auto px-2'
                                : `flex flex-col justify-center my-1 ${
                                    aspectRatio === '16:9'
                                      ? 'max-w-[88%] mx-auto pr-16 gap-3'
                                      : displayedMatches.length >= 6
                                      ? 'gap-2.5'
                                      : displayedMatches.length === 5
                                      ? 'gap-3.5'
                                      : displayedMatches.length === 4
                                      ? 'gap-5'
                                      : 'gap-7'
                                  }`
                            }`}
                          >
                            {displayedMatches.map((m) => {
                              const isExempt = posterFilter === 'exempt' || isExemptItem(m);
                              const isHome = Boolean(m.isHomeMatch);

                              const teamLeft = isHome ? m.category : (m.teamHome || 'Notre Club');
                              const teamRight = isExempt ? 'Exempt' : (isHome ? (m.teamAway || 'Adversaire') : m.category);
                              const count = displayedMatches.length;

                              const pillHeight = aspectRatio === '16:9' ? (count >= 4 ? '70px' : '80px') : (count >= 6 ? '80px' : count === 5 ? '90px' : count === 4 ? '102px' : '112px');
                              const headerFontSize = aspectRatio === '16:9' ? '26px' : (count >= 6 ? '27px' : count === 5 ? '29px' : count === 4 ? '31px' : (aspectRatio === '1:1' ? '29px' : '33px'));
                              const headerMb = aspectRatio === '16:9' ? 'mb-1' : (count >= 5 ? 'mb-1.5' : 'mb-2.5');
                              const vsBadgeSize = aspectRatio === '16:9' ? 'w-14 h-14 text-lg' : (count >= 6 ? 'w-15 h-15 text-lg' : count === 5 ? 'w-16 h-16 text-xl' : 'w-18 h-18 text-2xl');

                              const isLive = isMatchLive(m);
                              const isFinished = isMatchFinished(m);
                              const hasScore = m.homeScore !== undefined && m.awayScore !== undefined;

                              return (
                                <div key={m.id} className="w-full flex flex-col items-center">
                                  {/* Match Date Header: Samedi 19 septembre | 13h30 + Statut DIRECT */}
                                  <div
                                    className={`${getFontFamilyClass(layer2FontBody)} font-bold text-center ${headerMb} drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)] flex items-center justify-center gap-3`}
                                    style={{
                                      fontSize: headerFontSize,
                                      color: layer2TextColor,
                                      letterSpacing: '0.8px',
                                    }}
                                  >
                                    <span>{formatPosterMatchDate(m.date, m.time)}</span>
                                    {isLive && (
                                      <span className="px-4 py-1 rounded-full bg-red-600 text-white font-black text-lg uppercase tracking-wider animate-pulse shadow-md flex items-center gap-2">
                                        <span className="w-3 h-3 rounded-full bg-white animate-ping" />
                                        EN COURS
                                      </span>
                                    )}
                                  </div>

                                  {/* Match Row: [Team Left Pill] (vs) [Team Right Pill] */}
                                  <div className="w-full flex items-center justify-between gap-4">
                                    
                                    {/* Home / Category Pill with Auto-adaptive font */}
                                    <div
                                      className="flex-1 rounded-full flex items-center justify-center border-t-2 border-white/25"
                                      style={{
                                        height: pillHeight,
                                        background: `linear-gradient(180deg, ${layer2BadgeBgColor} 0%, ${layer2BadgeBgColor}dd 100%)`,
                                        boxShadow: '0 8px 18px rgba(0, 0, 0, 0.4), inset 0 2px 0 rgba(255, 255, 255, 0.2)',
                                      }}
                                    >
                                      <AutoFitTeamName name={teamLeft} count={count} aspectRatio={aspectRatio} fontHeader={layer2FontHeader} textColor={layer2BadgeTextColor} />
                                    </div>

                                    {/* Center Round VS Badge / Live / Score */}
                                    {isLive ? (
                                      <div
                                        className={`${vsBadgeSize} rounded-full font-black flex items-center justify-center shrink-0 shadow-[0_4px_12px_rgba(0,0,0,0.5)] select-none bg-red-600 text-white uppercase text-sm animate-pulse border-2 border-red-300`}
                                        title="Match en cours"
                                      >
                                        {hasScore ? `${m.homeScore}-${m.awayScore}` : 'en cours'}
                                      </div>
                                    ) : isFinished && hasScore ? (
                                      <div
                                        className={`${vsBadgeSize} rounded-full font-black flex items-center justify-center shrink-0 shadow-[0_4px_12px_rgba(0,0,0,0.5)] select-none bg-white text-slate-900 border-2 border-slate-300 text-base font-mono`}
                                      >
                                        {m.homeScore}-{m.awayScore}
                                      </div>
                                    ) : (
                                      <div
                                        className={`${vsBadgeSize} rounded-full font-black flex items-center justify-center shrink-0 shadow-[0_4px_12px_rgba(0,0,0,0.5)] lowercase select-none ${getFontFamilyClass(layer2FontBody)}`}
                                        style={{
                                          backgroundColor: layer2BadgeTextColor === '#000000' ? '#f8fafc' : '#ffffff',
                                          color: layer2BadgeBgColor || '#111111',
                                        }}
                                      >
                                        vs
                                      </div>
                                    )}

                                    {/* Away / Opponent Pill with Auto-adaptive font */}
                                    <div
                                      className="flex-1 rounded-full flex items-center justify-center border-t-2 border-white/25"
                                      style={{
                                        height: pillHeight,
                                        background: `linear-gradient(180deg, ${layer2BadgeBgColor} 0%, ${layer2BadgeBgColor}dd 100%)`,
                                        boxShadow: '0 8px 18px rgba(0, 0, 0, 0.4), inset 0 2px 0 rgba(255, 255, 255, 0.2)',
                                      }}
                                    >
                                      <AutoFitTeamName name={teamRight} isExempt={isExempt} count={count} aspectRatio={aspectRatio} fontHeader={layer2FontHeader} textColor={layer2BadgeTextColor} />
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

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

                              const pillHeight = aspectRatio === '16:9' ? (count >= 4 ? '70px' : '80px') : (count >= 6 ? '80px' : count === 5 ? '90px' : count === 4 ? '102px' : '112px');
                              const headerFontSize = aspectRatio === '16:9' ? '26px' : (count >= 6 ? '27px' : count === 5 ? '29px' : count === 4 ? '31px' : (aspectRatio === '1:1' ? '29px' : '33px'));
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
                                      <AutoFitTeamName name={teamLeft} count={count} aspectRatio={aspectRatio} fontHeader={layer2FontHeader} textColor={layer2BadgeTextColor} />
                                    </div>

                                    <div
                                      className={`px-6 rounded-full font-black flex items-center justify-center shrink-0 shadow-md ${
                                        count >= 6 ? 'h-18 text-2xl' : 'h-20 text-3xl'
                                      } ${resultDisplayMode === 'status' || !hasScore ? 'font-sans uppercase tracking-wider text-xl font-black' : 'font-mono font-black'}`}
                                      style={{
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
                                      <AutoFitTeamName name={teamRight} count={count} aspectRatio={aspectRatio} fontHeader={layer2FontHeader} textColor={layer2BadgeTextColor} />
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