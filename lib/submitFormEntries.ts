import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Shape expected by your Next.js endpoint:
// { entryId: string; inputs?: Record<string, string> | null }[]
export interface FormEntryPayload {
  entryId: string;
  inputs: Record<string, string> | null;
}

// TODO: update this to your actual deployed Next.js API URL
const FORM_ENTRY_API_URL = "http://192.168.1.171:3000/api/save-form";

/**
 * Sends one or more form entry payloads to the Next.js API endpoint.
 * Includes the JWT in the Authorization header so the route can authenticate the user.
 */
export async function submitFormEntries(payload: FormEntryPayload[]) {
  const token = await AsyncStorage.getItem("authToken");

  const response = await axios.post(FORM_ENTRY_API_URL, payload, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  return response.data;
}
