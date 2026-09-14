const MAX_PATH = 512;

/** The link to the report form, remembering where the player was. */
export function reportBugHref(currentPath: string): string {
  const from = originPath(currentPath);
  return from && from !== '/about'
    ? `/about?from=${encodeURIComponent(from)}#feedback`
    : '/about#feedback';
}

/**
 * A same-site path, or nothing. The query string is anyone's to write, and a
 * query or hash can carry room and invite codes, so only the path survives.
 */
export function originPath(
  value: string | null | undefined,
): string | undefined {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return undefined;
  }
  const path = value.split(/[?#]/)[0];
  return path.length <= MAX_PATH ? path : undefined;
}
