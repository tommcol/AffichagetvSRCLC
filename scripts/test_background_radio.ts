import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { BackgroundRadio } from '../src/components/common/BackgroundRadio';
import { getRadioStreamUrl, RADIO_STATIONS } from '../src/utils/radioStations';
import { startRadioPlayback } from '../src/utils/radioPlayback';

assert.equal(getRadioStreamUrl({}), undefined, 'Existing clubs stay silent by default');
assert.equal(getRadioStreamUrl({ radioStationId: 'off' }), undefined);
assert.equal(getRadioStreamUrl({ radioStationId: 'unknown' }), undefined);
assert.equal(getRadioStreamUrl({ radioStationId: 'radio-paradise' }), RADIO_STATIONS[0].url);
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
console.log('Background radio: default off, URL validation, hidden player, autoplay gesture, continuous playback, reconnect, stall and cleanup OK');
