import { SnippetPlayer, findOnset } from './snippet-player';

/** A buffer whose loudness follows `level(second)`, at 100 samples a second. */
function buffer(seconds: number, level: (t: number) => number): AudioBuffer {
  const rate = 100;
  const data = new Float32Array(seconds * rate);
  for (let i = 0; i < data.length; i++) {
    // Alternating sign so RMS reflects the level rather than a DC offset.
    data[i] = level(i / rate) * (i % 2 === 0 ? 1 : -1);
  }
  return {
    duration: seconds,
    sampleRate: rate,
    length: data.length,
    getChannelData: () => data,
  } as unknown as AudioBuffer;
}

interface FakeSource {
  buffer: unknown;
  onended: (() => void) | null;
  connect: jest.Mock;
  start: jest.Mock;
  stop: jest.Mock;
}

function fakeContext() {
  const sources: FakeSource[] = [];
  const gain = { gain: { value: 0 }, connect: jest.fn() };

  const context = {
    state: 'running' as AudioContextState,
    currentTime: 0,
    destination: {},
    resume: jest.fn(function (this: { state: AudioContextState }) {
      context.state = 'running';
      return Promise.resolve();
    }),
    decodeAudioData: jest.fn().mockResolvedValue({
      duration: 30,
      // One sample a second, so the playable window covers the whole array.
      sampleRate: 1,
      getChannelData: () => new Float32Array([0, 0.5, -1, 0.25, 0, -0.5, 1, 0]),
    }),
    createGain: jest.fn(() => gain),
    createBufferSource: jest.fn(() => {
      const source: FakeSource = {
        buffer: null,
        onended: null,
        connect: jest.fn(),
        start: jest.fn(),
        stop: jest.fn(),
      };
      sources.push(source);
      return source;
    }),
  };

  return { context, sources, gain };
}

describe('SnippetPlayer', () => {
  let harness: ReturnType<typeof fakeContext>;

  const player = () =>
    new SnippetPlayer({
      get: () => harness.context as unknown as AudioContext,
      resume: async () => {
        await harness.context.resume();
        return harness.context as unknown as AudioContext;
      },
    });

  beforeEach(() => {
    harness = fakeContext();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
    }) as unknown as typeof fetch;
  });

  it('is not ready before anything is loaded', () => {
    expect(player().isReady).toBe(false);
  });

  it('decodes the preview up front', async () => {
    const p = player();

    await expect(p.load('https://cdn/preview.mp3')).resolves.toBe(true);

    expect(p.isReady).toBe(true);
    expect(harness.context.decodeAudioData).toHaveBeenCalled();
  });

  it('reports failure rather than throwing when the audio cannot be decoded', async () => {
    harness.context.decodeAudioData.mockRejectedValue(new Error('bad codec'));
    const p = player();

    await expect(p.load('https://cdn/preview.mp3')).resolves.toBe(false);
    expect(p.isReady).toBe(false);
  });

  it('reports failure when the preview cannot be fetched', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue({ ok: false, status: 403 }) as unknown as typeof fetch;

    await expect(player().load('https://cdn/gone.mp3')).resolves.toBe(false);
  });

  it('will not play before anything is loaded', () => {
    expect(player().play(0.1)).toBe(false);
  });

  it('leaves a tap to the element while the context is still suspended', async () => {
    // Resuming is async and the gesture is spent by the time it resolves, so
    // scheduling here would be silence. The element covers this tap and the
    // resume makes the next one Web Audio.
    const p = player();
    await p.load('https://cdn/preview.mp3');
    harness.context.state = 'suspended';

    expect(p.play(1)).toBe(false);
    expect(harness.sources).toHaveLength(0);
    expect(harness.context.resume).toHaveBeenCalled();
  });

  it('schedules exactly the requested duration', async () => {
    const p = player();
    await p.load('https://cdn/preview.mp3');

    expect(p.play(0.1)).toBe(true);

    // start(when, offset, duration) — the third argument is what the audio
    // hardware enforces, and is the whole reason 0.1s is achievable.
    expect(harness.sources[0].start).toHaveBeenCalledWith(0, 0, 0.1);
  });

  it('never asks for more audio than the buffer holds', async () => {
    const p = player();
    await p.load('https://cdn/preview.mp3');

    p.play(60);

    expect(harness.sources[0].start).toHaveBeenCalledWith(0, 0, 30);
  });

  it('stops the previous snippet when a new one starts', async () => {
    const p = player();
    await p.load('https://cdn/preview.mp3');

    p.play(0.5);
    p.play(0.5);

    expect(harness.sources[0].stop).toHaveBeenCalled();
    expect(harness.sources).toHaveLength(2);
  });

  it('applies volume through the gain node', async () => {
    const p = player();
    p.setVolume(0.3);
    await p.load('https://cdn/preview.mp3');

    p.play(0.5);

    expect(harness.gain.gain.value).toBe(0.3);
  });

  it('reports the snippet ending on its own', async () => {
    const p = player();
    const onEnded = jest.fn();
    p.onEnded = onEnded;
    await p.load('https://cdn/preview.mp3');
    p.play(0.5);

    harness.sources[0].onended?.();

    expect(onEnded).toHaveBeenCalledTimes(1);
  });

  it('does not report an ending the caller asked for', async () => {
    const p = player();
    const onEnded = jest.fn();
    p.onEnded = onEnded;
    await p.load('https://cdn/preview.mp3');
    p.play(0.5);

    p.stop();

    expect(onEnded).not.toHaveBeenCalled();
  });

  it('discards a decode that finished after the track moved on', async () => {
    const p = player();
    let releaseFirst: (value: AudioBuffer) => void = () => {};
    harness.context.decodeAudioData
      .mockImplementationOnce(
        () =>
          new Promise<AudioBuffer>((resolve) => {
            releaseFirst = resolve;
          }),
      )
      .mockResolvedValueOnce({ duration: 12 } as AudioBuffer);

    const stale = p.load('https://cdn/old.mp3');
    await p.load('https://cdn/new.mp3');
    releaseFirst({ duration: 30 } as AudioBuffer);

    await expect(stale).resolves.toBe(false);
    // The newer track's audio survives; the late one is thrown away.
    p.play(60);
    expect(harness.sources[0].start).toHaveBeenCalledWith(0, 0, 12);
  });

  describe('peaks', () => {
    it('is empty before anything is loaded', () => {
      expect(player().peaks(8)).toEqual([]);
    });

    it('is empty when asked for nothing', async () => {
      const p = player();
      await p.load('https://cdn/preview.mp3');

      expect(p.peaks(0)).toEqual([]);
    });

    it('returns one value per slice requested', async () => {
      const p = player();
      await p.load('https://cdn/preview.mp3');

      expect(p.peaks(4)).toHaveLength(4);
    });

    it('takes the loudest sample in each slice, ignoring sign', async () => {
      const p = player();
      await p.load('https://cdn/preview.mp3');

      // Two samples per slice of [0, .5, -1, .25, 0, -.5, 1, 0]
      expect(p.peaks(4)).toEqual([0.5, 1, 0.5, 1]);
    });

    it('normalises against the loudest slice', async () => {
      harness.context.decodeAudioData.mockResolvedValue({
        duration: 30,
        sampleRate: 1,
        // A quietly mastered track should still fill the bar.
        getChannelData: () => new Float32Array([0.1, 0.2]),
      });
      const p = player();
      await p.load('https://cdn/preview.mp3');

      expect(p.peaks(2)).toEqual([0.5, 1]);
    });

    it('does not divide by zero on silence', async () => {
      harness.context.decodeAudioData.mockResolvedValue({
        duration: 30,
        sampleRate: 1,
        getChannelData: () => new Float32Array([0, 0, 0, 0]),
      });
      const p = player();
      await p.load('https://cdn/preview.mp3');

      expect(p.peaks(2)).toEqual([0, 0]);
    });
  });

  describe('progress', () => {
    it('is zero before anything plays', async () => {
      const p = player();
      await p.load('https://cdn/preview.mp3');

      expect(p.progress()).toBe(0);
    });

    it('follows the context clock rather than a counter of its own', async () => {
      const p = player();
      await p.load('https://cdn/preview.mp3');
      harness.context.currentTime = 10;

      p.play(4);
      expect(p.progress()).toBe(0);

      harness.context.currentTime = 11;
      expect(p.progress()).toBeCloseTo(0.25);

      harness.context.currentTime = 13;
      expect(p.progress()).toBeCloseTo(0.75);
    });

    it('never exceeds one, even if the clock runs past the snippet', async () => {
      const p = player();
      await p.load('https://cdn/preview.mp3');
      p.play(1);

      harness.context.currentTime = 99;

      expect(p.progress()).toBe(1);
    });

    it('is playing from the first moment, before the clock has moved', async () => {
      const p = player();
      await p.load('https://cdn/preview.mp3');

      p.play(4);

      expect(p.progress()).toBe(0);
      expect(p.isPlaying()).toBe(true);
      p.stop();
      expect(p.isPlaying()).toBe(false);
    });

    it('returns to zero once stopped', async () => {
      const p = player();
      await p.load('https://cdn/preview.mp3');
      p.play(4);
      harness.context.currentTime = 2;

      p.stop();

      expect(p.progress()).toBe(0);
    });
  });

  it('forgets its audio when unloaded', async () => {
    const p = player();
    await p.load('https://cdn/preview.mp3');

    p.unload();

    expect(p.isReady).toBe(false);
    expect(p.play(0.5)).toBe(false);
  });

  it('refuses this tap and re-decodes when the context was replaced', async () => {
    // A buffer belongs to the context that decoded it. Decoding again cannot
    // happen inside the gesture, so the caller falls back to the element for
    // this tap and the next one has a buffer that matches.
    const p = new SnippetPlayer({
      get: () => harness.context as unknown as AudioContext,
      resume: async () => {
        await harness.context.resume();
        return harness.context as unknown as AudioContext;
      },
    });

    await p.load('https://cdn/preview.mp3');
    harness = fakeContext();

    expect(p.play(1)).toBe(false);
    expect(harness.sources).toHaveLength(0);

    // The re-decode was started, so a second tap plays.
    await Promise.resolve();
    await Promise.resolve();
    expect(harness.context.decodeAudioData).toHaveBeenCalledTimes(1);
  });
});

describe('findOnset', () => {
  it('starts at the beginning when the track opens loud', () => {
    expect(
      findOnset(
        buffer(30, () => 0.8),
        12,
      ),
    ).toBe(0);
  });

  it('skips a silent opening', () => {
    // Silent for two seconds, then the song.
    const onset = findOnset(
      buffer(30, (t) => (t < 2 ? 0 : 0.8)),
      12,
    );

    expect(onset).toBeGreaterThanOrEqual(1.9);
    expect(onset).toBeLessThanOrEqual(2.1);
  });

  it('ignores a click in the silence', () => {
    // A single loud frame at 1s is not the song starting.
    const onset = findOnset(
      buffer(30, (t) => (t >= 1 && t < 1.02 ? 0.9 : t < 5 ? 0 : 0.8)),
      12,
    );

    expect(onset).toBeGreaterThanOrEqual(4.9);
  });

  it('stays at the beginning for a quiet but not silent opening', () => {
    // A fade-in still counts once it passes a fifth of the track's level.
    expect(
      findOnset(
        buffer(30, () => 0.3),
        12,
      ),
    ).toBe(0);
  });

  it('gives up rather than skipping past what a round can reach', () => {
    // Nothing until 25s: skipping there would leave under 12s of audio.
    expect(
      findOnset(
        buffer(30, (t) => (t < 25 ? 0 : 0.8)),
        12,
      ),
    ).toBe(0);
  });

  it('returns zero for silence throughout', () => {
    expect(
      findOnset(
        buffer(30, () => 0),
        12,
      ),
    ).toBe(0);
  });

  it('handles a buffer shorter than a single frame', () => {
    expect(
      findOnset(
        buffer(0, () => 0),
        12,
      ),
    ).toBe(0);
  });
});
