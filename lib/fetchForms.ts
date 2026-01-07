import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { UserData } from "../types/types";

const CACHE_KEY = "cachedUserData";

/**
 * Fetches all forms and related dashboard data for the current user.
 * - On success: returns fresh data and saves it to AsyncStorage.
 * - On network / server error: falls back to the last cached data (if any),
 *   so the app still works offline and across restarts.
 *
 * This function is designed to be used as a TanStack Query `queryFn`.
 */
export const fetchForms = async (): Promise<UserData> => {
  const token = await AsyncStorage.getItem("authToken");
  if (!token) {
    throw new Error("No auth token");
  }

  const cached = await AsyncStorage.getItem(CACHE_KEY);

  try {
    const res = await axios.get<{ success: boolean; data: UserData }>(
      "http://192.168.1.171:3000/api/get-forms",
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!res.data.success) {
      throw new Error("Failed to fetch user data");
    }

    const data = res.data.data;

    // Persist latest successful result for offline use & faster cold starts
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data));

    return data;
  } catch (error) {
    // If we have cached data, use it as a graceful offline fallback
    if (cached) {
      console.warn("fetchForms: using cached data due to fetch error", error);
      return JSON.parse(cached) as UserData;
    }

    // No cache available – rethrow so React Query can surface the error
    throw error;
  }
};
