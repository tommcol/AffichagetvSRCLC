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

export function readFileAsDataUrl(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    if (typeof FileReader !== 'undefined') {
      const reader = new FileReader();

      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Impossible de lire le fichier.'));
        }
      };

      reader.onerror = () => {
        reject(reader.error || new Error('Erreur de lecture du fichier.'));
      };

      reader.readAsDataURL(file);
    } else {
      file.arrayBuffer()
        .then((buffer) => {
          const bytes = new Uint8Array(buffer);
          let binary = '';
          for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          const base64 = typeof btoa !== 'undefined' ? btoa(binary) : '';
          const mime = file.type || 'application/octet-stream';
          resolve(`data:${mime};base64,${base64}`);
        })
        .catch((err) => reject(err || new Error('Erreur de lecture du fichier.')));
    }
  });
}
