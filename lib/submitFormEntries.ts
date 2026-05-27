import { apiRequest } from "./api";

// Shape expected by your Next.js endpoint:
// { entryId: string; inputs?: Record<string, string> | null }[]
export interface FormEntryPayload {
  entryId: string;
  inputs: Record<string, string> | null;
}

/**
 * Sends one or more form entry payloads to the Next.js API endpoint.
 * Includes the JWT in the Authorization header so the route can authenticate the user.
 */
export async function submitFormEntries(payload: FormEntryPayload[]) {
  const response = await apiRequest({
    method: "POST",
    url: "/api/save-form",
    data: payload,
    headers: {
      "Content-Type": "application/json",
    },
  });

  return response;
}
