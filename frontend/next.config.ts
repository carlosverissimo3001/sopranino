import type { NextConfig } from 'next';
import { version } from './package.json';

const nextConfig: NextConfig = {
  // Fixed at build, so a deploy always reports the release it was built from.
  env: {
    NEXT_PUBLIC_APP_VERSION: version,
    NEXT_PUBLIC_COMMIT_SHA:
      process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? '',
  },
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    // A route served by a separate deployment, proxied in at the same origin.
    // Unset any of these and the rules simply don't exist.
    const zonePath = process.env.PRIVATE_ZONE_PATH;
    const zoneUrl = process.env.PRIVATE_ZONE_URL;
    const zoneAssets = process.env.PRIVATE_ZONE_ASSET_PREFIX;
    // assetPrefix only covers /_next/*; files in the target's public/ dir are
    // served at literal paths and need their own rule.
    const zonePublic = process.env.PRIVATE_ZONE_PUBLIC_PREFIX;

    const beforeFiles = [];

    if (zonePath && zoneUrl && zoneAssets) {
      beforeFiles.push(
        {
          source: `${zoneAssets}/_next/:path*`,
          destination: `${zoneUrl}/_next/:path*`,
        },
        // Exact path before the wildcard: `:path*` matches zero segments too,
        // so the wildcard would rewrite the bare path with a trailing slash,
        // which the target 308s away — an infinite loop.
        {
          source: zonePath,
          destination: `${zoneUrl}${zonePath}`,
        },
        {
          source: `${zonePath}/:path*`,
          destination: `${zoneUrl}${zonePath}/:path*`,
        },
      );

      if (zonePublic) {
        beforeFiles.push({
          source: `${zonePublic}/:path*`,
          destination: `${zoneUrl}${zonePublic}/:path*`,
        });
      }
    } else if (
      process.env.NODE_ENV === 'production' &&
      (zonePath || zoneUrl || zoneAssets)
    ) {
      console.warn(
        '[host] Proxy rewrite partially configured and skipped. Needs ' +
          'PRIVATE_ZONE_PATH, PRIVATE_ZONE_URL, PRIVATE_ZONE_ASSET_PREFIX.',
      );
    }

    return {
      beforeFiles,
      afterFiles: [
        {
          source: '/api/:path((?!auth/gate).*)',
          destination: `${apiUrl}/:path*`,
        },
      ],
      fallback: [],
    };
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'i.scdn.co' },
      { protocol: 'https', hostname: '*.scdn.co' },
      { protocol: 'https', hostname: '*.spotifycdn.com' },
      { protocol: 'https', hostname: '*.dzcdn.net' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'flagcdn.com' },
    ],
  },
};

export default nextConfig;
