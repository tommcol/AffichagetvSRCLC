export type Layer3Position =
  | 'bottom-right'
  | 'bottom-left'
  | 'top-right'
  | 'center';

export type Layer4Position =
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | 'center';

export function getLayer3PositionClass(
  position: Layer3Position
): string {
  switch (position) {
    case 'bottom-right':
      return 'bottom-8 right-8';

    case 'bottom-left':
      return 'bottom-8 left-8';

    case 'top-right':
      return 'top-32 right-8';

    case 'center':
      return 'bottom-16 left-1/2 -translate-x-1/2';

    default:
      return 'bottom-8 right-8';
  }
}

export function getLayer3TransformOrigin(
  position: Layer3Position
): string {
  return position === 'bottom-right'
    ? 'bottom right'
    : position === 'bottom-left'
    ? 'bottom left'
    : 'center center';
}

export function getLayer3Transform(
  scale: number,
  flipHorizontal?: boolean
): string {
  return `scale(${scale}) ${
    flipHorizontal ? 'scaleX(-1)' : ''
  }`;
}

export function getLayer4PositionClass(
  position: Layer4Position
): string {
  switch (position) {
    case 'top-right':
      return 'top-8 right-8';

    case 'bottom-left':
      return 'bottom-8 left-8';

    case 'bottom-right':
      return 'bottom-8 right-8';

    case 'center':
      return 'top-8 left-8';

    default:
      return 'top-8 right-8';
  }
}

export function getLayer4TransformOrigin(
  position: Layer4Position
): string {
  return position.includes('right')
    ? 'top right'
    : 'top left';
}

export { readFileAsDataUrl } from './fileReaderHelpers';
