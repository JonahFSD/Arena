"use client";

import type { CSSProperties } from "react";
import { useLayoutEffect, useMemo, useState } from "react";

/** Tailwind `sm` / `lg` / `xl` defaults — keep in sync with grid classNames. */
export const BOUNTIES_GRID_BREAKPOINTS = [
  { minWidth: 1280, cols: 4 },
  { minWidth: 640, cols: 2 },
  { minWidth: 0, cols: 1 },
] as const;

export const COMMUNITY_MEMBERS_GRID_BREAKPOINTS = [
  { minWidth: 1024, cols: 4 },
  { minWidth: 640, cols: 2 },
  { minWidth: 0, cols: 1 },
] as const;

function colsForWidth(
  width: number,
  breakpoints: readonly { minWidth: number; cols: number }[]
): number {
  const sorted = [...breakpoints].sort((a, b) => b.minWidth - a.minWidth);
  for (const bp of sorted) {
    if (width >= bp.minWidth) return bp.cols;
  }
  return sorted[sorted.length - 1]!.cols;
}

/**
 * Current column count for a responsive grid. Initial state is 1 so SSR and the
 * first client paint match; `useLayoutEffect` updates before paint to avoid
 * hydration mismatch while filling incomplete rows.
 */
export function useResponsiveGridColumnCount(
  breakpoints: readonly { minWidth: number; cols: number }[]
): number {
  const sorted = useMemo(
    () => [...breakpoints].sort((a, b) => b.minWidth - a.minWidth),
    [breakpoints]
  );

  const [cols, setCols] = useState(1);

  useLayoutEffect(() => {
    const run = () => {
      setCols(colsForWidth(window.innerWidth, sorted));
    };
    run();
    window.addEventListener("resize", run);
    return () => window.removeEventListener("resize", run);
  }, [sorted]);

  return cols;
}

/** Split items into rows of `cols` length; last row may be shorter. */
export function chunkIntoRows<T>(items: readonly T[], cols: number): T[][] {
  if (cols <= 0) return [];
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += cols) {
    rows.push(items.slice(i, i + cols) as T[]);
  }
  return rows;
}

/**
 * Width of one column in a `gap-px` grid with `repeat(cols, minmax(0, 1fr))`.
 * Use on flex children in a partial last row so cards align with columns above
 * without drawing vertical hairlines through empty tracks.
 */
export function paneGridCellFractionStyle(columnCount: number): CSSProperties {
  if (columnCount <= 0) return {};
  const gapPx = 1;
  const w = `calc((100% - ${(columnCount - 1) * gapPx}px) / ${columnCount})`;
  return {
    flex: `0 0 ${w}`,
    maxWidth: w,
    minWidth: 0,
  };
}

/**
 * True when this item sits in the grid’s last row. Pane stacks use `gap-px` between
 * rows, which does not draw a line below the final row when it is full—so cells in
 * that row need an explicit bottom border. Incomplete last rows need the same edge.
 */
export function isLastRowCell(
  index: number,
  itemCount: number,
  columnCount: number
): boolean {
  if (itemCount <= 0 || columnCount <= 0) return false;
  const lastRowFirstIndex =
    Math.floor((itemCount - 1) / columnCount) * columnCount;
  return index >= lastRowFirstIndex;
}
