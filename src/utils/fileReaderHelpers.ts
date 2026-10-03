export const readFileAsDataUrl = (file: File | Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (typeof FileReader !== 'undefined') {
      const reader = new FileReader();

      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Impossible de lire le fichier comme Data URL'));
        }
      };

      reader.onerror = () => {
        reject(reader.error || new Error('Erreur lors de la lecture du fichier'));
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
        .catch((err) => reject(err || new Error('Erreur lors de la lecture du fichier')));
    }
  });
};
