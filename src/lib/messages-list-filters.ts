import type { ReadonlyURLSearchParams } from "next/navigation";

export type MessagesSort =
  | "activity"
  | "unread"
  | "sent"
  | "received";

export type MessagesThreadForFilters = {
  threadId: string;
  unreadCount: number;
  lastSentAt: number;
  lastReceivedAt: number;
  lastMessage: { body: string; _creationTime: number };
  otherUser: {
    fullName?: string;
    lookingForCofounders: boolean;
    networkCount: number;
  } | null;
};

export function parseMessagesSearchFromSearch(
  searchParams: ReadonlyURLSearchParams
): string {
  return (searchParams.get("q") ?? "").trim();
}

export function parseMessagesSortFromSearch(
  searchParams: ReadonlyURLSearchParams
): MessagesSort {
  const raw = searchParams.get("sort");
  if (
    raw === "unread" ||
    raw === "sent" ||
    raw === "received" ||
    raw === "activity"
  ) {
    return raw;
  }
  return "activity";
}

export function parseMessagesCofoundersOnly(
  searchParams: ReadonlyURLSearchParams
): boolean {
  return searchParams.get("cofounders") === "1";
}

export function parseMessagesNetworkOnly(
  searchParams: ReadonlyURLSearchParams
): boolean {
  return searchParams.get("network") === "1";
}

export function filterMessagesThreadsBySearch<T extends MessagesThreadForFilters>(
  threads: T[],
  q: string
): T[] {
  const needle = q.trim().toLowerCase();
  if (!needle) return threads;
  return threads.filter((t) => {
    const name = (t.otherUser?.fullName ?? "").toLowerCase();
    const preview = (t.lastMessage?.body ?? "").toLowerCase();
    return name.includes(needle) || preview.includes(needle);
  });
}

export function filterMessagesThreadsByToggles<T extends MessagesThreadForFilters>(
  threads: T[],
  cofoundersOnly: boolean,
  networkOnly: boolean
): T[] {
  let out = threads;
  if (cofoundersOnly) {
    out = out.filter((t) => t.otherUser?.lookingForCofounders === true);
  }
  if (networkOnly) {
    out = out.filter((t) => (t.otherUser?.networkCount ?? 0) > 0);
  }
  return out;
}

function sortKey(t: MessagesThreadForFilters, sort: MessagesSort): number {
  switch (sort) {
    case "activity":
      return t.lastMessage._creationTime;
    case "unread":
      // Unread sort is handled specially in sortThreads before sortKey is called.
      return t.lastMessage._creationTime;
    case "sent":
      return t.lastSentAt;
    case "received":
      return t.lastReceivedAt;
  }
}

export function sortMessagesThreads<T extends MessagesThreadForFilters>(
  threads: T[],
  sort: MessagesSort
): T[] {
  const copy = [...threads];
  if (sort === "unread") {
    copy.sort((a, b) => {
      const ua = a.unreadCount > 0 ? 1 : 0;
      const ub = b.unreadCount > 0 ? 1 : 0;
      if (ua !== ub) return ub - ua;
      return b.lastMessage._creationTime - a.lastMessage._creationTime;
    });
    return copy;
  }
  copy.sort(
    (a, b) => sortKey(b, sort) - sortKey(a, sort)
  );
  return copy;
}

export function messagesFilterSummary(
  sort: MessagesSort,
  cofoundersOnly: boolean,
  networkOnly: boolean
): string | null {
  const parts: string[] = [];
  if (sort !== "activity") {
    if (sort === "unread") parts.push("Unread");
    else if (sort === "sent") parts.push("Sent");
    else if (sort === "received") parts.push("Received");
  }
  if (cofoundersOnly) parts.push("Cofounders");
  if (networkOnly) parts.push("Network");
  if (parts.length === 0) return null;
  return parts.join(" · ");
}
