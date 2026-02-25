"use client";

/**
 * Confetti Animation Component
 *
 * A lightweight CSS-only confetti effect that falls from the top of the
 * screen. Renders a fixed overlay of randomly-positioned coloured pieces
 * that animate downward and then auto-removes itself after the animation
 * completes.
 *
 * Usage: render `<Confetti />` once; it self-destructs after ~3 s.
 */

import { useEffect, useState } from "react";

/** Number of individual confetti pieces. */
const PIECE_COUNT = 60;

/** Duration before the component unmounts itself (ms). */
const ANIMATION_DURATION_MS = 3500;

/** Palette of confetti colours. */
const COLORS = [
  "#f44336", // red
  "#e91e63", // pink
  "#9c27b0", // purple
  "#673ab7", // deep purple
  "#3f51b5", // indigo
  "#2196f3", // blue
  "#03a9f4", // light blue
  "#00bcd4", // cyan
  "#009688", // teal
  "#4caf50", // green
  "#8bc34a", // light green
  "#ffeb3b", // yellow
  "#ffc107", // amber
  "#ff9800", // orange
  "#ff5722", // deep orange
];

/** A single confetti piece with randomised properties. */
interface Piece {
  id: number;
  left: number;      // % from left
  delay: number;     // animation-delay in seconds
  duration: number;   // fall duration in seconds
  size: number;       // side-length in px
  color: string;
  rotation: number;   // initial rotation in degrees
}

function randomPieces(): Piece[] {
  return Array.from({ length: PIECE_COUNT }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 1.2,
    duration: 1.8 + Math.random() * 1.4,
    size: 6 + Math.random() * 6,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    rotation: Math.random() * 360,
  }));
}

export function Confetti() {
  const [visible, setVisible] = useState(true);
  const [pieces] = useState<Piece[]>(randomPieces);

  // Auto-hide after the animation completes
  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), ANIMATION_DURATION_MS);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
    >
      {pieces.map((p) => (
        <span
          key={p.id}
          className="absolute animate-confetti-fall"
          style={{
            left: `${p.left}%`,
            top: "-10px",
            width: `${p.size}px`,
            height: `${p.size * 0.6}px`,
            backgroundColor: p.color,
            borderRadius: "2px",
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            transform: `rotate(${p.rotation}deg)`,
          }}
        />
      ))}
    </div>
  );
}
