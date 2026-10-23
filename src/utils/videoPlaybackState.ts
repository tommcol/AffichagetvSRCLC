export interface VideoState { duration: number; currentTime: number; ended: boolean; failed?: boolean }
export function videoPlaybackState(videos: VideoState[]) {
  const active = videos.filter(v => !v.failed);
  const longest = active.filter(v => Number.isFinite(v.duration) && v.duration > 0).sort((a, b) => b.duration - a.duration)[0];
  return {
    complete: videos.length > 0 && active.every(v => v.ended),
    progress: longest ? Math.min(100, longest.currentTime / longest.duration * 100) : 0,
  };
}
