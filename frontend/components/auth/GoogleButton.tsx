import Image from 'next/image';

/** Starts a Google sign-in. A guest on this browser comes along with it. */
export const GOOGLE_SIGN_IN_URL = '/api/auth/google/login';

/** Adds Google to the account this browser is signed in to. */
export const GOOGLE_LINK_URL = '/api/auth/google/link';

/**
 * Google's own button colours, light and dark, rather than the app's: the
 * branding rules ask for them, and people look for them.
 *
 * A plain link, not a fetch: the flow is a chain of full-page redirects.
 * Unlike Spotify's it is never gated on the site password. Spotify caps the
 * accounts an app in development mode may link; Google has no such cap.
 */
export function GoogleButton({
  label = 'Continue with Google',
}: {
  label?: string;
}) {
  return (
    <a
      href={GOOGLE_SIGN_IN_URL}
      className="flex h-11 w-full items-center justify-center rounded-full border border-[#747775] bg-white text-sm font-bold text-[#1f1f1f] transition-colors hover:bg-[#f2f2f2] dark:border-[#8e918f] dark:bg-[#131314] dark:text-[#e3e3e3] dark:hover:bg-[#1f1f1f]"
    >
      <Image
        src="/google-icon.svg"
        alt=""
        width={16}
        height={16}
        className="mr-2.5 shrink-0"
      />
      {label}
    </a>
  );
}
