/** Matches `(platform)/layout.tsx` `<main className="p-4 md:p-6 lg:p-8 ...">` for edge-to-edge pane grids. */
export const platformPaneBleedClass =
  "-mx-4 md:-mx-6 lg:-mx-8 -mt-4 md:-mt-6 lg:-mt-8";

/** Inset inside each pane cell (between grid lines and content). */
export const platformPaneCellPaddingClass = "p-[5px]";

/** Flush tiles: grid lines define the pane; no floating card chrome. */
export const platformPaneTileClass =
  "rounded-none border-0 shadow-none bg-transparent";

/**
 * Hairline dividers between grid cells only — `gap-px` shows `--color-border-default`
 * between `bg-surface-primary` faces. No outer border on the grid, so lines do not stack
 * against the sidebar rail, top bar, or main padding edges.
 */
export const platformPaneGridGapClass = "gap-px bg-border-default";

/**
 * Bottom border for cells in the last grid row (see `isLastRowCell` in
 * `@/lib/responsive-grid-columns`). Not applied to the full grid or to placeholders.
 */
export const platformPaneGridHangingCellBottomClass =
  "border-b border-solid border-border-default";

/** Cell face color (covers gap lines). */
export const platformPaneGridCellFillClass = "bg-surface-primary";

/** Vertical list of rows with hairline gaps only (same 1px pattern as `platformPaneGridGapClass`). */
export const platformPaneStackGapClass =
  "flex flex-col gap-px bg-border-default";

/** Stack of pane grid rows (horizontal lines only between rows). */
export const platformPaneGridRowsStackClass =
  "flex w-full flex-col gap-px bg-border-default";

/** One full row: equal columns; use with `style={{ gridTemplateColumns: repeat(cols, minmax(0, 1fr)) }}`. */
export const platformPaneGridRowFullClass =
  "grid w-full gap-px bg-border-default";

/**
 * Partial last row: real cards only. Uses page-colored flex area + explicit hairlines
 * between cells (not `gap` on grey), plus a flex tail so empty space stays `surface-primary`.
 */
export const platformPaneGridRowPartialClass =
  "flex w-full flex-row flex-nowrap bg-surface-primary";

/** Vertical hairline only between two adjacent cells in a partial row. */
export const platformPaneGridPartialHairlineClass =
  "w-px shrink-0 self-stretch bg-border-default";

/** Absorbs remaining width after fractional cells so no grey shows to the right. */
export const platformPaneGridPartialRowTailFillClass =
  "min-h-0 min-w-0 flex-1 bg-surface-primary";
