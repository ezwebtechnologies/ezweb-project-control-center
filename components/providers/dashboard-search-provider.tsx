"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";

type DashboardSearchContextValue = {
  query: string;
  setQuery: (q: string) => void;
};

const DashboardSearchContext = createContext<DashboardSearchContextValue | null>(null);

export function DashboardSearchProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [query, setQueryState] = useState("");
  const setQuery = useCallback((q: string) => {
    setQueryState(q);
  }, []);

  useEffect(() => {
    setQueryState("");
  }, [pathname]);

  const value = useMemo(() => ({ query, setQuery }), [query, setQuery]);

  return (
    <DashboardSearchContext.Provider value={value}>{children}</DashboardSearchContext.Provider>
  );
}

export function useDashboardSearch() {
  const ctx = useContext(DashboardSearchContext);
  if (!ctx) {
    throw new Error("useDashboardSearch must be used within DashboardSearchProvider");
  }
  return ctx;
}
