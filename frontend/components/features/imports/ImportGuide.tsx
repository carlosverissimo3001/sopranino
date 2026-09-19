'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Camera, ExternalLink } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '@/components/ui/carousel';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  IMPORT_GUIDE,
  TUNEMYMUSIC_URL,
  type GuideSlide,
} from '@/lib/playlist-links';

/** The frame keeps its place in the layout whether or not the picture exists. */
function Shot({ slide }: { slide: GuideSlide }) {
  return (
    // Neutral: a tinted edge reads as part of a screenshot that has its own.
    <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-fg/10 bg-fg/[0.04]">
      {slide.image ? (
        <Image
          src={`/${slide.image}`}
          alt={slide.shotOf}
          fill
          // Must track the dialog's widths, or Next serves a narrower file
          // and the browser stretches it.
          sizes="(max-width: 640px) 92vw, (max-width: 1024px) 672px, 768px"
          quality={90}
          className="object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center">
          <Camera className="h-5 w-5 text-fg/25" />
          <p className="text-xs text-fg/40">{slide.shotOf}</p>
        </div>
      )}
    </div>
  );
}

/** The written steps, one screen at a time, for someone who wants to be shown. */
export function ImportGuide() {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) return;
    const update = () => setCurrent(api.selectedScrollSnap());
    update();
    api.on('select', update);
    return () => {
      api.off('select', update);
    };
  }, [api]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="mt-1.5 shrink-0 whitespace-nowrap text-xs font-semibold text-fg/50 underline decoration-fg/20 decoration-dotted underline-offset-4 transition-colors hover:text-fg/80"
        >
          Show me how
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-lg border-fg/10 bg-surface sm:max-w-2xl lg:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-base">Importing a playlist</DialogTitle>
          <DialogDescription className="text-xs text-fg/50">
            Any service works, as long as the playlist reaches Deezer: only
            Deezer lets us read one from a link.
          </DialogDescription>
        </DialogHeader>

        <Carousel setApi={setApi} className="w-full min-w-0">
          <CarouselContent>
            {IMPORT_GUIDE.map((slide, index) => (
              <CarouselItem key={slide.title}>
                <div className="space-y-3">
                  <Shot slide={slide} />
                  <div className="flex items-start gap-3">
                    <span
                      aria-hidden
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-fg/10 text-xs font-black text-fg/70"
                    >
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-fg">
                        {slide.title}
                      </p>
                      <p className="text-xs text-fg/50">{slide.caption}</p>
                    </div>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="-left-3 border-fg/10 bg-surface text-fg hover:bg-fg/10 sm:-left-4" />
          <CarouselNext className="-right-3 border-fg/10 bg-surface text-fg hover:bg-fg/10 sm:-right-4" />
        </Carousel>

        <div className="flex min-w-0 items-center justify-between gap-3">
          <div className="flex gap-1.5">
            {IMPORT_GUIDE.map((slide, index) => (
              <button
                key={slide.title}
                type="button"
                aria-label={`Step ${index + 1}`}
                aria-current={index === current}
                onClick={() => api?.scrollTo(index)}
                className={`h-1.5 rounded-full transition-all ${
                  index === current
                    ? 'w-5 bg-fg/60'
                    : 'w-1.5 bg-fg/20 hover:bg-fg/40'
                }`}
              />
            ))}
          </div>
          <a
            href={TUNEMYMUSIC_URL}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-fg/60 transition-colors hover:text-fg"
          >
            Open TuneMyMusic
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}
