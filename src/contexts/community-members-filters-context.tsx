"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

type NetworkView = "all" | "network";

export type CommunityMembersFiltersContextValue = {
  search: string;
  setSearch: (v: string) => void;
  showFilters: boolean;
  setShowFilters: (v: boolean) => void;
  toggleFilters: () => void;
  networkView: NetworkView;
  setNetworkView: (v: NetworkView) => void;
  showCoFoundersOnly: boolean;
  setShowCoFoundersOnly: Dispatch<SetStateAction<boolean>>;
  filterSkills: string[];
  setFilterSkills: (v: string[]) => void;
  filterBQTypes: string[];
  setFilterBQTypes: (v: string[]) => void;
  filterStates: string[];
  setFilterStates: (v: string[]) => void;
  filterGradYears: string[];
  setFilterGradYears: (v: string[]) => void;
  filterMinScore: string;
  setFilterMinScore: (v: string) => void;
  filterMaxScore: string;
  setFilterMaxScore: (v: string) => void;
  filterMinPoints: string;
  setFilterMinPoints: (v: string) => void;
  filterMaxPoints: string;
  setFilterMaxPoints: (v: string) => void;
  filterMinMemberMonths: string;
  setFilterMinMemberMonths: (v: string) => void;
  filterMaxMemberMonths: string;
  setFilterMaxMemberMonths: (v: string) => void;
  clearFilters: () => void;
  activeFilterCount: number;
};

const CommunityMembersFiltersContext =
  createContext<CommunityMembersFiltersContextValue | null>(null);

export function CommunityMembersFiltersProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [networkView, setNetworkView] = useState<NetworkView>("all");
  const [showCoFoundersOnly, setShowCoFoundersOnly] = useState(false);
  const [filterSkills, setFilterSkills] = useState<string[]>([]);
  const [filterBQTypes, setFilterBQTypes] = useState<string[]>([]);
  const [filterStates, setFilterStates] = useState<string[]>([]);
  const [filterGradYears, setFilterGradYears] = useState<string[]>([]);
  const [filterMinScore, setFilterMinScore] = useState("");
  const [filterMaxScore, setFilterMaxScore] = useState("");
  const [filterMinPoints, setFilterMinPoints] = useState("");
  const [filterMaxPoints, setFilterMaxPoints] = useState("");
  const [filterMinMemberMonths, setFilterMinMemberMonths] = useState("");
  const [filterMaxMemberMonths, setFilterMaxMemberMonths] = useState("");

  const activeFilterCount = useMemo(() => {
    return (
      filterSkills.length +
      filterBQTypes.length +
      filterStates.length +
      filterGradYears.length +
      (filterMinScore ? 1 : 0) +
      (filterMaxScore ? 1 : 0) +
      (filterMinPoints ? 1 : 0) +
      (filterMaxPoints ? 1 : 0) +
      (filterMinMemberMonths ? 1 : 0) +
      (filterMaxMemberMonths ? 1 : 0) +
      (showCoFoundersOnly ? 1 : 0) +
      (networkView === "network" ? 1 : 0)
    );
  }, [
    filterSkills.length,
    filterBQTypes.length,
    filterStates.length,
    filterGradYears.length,
    filterMinScore,
    filterMaxScore,
    filterMinPoints,
    filterMaxPoints,
    filterMinMemberMonths,
    filterMaxMemberMonths,
    showCoFoundersOnly,
    networkView,
  ]);

  const clearFilters = useCallback(() => {
    setFilterSkills([]);
    setFilterBQTypes([]);
    setFilterStates([]);
    setFilterGradYears([]);
    setFilterMinScore("");
    setFilterMaxScore("");
    setFilterMinPoints("");
    setFilterMaxPoints("");
    setFilterMinMemberMonths("");
    setFilterMaxMemberMonths("");
    setShowCoFoundersOnly(false);
    setNetworkView("all");
  }, []);

  const toggleFilters = useCallback(() => {
    setShowFilters((v) => !v);
  }, []);

  const value = useMemo(
    (): CommunityMembersFiltersContextValue => ({
      search,
      setSearch,
      showFilters,
      setShowFilters,
      toggleFilters,
      networkView,
      setNetworkView,
      showCoFoundersOnly,
      setShowCoFoundersOnly,
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
      clearFilters,
      activeFilterCount,
    }),
    [
      search,
      showFilters,
      toggleFilters,
      networkView,
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
      clearFilters,
      activeFilterCount,
    ]
  );

  return (
    <CommunityMembersFiltersContext.Provider value={value}>
      {children}
    </CommunityMembersFiltersContext.Provider>
  );
}

export function useCommunityMembersFilters(): CommunityMembersFiltersContextValue {
  const ctx = useContext(CommunityMembersFiltersContext);
  if (!ctx) {
    throw new Error(
      "useCommunityMembersFilters must be used within CommunityMembersFiltersProvider"
    );
  }
  return ctx;
}
