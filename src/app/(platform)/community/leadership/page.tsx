"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

const DEMO_LEADERSHIP = {
  executives: [
    { _id: "l1", name: "Jake Oswald", role: "Co-Founder", userId: "u9", school: "ACU", graduation: 2026, company: null, jobTitle: null, avatarUrl: null },
    { _id: "l2", name: "Connor", role: "Co-Founder", userId: "u4", school: "ACU", graduation: 2026, company: null, jobTitle: null, avatarUrl: null },
    { _id: "l3", name: "Yichi Zhang", role: "VP Operations", userId: "u2", school: "Valley Christian", graduation: 2028, company: null, jobTitle: null, avatarUrl: null },
  ],
  regionalDirectors: [
    { _id: "rd1", name: "Toi Stepp", role: "Regional Director", userId: "u6", school: "Jefferson Christian", graduation: 2027, avatarUrl: null, region: "Southeast" },
    { _id: "rd2", name: "Seowoong Park", role: "Regional Director", userId: "u5", school: "Cedar Park", graduation: 2028, avatarUrl: null, region: "South Central" },
  ],
  ambassadors: [
    { _id: "a1", name: "Alex Mi", role: "Ambassador", userId: "u1", school: "Valley Christian", graduation: 2027, avatarUrl: null, state: "California" },
    { _id: "a2", name: "Jonah Elliot", role: "Ambassador", userId: "u3", school: "ACU", graduation: 2028, avatarUrl: null, state: "Texas" },
    { _id: "a3", name: "Chelsea Gunn", role: "Ambassador", userId: "u7", school: "Jefferson Christian", graduation: 2026, avatarUrl: null, state: "Florida" },
  ],
};
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  platformPaneGridCellFillClass,
  platformPaneGridHangingCellBottomClass,
  platformPaneGridPartialHairlineClass,
  platformPaneGridPartialRowTailFillClass,
  platformPaneGridRowFullClass,
  platformPaneGridRowPartialClass,
  platformPaneGridRowsStackClass,
  platformPaneStackGapClass,
  platformPaneTileClass,
} from "@/lib/platform-pane-grid";
import {
  BOUNTIES_GRID_BREAKPOINTS,
  chunkIntoRows,
  isLastRowCell,
  paneGridCellFractionStyle,
  useResponsiveGridColumnCount,
} from "@/lib/responsive-grid-columns";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  MapPin, GraduationCap, Calendar, Plus, Send,
  CheckCircle, ChevronDown, ChevronUp, Building2, Briefcase,
} from "lucide-react";

/* ─── US regions with their states (static config — the positions are dynamic) ─── */
const REGIONS = [
  { name: "New England", states: ["Connecticut", "Maine", "Massachusetts", "New Hampshire", "New York", "Rhode Island", "Vermont"] },
  { name: "Mid-Atlantic", states: ["Delaware", "Maryland", "New Jersey", "North Carolina", "Pennsylvania", "Virginia", "West Virginia"] },
  { name: "Southeast", states: ["Alabama", "Florida", "Georgia", "Kentucky", "Louisiana", "Mississippi", "South Carolina", "Tennessee"] },
  { name: "Midwest", states: ["Illinois", "Indiana", "Iowa", "Michigan", "Minnesota", "Missouri", "Ohio", "Wisconsin"] },
  { name: "South Central", states: ["Arkansas", "Kansas", "Nebraska", "North Dakota", "Oklahoma", "South Dakota", "Texas"] },
  { name: "Mountain West", states: ["Arizona", "Colorado", "Idaho", "Montana", "New Mexico", "Utah", "Wyoming"] },
  { name: "Pacific", states: ["Alaska", "California", "Hawaii", "Nevada", "Oregon", "Washington"] },
];

type ExecutiveLeader = {
  _id: string;
  name: string;
  role: string;
  userId?: string;
  school?: string;
  graduation?: number;
  company?: string;
  jobTitle?: string;
  avatarUrl?: string | null;
};

function ExecutiveTeamMemberContent(props: ExecutiveLeader) {
  const { name, role, avatarUrl } = props;
  const meta = props.company ? (
    <div className="mt-1 flex flex-col items-start gap-1 text-sm text-text-secondary">
      <span className="flex items-center gap-1.5">
        <Building2 className="h-3.5 w-3.5 shrink-0 text-brand-500" />
        {props.company}
      </span>
      <span className="flex items-center gap-1.5">
        <Briefcase className="h-3.5 w-3.5 shrink-0 text-brand-500" />
        {props.jobTitle}
      </span>
    </div>
  ) : (
    <div className="mt-1 flex flex-col items-start gap-1 text-sm text-text-secondary">
      {props.school && (
        <span className="flex items-center gap-1.5">
          <GraduationCap className="h-3.5 w-3.5 shrink-0 text-brand-500" />
          {props.school}
        </span>
      )}
      {props.graduation && (
        <span className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 shrink-0 text-brand-500" />
          Class of {props.graduation}
        </span>
      )}
    </div>
  );

  return (
    <div className="flex flex-row items-start gap-3 sm:gap-4">
      <Avatar src={avatarUrl ?? undefined} name={name} size="lg" className="shrink-0" />
      <div className="min-w-0 flex-1 text-left">
        <h3 className="mb-1.5 text-base font-medium leading-snug text-text-primary">
          {name}
        </h3>
        <Badge
          variant="brand"
          className="mb-1.5 bg-brand-500/80 text-[10px] font-medium uppercase tracking-wide text-black"
        >
          {role}
        </Badge>
        {meta}
      </div>
    </div>
  );
}

function ExecutiveTeamGrid({ leaders }: { leaders: ExecutiveLeader[] }) {
  const gridCols = useResponsiveGridColumnCount(BOUNTIES_GRID_BREAKPOINTS);
  const rows = useMemo(
    () => chunkIntoRows(leaders, gridCols),
    [leaders, gridCols]
  );

  return (
    <div
      className={cn(
        "overflow-hidden rounded-none border-t border-solid border-border-default",
        "-mx-4 md:-mx-6 lg:-mx-8"
      )}
    >
      <div className={platformPaneGridRowsStackClass}>
        {rows.map((row, rowIndex) => {
          const isPartial = row.length < gridCols;
          const rowKey = `${rowIndex}-${row[0]!.name}`;

          const cells = row.map((leader, i) => {
            const index = rowIndex * gridCols + i;
            const href = leader.userId ? `/community/${leader.userId}` : undefined;

            const tile = (
              <Card
                hover={Boolean(href)}
                padding="none"
                className={cn(
                  platformPaneTileClass,
                  "flex h-full min-h-[11rem] min-w-0 flex-1 flex-col overflow-hidden p-4 sm:min-h-0 sm:p-5 md:p-[30px]"
                )}
              >
                <ExecutiveTeamMemberContent {...leader} />
              </Card>
            );

            return (
              <div
                key={leader._id}
                className={cn(
                  "min-w-0 flex flex-col",
                  platformPaneGridCellFillClass,
                  isLastRowCell(index, leaders.length, gridCols) &&
                    platformPaneGridHangingCellBottomClass
                )}
                style={
                  isPartial ? paneGridCellFractionStyle(gridCols) : undefined
                }
              >
                {href ? (
                  <Link
                    href={href}
                    className="block h-full min-h-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-primary"
                    aria-label={`View ${leader.name}'s profile`}
                  >
                    {tile}
                  </Link>
                ) : (
                  <div className="block h-full min-h-0">{tile}</div>
                )}
              </div>
            );
          });

          if (isPartial) {
            return (
              <div key={rowKey} className={platformPaneGridRowPartialClass}>
                {cells.flatMap((node, i) =>
                  i === 0
                    ? [node]
                    : [
                        <div
                          key={`${rowKey}-v-${i}`}
                          className={platformPaneGridPartialHairlineClass}
                          aria-hidden
                        />,
                        node,
                      ]
                )}
                <div
                  key={`${rowKey}-v-end`}
                  className={platformPaneGridPartialHairlineClass}
                  aria-hidden
                />
                <div
                  className={platformPaneGridPartialRowTailFillClass}
                  aria-hidden
                />
              </div>
            );
          }

          return (
            <div
              key={rowKey}
              className={platformPaneGridRowFullClass}
              style={{
                gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`,
              }}
            >
              {cells}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RegionalDirectorsPane({
  directors,
  ambassadors,
  onApply,
}: {
  directors: Map<string, ExecutiveLeader>;
  ambassadors: Map<string, ExecutiveLeader>;
  onApply: (state: string) => void;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-none border-t border-solid border-border-default",
        "-mx-4 md:-mx-6 lg:-mx-8"
      )}
    >
      <div className={platformPaneGridRowsStackClass}>
        {REGIONS.map((region, regionIndex) => (
          <div
            key={region.name}
            className={platformPaneGridRowFullClass}
            style={{ gridTemplateColumns: "minmax(0, 1fr)" }}
          >
            <div
              className={cn(
                platformPaneGridCellFillClass,
                regionIndex === REGIONS.length - 1 &&
                  platformPaneGridHangingCellBottomClass
              )}
            >
              <RegionRow
                region={region}
                director={directors.get(region.name)}
                ambassadors={ambassadors}
                onApply={onApply}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RegionRow({
  region,
  director,
  ambassadors,
  onApply,
}: {
  region: { name: string; states: string[] };
  director?: ExecutiveLeader;
  ambassadors: Map<string, ExecutiveLeader>;
  onApply: (state: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="min-w-0">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className={cn(
          "flex w-full items-center gap-4 p-4 text-left transition-all duration-200 sm:p-5 md:p-[30px]",
          "hover:bg-surface-card-hover"
        )}
      >
        {director ? (
          director.userId ? (
            <Link
              href={`/community/${director.userId}`}
              onClick={(e) => e.stopPropagation()}
              className="shrink-0 hover:opacity-80 transition-opacity"
            >
              <Avatar src={director.avatarUrl ?? undefined} name={director.name} size="md" />
            </Link>
          ) : (
            <Avatar src={director.avatarUrl ?? undefined} name={director.name} size="md" />
          )
        ) : (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-border-strong text-text-muted">
            <MapPin className="h-4 w-4" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-medium text-text-primary">{region.name}</h3>
          {director ? (
            <p className="mt-0.5 truncate text-[10px] text-text-muted">
              {director.name}
              {director.school && <> &bull; {director.school}</>}
              {director.graduation && <>&apos;{String(director.graduation).slice(2)}</>}
            </p>
          ) : (
            <p className="mt-0.5 text-[10px] italic text-text-muted">
              Regional Director — position open
            </p>
          )}
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-text-muted" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-text-muted" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-solid border-border-default">
          <div className={platformPaneStackGapClass}>
            {region.states.map((state) => {
              const ambassador = ambassadors.get(state);
              if (ambassador) {
                return (
                  <div
                    key={state}
                    className="flex items-center gap-3 bg-surface-primary px-4 py-3 transition-colors duration-200 hover:bg-surface-card-hover sm:px-5 md:px-[30px]"
                  >
                    {ambassador.userId ? (
                      <Link href={`/community/${ambassador.userId}`} className="shrink-0 hover:opacity-80 transition-opacity">
                        <Avatar src={ambassador.avatarUrl ?? undefined} name={ambassador.name} size="md" />
                      </Link>
                    ) : (
                      <Avatar src={ambassador.avatarUrl ?? undefined} name={ambassador.name} size="md" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-text-secondary">
                        {state}
                      </p>
                      <p className="mt-0.5 truncate text-[10px] text-text-muted">
                        {ambassador.name}
                        {ambassador.school && <> &bull; {ambassador.school}</>}
                        {ambassador.graduation && <>&apos;{String(ambassador.graduation).slice(2)}</>}
                      </p>
                    </div>
                  </div>
                );
              }
              return (
                <div
                  key={state}
                  className="group flex items-center gap-3 bg-surface-primary px-4 py-3 sm:px-5 md:px-[30px]"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-border-strong text-text-muted transition-colors group-hover:border-brand-500/40 group-hover:text-brand-500">
                    <Plus className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-text-secondary">
                      {state}
                    </p>
                    <p className="text-[10px] text-text-muted">Ambassador needed</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onApply(state)}
                    className="shrink-0 text-brand-500 hover:text-brand-400"
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    Apply
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function LeadershipPage() {
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [applyState, setApplyState] = useState("");
  const [applied, setApplied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [whyStatement, setWhyStatement] = useState("");
  const [leadershipExperience, setLeadershipExperience] = useState("");
  const [city, setCity] = useState("");

  const liveLeadership = useQuery(
    api.leadership.list,
    DEMO_MODE ? "skip" : {}
  );
  const leadershipData = DEMO_MODE
    ? (DEMO_LEADERSHIP as unknown as NonNullable<typeof liveLeadership>)
    : liveLeadership;
  const submitApplication = useMutation(api.leadership.submitAmbassadorApplication);

  // Build lookup maps from leadership positions
  const executives: ExecutiveLeader[] = useMemo(
    () =>
      (leadershipData?.executives ?? []).map((p) => ({
        _id: p._id,
        name: p.name,
        role: p.role,
        userId: p.userId ?? undefined,
        school: p.school ?? undefined,
        graduation: p.graduation ?? undefined,
        company: p.company ?? undefined,
        jobTitle: p.jobTitle ?? undefined,
        avatarUrl: p.avatarUrl,
      })),
    [leadershipData]
  );

  const directorsByRegion = useMemo(() => {
    const m = new Map<string, ExecutiveLeader>();
    for (const d of leadershipData?.regionalDirectors ?? []) {
      if (d.region) {
        m.set(d.region, {
          _id: d._id,
          name: d.name,
          role: d.role,
          userId: d.userId ?? undefined,
          school: d.school ?? undefined,
          graduation: d.graduation ?? undefined,
          avatarUrl: d.avatarUrl,
        });
      }
    }
    return m;
  }, [leadershipData]);

  const ambassadorsByState = useMemo(() => {
    const m = new Map<string, ExecutiveLeader>();
    for (const a of leadershipData?.ambassadors ?? []) {
      if (a.state) {
        m.set(a.state, {
          _id: a._id,
          name: a.name,
          role: a.role,
          userId: a.userId ?? undefined,
          school: a.school ?? undefined,
          graduation: a.graduation ?? undefined,
          avatarUrl: a.avatarUrl,
        });
      }
    }
    return m;
  }, [leadershipData]);

  const handleApply = (state: string) => {
    setApplyState(state);
    setApplied(false);
    setWhyStatement("");
    setLeadershipExperience("");
    setCity("");
    setApplyModalOpen(true);
  };

  const handleSubmitApplication = async () => {
    if (!whyStatement.trim() || !leadershipExperience.trim() || !city.trim()) return;
    setIsSubmitting(true);
    try {
      await submitApplication({
        state: applyState,
        whyStatement,
        leadershipExperience,
        city,
      });
      setApplied(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (leadershipData === undefined) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-circle border-2 border-brand-500 border-t-transparent" />
          <p className="text-sm text-text-secondary">Loading leadership...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-medium text-text-primary mb-4">Executive Team</h2>
        <ExecutiveTeamGrid leaders={executives} />
      </div>

      <div className="pt-[25px]">
        <h2 className="text-lg font-medium text-text-primary mb-4">Regional Directors &amp; State Ambassadors</h2>
        <RegionalDirectorsPane
          directors={directorsByRegion}
          ambassadors={ambassadorsByState}
          onApply={handleApply}
        />
      </div>

      <Modal isOpen={applyModalOpen} onClose={() => setApplyModalOpen(false)} title={applied ? "Application Submitted!" : `Apply for ${applyState} Ambassador`} size="lg">
        {applied ? (
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-2xl bg-success/10 flex items-center justify-center mx-auto mb-4"><CheckCircle className="h-8 w-8 text-success" /></div>
            <p className="text-sm text-text-secondary">Your application for <span className="font-medium text-text-primary">{applyState} Ambassador</span> has been submitted. The venture studio team will review your application and reach out during the November interview cycle.</p>
            <Button variant="brand" className="mt-6" onClick={() => setApplyModalOpen(false)}>Done</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-surface-elevated border border-border-default">
              <div className="flex items-center gap-2 text-sm"><MapPin className="h-4 w-4 text-brand-500" /><span className="font-medium text-text-primary">{applyState}</span><Badge variant="brand">Ambassador</Badge></div>
            </div>
            <p className="text-sm text-text-secondary">As a State Ambassador, you&apos;ll represent the ACU Youth Venture community in your state, recruit new members, organize local events, and serve as a liaison between your region and the leadership team.</p>
            <Textarea label="Why do you want to represent this state?" placeholder="Tell us about your connection to this state and why you'd be a great ambassador..." rows={4} required value={whyStatement} onChange={(e) => setWhyStatement(e.target.value)} />
            <Textarea label="Leadership experience" placeholder="Describe any relevant leadership, community involvement, or entrepreneurial experience..." rows={3} required value={leadershipExperience} onChange={(e) => setLeadershipExperience(e.target.value)} />
            <Input label="City / Metro Area" placeholder="e.g., Austin, Dallas, Houston" required value={city} onChange={(e) => setCity(e.target.value)} />
            <div className="p-3 rounded-lg bg-warning/5 border border-warning/10 text-xs text-text-secondary"><span className="font-medium text-warning">Note:</span> Sophomores and above are eligible for Ambassador roles. Applications are reviewed during the November interview cycle, announced in December, and new ambassadors begin their term on January 1.</div>
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-default">
              <Button variant="ghost" onClick={() => setApplyModalOpen(false)}>Cancel</Button>
              <Button variant="brand" onClick={handleSubmitApplication} isLoading={isSubmitting} leftIcon={<Send className="h-4 w-4" />}>Submit Application</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
