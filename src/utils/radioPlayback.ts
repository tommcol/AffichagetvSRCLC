type AudioTarget = Pick<HTMLAudioElement, 'src' | 'muted' | 'volume' | 'play' | 'pause' | 'load' | 'removeAttribute' | 'addEventListener' | 'removeEventListener'>;

/** A persistent audio stream, independent of carousel slides and their timers. */
export function startRadioPlayback(audio: AudioTarget, url: string, options: {
  events: EventTarget;
  onBlocked: (blocked: boolean) => void;
  schedule?: (callback: () => void, delay: number) => ReturnType<typeof setTimeout>;
  cancel?: (timer: ReturnType<typeof setTimeout>) => void;
}) {
  const schedule = options.schedule || setTimeout;
  const cancel = options.cancel || clearTimeout;
  let disposed = false;
  let pending = false;
  let blocked = false;
  let attempts = 0;
  let playSequence = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const clearRetry = () => { if (timer !== undefined) cancel(timer); timer = undefined; };
  const retryLater = () => {
    if (disposed || blocked || timer !== undefined) return;
    timer = schedule(() => { timer = undefined; reconnect(); }, Math.min(60000, 5000 * 2 ** Math.min(attempts++, 4)));
  };
  const play = () => {
    if (disposed || pending) return;
    pending = true;
    const sequence = ++playSequence;
    void audio.play().then(() => {
      if (disposed || sequence !== playSequence) return;
      pending = false;
      blocked = false;
      attempts = 0;
      clearRetry();
      options.onBlocked(false);
    }).catch((error: unknown) => {
      if (disposed || sequence !== playSequence) return;
      pending = false;
      if ((error as { name?: string })?.name === 'NotAllowedError') {
        blocked = true;
        clearRetry();
        options.onBlocked(true);
      } else retryLater();
    });
  };
  const reconnect = () => {
    if (disposed) return;
    clearRetry();
    playSequence++;
    pending = false;
    audio.load();
    play();
    waiting();
  };
  const gesture = () => { if (blocked) play(); };
  const waiting = () => {
    if (timer !== undefined || blocked || disposed) return;
    timer = schedule(() => { timer = undefined; reconnect(); }, 30000);
  };
  const playing = () => { clearRetry(); attempts = 0; };
  audio.src = url;
  audio.muted = false;
  audio.volume = 1;
  audio.addEventListener('error', retryLater);
  audio.addEventListener('ended', retryLater);
  audio.addEventListener('stalled', waiting);
  audio.addEventListener('waiting', waiting);
  audio.addEventListener('playing', playing);
  options.events.addEventListener('online', reconnect);
  options.events.addEventListener('pointerdown', gesture, true);
  options.events.addEventListener('keydown', gesture, true);
  play();
  waiting();
  return {
    retry: play,
    dispose() {
      disposed = true;
      clearRetry();
      audio.removeEventListener('error', retryLater);
      audio.removeEventListener('ended', retryLater);
      audio.removeEventListener('stalled', waiting);
      audio.removeEventListener('waiting', waiting);
      audio.removeEventListener('playing', playing);
      options.events.removeEventListener('online', reconnect);
      options.events.removeEventListener('pointerdown', gesture, true);
      options.events.removeEventListener('keydown', gesture, true);
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    },
  };
}
