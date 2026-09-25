import React, { useRef, useState, useEffect, useLayoutEffect } from 'react';

interface FixedCanvas169Props {
  children: React.ReactNode;
  className?: string;
  canvasClassName?: string;
  baseWidth?: number;
  baseHeight?: number;
}

/**
 * FixedCanvas169:
 * Renders an exact 16:9 fixed canvas (default 1920x1080 Full HD).
 * Automatically scales uniformly up or down to fit any display, TV, tablet, or phone,
 * perfectly preserving proportions without distortion, text wrapping breaks, or overflow —
 * exactly like a 16:9 movie/broadcast.
 */
export const FixedCanvas169: React.FC<FixedCanvas169Props> = ({
  children,
  className = '',
  canvasClassName = '',
  baseWidth = 1920,
  baseHeight = 1080,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Safe initial scale calculation
  const getInitialScale = () => {
    if (typeof window !== 'undefined' && window.innerWidth > 0 && window.innerHeight > 0) {
      return Math.min(window.innerWidth / baseWidth, window.innerHeight / baseHeight);
    }
    return 1;
  };

  const [scale, setScale] = useState<number>(getInitialScale);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: Math.round(baseWidth * getInitialScale()),
    height: Math.round(baseHeight * getInitialScale()),
  });

  const updateSize = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    if (w > 0 && h > 0) {
      const calculatedScale = Math.min(w / baseWidth, h / baseHeight);
      setScale(calculatedScale);
      setDimensions({
        width: Math.round(baseWidth * calculatedScale),
        height: Math.round(baseHeight * calculatedScale),
      });
    }
  };

  useLayoutEffect(() => {
    updateSize();
  }, [baseWidth, baseHeight]);

  useEffect(() => {
    updateSize();

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        updateSize();
      });
      resizeObserver.observe(containerRef.current);
    }

    window.addEventListener('resize', updateSize);
    return () => {
      window.removeEventListener('resize', updateSize);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [baseWidth, baseHeight]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full flex items-center justify-center overflow-hidden bg-black select-none ${className}`}
    >
      {/* Exact bounded scaled frame */}
      <div
        style={{
          width: `${dimensions.width}px`,
          height: `${dimensions.height}px`,
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: '#000000',
        }}
        className="shrink-0 shadow-2xl"
      >
        {/* Fixed 1920x1080 virtual canvas */}
        <div
          style={{
            width: `${baseWidth}px`,
            height: `${baseHeight}px`,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            position: 'absolute',
            top: 0,
            left: 0,
          }}
          className={`overflow-hidden ${canvasClassName}`}
        >
          {children}
        </div>
      </div>
    </div>
  );
};
