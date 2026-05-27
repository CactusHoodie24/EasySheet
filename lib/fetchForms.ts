import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { UserData, ProfileFormData } from "../types/types";
import { apiRequest, logoutUser } from "./api";

const CACHE_KEY = "cachedUserData";
const PROFILE_CACHE_KEY = "cachedUserProfile";

const isSessionExpiredError = (err: unknown) => {
  if (err instanceof Error && err.message === "SESSION_EXPIRED") {
    return true;
  }

  if (!axios.isAxiosError(err)) {
    return false;
  }

  const status = err.response?.status;
  const code = err.response?.data?.code;

  return (
    status === 401 ||
    status === 403 ||
    code === "SESSION_EXPIRED" ||
    code === "TOKEN_EXPIRED" ||
    code === "ACCESS_TOKEN_EXPIRED"
  );
};

export const fetchForms = async (): Promise<{ forms: UserData; profile: ProfileFormData | null }> => {
  try {
    const formsRes = await apiRequest<{
      success: boolean;
      data?: UserData;
      code?: string;
      message?: string;
    }>({
      url: "/api/get-forms",
    });

    if (!formsRes.success || !formsRes.data) {
      console.error("[fetchForms] fetch forms failed:", formsRes);
      throw new Error(formsRes.code || "FETCH_FAILED");
    }

    const formsData = formsRes.data;
    console.log("[fetchForms] saving forms to cache...");
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(formsData));

    let profileData: ProfileFormData | null = null;
    try {
      const profileRes = await apiRequest<{
        success: boolean;
        data?: ProfileFormData;
        code?: string;
        message?: string;
      }>({
        url: "/api/profile",
      });

      if (profileRes.success && profileRes.data) {
        profileData = profileRes.data;
        console.log("[fetchForms] saving profile to cache...");
        await AsyncStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profileData));
      } else {
        console.warn("[fetchForms] no profile data -> profile incomplete");
        throw new Error("PROFILE_INCOMPLETE");
      }
    } catch (err) {
      console.warn("[fetchForms] profile fetch error", err);

      if (isSessionExpiredError(err)) {
        throw new Error("SESSION_EXPIRED");
      }

      throw new Error("PROFILE_INCOMPLETE");
    }

    return { forms: formsData, profile: profileData };
  } catch (err) {
    console.error("[fetchForms] error caught:", err);

    if (isSessionExpiredError(err)) {
      console.warn("[fetchForms] session expired, clearing storage");
      await logoutUser();
      throw new Error("SESSION_EXPIRED");
    }

    if (
      err instanceof Error &&
      err.message !== "NO_AUTH_TOKEN" &&
      err.message !== "SESSION_EXPIRED" &&
      err.message !== "PROFILE_INCOMPLETE"
    ) {
      const cachedForms = await AsyncStorage.getItem(CACHE_KEY);
      const cachedProfile = await AsyncStorage.getItem(PROFILE_CACHE_KEY);

      if (cachedForms) {
        console.warn("[fetchForms] using cached data due to fetch error", err);
        return {
          forms: JSON.parse(cachedForms) as UserData,
          profile: cachedProfile ? (JSON.parse(cachedProfile) as ProfileFormData) : null,
        };
      }
    }

    throw err;
  }
};

