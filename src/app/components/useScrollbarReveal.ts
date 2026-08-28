import { useEffect } from "react";

/**
 * Reveals a surface's scrollbar only while that surface is scrolling.
 *
 * The look lives in theme.css (see the "Scrollbars" block); this file owns
 * the single number that block reads — `--sb-alpha`, written inline on
 * whichever element just scrolled. Scroll starts, the thumb is there; a
 * beat after it stops, the thumb eases away.
 *
 * Everything is inline-style writes on the scrolling element, deliberately:
 * `--sb-alpha` is registered with `inherits: false`, so one element's
 * reveal cannot leak into the scrollbars of the scroll containers nested
 * inside it, and inline values never argue with a stylesheet.
 */

/** How long the thumb stays at full strength after the last scroll tick. */
const HOLD_MS = 700;
/** The exit fade. Chrome will not transition scrollbar pseudos, so we drive it. */
const FADE_MS = 240;

const ALPHA = "--sb-alpha";

type Reveal = {
  hold: ReturnType<typeof setTimeout> | null;
  frame: number | null;
};

const reveals = new WeakMap<HTMLElement, Reveal>();

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function stateFor(el: HTMLElement): Reveal {
  let state = reveals.get(el);
  if (!state) {
    state = { hold: null, frame: null };
    reveals.set(el, state);
  }
  return state;
}

function clearPending(state: Reveal): void {
  if (state.hold !== null) {
    clearTimeout(state.hold);
    state.hold = null;
  }
  if (state.frame !== null) {
    cancelAnimationFrame(state.frame);
    state.frame = null;
  }
}

/** Cubic ease-out: leaves quickly, settles slowly — the same curve shape the
 *  portal's 150-250ms state transitions use. */
function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function fadeOut(el: HTMLElement, state: Reveal): void {
  if (prefersReducedMotion()) {
    el.style.removeProperty(ALPHA);
    return;
  }

  const start = performance.now();
  const step = (now: number): void => {
    const t = Math.min((now - start) / FADE_MS, 1);
    if (t >= 1) {
      state.frame = null;
      el.style.removeProperty(ALPHA);
      return;
    }
    el.style.setProperty(ALPHA, String(1 - easeOut(t)));
    state.frame = requestAnimationFrame(step);
  };
  state.frame = requestAnimationFrame(step);
}

/**
 * Resolve a scroll event to the element whose scrollbar should answer.
 * A document-level scroll is reported with the Document as its target, but
 * the scrollbar belongs to the root element.
 */
function scrollerOf(target: EventTarget | null): HTMLElement | null {
  if (target instanceof HTMLElement) return target;
  if (target instanceof Document) return target.documentElement;
  return null;
}

function onScroll(event: Event): void {
  const el = scrollerOf(event.target);
  if (!el) return;

  const state = stateFor(el);
  clearPending(state);
  el.style.setProperty(ALPHA, "1");
  state.hold = setTimeout(() => {
    state.hold = null;
    fadeOut(el, state);
  }, HOLD_MS);
}

/**
 * Installs the reveal for the whole app. Call once, at the root.
 *
 * Capture phase because `scroll` does not bubble: a single listener on the
 * document is how one handler covers every scroll container in the portal,
 * including ones mounted later by a route change.
 */
export function useScrollbarReveal(): void {
  useEffect(() => {
    document.addEventListener("scroll", onScroll, { capture: true, passive: true });
    return () => document.removeEventListener("scroll", onScroll, { capture: true });
  }, []);
}
