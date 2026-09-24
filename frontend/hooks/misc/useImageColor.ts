'use client';

import { useState, useEffect, useMemo } from 'react';
import { FastAverageColor } from 'fast-average-color';

const fac = new FastAverageColor();

// Read once per image: a card remounts whenever its section is reopened, and
// reading the pixels again stalls the frame.
const read = new Map<string, Promise<[number, number, number]>>();

function rgbOf(imageUrl: string): Promise<[number, number, number]> {
  const known = read.get(imageUrl);
  if (known) return known;
  const pending = fac
    .getColorAsync(imageUrl, {
      ignoredColor: [
        [255, 255, 255, 255],
        [0, 0, 0, 255],
      ],
    })
    .then((res) => res.value.slice(0, 3) as [number, number, number]);
  read.set(imageUrl, pending);
  return pending;
}

const DEFAULT_FALLBACK = 'rgba(29, 185, 84, 0.15)';
const DEFAULT_ALPHA = 0.25;

export interface UseImageColorOptions {
  fallback?: string;
  alpha?: number;
}

export function useImageColor(
  imageUrl: string | null | undefined,
  options?: UseImageColorOptions,
) {
  const { fallback = DEFAULT_FALLBACK, alpha = DEFAULT_ALPHA } = options ?? {};
  const [color, setColor] = useState(fallback);

  const stableOptions = useMemo(() => ({ fallback, alpha }), [fallback, alpha]);

  useEffect(() => {
    if (!imageUrl) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Resetting color when imageUrl becomes null
      setColor(stableOptions.fallback);
      return;
    }

    let isCurrent = true;

    rgbOf(imageUrl)
      .then(([r, g, b]) => {
        if (isCurrent) {
          setColor(`rgba(${r}, ${g}, ${b}, ${stableOptions.alpha})`);
        }
      })
      .catch(() => {
        if (isCurrent) setColor(stableOptions.fallback);
      });

    return () => {
      isCurrent = false;
    };
  }, [imageUrl, stableOptions]);

  return color;
}
