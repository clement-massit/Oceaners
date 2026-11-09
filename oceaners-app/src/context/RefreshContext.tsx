import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
} from "react";

type RefreshContextType = {
  refreshKey: number;
  refreshAll: () => void;
};

const RefreshContext = createContext<RefreshContextType | undefined>(undefined);

export function RefreshProvider({ children }: { children: ReactNode }) {
  const [refreshKey, setRefreshKey] = useState(0);

  const refreshAll = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  return (
    <RefreshContext.Provider value={{ refreshKey, refreshAll }}>
      {children}
    </RefreshContext.Provider>
  );
}

export function useGlobalRefresh() {
  const ctx = useContext(RefreshContext);
  if (!ctx)
    throw new Error("useGlobalRefresh doit être utilisé dans RefreshProvider");
  return ctx;
}
