import { ImageResponse } from 'next/og';

// Image metadata
export const alt = 'Sopranino - Music Guessing Game';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

// Open Graph Image
export default async function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        background: 'linear-gradient(135deg, #121212 0%, #1a1a1a 100%)',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '-20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '800px',
          height: '800px',
          background:
            'radial-gradient(circle, rgba(29, 185, 84, 0.2) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }}
      />

      {/* Logo */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '40px',
        }}
      >
        <div
          style={{
            background: '#1DB954',
            padding: '24px',
            borderRadius: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg
            width="80"
            height="80"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" fill="#000000" />
          </svg>
        </div>
      </div>

      <div
        style={{
          fontSize: '80px',
          fontWeight: 900,
          color: 'white',
          letterSpacing: '-0.05em',
          textTransform: 'uppercase',
          fontStyle: 'italic',
          marginBottom: '20px',
        }}
      >
        Sopranino
      </div>

      <div
        style={{
          fontSize: '32px',
          fontWeight: 600,
          color: '#1DB954',
          letterSpacing: '0.05em',
        }}
      >
        Music Guessing Game
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: '40px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          color: '#666',
          fontSize: '24px',
        }}
      >
        <div
          style={{
            width: '8px',
            height: '8px',
            background: '#1DB954',
            borderRadius: '50%',
          }}
        />
        <span>Guess the song from a snippet</span>
      </div>
    </div>,
    {
      ...size,
    },
  );
}
