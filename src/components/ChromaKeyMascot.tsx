import React, { useEffect, useRef, useState } from 'react';
import { ForegroundMascotConfig } from '../types';

interface ChromaKeyMascotProps {
  mascot?: ForegroundMascotConfig;
  isVictoryContext?: boolean;
  slideType?: 'matches' | 'results' | 'birthdays';
  className?: string;
}

// Parse Hex Chroma Color (default #00ff00)
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

export const ChromaKeyMascot: React.FC<ChromaKeyMascotProps> = ({
  mascot,
  isVictoryContext = false,
  slideType,
  className = '',
}) => {
  // MUST declare all hooks unconditionally at top level (Rules of Hooks)
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [canvasError, setCanvasError] = useState(false);

  const isEnabled = Boolean(mascot && mascot.enabled && mascot.mediaUrl);

  const isVisibleForSlide = !slideType
    ? true
    : slideType === 'matches'
    ? mascot?.showOnMatches !== false
    : slideType === 'results'
    ? mascot?.showOnResults !== false
    : slideType === 'birthdays'
    ? mascot?.showOnBirthdays !== false
    : true;

  const isVisibleForVictory = !mascot?.onlyOnVictory || isVictoryContext;
  const shouldRender = isEnabled && isVisibleForSlide && isVisibleForVictory;

  // Real-time Canvas Chroma Key processing loop
  useEffect(() => {
    if (!shouldRender || !mascot || !mascot.useChromaKey || mascot.mediaType !== 'video') {
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
      setCanvasError(true);
      return;
    }

    if (!ctx) return;

    const { r: keyR, g: keyG, b: keyB } = hexToRgb(mascot.chromaKeyColor || '#00ff00');
    const tolerance = Math.max(0.05, Math.min(0.8, mascot.chromaTolerance ?? 0.35));
    const smoothness = Math.max(0.01, Math.min(0.3, mascot.chromaSmoothness ?? 0.08));

    let isRunning = true;

    const renderFrame = () => {
      if (!isRunning) return;

      if (video && video.readyState >= 2 && !video.paused && !video.ended) {
        const width = video.videoWidth || 320;
        const height = video.videoHeight || 320;

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

            // Euclidean distance in normalized RGB
            const dist =
              Math.sqrt(
                Math.pow(r - keyR, 2) + Math.pow(g - keyG, 2) + Math.pow(b - keyB, 2)
              ) / 441.67;

            const isGreenDominant = g > 65 && g > r * 1.15 && g > b * 1.15;

            if (dist < tolerance || (isGreenDominant && dist < tolerance * 1.3)) {
              data[i + 3] = 0; // Transparent
            } else if (dist < tolerance + smoothness) {
              const edgeAlpha = (dist - tolerance) / smoothness;
              data[i + 3] = Math.round(data[i + 3] * Math.max(0, Math.min(1, edgeAlpha)));
            }
          }

          ctx.putImageData(frame, 0, 0);
        } catch {
          // If cross-origin or canvas security error, fallback safely without crashing
          setCanvasError(true);
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
    mascot?.mediaUrl,
    mascot?.useChromaKey,
    mascot?.mediaType,
    mascot?.chromaKeyColor,
    mascot?.chromaTolerance,
    mascot?.chromaSmoothness,
    videoLoaded,
  ]);

  // Early return ONLY after all hooks have been executed
  if (!shouldRender || !mascot) {
    return null;
  }

  // Position placement
  const getPositionClasses = () => {
    switch (mascot.position) {
      case 'bottom-left':
        return 'bottom-2 left-2 md:bottom-6 md:left-8';
      case 'top-right':
        return 'top-16 right-4 md:top-20 md:right-8';
      case 'center-right':
        return 'top-1/2 -translate-y-1/2 right-2 md:right-8';
      case 'bottom-right':
      default:
        return 'bottom-2 right-2 md:bottom-6 md:right-8';
    }
  };

  // Animation style
  const getAnimationClass = () => {
    switch (mascot.animationStyle) {
      case 'bounce':
        return 'animate-bounce';
      case 'pulse':
        return 'animate-pulse-slow';
      case 'float':
        return 'animate-pulse-slow transform hover:scale-105';
      case 'none':
      default:
        return '';
    }
  };

  const scaleMultiplier = mascot.scale ?? 1.0;
  const opacityVal = mascot.opacity ?? 1.0;
  const isHttpUrl = mascot.mediaUrl.startsWith('http');

  return (
    <div
      className={`absolute z-30 pointer-events-none transition-all duration-500 ease-out select-none ${getPositionClasses()} ${className}`}
      style={{
        transform: `scale(${scaleMultiplier})`,
        transformOrigin: mascot.position?.includes('left') ? 'bottom left' : 'bottom right',
        opacity: opacityVal,
      }}
    >
      <div className={`relative ${getAnimationClass()} drop-shadow-[0_15px_25px_rgba(0,0,0,0.65)]`}>
        {mascot.mediaType === 'image' ? (
          <img
            src={mascot.mediaUrl}
            alt="Mascotte 1er Plan"
            className="w-48 sm:w-60 md:w-80 lg:w-96 max-h-[46vh] object-contain"
            referrerPolicy="no-referrer"
          />
        ) : mascot.useChromaKey && !canvasError ? (
          <>
            {/* Hidden video source processing frames into canvas */}
            <video
              ref={videoRef}
              src={mascot.mediaUrl}
              autoPlay
              loop
              muted
              playsInline
              {...(isHttpUrl ? { crossOrigin: 'anonymous' } : {})}
              onLoadedData={() => setVideoLoaded(true)}
              onError={() => setCanvasError(true)}
              className="hidden"
            />
            {/* Real-time processed Canvas with green background stripped */}
            <canvas
              ref={canvasRef}
              className="w-48 sm:w-60 md:w-80 lg:w-96 max-h-[46vh] object-contain"
            />
          </>
        ) : (
          /* Transparent WebM or direct alpha video or fallback */
          <video
            ref={videoRef}
            src={mascot.mediaUrl}
            autoPlay
            loop
            muted
            playsInline
            className="w-48 sm:w-60 md:w-80 lg:w-96 max-h-[46vh] object-contain"
          />
        )}
      </div>
    </div>
  );
};
