/** Mock monthly series for the member dashboard (replace with API later). */

export type DashboardTrendMetricId =
  | "pointsEarned"
  | "networkSize"
  | "earnings"
  | "communityRank"
  | "submissions"
  | "avgAiScore";

export type DashboardTrendRow = {
  monthKey: string;
  label: string;
  /** Points earned in that month */
  pointsEarned: number;
  /** Network size (connections) at month end */
  networkSize: number;
  /** Earnings in that month (USD) */
  earnings: number;
  /** Community rank (1 = best) */
  communityRank: number;
  submissions: number;
  avgAiScore: number;
};

export const DASHBOARD_TRENDS_SERIES: DashboardTrendRow[] = [
  {
    monthKey: "2025-05",
    label: "May",
    pointsEarned: 120,
    networkSize: 9,
    earnings: 180,
    communityRank: 12,
    submissions: 2,
    avgAiScore: 74.0,
  },
  {
    monthKey: "2025-06",
    label: "Jun",
    pointsEarned: 145,
    networkSize: 11,
    earnings: 220,
    communityRank: 10,
    submissions: 2,
    avgAiScore: 75.2,
  },
  {
    monthKey: "2025-07",
    label: "Jul",
    pointsEarned: 132,
    networkSize: 12,
    earnings: 195,
    communityRank: 9,
    submissions: 3,
    avgAiScore: 76.1,
  },
  {
    monthKey: "2025-08",
    label: "Aug",
    pointsEarned: 160,
    networkSize: 14,
    earnings: 260,
    communityRank: 8,
    submissions: 2,
    avgAiScore: 77.0,
  },
  {
    monthKey: "2025-09",
    label: "Sep",
    pointsEarned: 155,
    networkSize: 15,
    earnings: 240,
    communityRank: 7,
    submissions: 3,
    avgAiScore: 77.8,
  },
  {
    monthKey: "2025-10",
    label: "Oct",
    pointsEarned: 178,
    networkSize: 17,
    earnings: 310,
    communityRank: 6,
    submissions: 4,
    avgAiScore: 78.4,
  },
  {
    monthKey: "2025-11",
    label: "Nov",
    pointsEarned: 165,
    networkSize: 18,
    earnings: 285,
    communityRank: 6,
    submissions: 3,
    avgAiScore: 79.0,
  },
  {
    monthKey: "2025-12",
    label: "Dec",
    pointsEarned: 140,
    networkSize: 19,
    earnings: 250,
    communityRank: 5,
    submissions: 2,
    avgAiScore: 79.2,
  },
  {
    monthKey: "2026-01",
    label: "Jan",
    pointsEarned: 190,
    networkSize: 20,
    earnings: 340,
    communityRank: 5,
    submissions: 4,
    avgAiScore: 80.1,
  },
  {
    monthKey: "2026-02",
    label: "Feb",
    pointsEarned: 205,
    networkSize: 22,
    earnings: 360,
    communityRank: 4,
    submissions: 3,
    avgAiScore: 80.6,
  },
  {
    monthKey: "2026-03",
    label: "Mar",
    pointsEarned: 198,
    networkSize: 23,
    earnings: 355,
    communityRank: 4,
    submissions: 4,
    avgAiScore: 81.0,
  },
  {
    monthKey: "2026-04",
    label: "Apr",
    pointsEarned: 180,
    networkSize: 24,
    earnings: 330,
    communityRank: 4,
    submissions: 3,
    avgAiScore: 81.2,
  },
];

const METRIC_KEY: Record<DashboardTrendMetricId, keyof DashboardTrendRow> = {
  pointsEarned: "pointsEarned",
  networkSize: "networkSize",
  earnings: "earnings",
  communityRank: "communityRank",
  submissions: "submissions",
  avgAiScore: "avgAiScore",
};

export const DASHBOARD_TREND_METRICS: {
  id: DashboardTrendMetricId;
  label: string;
  format: "integer" | "currency" | "oneDecimal" | "rank";
}[] = [
  { id: "pointsEarned", label: "Points earned", format: "integer" },
  { id: "networkSize", label: "Network size", format: "integer" },
  { id: "earnings", label: "Earnings", format: "currency" },
  { id: "communityRank", label: "Community rank", format: "rank" },
  { id: "submissions", label: "Submissions", format: "integer" },
  { id: "avgAiScore", label: "Avg. AI score", format: "oneDecimal" },
];

export function getDashboardTrendValue(
  row: DashboardTrendRow,
  id: DashboardTrendMetricId
): number {
  return row[METRIC_KEY[id]] as number;
}

/** Stat tiles on the member dashboard (maps to trend series fields). */
export type DashboardStatCardMomId =
  | "points"
  | "network"
  | "earnings"
  | "rank";

const STAT_CARD_MOM: Record<
  DashboardStatCardMomId,
  { key: keyof DashboardTrendRow; rankInverted: boolean }
> = {
  points: { key: "pointsEarned", rankInverted: false },
  network: { key: "networkSize", rankInverted: false },
  earnings: { key: "earnings", rankInverted: false },
  rank: { key: "communityRank", rankInverted: true },
};

const MOM_PCT_EPS = 1e-9;

function formatMomPercentNonZero(pct: number): string {
  const rounded = Math.round(pct * 10) / 10;
  const abs = Math.abs(rounded);
  const body = abs % 1 === 0 ? String(abs) : abs.toFixed(1);
  return rounded > 0 ? `+${body}%` : `-${body}%`;
}

export type DashboardStatMomTone = "positive" | "negative" | "neutral";

/**
 * Month-over-month % from the last two months in {@link DASHBOARD_TRENDS_SERIES}
 * (same sample data as “Your trends”). Rank uses inverted change so “up” is positive when rank improves.
 */
export function getDashboardStatMomPercent(id: DashboardStatCardMomId): {
  text: string;
  tone: DashboardStatMomTone;
} {
  const series = DASHBOARD_TRENDS_SERIES;
  if (series.length < 2) return { text: "—", tone: "neutral" };
  const prevRow = series[series.length - 2]!;
  const currRow = series[series.length - 1]!;
  const { key, rankInverted } = STAT_CARD_MOM[id];
  const prev = prevRow[key] as number;
  const curr = currRow[key] as number;

  let pct: number;
  if (rankInverted) {
    if (prev <= 0) return { text: "—", tone: "neutral" };
    pct = ((prev - curr) / prev) * 100;
  } else {
    if (prev === 0 && curr === 0) return { text: "0%", tone: "neutral" };
    if (prev === 0) return { text: "—", tone: "neutral" };
    pct = ((curr - prev) / prev) * 100;
  }

  if (Math.abs(pct) < MOM_PCT_EPS) return { text: "0%", tone: "neutral" };
  return {
    text: formatMomPercentNonZero(pct),
    tone: pct > 0 ? "positive" : "negative",
  };
}
