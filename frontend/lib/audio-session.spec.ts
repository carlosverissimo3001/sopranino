/**
 * The point of the silent element is the audio session category, not sound: on
 * iOS the ringer switch silences Web Audio but not a playing media element.
 */

interface FakeAudio {
  loop: boolean;
  preload: string;
  play: jest.Mock;
  pause: jest.Mock;
  setAttribute: jest.Mock;
  src: string;
  paused: boolean;
}

const made: FakeAudio[] = [];

function install(playResult: Promise<void> = Promise.resolve()) {
  made.length = 0;
  (globalThis as unknown as { window: unknown }).window = {};
  (globalThis as unknown as { Audio: unknown }).Audio = jest.fn(
    (src: string) => {
      const audio: FakeAudio = {
        src,
        loop: false,
        preload: '',
        paused: true,
        play: jest.fn(() => {
          playResult.then(
            () => (audio.paused = false),
            () => undefined,
          );
          return playResult;
        }),
        pause: jest.fn(() => (audio.paused = true)),
        setAttribute: jest.fn(),
      };
      made.push(audio);
      return audio;
    },
  );
  (globalThis as unknown as { URL: unknown }).URL = {
    createObjectURL: jest.fn(() => 'blob:silence'),
  };
  (globalThis as unknown as { Blob: unknown }).Blob = jest.fn();
}

afterAll(() => {
  for (const key of ['window', 'Audio', 'URL', 'Blob']) {
    delete (globalThis as unknown as Record<string, unknown>)[key];
  }
});

describe('holdAudioSession', () => {
  it('plays a looping silent element', async () => {
    install();
    jest.resetModules();
    const { holdAudioSession } = await import('./audio-session');

    holdAudioSession();

    expect(made).toHaveLength(1);
    expect(made[0].loop).toBe(true);
    expect(made[0].play).toHaveBeenCalled();
    // Otherwise iOS can take the page fullscreen.
    expect(made[0].setAttribute).toHaveBeenCalledWith('playsinline', '');
  });

  it('holds one element however many times it is called', async () => {
    install();
    jest.resetModules();
    const { holdAudioSession } = await import('./audio-session');

    holdAudioSession();
    holdAudioSession();
    holdAudioSession();

    expect(made).toHaveLength(1);
  });

  it('tries again after a play that was refused', async () => {
    install(Promise.reject(new Error('blocked')));
    jest.resetModules();
    const { holdAudioSession } = await import('./audio-session');

    holdAudioSession();
    await Promise.resolve();
    await Promise.resolve();
    holdAudioSession();

    // The first attempt released its element, so a later gesture can retry.
    expect(made).toHaveLength(2);
  });

  it('lets go when asked', async () => {
    install();
    jest.resetModules();
    const { holdAudioSession, releaseAudioSession } =
      await import('./audio-session');

    holdAudioSession();
    releaseAudioSession();

    expect(made[0].pause).toHaveBeenCalled();
  });
});

// Sent with each guess, so the audit can tell a muted round from a hard one.
describe('isAudioSessionHeld', () => {
  it('is held once the silent element is playing', async () => {
    install();
    jest.resetModules();
    const { holdAudioSession, isAudioSessionHeld } =
      await import('./audio-session');

    holdAudioSession();
    await Promise.resolve();

    expect(isAudioSessionHeld()).toBe(true);
  });

  it('is not held when the play was refused', async () => {
    install(Promise.reject(new Error('blocked')));
    jest.resetModules();
    const { holdAudioSession, isAudioSessionHeld } =
      await import('./audio-session');

    holdAudioSession();
    await Promise.resolve();
    await Promise.resolve();

    expect(isAudioSessionHeld()).toBe(false);
  });

  it('is not held before anything asked for it', async () => {
    install();
    jest.resetModules();
    const { isAudioSessionHeld } = await import('./audio-session');

    expect(isAudioSessionHeld()).toBe(false);
  });
});
