"use client";

import { type ReactNode, useEffect, useRef } from "react";

interface CursorScaleProps {
  children: ReactNode;
  className?: string;
  /** Scale applied on hover (e.g., 1.0 = no scale, 1.05 = +5%) */
  hoverScale?: number;
  /** Maximum pixel translation at the edges (both axes) */
  maxTranslate?: number;
  /** Linear interpolation factor for smoothing (0-1). Higher = snappier */
  lerp?: number;
  /** Disable the effect */
  disabled?: boolean;
  /** Base rotation in degrees (default state) */
  baseRotation?: number;
  /** Rotation in degrees on hover */
  hoverRotation?: number;
}

/**
 * CursorScale wraps content and applies a smooth hover-driven scale + subtle translation
 * that follows the cursor within the element's bounds. Uses rAF updates and DOM style
 * mutations to avoid React re-renders on pointer move.
 */
const CursorScale = ({
  children,
  className,
  hoverScale = 1.05,
  maxTranslate = 10,
  lerp = 0.12,
  disabled = false,
  baseRotation = 0,
  hoverRotation,
}: CursorScaleProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const isHoveringRef = useRef(false);

  // Use baseRotation as default for hoverRotation if not specified
  const effectiveHoverRotation = hoverRotation ?? baseRotation;

  const targetRef = useRef({ x: 0, y: 0, s: 1, r: baseRotation });
  const currentRef = useRef({ x: 0, y: 0, s: 1, r: baseRotation });

  useEffect(() => {
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) return;

    if (disabled) {
      // Reset any transform if disabling after being active
      content.style.transform = `translate3d(0px, 0px, 0px) scale(1) rotate(${baseRotation}deg)`;
      return;
    }

    const clamp = (v: number, min: number, max: number) =>
      Math.max(min, Math.min(max, v));

    const animate = () => {
      rafIdRef.current = null;
      // Lerp towards target
      const t = clamp(lerp, 0, 1);
      currentRef.current.x += (targetRef.current.x - currentRef.current.x) * t;
      currentRef.current.y += (targetRef.current.y - currentRef.current.y) * t;
      currentRef.current.s += (targetRef.current.s - currentRef.current.s) * t;
      currentRef.current.r += (targetRef.current.r - currentRef.current.r) * t;

      const { x, y, s, r } = currentRef.current;
      content.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) scale(${s.toFixed(4)}) rotate(${r.toFixed(2)}deg)`;

      const stillMoving =
        Math.abs(targetRef.current.x - x) > 0.1 ||
        Math.abs(targetRef.current.y - y) > 0.1 ||
        Math.abs(targetRef.current.s - s) > 0.001 ||
        Math.abs(targetRef.current.r - r) > 0.01;

      if (stillMoving) {
        rafIdRef.current = window.requestAnimationFrame(animate);
      }
    };

    const ensureRaf = () => {
      rafIdRef.current ??= window.requestAnimationFrame(animate);
    };

    const handlePointerEnter = () => {
      isHoveringRef.current = true;
      targetRef.current.s = Math.max(1, hoverScale);
      targetRef.current.r = effectiveHoverRotation;
      ensureRaf();
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!isHoveringRef.current) return;
      const rect = container.getBoundingClientRect();
      const localX = event.clientX - rect.left;
      const localY = event.clientY - rect.top;
      const nx = (localX / Math.max(1, rect.width) - 0.5) * 2; // -1 .. 1
      const ny = (localY / Math.max(1, rect.height) - 0.5) * 2; // -1 .. 1

      // Translate proportionally to position. Top-right => up (-y) and right (+x)
      targetRef.current.x = clamp(nx, -1, 1) * maxTranslate;
      targetRef.current.y = clamp(ny, -1, 1) * maxTranslate;
      ensureRaf();
    };

    const handlePointerLeave = () => {
      isHoveringRef.current = false;
      targetRef.current = { x: 0, y: 0, s: 1, r: baseRotation };
      ensureRaf();
    };

    container.addEventListener("pointerenter", handlePointerEnter);
    container.addEventListener("pointermove", handlePointerMove);
    container.addEventListener("pointerleave", handlePointerLeave);

    return () => {
      container.removeEventListener("pointerenter", handlePointerEnter);
      container.removeEventListener("pointermove", handlePointerMove);
      container.removeEventListener("pointerleave", handlePointerLeave);
      if (rafIdRef.current != null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      // Reset transform on cleanup
      content.style.transform = `translate3d(0px, 0px, 0px) scale(1) rotate(${baseRotation}deg)`;
      // Reset state refs
      targetRef.current = { x: 0, y: 0, s: 1, r: baseRotation };
      currentRef.current = { x: 0, y: 0, s: 1, r: baseRotation };
    };
  }, [hoverScale, maxTranslate, lerp, disabled, baseRotation, effectiveHoverRotation]);

  const containerClasses = [
    "relative",
    "isolate",
    "overflow-visible",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div ref={containerRef} className={containerClasses}>
      <div
        ref={contentRef}
        className="transform-gpu will-change-transform"
        style={{ transform: `translate3d(0px, 0px, 0px) scale(1) rotate(${baseRotation}deg)` }}
      >
        {children}
      </div>
    </div>
  );
};

export default CursorScale;
