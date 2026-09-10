import { ImageResponse } from 'next/og';

export const size = {
  width: 96,
  height: 96,
};
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        background: '#1DB954',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '20%',
      }}
    >
      <svg
        width="60"
        height="60"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M13 2L3 14h8l-1 8 10-12h-8l1-8z"
          fill="#000000"
          stroke="#000000"
          strokeWidth="0"
        />
      </svg>
    </div>,
    {
      ...size,
    },
  );
}
