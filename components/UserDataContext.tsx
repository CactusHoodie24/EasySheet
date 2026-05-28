// UserDataContext.tsx
import React, { createContext, useContext } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { UserData, ProfileFormData, UserDataContextType } from "../types/types";
import { fetchForms } from "../lib/fetchForms";

interface ExtendedUserDataContextType extends UserDataContextType {
  profile: ProfileFormData | null;
  errorCode?: string | null;
}

const UserDataContext = createContext<ExtendedUserDataContextType | undefined>(undefined);

export const UserDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const [hasAuthToken, setHasAuthToken] = React.useState(false);
  const [checkingAuth, setCheckingAuth] = React.useState(true);

  React.useEffect(() => {
    const checkToken = async () => {
      const token = await AsyncStorage.getItem("authToken");
      setHasAuthToken(Boolean(token));
      setCheckingAuth(false);
    };

    checkToken();
  }, []);

  const { data, isLoading, refetch, dataUpdatedAt, isError, error } = useQuery<{
    forms: UserData;
    profile: ProfileFormData | null;
  }, Error>({
    queryKey: ["forms"],
    queryFn: fetchForms,
    retry: false,
    enabled: hasAuthToken,
  });

  const refresh = async () => {
    const token = await AsyncStorage.getItem("authToken");
    setHasAuthToken(Boolean(token));

    if (token) {
      await refetch();
    }
  };

  const clearData = async () => {
    await queryClient.removeQueries({ queryKey: ["forms"] });
  };

  const errorCode = hasAuthToken ? error?.message || null : null;

  return (
    <UserDataContext.Provider
      value={{
        data: data?.forms ?? null,
        profile: data?.profile ?? null,
        loading: checkingAuth || isLoading,
        refresh,
        error: hasAuthToken && isError,
        errorCode,
        lastUpdated: dataUpdatedAt || null,
        clearData,
      }}
    >
      {children}
    </UserDataContext.Provider>
  );
};

export const useUserData = () => {
  const context = useContext(UserDataContext);
  if (!context) throw new Error("useUserData must be used within UserDataProvider");
  return context;
};
