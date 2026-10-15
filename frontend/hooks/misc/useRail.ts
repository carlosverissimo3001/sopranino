'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * A row you grab and throw: the pointer moves it 1:1, a release carries the
 * gesture's own velocity into the settle, and the ends resist rather than stop.
 */

/** Apple's projection from Designing Fluid Interfaces, not the textbook one. */
/** Matches the floor the indicator renders with. */
const MIN_THUMB = 0.08;

function project(velocity: number, deceleration = 0.998): number {
  return ((velocity / 1000) * deceleration) / (1 - deceleration);
}

/** The further past the end, the less the row follows. */
function rubberband(overshoot: number, width: number, constant = 0.55): number {
  return (
    (overshoot * width * constant) / (width + constant * Math.abs(overshoot))
  );
}

interface RailState {
  /** The row is moving, or was a moment ago: the indicator lives this long. */
  moving: boolean;
  /** How far along the row is, 0 to 1, for the progress line. */
  progress: number;
  /** Fraction of the row on screen; 1 when nothing overflows. */
  visible: number;
  overflows: boolean;
  dragging: boolean;
}

export function useRail(cardStep: () => number) {
  const ref = useRef<HTMLDivElement>(null);
  const frame = useRef<number | null>(null);
  const drag = useRef<{
    pointer: number;
    startX: number;
    startScroll: number;
    samples: { x: number; t: number }[];
  } | null>(null);
  /** A drag ends over a card, and that card must not open. */
  const moved = useRef(false);
  const idle = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Pointer capture can be refused; the scrub is tracked here either way. */
  const scrubbing = useRef(false);
  /** Where along the thumb it was grabbed. */
  const held = useRef(0);
  const [state, setState] = useState<RailState>({
    moving: false,
    progress: 0,
    visible: 1,
    overflows: false,
    dragging: false,
  });

  const read = useCallback((moving = false) => {
    const el = ref.current;
    if (!el) return;
    if (moving) {
      if (idle.current) clearTimeout(idle.current);
      idle.current = setTimeout(
        () => setState((previous) => ({ ...previous, moving: false })),
        900,
      );
    }
    const span = el.scrollWidth - el.clientWidth;
    setState((previous) => ({
      ...previous,
      moving: moving || previous.moving,
      overflows: span > 8,
      visible: el.clientWidth / el.scrollWidth,
      progress: span > 0 ? Math.min(1, Math.max(0, el.scrollLeft / span)) : 0,
    }));
  }, []);

  /**
   * A callback ref, not a plain one: the row only exists once its sets have
   * arrived, and a mount effect would measure a component that renders null.
   */
  const observer = useRef<ResizeObserver | null>(null);
  const children = useRef<MutationObserver | null>(null);
  const attach = useCallback(
    (node: HTMLDivElement | null) => {
      ref.current = node;
      observer.current?.disconnect();
      children.current?.disconnect();
      if (!node) return;

      const watch = () => {
        observer.current?.disconnect();
        observer.current = new ResizeObserver(() => read());
        observer.current.observe(node);
        for (const child of Array.from(node.children)) {
          observer.current.observe(child);
        }
        read();
      };

      // A filter can empty or fill the row without changing its size, and the
      // row would keep saying it fits.
      children.current = new MutationObserver(watch);
      children.current.observe(node, { childList: true });
      watch();
    },
    [read],
  );

  useEffect(
    () => () => {
      children.current?.disconnect();
      observer.current?.disconnect();
      if (frame.current) cancelAnimationFrame(frame.current);
    },
    [],
  );

  const stop = () => {
    if (frame.current) cancelAnimationFrame(frame.current);
    frame.current = null;
  };

  /** Critically damped settle, started from wherever the row is now. */
  const settle = (to: number, velocity: number) => {
    const el = ref.current;
    if (!el) return;
    stop();
    let current = el.scrollLeft;
    let speed = velocity;
    let last = performance.now();

    const step = (now: number) => {
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;
      // Spring: response 0.4s, damping 1.0.
      const stiffness = (2 * Math.PI) / 0.4;
      const accel =
        -stiffness * stiffness * (current - to) - 2 * stiffness * speed;
      speed += accel * dt;
      current += speed * dt;
      el.scrollLeft = current;
      read();
      if (Math.abs(current - to) > 0.5 || Math.abs(speed) > 10) {
        frame.current = requestAnimationFrame(step);
      } else {
        el.scrollLeft = to;
        frame.current = null;
        read();
      }
    };
    frame.current = requestAnimationFrame(step);
  };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    // Touch already throws the row natively, and better than this can.
    if (event.pointerType === 'touch') return;
    const el = ref.current;
    if (!el || el.scrollWidth <= el.clientWidth) return;
    stop();
    // Capture waits for movement: taken on the press, the row becomes the
    // click's target and a card could never be clicked.
    moved.current = false;
    drag.current = {
      pointer: event.pointerId,
      startX: event.clientX,
      startScroll: el.scrollLeft,
      samples: [{ x: event.clientX, t: performance.now() }],
    };
    setState((previous) => ({ ...previous, dragging: true }));
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    const grab = drag.current;
    if (!el || !grab) return;
    const travelled = event.clientX - grab.startX;
    if (Math.abs(travelled) > 4 && !moved.current) {
      moved.current = true;
      try {
        el.setPointerCapture(grab.pointer);
      } catch {
        // A pointer the browser no longer tracks; the drag still follows.
      }
    }
    if (!moved.current) return;
    const span = el.scrollWidth - el.clientWidth;
    const wanted = grab.startScroll - travelled;
    el.scrollLeft =
      wanted < 0
        ? -rubberband(-wanted, el.clientWidth)
        : wanted > span
          ? span + rubberband(wanted - span, el.clientWidth)
          : wanted;

    grab.samples.push({ x: event.clientX, t: performance.now() });
    if (grab.samples.length > 5) grab.samples.shift();
    read();
  };

  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    const grab = drag.current;
    drag.current = null;
    setState((previous) => ({ ...previous, dragging: false }));
    if (!el || !grab) return;
    if (el.hasPointerCapture(event.pointerId)) {
      el.releasePointerCapture(event.pointerId);
    }
    if (!moved.current) return;

    const first = grab.samples[0];
    const last = grab.samples[grab.samples.length - 1];
    const seconds = (last.t - first.t) / 1000;
    const velocity = seconds > 0 ? -(last.x - first.x) / seconds : 0;

    const span = el.scrollWidth - el.clientWidth;
    const step = cardStep();
    const landing = el.scrollLeft + project(velocity);
    const snapped = Math.round(landing / step) * step;
    settle(Math.min(span, Math.max(0, snapped)), velocity);
  };

  /**
   * The thumb is grabbed where it was pressed, as a scrollbar is: pressing it
   * must not jump the row before the pointer has moved. A press on the empty
   * track does jump, and hands the thumb over under the pointer.
   */
  const scrubTo = (event: React.PointerEvent<HTMLDivElement>, grab = false) => {
    const el = ref.current;
    if (!el) return;
    stop();
    const span = el.scrollWidth - el.clientWidth;
    const box = event.currentTarget.getBoundingClientRect();
    const thumb = Math.max(
      MIN_THUMB * box.width,
      (el.clientWidth / el.scrollWidth) * box.width,
    );
    const travel = box.width - thumb;
    const x = event.clientX - box.left;

    if (grab) {
      const thumbLeft = (el.scrollLeft / (span || 1)) * travel;
      const onThumb = x >= thumbLeft && x <= thumbLeft + thumb;
      // On the thumb, keep the grip; off it, take the thumb's middle.
      held.current = onThumb ? x - thumbLeft : thumb / 2;
      if (onThumb) return;
    }

    const fraction = Math.max(
      0,
      Math.min(1, (x - held.current) / (travel || 1)),
    );
    el.scrollLeft = fraction * span;
    read(true);
  };

  /** Keyboard and the arrow fallback both move by a card. */
  const nudge = (direction: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    const span = el.scrollWidth - el.clientWidth;
    const step = cardStep();
    const to = Math.round((el.scrollLeft + direction * step) / step) * step;
    settle(Math.min(span, Math.max(0, to)), 0);
  };

  return {
    ref: attach,
    state,
    nudge,
    onScroll: () => read(true),
    /** The indicator is a control: grab it and the row follows, 1:1. */
    scrub: {
      onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => {
        try {
          event.currentTarget.setPointerCapture(event.pointerId);
        } catch {
          // A pointer the browser no longer tracks; the scrub still stands.
        }
        scrubbing.current = true;
        scrubTo(event, true);
      },
      onPointerMove: (event: React.PointerEvent<HTMLDivElement>) => {
        if (scrubbing.current) scrubTo(event);
      },
      onPointerUp: (event: React.PointerEvent<HTMLDivElement>) => {
        scrubbing.current = false;
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
      },
    },
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
      // The browser's own image and link dragging would steal the gesture.
      onDragStart: (event: React.DragEvent) => event.preventDefault(),
      onClickCapture: (event: React.MouseEvent) => {
        if (!moved.current) return;
        event.preventDefault();
        event.stopPropagation();
        moved.current = false;
      },
    },
  };
}
