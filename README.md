This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## The Arena Landing Page

A separate public-facing landing page lives in this repo, distinct from the
authenticated platform UI. It exists in two parallel forms — a static HTML
sandbox for fast iteration, and a Next.js port that runs as a real route.

### Files

- **`arena-landing-mockup.html`** — standalone HTML/CSS/JS sandbox at the repo
  root. Open it directly in a browser to iterate on the design. No build step.
  This is where new visual ideas get tried first, since edits show up on reload
  without going through Next's dev server.
- **`src/app/(marketing)/landing-page/`** — the Next.js port. Same design,
  ported to React + TypeScript + a CSS Module. Accessible at `/landing-page`
  when the dev server is running. Files:
  - `page.tsx` — client component, syncs the active section (Home / Thesis /
    Team) with the URL hash, loads Inter + Newsreader via `next/font`.
  - `landing-page.module.css` — all styles, scoped via CSS Module. Preserves
    the mockup's animations, gradients, and noise overlay verbatim.
  - `orb.ts` — typed Three.js setup. Exports `initOrb(canvas, tooltip)` which
    returns a disposer for `useEffect` cleanup.

### Design

Three sections, hash-routed: `#home` (the WebGL orb + "By nomination only"
plaque), `#thesis` ("Worthy."), `#team` (Jake Oswald + Braden Peays + Connor
Doore). Palette is intentionally warm cream/gold against deep near-black,
which is *different* from the platform's gold-on-darker UI — this is the
public-facing front, not part of the logged-in app.

### The orb

A WebGL point-cloud globe rendered via Three.js. Recipe:

1. ~60k dots distributed uniformly on a sphere via a Fibonacci spiral.
2. Each dot is tagged land or ocean by sampling Three.js's
   `earth_specular_2048.jpg` (specular map → ocean is bright, land is dark; no
   clouds polluting the mask).
3. A custom GLSL shader gives land dots higher brightness, a small size boost,
   and a fresnel rim term that pushes dots near the silhouette to full bright
   — combined with **additive blending** and a **soft gaussian dot texture**,
   the rim accumulates into a luminous halo around the orb's edge.
4. The orb spins slowly on Y, with a subtle ±5% brightness "breath" on a 7s
   sine cycle so it doesn't feel mechanical.
5. Three gold markers (Jupiter FL, Fairhope AL, Austin TX) sit on the surface
   as a separate Points buffer. A raycaster picks marker hits on `pointermove`;
   the hovered marker eases up in size and brightness via a per-vertex
   `aHover` attribute, while a small DOM tooltip follows the cursor with the
   city name.
6. Click-and-drag rotates the orb manually; the auto-rotation pauses while
   dragging.

### Tuning the orb

All the visual knobs are constants at the top of `initOrb` in both files.
The names match between the HTML and `orb.ts`:

- `N_CANDIDATES`, `POINT_SIZE`, `LAND_SIZE_BOOST` — density and dot sizing.
- `OCEAN_BRIGHTNESS`, `LAND_BRIGHTNESS` — the contrast between sphere texture
  and continent fill. With additive blending, set lower than you'd expect; the
  accumulation does the work.
- `RIM_POWER`, `RIM_BOOST` — the silhouette halo. Lower power = broader band.
- `BREATH_PERIOD`, `BREATH_AMPLITUDE` — the slow brightness pulse.
- `MARKER_HOVER_SIZE_BOOST`, `MARKER_HOVER_BRIGHT_BOOST`, `MARKER_HOVER_LERP` —
  how the gold pins react to hover.

### Iterating

When you want to try something visual, edit `arena-landing-mockup.html` first
— reloading the file is faster than going through Next's dev rebuilds. Once
the change is dialed in, port the diff to `orb.ts` and/or
`landing-page.module.css`. The two are kept structurally parallel so a port is
mostly a copy-paste with type annotations.

### Promoting to the public landing

Right now `src/app/(marketing)/page.tsx` is the marketing route at `/`, and
the new design lives at `/landing-page`. When the new design is ready to
replace the existing landing, either redirect `/` to `/landing-page` or move
the contents of `landing-page/` up one level.
