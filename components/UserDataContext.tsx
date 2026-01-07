// UserDataContext.tsx
import React, { createContext, useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import { UserData, UserDataContextType } from "../types/types";
import { fetchForms } from "../lib/fetchForms";

const UserDataContext = createContext<UserDataContextType | undefined>(undefined);

export const UserDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data, isLoading, refetch, dataUpdatedAt, isError, } = useQuery<UserData>({
    queryKey: ["forms"],
    queryFn: fetchForms,
  });

  // Wrap refetch so it matches the `() => Promise<void>` signature in the context type
  const refresh = async () => {
    await refetch();
  };

  return (
    <UserDataContext.Provider
      value={{
        data: data ?? null,
        loading: isLoading,
        refresh,
        error: isError,
        lastUpdated: dataUpdatedAt || null,
      }}
    >
      {children}
    </UserDataContext.Provider>
  );
};

// Hook for easy access
export const useUserData = () => {
  const context = useContext(UserDataContext);
  if (!context) throw new Error("useUserData must be used within UserDataProvider");
  return context;
};
