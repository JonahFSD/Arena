/**
 * PlatformBackdrop
 *
 * Fixed full-viewport texture stack. Poster-style: a bold warm radial focal
 * over the brand palette, a visible halftone dot field, and heavy SVG grain.
 *
 * Layer stack, bottom → top:
 *   1. Radial gradient — gold core, fading through brand-700 / brand-900
 *      into surface-primary at the corners. Carries all of the color.
 *   2. Halftone — fine offset radial-gradient tiles, mix-blend-overlay so
 *      dots brighten warm areas and darken cool ones. Reads as newsprint.
 *   3. Grain — SVG feTurbulence rasterized once and tiled by the browser.
 *      mix-blend-overlay at meaningful opacity so it adds analog/film
 *      texture without flattening the gradient.
 *
 * All layers are pointer-events-none and fixed inset-0.
 */
export function PlatformBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      {/* Layer 1: Tight warm focal — reads as a discrete glow, not a wash.
          Falls off fast so the corners stay near-black like the reference. */}
      <div
        className="absolute inset-0"
        style={{
          background: [
            "radial-gradient(ellipse 50% 45% at 50% 50%, " +
              "rgba(212, 171, 42, 0.45) 0%, " + // brand-400 — core
              "rgba(196, 154, 34, 0.32) 18%, " + // brand-500
              "rgba(157, 123, 27, 0.18) 38%, " + // brand-600
              "rgba(118, 92, 20, 0.08) 60%, " + // brand-700
              "transparent 80%)",
          ].join(", "),
        }}
      />

      {/* Layer 2: Halftone dot field — visible but quieter so the focal stays the read */}
      <div
        className="absolute inset-0 opacity-[0.28] mix-blend-overlay"
        style={{
          backgroundImage: [
            "radial-gradient(circle at center, rgba(255, 255, 255, 1) 0.6px, transparent 1.1px)",
            "radial-gradient(circle at center, rgba(0, 0, 0, 0.8) 0.6px, transparent 1.1px)",
          ].join(", "),
          backgroundSize: "5px 5px, 5px 5px",
          backgroundPosition: "0 0, 2.5px 2.5px",
        }}
      />

      {/* Layer 3: SVG fractal-noise grain — heavier film texture */}
      <svg
        className="absolute inset-0 h-full w-full opacity-[0.28] mix-blend-overlay"
        xmlns="http://www.w3.org/2000/svg"
      >
        <filter id="platform-grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.85"
            numOctaves="2"
            stitchTiles="stitch"
          />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 1
                    0 0 0 0 1
                    0 0 0 0 1
                    0 0 0 0.9 0"
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#platform-grain)" />
      </svg>

    </div>
  );
}
