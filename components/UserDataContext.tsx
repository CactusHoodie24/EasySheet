// UserDataContext.tsx
import React, { createContext, useContext } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { UserData, ProfileFormData, UserDataContextType } from "../types/types";
import { fetchForms } from "../lib/fetchForms";

// Extend your context type to include profile
interface ExtendedUserDataContextType extends UserDataContextType {
  profile: ProfileFormData | null;
  errorCode?: string | null;
}

const UserDataContext = createContext<ExtendedUserDataContextType | undefined>(undefined);

export const UserDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient(); // ✅ React Query client
  const { data, isLoading, refetch, dataUpdatedAt, isError, error } = useQuery<{
    forms: UserData;
    profile: ProfileFormData | null;
  }, Error>({
    queryKey: ["forms"],
    queryFn: fetchForms,
    retry: false,
  });

  // Wrap refetch so it matches () => Promise<void>
  const refresh = async () => {
    await refetch();
  };

  const clearData = async () => {
  await queryClient.removeQueries({ queryKey: ["forms"] }); // ✅ fix TS error
};


  // Provide both generic error flag AND code
  const errorCode = error?.message || null;

  return (
    <UserDataContext.Provider
      value={{
        data: data?.forms ?? null,
        profile: data?.profile ?? null,
        loading: isLoading,
        refresh,
        error: isError,
        errorCode,
        lastUpdated: dataUpdatedAt || null,
        clearData,
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
