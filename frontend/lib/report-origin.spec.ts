import { originPath, reportBugHref } from './report-origin';

describe('originPath', () => {
  it('keeps a same-site path', () => {
    expect(originPath('/shuffle')).toBe('/shuffle');
  });

  // A query or hash can carry a room or invite code.
  it('drops the query and the hash', () => {
    expect(originPath('/multiplayer/join/ABCD?code=1#x')).toBe(
      '/multiplayer/join/ABCD',
    );
  });

  it('refuses anything that is not a path on this site', () => {
    expect(originPath('https://evil.example/x')).toBeUndefined();
    expect(originPath('//evil.example/x')).toBeUndefined();
    expect(originPath('javascript:alert(1)')).toBeUndefined();
    expect(originPath('')).toBeUndefined();
    expect(originPath(null)).toBeUndefined();
  });

  it('refuses a path longer than any real one', () => {
    expect(originPath(`/${'a'.repeat(600)}`)).toBeUndefined();
  });
});

describe('reportBugHref', () => {
  it('carries the page the player was on', () => {
    expect(reportBugHref('/shuffle')).toBe('/about?from=%2Fshuffle#feedback');
  });

  it('carries nothing from the about page itself', () => {
    expect(reportBugHref('/about')).toBe('/about#feedback');
  });
});
