import React from 'react';
import { isVideoMedia } from '../../utils/mediaUtils';

/** The editor displays the real medium; PNG exports capture its current frame. */
export function PosterMedia({ src, alt, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) {
  if (src && isVideoMedia(src)) {
    return <video src={src} aria-label={alt} className={props.className} style={props.style} crossOrigin="anonymous" autoPlay muted loop playsInline preload="auto" />;
  }
  return <img src={src} alt={alt} {...props} />;
}
