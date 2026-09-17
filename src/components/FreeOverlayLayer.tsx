import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, Maximize2 } from 'lucide-react';
import { OverlayLayerItem } from '../types';
import { isVideoMedia } from '../utils/mediaUtils';

interface FreeOverlayLayerProps {
  layer?: OverlayLayerItem;
  layerNumber: 3 | 4;
  isVictoryContext?: boolean;
  interactive?: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
  onPositionChange?: (x: number, y: number) => void;
  containerRef?: React.RefObject<HTMLDivElement | null>;
}

const hexToRgb = (hex: string) => {
  let cleanHex = (hex || '#00ff00').replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map((c) => c + c).join('');
  }
  const num = parseInt(cleanHex, 16) || 0;
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
};

export const FreeOverlayLayer: React.FC<FreeOverlayLayerProps> = ({
  layer,
  layerNumber,
  isVictoryContext = false,
  interactive = false,
  isSelected = false,
  onSelect,
  onPositionChange,
  containerRef,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [videoError, setVideoError] = useState(false);

  const isEnabled = Boolean(layer && layer.enabled && layer.mediaUrl);
  const isVisibleForVictory = !layer?.onlyOnVictory || isVictoryContext;
  const shouldRender = isEnabled && isVisibleForVictory;

  const isVideo = Boolean(
    layer && (layer.mediaType === 'video' || isVideoMedia(layer.mediaUrl))
  );

  // Autoplay guarantee & video lifecycle
  useEffect(() => {
    if (!shouldRender || !isVideo) return;

    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.loop = true;

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsPlaying(true);
          setVideoError(false);
        })
        .catch((err) => {
          console.warn('Autoplay waiting or blocked:', err);
          setIsPlaying(false);
        });
    }
  }, [shouldRender, isVideo, layer?.mediaUrl]);

  // Real-time Canvas Chroma Key for videos
  useEffect(() => {
    if (!shouldRender || !layer || !layer.useChromaKey || !isVideo) {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    let ctx: CanvasRenderingContext2D | null = null;
    try {
      ctx = canvas.getContext('2d', { willReadFrequently: true });
    } catch {
      return;
    }
    if (!ctx) return;

    const { r: keyR, g: keyG, b: keyB } = hexToRgb(layer.chromaKeyColor || '#00ff00');
    const tolerance = Math.max(0.05, Math.min(0.8, layer.chromaTolerance ?? 0.35));
    const smoothness = Math.max(0.01, Math.min(0.3, layer.chromaSmoothness ?? 0.08));

    let isRunning = true;

    const renderFrame = () => {
      if (!isRunning) return;

      if (video && video.readyState >= 2 && !video.paused && !video.ended) {
        const width = video.videoWidth || 640;
        const height = video.videoHeight || 360;

        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
        }

        ctx.drawImage(video, 0, 0, width, height);

        try {
          const frame = ctx.getImageData(0, 0, width, height);
          const data = frame.data;
          const len = data.length;

          for (let i = 0; i < len; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            const dist =
              Math.sqrt(
                Math.pow(r - keyR, 2) + Math.pow(g - keyG, 2) + Math.pow(b - keyB, 2)
              ) / 441.67;

            // Green screen bias detection if keying green
            const isGreenKey = keyG > 180 && keyR < 100 && keyB < 100;
            const isGreenDominant = isGreenKey && g > 60 && g > r * 1.15 && g > b * 1.15;

            if (dist < tolerance || (isGreenDominant && dist < tolerance * 1.3)) {
              data[i + 3] = 0; // Transparent
            } else if (dist < tolerance + smoothness) {
              const edgeAlpha = (dist - tolerance) / smoothness;
              data[i + 3] = Math.round(data[i + 3] * Math.max(0, Math.min(1, edgeAlpha)));
            }
          }

          ctx.putImageData(frame, 0, 0);
        } catch {
          // ignore potential frame security error
        }
      }

      animFrameRef.current = requestAnimationFrame(renderFrame);
    };

    renderFrame();

    return () => {
      isRunning = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };
  }, [
    shouldRender,
    isVideo,
    layer?.mediaUrl,
    layer?.useChromaKey,
    layer?.chromaKeyColor,
    layer?.chromaTolerance,
    layer?.chromaSmoothness,
  ]);

  if (!shouldRender || !layer) {
    return null;
  }

  // Toggle Video Play / Pause
  const togglePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  // Drag & drop handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!interactive || !onPositionChange || layer.fullScreen) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    if (onSelect) onSelect();

    const parent = containerRef?.current || (e.currentTarget.parentElement as HTMLElement);
    if (!parent) return;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const rect = parent.getBoundingClientRect();
      const mouseX = moveEvent.clientX - rect.left;
      const mouseY = moveEvent.clientY - rect.top;

      let pctX = Math.round((mouseX / rect.width) * 100);
      let pctY = Math.round((mouseY / rect.height) * 100);

      pctX = Math.max(0, Math.min(100, pctX));
      pctY = Math.max(0, Math.min(100, pctY));

      onPositionChange(pctX, pctY);
    };

    const onMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const isFullScreenMode = Boolean(layer.fullScreen);
  const isMotionActive = !isFullScreenMode && Boolean(layer.motionTrajectory && layer.motionTrajectory !== 'none');
  const currentX = layer.x ?? 50;
  const currentY = layer.y ?? (isMotionActive ? 78 : 50);
  const currentScale = layer.scale ?? 1.0;
  const currentOpacity = layer.opacity ?? 1.0;
  const motionDuration = layer.motionDuration ?? 12;
  const isFlipped = Boolean(layer.flipHorizontal);

  // Calcul de la largeur en fonction de l'échelle (de 10rem à toute la largeur)
  const baseWidthRem = 16 * currentScale;

  // Styles de conteneur selon mode Plein Écran, Traversée animée ou Libre
  let containerStyle: React.CSSProperties;

  if (isFullScreenMode) {
    containerStyle = {
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      opacity: currentOpacity,
      zIndex: layerNumber === 4 ? 35 : 30,
      transform: isFlipped ? 'scaleX(-1)' : undefined,
    };
  } else if (isMotionActive) {
    containerStyle = {
      position: 'absolute',
      top: `${currentY}%`,
      opacity: currentOpacity,
      zIndex: layerNumber === 4 ? 35 : 30,
      animation: `${
        layer.motionTrajectory === 'right-to-left' ? 'traverseRightToLeft' : 'traverseLeftToRight'
      } ${motionDuration}s linear infinite`,
      transform: `translate(-50%, -50%) ${isFlipped ? 'scaleX(-1)' : ''}`,
      willChange: 'left',
    };
  } else {
    containerStyle = {
      position: 'absolute',
      left: `${currentX}%`,
      top: `${currentY}%`,
      transform: `translate(-50%, -50%) ${isFlipped ? 'scaleX(-1)' : ''}`,
      opacity: currentOpacity,
      zIndex: layerNumber === 4 ? 35 : 30,
    };
  }

  return (
    <div
      style={containerStyle}
      className={`select-none ${
        isFullScreenMode
          ? interactive ? 'pointer-events-auto group' : 'pointer-events-none'
          : isMotionActive
          ? interactive ? 'pointer-events-auto group' : 'pointer-events-none'
          : interactive ? 'cursor-move pointer-events-auto group' : 'pointer-events-none'
      }`}
      onMouseDown={isMotionActive ? undefined : handleMouseDown}
      onClick={(e) => {
        if (interactive && onSelect) {
          e.stopPropagation();
          onSelect();
        }
      }}
    >
      {/* Interactive Drag Bounding Box & Label in Studio */}
      {interactive && !isFullScreenMode && !isMotionActive && (
        <div
          className={`absolute -inset-2 rounded-2xl border-2 transition-all pointer-events-none ${
            isSelected || isDragging
              ? layerNumber === 3
                ? 'border-emerald-400 bg-emerald-500/10 shadow-lg shadow-emerald-500/20'
                : 'border-purple-400 bg-purple-500/10 shadow-lg shadow-purple-500/20'
              : 'border-transparent group-hover:border-white/40'
          }`}
        >
          {/* Badge indicator */}
          <div
            className={`absolute -top-7 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider text-white shadow flex items-center gap-1.5 whitespace-nowrap ${
              layerNumber === 3 ? 'bg-emerald-600' : 'bg-purple-600'
            }`}
          >
            <span>C{layerNumber}</span>
            <span>{layer.name || (layerNumber === 3 ? 'Élément 1' : 'Élément 2')}</span>
            <span className="font-mono text-[9px] opacity-80">
              ({currentX}%, {currentY}%) - {Math.round(currentScale * 100)}%
            </span>
          </div>
        </div>
      )}

      {/* Badge indicateur d'animation de traversée */}
      {interactive && isMotionActive && (
        <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider text-white shadow bg-sky-600 flex items-center gap-1.5 whitespace-nowrap pointer-events-none">
          <span>🏃 Traversée {layer.motionTrajectory === 'right-to-left' ? '◀ Droite ➔ Gauche' : '▶ Gauche ➔ Droite'}</span>
          <span className="opacity-80 font-mono">({motionDuration}s)</span>
        </div>
      )}

      {/* Visual Content Container */}
      <div
        className={`${
          isFullScreenMode ? 'w-full h-full' : 'transition-transform duration-75'
        } relative`}
        style={
          isFullScreenMode
            ? undefined
            : {
                width: `${baseWidthRem}rem`,
                maxWidth: '96vw',
              }
        }
      >
        {isVideo ? (
          <>
            {/* Vidéo source */}
            <video
              ref={videoRef}
              src={layer.mediaUrl}
              autoPlay
              loop
              muted
              playsInline
              crossOrigin="anonymous"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onError={() => setVideoError(true)}
              style={
                isFullScreenMode
                  ? {
                      width: '100%',
                      height: '100%',
                      objectFit: layer.objectFit || 'cover',
                    }
                  : undefined
              }
              className={
                layer.useChromaKey
                  ? 'absolute -top-[9999px] -left-[9999px] opacity-0 pointer-events-none w-1 h-1'
                  : isFullScreenMode
                  ? 'w-full h-full'
                  : 'w-full h-auto object-contain drop-shadow-2xl'
              }
            />

            {/* Canvas avec suppression de fond vert (Chroma Key) */}
            {layer.useChromaKey && (
              <canvas
                ref={canvasRef}
                style={
                  isFullScreenMode
                    ? {
                        width: '100%',
                        height: '100%',
                        objectFit: layer.objectFit || 'cover',
                      }
                    : undefined
                }
                className={
                  isFullScreenMode
                    ? 'w-full h-full'
                    : 'w-full h-auto object-contain drop-shadow-2xl'
                }
              />
            )}

            {/* Bouton Lecture / Pause interactif si en mode Studio */}
            {interactive && (
              <button
                type="button"
                onClick={togglePlayPause}
                title={isPlaying ? 'Mettre en pause la vidéo' : 'Lancer la lecture de la vidéo'}
                className="absolute bottom-2 right-2 z-50 p-2 rounded-full bg-black/75 hover:bg-black text-white border border-white/20 shadow-lg backdrop-blur-md opacity-80 hover:opacity-100 transition-all flex items-center justify-center pointer-events-auto"
              >
                {isPlaying ? (
                  <Pause className="w-3.5 h-3.5 text-white" />
                ) : (
                  <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                )}
              </button>
            )}
          </>
        ) : (
          <img
            src={layer.mediaUrl}
            alt={layer.name || `Calque ${layerNumber}`}
            style={
              isFullScreenMode
                ? {
                    width: '100%',
                    height: '100%',
                    objectFit: layer.objectFit || 'cover',
                  }
                : undefined
            }
            className={
              isFullScreenMode
                ? 'w-full h-full pointer-events-none'
                : 'w-full h-auto object-contain drop-shadow-2xl pointer-events-none'
            }
            crossOrigin="anonymous"
          />
        )}
      </div>
    </div>
  );
};
