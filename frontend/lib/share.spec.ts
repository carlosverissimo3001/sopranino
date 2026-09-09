import { shareResult } from './share';

const TEXT = 'sopranino #142 · 3/6\n🔇🔇🟩\nunpause.vercel.app/daily';

const stub = (share: unknown, writeText: unknown, coarsePointer = true) => {
  Object.defineProperty(globalThis, 'navigator', {
    value: { share, clipboard: { writeText } },
    configurable: true,
    writable: true,
  });
  Object.defineProperty(globalThis, 'window', {
    value: { matchMedia: () => ({ matches: coarsePointer }) },
    configurable: true,
    writable: true,
  });
};

describe('shareResult', () => {
  it('prefers the native sheet when there is one', async () => {
    const share = jest.fn().mockResolvedValue(undefined);
    const writeText = jest.fn();
    stub(share, writeText);

    await expect(shareResult(TEXT)).resolves.toBe('shared');
    expect(share).toHaveBeenCalledWith({ text: TEXT });
    expect(writeText).not.toHaveBeenCalled();
  });

  it('puts everything in text, so no target can keep the link and drop the grid', async () => {
    const share = jest.fn().mockResolvedValue(undefined);
    stub(share, jest.fn());

    await shareResult(TEXT);

    expect(share.mock.calls[0][0]).not.toHaveProperty('url');
  });

  it('copies on a mouse device, even where the sheet exists', async () => {
    const share = jest.fn();
    const writeText = jest.fn().mockResolvedValue(undefined);
    stub(share, writeText, false);

    await expect(shareResult(TEXT)).resolves.toBe('copied');
    expect(share).not.toHaveBeenCalled();
    expect(writeText).toHaveBeenCalledWith(TEXT);
  });

  it('copies where there is no share sheet', async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    stub(undefined, writeText);

    await expect(shareResult(TEXT)).resolves.toBe('copied');
    expect(writeText).toHaveBeenCalledWith(TEXT);
  });

  it('leaves the clipboard alone when the sheet is dismissed', async () => {
    const writeText = jest.fn();
    stub(
      jest.fn().mockRejectedValue(new DOMException('cancel', 'AbortError')),
      writeText,
    );

    await expect(shareResult(TEXT)).resolves.toBe('dismissed');
    expect(writeText).not.toHaveBeenCalled();
  });

  it('falls back to the clipboard when the sheet genuinely fails', async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    stub(jest.fn().mockRejectedValue(new Error('no target')), writeText);

    await expect(shareResult(TEXT)).resolves.toBe('copied');
    expect(writeText).toHaveBeenCalledWith(TEXT);
  });

  it('reports failure when neither route works', async () => {
    stub(undefined, jest.fn().mockRejectedValue(new Error('denied')));

    await expect(shareResult(TEXT)).resolves.toBe('failed');
  });
});
