import { useCallback, useEffect, useRef, useState } from "react";
import type { TouchEvent, MouseEvent as ReactMouseEvent } from "react";

// How far (in px) a touch has to move before we decide whether the gesture
// is a horizontal swipe or a vertical scroll. Below this, we're just
// waiting to see which way it's actually going.
const DIRECTION_LOCK_PX = 10;

// How long the CSS snap/settle transition takes — must match the
// `transition: transform` duration applied in App.tsx.
const SETTLE_MS = 250;

// How long the kids' charts page can sit untouched before it auto-returns
// to the dashboard — mainly so a child leaving it parked there doesn't
// leave the dashboard stuck showing charts instead of the weather/calendar.
const IDLE_RETURN_MS = 5 * 60 * 1000;

const SLOT_PCT = 100 / 3;

function mod2(n: number): 0 | 1 {
  return (((n % 2) + 2) % 2) as 0 | 1;
}

// Two pages (dashboard, kids' charts) that loop endlessly in either
// direction: swiping left from the second page goes back to the dashboard
// (rather than getting stuck), and vice versa, always continuing in the
// direction you're already dragging.
//
// This is the standard "3 slot" infinite-carousel trick: we always render
// the previous/current/next page either side of `step`, drag between them
// with a live offset, and once a swipe commits, let the CSS transition
// finish sliding to the neighbour slot before instantly (no transition)
// recentring `step` on that neighbour — so there's always a buffer slot
// ready on both sides for the next swipe.
export function useSwipePage() {
  const [step, setStep] = useState(0);
  const [shiftFraction, setShiftFraction] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [transitionEnabled, setTransitionEnabled] = useState(true);

  const startX = useRef<number | null>(null);
  const liveOffset = useRef(0);
  const settleTimeout = useRef<number | undefined>(undefined);
  const recenterTimeout = useRef<number | undefined>(undefined);
  const idleTimeout = useRef<number | undefined>(undefined);

  useEffect(() => {
    return () => {
      window.clearTimeout(settleTimeout.current);
      window.clearTimeout(recenterTimeout.current);
      window.clearTimeout(idleTimeout.current);
    };
  }, []);

  // Animates to the neighbouring slot (same visual sequence a real swipe
  // triggers) and, once the transition finishes, instantly recentres `step`
  // there so a buffer slot is ready again on both sides.
  const settle = useCallback((stepDelta: 1 | -1) => {
    window.clearTimeout(settleTimeout.current);
    window.clearTimeout(recenterTimeout.current);
    setTransitionEnabled(true);
    setShiftFraction(-stepDelta);
    settleTimeout.current = window.setTimeout(() => {
      setTransitionEnabled(false);
      setStep((s) => s + stepDelta);
      setShiftFraction(0);
      recenterTimeout.current = window.setTimeout(() => setTransitionEnabled(true), 20);
    }, SETTLE_MS);
  }, []);

  // Resets on any touch/drag activity, and re-armed whenever the page
  // changes — only actually counts down while sat on the kids' charts page.
  const resetIdleTimer = useCallback(() => {
    window.clearTimeout(idleTimeout.current);
    setStep((s) => {
      if (mod2(s) === 1) {
        idleTimeout.current = window.setTimeout(() => settle(-1), IDLE_RETURN_MS);
      }
      return s;
    });
  }, [settle]);

  useEffect(() => {
    resetIdleTimer();
  }, [step, resetIdleTimer]);

  const begin = useCallback((clientX: number) => {
    window.clearTimeout(settleTimeout.current);
    window.clearTimeout(recenterTimeout.current);
    setTransitionEnabled(true);
    startX.current = clientX;
    setIsDragging(true);
  }, []);

  const move = useCallback((clientX: number) => {
    if (startX.current == null) return;
    liveOffset.current = clientX - startX.current;
    const fraction = liveOffset.current / window.innerWidth;
    setShiftFraction(Math.max(-1, Math.min(1, fraction)));
  }, []);

  const end = useCallback(() => {
    if (startX.current == null) return;
    const threshold = window.innerWidth * 0.18;
    const offset = liveOffset.current;

    const stepDelta = offset < -threshold ? 1 : offset > threshold ? -1 : 0;

    setIsDragging(false);
    setShiftFraction(-stepDelta);
    liveOffset.current = 0;
    startX.current = null;

    if (stepDelta !== 0) {
      settleTimeout.current = window.setTimeout(() => {
        setTransitionEnabled(false);
        setStep((s) => s + stepDelta);
        setShiftFraction(0);
        recenterTimeout.current = window.setTimeout(() => setTransitionEnabled(true), 20);
      }, SETTLE_MS);
    }
  }, []);

  // Touch is direction-locked: nothing happens to the horizontal swipe
  // until a gesture has moved far enough to tell whether it's mostly
  // horizontal or mostly vertical. A vertical drag (e.g. scrolling the
  // calendar list) is left completely alone from that point on — the
  // dashboard never nudges sideways because of it.
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const touchDirection = useRef<"horizontal" | "vertical" | null>(null);

  const onTouchStart = useCallback(
    (e: TouchEvent) => {
      touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      touchDirection.current = null;
      resetIdleTimer();
    },
    [resetIdleTimer],
  );

  const onTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!touchStart.current) return;
      const dx = e.touches[0].clientX - touchStart.current.x;
      const dy = e.touches[0].clientY - touchStart.current.y;

      if (touchDirection.current == null) {
        if (Math.abs(dx) < DIRECTION_LOCK_PX && Math.abs(dy) < DIRECTION_LOCK_PX) return;
        touchDirection.current = Math.abs(dx) > Math.abs(dy) ? "horizontal" : "vertical";
        if (touchDirection.current === "horizontal") begin(touchStart.current.x);
      }

      if (touchDirection.current !== "horizontal") return;
      move(e.touches[0].clientX);
    },
    [begin, move],
  );

  const onTouchEnd = useCallback(() => {
    if (touchDirection.current === "horizontal") end();
    touchStart.current = null;
    touchDirection.current = null;
  }, [end]);

  // Mouse-drag support, purely so this is testable with a trackpad/mouse on
  // desktop — Fully Kiosk on the tablet only ever sends touch events, and
  // mouse-drag doesn't compete with a native vertical-scroll gesture the
  // way touch does, so it skips the direction-locking above.
  const onMouseDown = useCallback(
    (e: ReactMouseEvent) => {
      e.preventDefault();
      resetIdleTimer();
      begin(e.clientX);
    },
    [begin, resetIdleTimer],
  );

  // mousemove/mouseup are tracked on window rather than the element, since
  // (unlike touch) the cursor can leave the swipeable area mid-drag.
  useEffect(() => {
    if (!isDragging) return;
    const handleMove = (e: globalThis.MouseEvent) => move(e.clientX);
    const handleUp = () => end();
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [isDragging, move, end]);

  // The three slots rendered side by side: previous / current / next page,
  // each identified by which logical page (0 = dashboard, 1 = kids' charts)
  // they hold right now.
  const slots: [0 | 1, 0 | 1, 0 | 1] = [mod2(step - 1), mod2(step), mod2(step + 1)];
  const trackPercent = (-1 + shiftFraction) * SLOT_PCT;

  return {
    page: mod2(step),
    slots,
    trackPercent,
    isDragging,
    transitionEnabled,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    onMouseDown,
  };
}
