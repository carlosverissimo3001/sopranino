import { getAudioContext, resumeAudioContext } from './audio-context';
import { logAudio } from './audio-debug';

/**
 * Snippets through Web Audio, not an <audio> element: play() costs 100–300ms
 * to start, which is longer than the first round. Free of React so it can be
 * tested without a DOM.
 */
/** Loudness has to hold for this long to count as the song starting. */
const ONSET_HOLD_SECONDS = 0.15;
/** Measured over windows this size, so a single click cannot trigger it. */
const ONSET_FRAME_SECONDS = 0.02;
/**
 * Share of the track's own peak level that counts as sound: -34dB, so only
 * near silence is skipped. A fifth (-14dB) skipped soft intros as if they were
 * silent, 4.4s of Hotel California among them.
 */
const ONSET_RATIO = 0.02;
/** Below this (about -50dBFS) is silence however quiet the whole track is. */
const ONSET_FLOOR = 0.003;

/** Long enough to take the click off a cut mid-wave, short enough not to hear. */
const EDGE_FADE_SECONDS = 0.008;
/** Into the reveal, which picks up where the snippet left the player. */
const REVEAL_FADE_SECONDS = 0.12;

/**
 * Where the round should start, so a near-silent opening doesn't spend the
 * 0.1s round on nothing. Threshold is relative to the track's own loudness —
 * mastering varies far too much for an absolute one.
 */
export function findOnset(buffer: AudioBuffer, window: number): number {
  const rate = buffer.sampleRate;
  // Every channel: an opening panned to one side is still the song.
  const channels = Array.from(
    { length: Math.max(buffer.numberOfChannels ?? 1, 1) },
    (_, i) => buffer.getChannelData(i),
  );
  const frame = Math.max(Math.floor(ONSET_FRAME_SECONDS * rate), 1);
  const frames = Math.floor(channels[0].length / frame);
  if (frames === 0) {
    return 0;
  }

  const levels = new Float32Array(frames);
  let loudest = 0;
  for (let i = 0; i < frames; i++) {
    const start = i * frame;
    let rms = 0;
    for (const channel of channels) {
      let sum = 0;
      for (let j = start; j < start + frame; j++) {
        sum += channel[j] * channel[j];
      }
      rms = Math.max(rms, Math.sqrt(sum / frame));
    }
    levels[i] = rms;
    if (rms > loudest) {
      loudest = rms;
    }
  }
  if (loudest === 0) {
    return 0;
  }

  const threshold = Math.max(loudest * ONSET_RATIO, ONSET_FLOOR);
  const hold = Math.max(Math.ceil(ONSET_HOLD_SECONDS / ONSET_FRAME_SECONDS), 1);
  // Never skip so far that a full-length round runs off the end.
  const latest = Math.max(
    Math.floor(((buffer.duration - window) * rate) / frame),
    0,
  );

  let run = 0;
  for (let i = 0; i < frames; i++) {
    run = levels[i] >= threshold ? run + 1 : 0;
    if (run >= hold) {
      const startFrame = i - hold + 1;
      return startFrame > latest ? 0 : (startFrame * frame) / rate;
    }
  }
  return 0;
}

interface AudioAccess {
  /** For decoding, which needs no user gesture. */
  get(): AudioContext | null;
  /** For playback, which does. */
  resume(): Promise<AudioContext | null>;
}

const sharedAudio: AudioAccess = {
  get: getAudioContext,
  resume: resumeAudioContext,
};

export class SnippetPlayer {
  private buffer: AudioBuffer | null = null;
  /** What the buffer was decoded against, and where it was fetched from. */
  private decodedWith: AudioContext | null = null;
  private url: string | null = null;
  private source: AudioBufferSourceNode | null = null;
  private gain: GainNode | null = null;
  private volume = 1;
  /** Guards against a slow decode landing after the track has moved on. */
  private generation = 0;
  /** Context clock reading when the current snippet started, for the playhead. */
  private startedAt = 0;
  private playingFor = 0;
  /** Seconds into the preview where the current playback started. */
  private startedFrom = 0;
  /** Seconds into the preview where the round starts. */
  private offset = 0;

  onEnded: (() => void) | null = null;

  /** @param window Seconds a round can reach; past it is neither drawn nor searched. */
  constructor(
    private readonly audio: AudioAccess = sharedAudio,
    private readonly window = 12,
  ) {}

  get isReady(): boolean {
    return this.buffer !== null;
  }

  /** Peak amplitude across `count` slices of the playable window, each 0–1. */
  peaks(count: number): number[] {
    const buffer = this.buffer;
    if (!buffer || count <= 0) {
      return [];
    }

    // One channel: the two are near-identical at this resolution.
    const channel = buffer.getChannelData(0);
    // Only what a round can reach — the rest of the preview is never audible.
    const samples = channel.subarray(
      Math.floor(this.offset * buffer.sampleRate),
      Math.min(
        Math.floor((this.offset + this.window) * buffer.sampleRate),
        channel.length,
      ),
    );
    const per = Math.floor(samples.length / count) || 1;
    const out: number[] = new Array<number>(count);

    let ceiling = 0;
    for (let slice = 0; slice < count; slice++) {
      const start = slice * per;
      const end = Math.min(start + per, samples.length);
      let peak = 0;
      for (let i = start; i < end; i++) {
        const value = samples[i] < 0 ? -samples[i] : samples[i];
        if (value > peak) {
          peak = value;
        }
      }
      out[slice] = peak;
      if (peak > ceiling) {
        ceiling = peak;
      }
    }

    // Against the loudest slice, so a quiet master still fills the bar.
    if (ceiling > 0) {
      for (let i = 0; i < count; i++) {
        out[i] /= ceiling;
      }
    }
    return out;
  }

  /**
   * How far through the snippet, 0–1. Read from the context clock, the same
   * one playback is scheduled against, so the bar cannot drift from the audio.
   */
  progress(): number {
    if (!this.source || this.playingFor <= 0) {
      return 0;
    }
    const context = this.audio.get();
    if (!context) {
      return 0;
    }
    const elapsed = context.currentTime - this.startedAt;
    return Math.min(Math.max(elapsed / this.playingFor, 0), 1);
  }

  /** True from play() until the snippet ends or is stopped. */
  isPlaying(): boolean {
    return this.source !== null;
  }

  setVolume(volume: number): void {
    this.volume = volume;
    const context = this.audio.get();
    if (!this.gain || !this.source || !context) {
      return;
    }
    // Automation outranks .value, so the change is scheduled, and the fade out
    // at the end is put back after it.
    const now = context.currentTime;
    const end = this.startedAt + this.playingFor;
    const tail = Math.min(EDGE_FADE_SECONDS, this.playingFor / 4);
    this.gain.gain.cancelScheduledValues(now);
    this.gain.gain.setValueAtTime(volume, now);
    if (end - tail > now) {
      this.gain.gain.setValueAtTime(volume, end - tail);
      this.gain.gain.linearRampToValueAtTime(0, end);
    }
  }

  /** False when it could not be decoded, so the caller can fall back. */
  async load(url: string): Promise<boolean> {
    const generation = ++this.generation;
    this.buffer = null;
    this.url = url;

    const context = this.audio.get();
    if (!context) {
      return false;
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        return false;
      }
      const decoded = await context.decodeAudioData(
        await response.arrayBuffer(),
      );
      if (generation !== this.generation) {
        // A newer track was requested while this was decoding.
        return false;
      }
      this.buffer = decoded;
      this.decodedWith = context;
      this.offset = findOnset(decoded, this.window);
      return true;
    } catch {
      return false;
    }
  }

  /** Discards the loaded audio, so a stale buffer cannot outlive its round. */
  unload(): void {
    this.generation++;
    this.stop();
    this.buffer = null;
    this.decodedWith = null;
    this.url = null;
  }

  /**
   * False when it could not play, so the caller can fall back.
   *
   * Synchronous on purpose. start() is a no-op on iOS unless it happens in the
   * gesture's own turn of the event loop, so nothing here may await: the resume
   * is kicked off unawaited, and a source scheduled against a context that is
   * still suspended plays as soon as it resumes.
   */
  play(durationSeconds: number): boolean {
    const buffer = this.buffer;
    if (!buffer) {
      return false;
    }
    return this.start({
      from: this.offset,
      seconds: Math.min(durationSeconds, buffer.duration - this.offset),
      fadeIn: EDGE_FADE_SECONDS,
    });
  }

  /**
   * The rest of the preview, for the reveal: from where the rounds start, or
   * from `from` to resume. The same decoded buffer, so nothing is fetched and
   * iOS never switches audio paths between the last snippet and the song.
   */
  playFull(
    from?: number,
    /** Picking up a snippet still sounding: a fade in would be a dip. */
    { continuing = false }: { continuing?: boolean } = {},
  ): boolean {
    const buffer = this.buffer;
    if (!buffer) {
      return false;
    }
    const start = Math.min(Math.max(from ?? this.offset, 0), buffer.duration);
    return this.start({
      from: start,
      seconds: buffer.duration - start,
      fadeIn: continuing ? EDGE_FADE_SECONDS : REVEAL_FADE_SECONDS,
    });
  }

  /** Seconds into the preview of what is playing, or null when nothing is. */
  position(): number | null {
    const context = this.audio.get();
    if (!this.source || !context) {
      return null;
    }
    const elapsed = Math.max(context.currentTime - this.startedAt, 0);
    return this.startedFrom + Math.min(elapsed, this.playingFor);
  }

  private start({
    from,
    seconds,
    fadeIn,
  }: {
    from: number;
    seconds: number;
    fadeIn: number;
  }): boolean {
    const buffer = this.buffer;
    if (!buffer || seconds <= 0) {
      return false;
    }

    const context = this.audio.get();
    if (!context) {
      return false;
    }

    // An interruption can leave a context beyond saving, and the one that
    // replaces it cannot play a buffer decoded against the old one. Decoding
    // again cannot happen in this turn, so this tap goes to the element and
    // the next one has a buffer that matches.
    if (this.decodedWith !== context) {
      logAudio('context changed under the buffer; decoding again');
      if (this.url) {
        void this.load(this.url);
      }
      return false;
    }

    // A suspended context cannot be started from here: resuming is async, and
    // the gesture is spent by the time it resolves. Scheduling anyway is
    // silence -- start() is a no-op on iOS outside a gesture, and the window
    // has passed by the time the clock starts. So this tap goes to the
    // element, and the resume makes the next one Web Audio.
    if (context.state !== 'running') {
      logAudio(`context ${context.state}; this tap goes to the element`);
      void this.audio.resume();
      return false;
    }

    this.stop();

    const now = context.currentTime;
    const edge = Math.min(fadeIn, seconds / 4);
    const tail = Math.min(EDGE_FADE_SECONDS, seconds / 4);
    const gain = context.createGain();
    gain.gain.value = this.volume;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(this.volume, now + edge);
    gain.gain.setValueAtTime(this.volume, now + seconds - tail);
    gain.gain.linearRampToValueAtTime(0, now + seconds);
    gain.connect(context.destination);

    const source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(gain);
    source.onended = () => {
      if (this.source === source) {
        this.source = null;
        this.onEnded?.();
      }
    };

    this.source = source;
    this.gain = gain;
    this.startedAt = now;
    this.startedFrom = from;
    this.playingFor = seconds;
    // The third argument is enforced by the hardware, so the length is exact.
    source.start(0, from, seconds);
    logAudio(
      `snippet ${seconds.toFixed(2)}s at clock ${context.currentTime.toFixed(3)}, state=${context.state}`,
    );
    return true;
  }

  stop(): void {
    const source = this.source;
    if (!source) {
      return;
    }
    const gain = this.gain;
    this.source = null;
    this.playingFor = 0;
    // Detached first: onended fires on an explicit stop too.
    source.onended = null;
    const now = this.audio.get()?.currentTime ?? 0;
    if (gain) {
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(gain.gain.value, now);
      gain.gain.linearRampToValueAtTime(0, now + EDGE_FADE_SECONDS);
    }
    try {
      source.stop(now + EDGE_FADE_SECONDS);
    } catch {
      // Already stopped; nothing to undo.
    }
  }
}
