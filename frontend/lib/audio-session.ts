/**
 * iOS applies the ringer switch to Web Audio but not to a playing media
 * element: the first is classed as ambient, the second as playback. So a page
 * whose sound comes from Web Audio is silent for anyone browsing with their
 * phone on silent, which is most people.
 *
 * Keeping a silent element playing holds the session in the playback category,
 * and the snippets become audible. The cost is a Now Playing entry in Control
 * Center, which is the same trade every game doing this makes.
 */
import { logAudio } from './audio-debug';

let element: HTMLAudioElement | null = null;
let silenceUrl: string | null = null;

/** A second of silence, built rather than shipped so there is no asset to fetch. */
function silence(): string {
  if (silenceUrl) {
    return silenceUrl;
  }

  const rate = 8000;
  const samples = rate;
  const bytes = new ArrayBuffer(44 + samples * 2);
  const view = new DataView(bytes);

  const ascii = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i++) {
      view.setUint8(offset + i, text.charCodeAt(i));
    }
  };

  ascii(0, 'RIFF');
  view.setUint32(4, 36 + samples * 2, true);
  ascii(8, 'WAVE');
  ascii(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, rate, true);
  view.setUint32(28, rate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  ascii(36, 'data');
  view.setUint32(40, samples * 2, true);
  // The samples themselves are already zero.

  silenceUrl = URL.createObjectURL(new Blob([bytes], { type: 'audio/wav' }));
  return silenceUrl;
}

/** Must be called from a user gesture, like any other playback on iOS. */
export function holdAudioSession(): void {
  if (element || typeof Audio === 'undefined') {
    return;
  }

  const audio = new Audio(silence());
  audio.loop = true;
  audio.preload = 'auto';
  // Otherwise iOS takes the page fullscreen for anything it considers a video.
  audio.setAttribute('playsinline', '');
  element = audio;

  void audio
    .play()
    .then(() => logAudio('audio session held'))
    .catch(() => {
      // Not held. Snippets still play; they are just subject to the switch.
      logAudio('audio session refused');
      element = null;
    });
}

export function isAudioSessionHeld(): boolean {
  return !!element && !element.paused;
}

export function releaseAudioSession(): void {
  element?.pause();
  element = null;
}
