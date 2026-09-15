import { keepPreviewUrl, previewKey } from './preview-url';

const signed = (hash: string, exp: number) =>
  `https://cdnt-preview.dzcdn.net/api/1/1/a/b/c/0/abc.mp3?hdnea=exp=${exp}~hmac=${hash}`;

describe('previewKey', () => {
  it('drops the signature', () => {
    expect(previewKey(signed('one', 100))).toBe(previewKey(signed('two', 200)));
  });
});

describe('keepPreviewUrl', () => {
  const now = 1_000_000_000;
  const later = now / 1000 + 600;

  it('keeps the link in use when the same song comes back re-signed', () => {
    const current = signed('one', later);
    expect(keepPreviewUrl(current, signed('two', later + 60), now)).toBe(
      current,
    );
  });

  it('takes the new link for a different song', () => {
    const next =
      'https://cdnt-preview.dzcdn.net/api/1/1/d/e/f/0/def.mp3?hdnea=exp=1';
    expect(keepPreviewUrl(signed('one', later), next, now)).toBe(next);
  });

  it('takes the new link once the one in use is about to expire', () => {
    const next = signed('two', later + 600);
    expect(keepPreviewUrl(signed('one', now / 1000 + 30), next, now)).toBe(
      next,
    );
  });

  it('takes whatever arrives when there was nothing before', () => {
    expect(keepPreviewUrl(undefined, signed('one', later), now)).toBe(
      signed('one', later),
    );
  });
});
