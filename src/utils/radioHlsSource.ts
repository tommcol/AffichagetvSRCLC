import type Hls from 'hls.js';

/** HLS owns its MediaSource; reconnect by recreating it, never by audio.load(). */
export function createHlsRadioSource(audio: HTMLAudioElement, url: string, HlsClass: typeof Hls, onFatal: () => void) {
  let player: Hls | undefined;
  let disposed = false;
  return {
    load() {
      if (disposed) return;
      player?.destroy();
      player = new HlsClass({ enableWorker: false, backBufferLength: 30, maxBufferLength: 15 });
      player.on(HlsClass.Events.ERROR, (_event, data) => { if (data.fatal && !disposed) onFatal(); });
      player.loadSource(url);
      player.attachMedia(audio);
    },
    dispose() { disposed = true; player?.destroy(); player = undefined; },
  };
}
