import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { BackgroundRadio } from '../src/components/common/BackgroundRadio';
import { getRadioStreamUrl, RADIO_STATIONS, isHlsRadioStation } from '../src/utils/radioStations';
import { startRadioPlayback } from '../src/utils/radioPlayback';
import { createHlsRadioSource } from '../src/utils/radioHlsSource';

assert.equal(getRadioStreamUrl({}), undefined, 'Existing clubs stay silent by default');
assert.equal(getRadioStreamUrl({ radioStationId: 'off' }), undefined);
assert.equal(getRadioStreamUrl({ radioStationId: 'unknown' }), undefined);
assert.equal(getRadioStreamUrl({ radioStationId: 'radio-paradise' }), RADIO_STATIONS[0].url);
assert.equal(isHlsRadioStation('mellow-rock'), true);
assert.equal(isHlsRadioStation('frequence3'), false);
assert.equal(isHlsRadioStation('custom'), false);
for (const url of ['http://example.org/radio', 'javascript:alert(1)', 'data:audio/mp3,x', 'https://user:password@example.org/radio', 'invalid']) {
  assert.equal(getRadioStreamUrl({ radioStationId: 'custom', radioCustomUrl: url }), undefined);
}
assert.equal(getRadioStreamUrl({ radioStationId: 'custom', radioCustomUrl: ' https://example.org/live.mp3 ' }), 'https://example.org/live.mp3');
assert.equal(renderToStaticMarkup(React.createElement(BackgroundRadio, { settings: {} as any })), '');
const markup = renderToStaticMarkup(React.createElement(BackgroundRadio, { settings: { radioStationId: 'radio-paradise' } as any }));
assert.ok(markup.includes('hidden=""') && !markup.includes('controls'), 'No visible player or volume control');

class FakeAudio extends EventTarget {
  src = ''; muted = true; volume = 0; plays = 0; pauses = 0; loads = 0;
  playResult = () => Promise.resolve();
  play() { this.plays++; return this.playResult(); }
  pause() { this.pauses++; }
  load() { this.loads++; }
  removeAttribute(name: string) { if (name === 'src') this.src = ''; }
}
const flush = async () => { await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); };
const audio = new FakeAudio(), events = new EventTarget();
const queue = new Map<any, { callback: () => void; delay: number }>();
let id = 0, blocked = false;
const schedule = (callback: () => void, delay: number): any => { const key = ++id; queue.set(key, { callback, delay }); return key; };
audio.playResult = () => Promise.reject(Object.assign(new Error('Gesture required'), { name: 'NotAllowedError' }));
const controller = startRadioPlayback(audio, 'https://example.org/live.mp3', { events, onBlocked: value => { blocked = value; }, schedule, cancel: timer => { queue.delete(timer); } });
await flush();
assert.equal(blocked, true);
assert.equal(queue.size, 0, 'Autoplay denial does not loop network retries');
audio.playResult = () => Promise.resolve();
events.dispatchEvent(new Event('pointerdown'));
await flush();
assert.equal(blocked, false);
assert.equal(audio.muted, false);
assert.equal(audio.volume, 1);
const playingCalls = audio.plays;
events.dispatchEvent(new Event('slide-change'));
assert.equal(audio.plays, playingCalls, 'Slides do not restart the radio');
audio.dispatchEvent(new Event('error'));
assert.equal(queue.size, 1);
const [key, retry] = [...queue][0]; queue.delete(key); retry.callback();
await flush();
assert.equal(audio.plays, playingCalls + 1, 'Network error reconnects');
assert.equal(queue.size, 0);
audio.dispatchEvent(new Event('waiting'));
assert.equal(queue.size, 1);
audio.dispatchEvent(new Event('playing'));
assert.equal(queue.size, 0, 'Recovered buffering clears watchdog');
audio.playResult = () => new Promise(() => {});
events.dispatchEvent(new Event('online'));
const [hungKey, watchdog] = [...queue][0]; queue.delete(hungKey); watchdog.callback();
assert.equal(queue.size, 1, 'A stalled unresolved play promise can be retried');
controller.dispose();
assert.equal(queue.size, 0);
assert.equal(audio.src, '');
assert.ok(audio.pauses > 0);
const disposedCalls = audio.plays;
events.dispatchEvent(new Event('online'));events.dispatchEvent(new Event('pointerdown'));audio.dispatchEvent(new Event('error'));
assert.equal(audio.plays, disposedCalls, 'All listeners removed when disabled or leaving TV');

class FakeHls {
  static Events = { ERROR: 'hlsError' };
  static instances: FakeHls[] = [];
  destroyed = false; url = ''; media: unknown;
  onError?: (event: string, data: { fatal: boolean }) => void;
  constructor(_config: unknown) { FakeHls.instances.push(this); }
  on(_event: string, callback: FakeHls['onError']) { this.onError = callback; }
  loadSource(url: string) { this.url = url; }
  attachMedia(media: unknown) { this.media = media; }
  destroy() { this.destroyed = true; }
}
const hlsAudio = new FakeAudio(), hlsEvents = new EventTarget();
let fatalCount = 0;
const hlsSource = createHlsRadioSource(hlsAudio as any, 'https://example.org/live.m3u8', FakeHls as any, () => { fatalCount++; });
const hlsController = startRadioPlayback(hlsAudio, 'https://example.org/live.m3u8', {
  events: hlsEvents, onBlocked: () => {}, source: hlsSource, schedule, cancel: timer => { queue.delete(timer); },
});
await flush();
assert.equal(FakeHls.instances[0].url, 'https://example.org/live.m3u8');
assert.equal(FakeHls.instances[0].media, hlsAudio);
assert.equal(hlsAudio.src, '', 'HLS owns MediaSource instead of assigning an unsupported playlist to audio.src');
FakeHls.instances[0].onError?.('hlsError', { fatal: false });
assert.equal(fatalCount, 0);
FakeHls.instances[0].onError?.('hlsError', { fatal: true });
assert.equal(fatalCount, 1);
hlsEvents.dispatchEvent(new Event('online'));
await flush();
assert.equal(FakeHls.instances.length, 2);
assert.equal(FakeHls.instances[0].destroyed, true, 'Reconnect releases the old HLS player');
assert.equal(hlsAudio.loads, 0, 'Reconnect must not detach HLS MediaSource by calling audio.load');
hlsController.dispose();
assert.equal(FakeHls.instances[1].destroyed, true, 'Leaving TV or changing station destroys HLS');
hlsSource.load();
assert.equal(FakeHls.instances.length, 2, 'Disposed source cannot restart');
assert.equal(queue.size, 0);
console.log('Background radio: default off, URL validation, hidden player, autoplay gesture, continuous playback, reconnect, stall and cleanup OK');
