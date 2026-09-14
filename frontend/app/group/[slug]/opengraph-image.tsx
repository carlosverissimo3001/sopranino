import { ImageResponse } from 'next/og';
import { findPublicTrackGroup } from '@/lib/track-groups-server';
import { guessLine } from '@/lib/track-group-labels';

export const alt = 'A Sopranino music guessing game';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/**
 * What a pasted link to a set shows in a group chat: its cover and what the
 * round asks. For fandoms the share, more than search, is how a set spreads.
 */
export default async function GroupOpenGraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const group = await findPublicTrackGroup(slug);
  const line = group ? guessLine(group) : 'Guess the song';

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: '64px',
        padding: '72px',
        background: 'linear-gradient(135deg, #121212 0%, #1b1b1b 100%)',
        color: 'white',
      }}
    >
      {group?.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- rendered to a PNG, not the page
        <img
          src={group.imageUrl}
          alt=""
          width={420}
          height={420}
          style={{ borderRadius: '32px', objectFit: 'cover' }}
        />
      ) : (
        <div
          style={{
            width: '420px',
            height: '420px',
            borderRadius: '32px',
            background: '#1DB954',
          }}
        />
      )}

      <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div
          style={{
            fontSize: '64px',
            fontWeight: 900,
            lineHeight: 1.05,
            letterSpacing: '-0.03em',
          }}
        >
          {line}
        </div>
        <div
          style={{
            marginTop: '24px',
            fontSize: '34px',
            color: '#1DB954',
            fontWeight: 700,
          }}
        >
          from a tenth of a second
        </div>
        <div
          style={{
            marginTop: '56px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            fontSize: '30px',
            color: '#9a9a9a',
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: '#1DB954',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="26" height="26" viewBox="0 0 24 24">
              <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" fill="#000000" />
            </svg>
          </div>
          sopranino.app
        </div>
      </div>
    </div>,
    { ...size },
  );
}
