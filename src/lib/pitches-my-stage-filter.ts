import type { SubmissionStatus } from "@/types";

/** null = show all. Draft vs submitted (submitted includes scored). */
export type PitchesMyStageFilter = "draft" | "submitted" | null;

export function parsePitchesStageFromSearch(
  searchParams: URLSearchParams
): PitchesMyStageFilter {
  const s = searchParams.get("stage");
  if (s === "draft" || s === "submitted") return s;
  return null;
}

export function filterSubmissionsByPitchesStage<
  T extends { status: SubmissionStatus },
>(subs: T[], stage: PitchesMyStageFilter): T[] {
  switch (stage) {
    case "draft":
      return subs.filter((s) => s.status === "draft");
    case "submitted":
      return subs.filter(
        (s) => s.status === "submitted" || s.status === "scored"
      );
    case null:
      return subs;
  }
}

export const PITCHES_STAGE_MENU_OPTIONS: {
  value: PitchesMyStageFilter;
  label: string;
}[] = [
  { value: null, label: "Show all pitches" },
  { value: "draft", label: "Draft" },
  { value: "submitted", label: "Submitted" },
];

/** Trimmed search query from `?q=` */
export function parsePitchesSearchFromSearch(
  searchParams: URLSearchParams
): string {
  return (searchParams.get("q") ?? "").trim();
}

export function filterSubmissionsByPitchesSearch<
  T extends { title: string; description: string },
>(subs: T[], query: string): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return subs;
  return subs.filter(
    (s) =>
      s.title.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q)
  );
}
