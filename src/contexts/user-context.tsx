"use client";

import { createContext, useContext, ReactNode } from "react";
import { Doc } from "../../convex/_generated/dataModel";

type UserContextValue = {
  user: Doc<"users"> | null;
};

const UserContext = createContext<UserContextValue>({ user: null });

export function UserProvider({
  user,
  children,
}: {
  user: Doc<"users"> | null;
  children: ReactNode;
}) {
  return (
    <UserContext.Provider value={{ user }}>{children}</UserContext.Provider>
  );
}

/**
 * Access the currently authenticated user document.
 * Returns null if not yet loaded or not authenticated.
 */
export function useCurrentUser() {
  return useContext(UserContext).user;
}
