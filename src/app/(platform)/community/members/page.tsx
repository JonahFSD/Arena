"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

const DEMO_MEMBERS = [
  { _id: "u1", fullName: "Alex Mi", schoolName: "Valley Christian", city: "Cupertino", state: "CA", graduationYear: 2027, bio: "Founder of Dermi AI. Computer vision for skin health.", skills: ["React", "Python", "Computer Vision"], lookingForCofounders: true, bqType: "Strategist", networkCount: 142, points: 4280, totalEarnings: 2400, avatarUrl: null, linkedinUrl: "https://linkedin.com" },
  { _id: "u2", fullName: "Yichi Zhang", schoolName: "Valley Christian", city: "Cupertino", state: "CA", graduationYear: 2028, bio: "Building Safelock. VP Ops at The Arena.", skills: ["Hardware", "Bluetooth", "Operations"], lookingForCofounders: false, bqType: "Optimizer", networkCount: 98, points: 4110, totalEarnings: 1800, avatarUrl: null, linkedinUrl: null },
  { _id: "u3", fullName: "Jonah Elliot", schoolName: "ACU", city: "Abilene", state: "TX", graduationYear: 2028, bio: "Sola founder. Christian apologetics for Gen Z.", skills: ["Theology", "Product", "Next.js"], lookingForCofounders: true, bqType: "Luminary", networkCount: 76, points: 3905, totalEarnings: 1200, avatarUrl: null, linkedinUrl: null },
  { _id: "u4", fullName: "Connor", schoolName: "ACU", city: "Abilene", state: "TX", graduationYear: 2026, bio: "AI integration consulting. Building Onion.", skills: ["AI", "Strategy", "Vibecoding"], lookingForCofounders: false, bqType: "Luminary", networkCount: 87, points: 3780, totalEarnings: 1250, avatarUrl: null, linkedinUrl: null },
  { _id: "u5", fullName: "Seowoong Park", schoolName: "Cedar Park", city: "Cedar Park", state: "TX", graduationYear: 2028, bio: "Building Milestone. Teen driver coaching app.", skills: ["iOS", "Sensors", "UX"], lookingForCofounders: true, bqType: "Optimizer", networkCount: 64, points: 3540, totalEarnings: 900, avatarUrl: null, linkedinUrl: null },
  { _id: "u6", fullName: "Toi Stepp", schoolName: "Jefferson Christian", city: "Tampa", state: "FL", graduationYear: 2027, bio: "Networker. Entrepreneurship board.", skills: ["Sales", "Community"], lookingForCofounders: false, bqType: "Strategist", networkCount: 58, points: 3200, totalEarnings: 750, avatarUrl: null, linkedinUrl: null },
  { _id: "u7", fullName: "Chelsea Gunn", schoolName: "Jefferson Christian", city: "Tampa", state: "FL", graduationYear: 2026, bio: "Chief fundraiser. Heavy Claude user.", skills: ["Fundraising", "Storytelling"], lookingForCofounders: false, bqType: "Optimizer", networkCount: 51, points: 2980, totalEarnings: 600, avatarUrl: null, linkedinUrl: null },
  { _id: "u8", fullName: "Adam Richardson", schoolName: "Jefferson Christian", city: "Tampa", state: "FL", graduationYear: 2027, bio: "Business teacher. College prep through projects.", skills: ["Curriculum", "Coaching"], lookingForCofounders: false, bqType: "Luminary", networkCount: 44, points: 2750, totalEarnings: 500, avatarUrl: null, linkedinUrl: null },
  { _id: "u9", fullName: "Jake Oswald", schoolName: "ACU", city: "Abilene", state: "TX", graduationYear: 2026, bio: "Advisor. Owns Arena / Accelerators.", skills: ["Strategy", "Advising"], lookingForCofounders: false, bqType: "Strategist", networkCount: 39, points: 2450, totalEarnings: 400, avatarUrl: null, linkedinUrl: null },
  { _id: "u10", fullName: "Lars Ostervold", schoolName: "ACU", city: "Abilene", state: "TX", graduationYear: 2027, bio: "Legal + regulatory. Lexx AI co-founder.", skills: ["Legal", "Compliance"], lookingForCofounders: true, bqType: "Luminary", networkCount: 31, points: 2100, totalEarnings: 250, avatarUrl: null, linkedinUrl: null },
];
import { PaywallGate } from "@/components/auth/paywall-gate";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { InfoCallout } from "@/components/ui/info-callout";
import { MultiSelectDropdown } from "@/components/ui/multi-select-dropdown";
import { cn } from "@/lib/utils";
import {
  platformPaneBleedClass,
  platformPaneCellPaddingClass,
  platformPaneGridCellFillClass,
} from "@/lib/platform-pane-grid";
import {
  BQ_TYPES,
  GRAD_YEARS,
  SKILLS,
  STATES,
} from "@/lib/community-filter.constants";
import { useCommunityMembersFilters } from "@/contexts/community-members-filters-context";
import { Search, Handshake, Info, Link2, MessageCircle } from "lucide-react";

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

const EDGE_PL = "pl-4 md:pl-6 lg:pl-8";
const EDGE_PR = "pr-4 md:pr-6 lg:pr-8";
const TBODY_DIVIDE = "divide-y divide-border-default/60";

export default function MembersPage() {
  const liveMembers = useQuery(
    api.users.listMembers,
    DEMO_MODE ? "skip" : {}
  );
  const rawMembers = DEMO_MODE
    ? (DEMO_MEMBERS as unknown as NonNullable<typeof liveMembers>)
    : liveMembers;
  const router = useRouter();

  const {
    search,
    showFilters,
    networkView,
    showCoFoundersOnly,
    filterSkills,
    setFilterSkills,
    filterBQTypes,
    setFilterBQTypes,
    filterStates,
    setFilterStates,
    filterGradYears,
    setFilterGradYears,
    filterMinScore,
    setFilterMinScore,
    filterMaxScore,
    setFilterMaxScore,
    filterMinPoints,
    setFilterMinPoints,
    filterMaxPoints,
    setFilterMaxPoints,
    filterMinMemberMonths,
    setFilterMinMemberMonths,
    filterMaxMemberMonths,
    setFilterMaxMemberMonths,
    setNetworkView,
    setShowCoFoundersOnly,
    activeFilterCount,
  } = useCommunityMembersFilters();

  const members = (rawMembers ?? []).map((m) => ({
    id: m._id,
    name: m.fullName,
    school: m.schoolName ?? "",
    city: m.city ?? "",
    state: m.state ?? "",
    gradYear: m.graduationYear ?? 0,
    bio: m.bio ?? "",
    skills: m.skills ?? [],
    looking_for_cofounders: m.lookingForCofounders,
    avgScore: 0,
    bqType: m.bqType ?? "",
    networkCount: m.networkCount ?? 0,
    points: m.points ?? 0,
    totalEarnings: m.totalEarnings ?? 0,
    monthsAsMember: 0,
    isInNetwork: false,
    avatarUrl: m.avatarUrl ?? null,
    linkedinUrl: m.linkedinUrl ?? null,
  }));

  const networkMembers = useMemo(
    () => members.filter((m) => m.isInNetwork),
    [members]
  );

  const filtered = useMemo(() => {
    const base = networkView === "network" ? networkMembers : members;
    return base.filter((m) => {
      if (showCoFoundersOnly && !m.looking_for_cofounders) return false;
      if (search && !m.name.toLowerCase().includes(search.toLowerCase()))
        return false;
      if (
        filterSkills.length > 0 &&
        !filterSkills.some((s) => m.skills.includes(s))
      )
        return false;
      if (filterBQTypes.length > 0 && !filterBQTypes.includes(m.bqType))
        return false;
      if (filterStates.length > 0 && !filterStates.includes(m.state))
        return false;
      if (
        filterGradYears.length > 0 &&
        !filterGradYears.includes(String(m.gradYear))
      )
        return false;
      if (filterMinScore && (m.avgScore || 0) < Number(filterMinScore))
        return false;
      if (filterMaxScore && (m.avgScore || 0) > Number(filterMaxScore))
        return false;
      if (filterMinPoints && m.points < Number(filterMinPoints)) return false;
      if (filterMaxPoints && m.points > Number(filterMaxPoints)) return false;
      if (
        filterMinMemberMonths &&
        m.monthsAsMember < Number(filterMinMemberMonths)
      )
        return false;
      if (
        filterMaxMemberMonths &&
        m.monthsAsMember > Number(filterMaxMemberMonths)
      )
        return false;
      return true;
    });
  }, [
    members,
    networkMembers,
    networkView,
    search,
    showCoFoundersOnly,
    filterSkills,
    filterBQTypes,
    filterStates,
    filterGradYears,
    filterMinScore,
    filterMaxScore,
    filterMinPoints,
    filterMaxPoints,
    filterMinMemberMonths,
    filterMaxMemberMonths,
  ]);

  if (rawMembers === undefined) {
    return (
      <div
        className={cn("overflow-hidden rounded-none", platformPaneBleedClass)}
      >
        <div className="-mx-4 flex items-center justify-center py-16 text-text-muted md:-mx-6 lg:-mx-8">
          Loading members...
        </div>
      </div>
    );
  }

  return (
    <PaywallGate>
    <div className="space-y-6">
      {networkView === "network" && (
        <InfoCallout>
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-text-tertiary flex-shrink-0 mt-0.5" />
            <p className="text-sm text-text-secondary">
              When you and another member have each exchanged at least{" "}
              <strong className="text-text-primary">10 DMs</strong>, you&apos;re
              automatically added to each other&apos;s network. Each new
              connection earns you{" "}
              <strong className="text-text-primary">50 points</strong>.
            </p>
          </div>
        </InfoCallout>
      )}

      {showFilters ? (
        <Card className="animate-slide-down">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            <MultiSelectDropdown
              label="Skill"
              options={SKILLS}
              value={filterSkills}
              onChange={setFilterSkills}
              emptyLabel="All skills"
            />
            <MultiSelectDropdown
              label="BQ Type"
              options={BQ_TYPES}
              value={filterBQTypes}
              onChange={setFilterBQTypes}
              emptyLabel="All types"
            />
            <MultiSelectDropdown
              label="State"
              options={STATES}
              value={filterStates}
              onChange={setFilterStates}
              emptyLabel="All states"
            />
            <MultiSelectDropdown
              label="Grad Year"
              options={GRAD_YEARS.map(String)}
              value={filterGradYears}
              onChange={setFilterGradYears}
              emptyLabel="All years"
            />

            <div className="flex flex-col">
              <label className="mb-1 block text-xs font-medium text-text-muted">
                Points
              </label>
              <div className="flex gap-1.5">
                <input
                  type="number"
                  min="0"
                  placeholder="Min"
                  value={filterMinPoints}
                  onChange={(e) => setFilterMinPoints(e.target.value)}
                  className="h-9 w-full rounded-lg border border-border-default bg-surface-elevated px-2 text-sm text-text-primary placeholder:text-text-primary"
                />
                <input
                  type="number"
                  min="0"
                  placeholder="Max"
                  value={filterMaxPoints}
                  onChange={(e) => setFilterMaxPoints(e.target.value)}
                  className="h-9 w-full rounded-lg border border-border-default bg-surface-elevated px-2 text-sm text-text-primary placeholder:text-text-primary"
                />
              </div>
            </div>

            <div className="flex flex-col">
              <label className="mb-1 block text-xs font-medium text-text-muted">
                Avg AI Score
              </label>
              <div className="flex gap-1.5">
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="Min"
                  value={filterMinScore}
                  onChange={(e) => setFilterMinScore(e.target.value)}
                  className="h-9 w-full rounded-lg border border-border-default bg-surface-elevated px-2 text-sm text-text-primary placeholder:text-text-primary"
                />
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="Max"
                  value={filterMaxScore}
                  onChange={(e) => setFilterMaxScore(e.target.value)}
                  className="h-9 w-full rounded-lg border border-border-default bg-surface-elevated px-2 text-sm text-text-primary placeholder:text-text-primary"
                />
              </div>
            </div>

            <div className="flex flex-col">
              <label className="mb-1 block text-xs font-medium text-text-muted">
                Months on Platform
              </label>
              <div className="flex gap-1.5">
                <input
                  type="number"
                  min="0"
                  placeholder="Min"
                  value={filterMinMemberMonths}
                  onChange={(e) => setFilterMinMemberMonths(e.target.value)}
                  className="h-9 w-full rounded-lg border border-border-default bg-surface-elevated px-2 text-sm text-text-primary placeholder:text-text-primary"
                />
                <input
                  type="number"
                  min="0"
                  placeholder="Max"
                  value={filterMaxMemberMonths}
                  onChange={(e) => setFilterMaxMemberMonths(e.target.value)}
                  className="h-9 w-full rounded-lg border border-border-default bg-surface-elevated px-2 text-sm text-text-primary placeholder:text-text-primary"
                />
              </div>
            </div>

            <div className="flex flex-row flex-wrap items-end gap-4 sm:gap-6">
              <div className="flex flex-col">
                <span className="mb-1 block text-xs font-medium text-text-muted">
                  My network only
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={networkView === "network"}
                  aria-label="Show only members in my network"
                  onClick={() =>
                    setNetworkView(
                      networkView === "network" ? "all" : "network"
                    )
                  }
                  title={
                    networkView === "network"
                      ? "Showing only your network"
                      : "Show all members"
                  }
                  className={cn(
                    "relative h-9 w-[3.75rem] shrink-0 rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40",
                    networkView === "network"
                      ? "border-brand-500 bg-brand-500/15"
                      : "border-border-default bg-surface-elevated"
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none absolute left-0.5 top-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-surface-card shadow-sm transition-transform duration-200",
                      networkView === "network"
                        ? "translate-x-7 text-brand-500"
                        : "translate-x-0 text-white"
                    )}
                  >
                    <Link2 className="h-4 w-4" aria-hidden />
                  </span>
                </button>
              </div>
              <div className="flex flex-col">
                <span className="mb-1 block text-xs font-medium text-text-muted">
                  Open to cofounders
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={showCoFoundersOnly}
                  aria-label="Open to cofounders"
                  onClick={() =>
                    setShowCoFoundersOnly(!showCoFoundersOnly)
                  }
                  className={cn(
                    "relative h-9 w-[3.75rem] shrink-0 rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40",
                    showCoFoundersOnly
                      ? "border-brand-500 bg-brand-500/15"
                      : "border-border-default bg-surface-elevated"
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none absolute left-0.5 top-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-surface-card shadow-sm transition-transform duration-200",
                      showCoFoundersOnly
                        ? "translate-x-7 text-brand-500"
                        : "translate-x-0 text-white"
                    )}
                  >
                    <Handshake className="h-4 w-4" aria-hidden />
                  </span>
                </button>
              </div>
            </div>
          </div>
        </Card>
      ) : null}

      <div
        className={cn(
          "min-w-0 max-w-none overflow-hidden rounded-none",
          "-mx-4 md:-mx-6 lg:-mx-8"
        )}
      >
        {filtered.length === 0 ? (
          <div
            className={cn(
              platformPaneCellPaddingClass,
              platformPaneGridCellFillClass,
              "py-12 text-center"
            )}
          >
            <Search className="h-10 w-10 text-text-muted mx-auto mb-3" />
            <p className="text-sm text-text-secondary">
              {search || activeFilterCount > 0
                ? "No members match your search and filters."
                : networkView === "network"
                  ? "No one in your network yet. Exchange 10+ DMs with a member to connect."
                  : "No members found."}
            </p>
          </div>
        ) : (
          <div className="min-w-0 w-full overflow-x-auto lg:overflow-x-visible">
            <table className="w-full min-w-full border-collapse">
              <thead>
                <tr className="border-b border-border-default">
                  <th
                    className={cn(
                      "whitespace-nowrap py-3 pr-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted",
                      EDGE_PL
                    )}
                  >
                    Member
                  </th>
                  <th className="w-[88px] whitespace-nowrap px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">
                    Grad Year
                  </th>
                  <th className="hidden w-[60px] whitespace-nowrap px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted sm:table-cell">
                    State
                  </th>
                  <th className="hidden px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted md:table-cell">
                    School
                  </th>
                  <th className="w-[80px] px-3 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">
                    Points
                  </th>
                  <th className="hidden w-[80px] px-3 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted sm:table-cell">
                    Earned
                  </th>
                  <th className="hidden w-[100px] px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted lg:table-cell">
                    BQ
                  </th>
                  <th className="hidden w-[70px] px-3 py-3 text-center text-xs font-medium uppercase tracking-wider text-text-muted lg:table-cell">
                    Network
                  </th>
                  <th
                    className={cn(
                      "w-[140px] py-3 pl-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted",
                      EDGE_PR
                    )}
                  >
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className={TBODY_DIVIDE}>
                {filtered.map((member) => (
                  <tr
                    key={member.id as string}
                    className="transition-colors hover:bg-surface-card-hover"
                  >
                    <td className={cn("whitespace-nowrap py-4 pr-3", EDGE_PL)}>
                      <Link href={`/community/${member.id}`}>
                        <div className="flex items-center gap-3">
                          <Avatar src={member.avatarUrl} name={member.name} size="sm" />
                          <span className="text-sm font-medium text-text-primary hover:text-text-primary transition-colors">
                            {member.name}
                          </span>
                        </div>
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4">
                      <span className="text-sm font-mono text-text-secondary tabular-nums">
                        {member.gradYear > 0 ? member.gradYear : "-"}
                      </span>
                    </td>
                    <td className="hidden whitespace-nowrap px-3 py-4 text-sm text-text-secondary sm:table-cell">
                      {member.state || "-"}
                    </td>
                    <td className="hidden truncate px-3 py-4 text-sm text-text-secondary md:table-cell max-w-[200px]">
                      {member.school || "-"}
                    </td>
                    <td className="px-3 py-4 text-right">
                      <span className="text-sm font-mono font-medium text-text-primary tabular-nums">
                        {member.points.toLocaleString()}
                      </span>
                    </td>
                    <td className="hidden px-3 py-4 text-right text-sm font-medium text-text-primary sm:table-cell">
                      {member.totalEarnings > 0
                        ? `$${(member.totalEarnings / 100).toLocaleString()}`
                        : "-"}
                    </td>
                    <td className="hidden px-3 py-4 text-sm text-text-secondary lg:table-cell">
                      {member.bqType || "-"}
                    </td>
                    <td className="hidden px-3 py-4 text-center text-sm text-text-secondary lg:table-cell">
                      {member.networkCount}
                    </td>
                    <td
                      className={cn(
                        "py-4 pl-3",
                        EDGE_PR
                      )}
                    >
                      <div className="flex items-center justify-end gap-2">
                        {member.looking_for_cofounders && (
                          <span
                            className="text-yellow-500"
                            aria-label="Open to co-founders"
                            title="Open to co-founders"
                          >
                            <Handshake className="h-4 w-4" />
                          </span>
                        )}
                        {member.isInNetwork && (
                          <span
                            className="text-yellow-500"
                            aria-label="In your network"
                            title="In your network"
                          >
                            <Link2 className="h-4 w-4" />
                          </span>
                        )}
                        {member.linkedinUrl && (
                          <a
                            href={member.linkedinUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-text-primary hover:text-text-primary transition-colors"
                            aria-label={`${member.name} on LinkedIn`}
                            title="LinkedIn profile"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <LinkedInIcon className="h-4 w-4" />
                          </a>
                        )}
                        <button
                          type="button"
                          className="text-text-primary hover:text-text-primary transition-colors"
                          aria-label={`Message ${member.name}`}
                          title="Send message"
                          onClick={(e) => {
                            e.preventDefault();
                            router.push(`/community/messages?to=${member.id}`);
                          }}
                        >
                          <MessageCircle className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
    </PaywallGate>
  );
}
