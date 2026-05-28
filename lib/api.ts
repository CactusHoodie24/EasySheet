import axios, { isAxiosError } from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { AxiosError, AxiosRequestConfig, Method } from "axios";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
const REFRESH_TOKEN_PATH = process.env.EXPO_PUBLIC_REFRESH_TOKEN_PATH ?? "/api/refresh";

const AUTH_TOKEN_KEY = "authToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const CACHE_KEYS = ["cachedUserData", "cachedUserProfile"];
const sessionExpiredHandlers = new Set<() => void>();

if (!API_BASE_URL) {
  throw new Error("Missing EXPO_PUBLIC_API_BASE_URL in frontend/easysheet/.env");
}

export const api = axios.create({
  baseURL: API_BASE_URL,
});

type ApiRequestOptions<TData = unknown> = {
  method?: Method;
  url: string;
  data?: TData;
  params?: AxiosRequestConfig["params"];
  headers?: AxiosRequestConfig["headers"];
  auth?: boolean;
};

type TokenResponse = {
  token?: string;
  accessToken?: string;
  authToken?: string;
  idToken?: string;
  customToken?: string;
  refreshToken?: string;
  refresh_token?: string;
  data?: TokenResponse;
  user?: TokenResponse;
  session?: TokenResponse;
};

let refreshPromise: Promise<string> | null = null;

const getAccessToken = (response?: TokenResponse): string | undefined => {
  if (!response) return undefined;

  return (
    response.idToken ??
    response.accessToken ??
    response.token ??
    response.authToken ??
    response.customToken ??
    getAccessToken(response.data) ??
    getAccessToken(response.session) ??
    getAccessToken(response.user)
  );
};

const getRefreshToken = (response?: TokenResponse): string | undefined => {
  if (!response) return undefined;

  return (
    response.refreshToken ??
    response.refresh_token ??
    getRefreshToken(response.data) ??
    getRefreshToken(response.session) ??
    getRefreshToken(response.user)
  );
};

const getTokenDebugInfo = (token: string | null) => ({
  hasToken: Boolean(token),
  tokenLength: token?.length ?? 0,
  jwtParts: token?.split(".").length ?? 0,
});

const isAuthExpiredError = (error: unknown) => {
  if (!isAxiosError(error)) return false;

  const code = error.response?.data?.code;
  const message = error.response?.data?.message;

  return (
    code === "SESSION_EXPIRED" ||
    code === "TOKEN_EXPIRED" ||
    code === "ACCESS_TOKEN_EXPIRED" ||
    (typeof message === "string" && message.toLowerCase().includes("expired"))
  );
};

export const logoutUser = async () => {
  await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, REFRESH_TOKEN_KEY, ...CACHE_KEYS]);
};

export const onSessionExpired = (handler: () => void) => {
  sessionExpiredHandlers.add(handler);
  return () => {
    sessionExpiredHandlers.delete(handler);
  };
};

const notifySessionExpired = () => {
  sessionExpiredHandlers.forEach((handler) => handler());
};

export const saveAuthTokens = async (tokens: TokenResponse) => {
  const accessToken = getAccessToken(tokens);
  const refreshToken = getRefreshToken(tokens);

  if (!accessToken) {
    console.error("[auth] Login response did not include a recognized access token", {
      topLevelKeys: Object.keys(tokens ?? {}),
      dataKeys: tokens.data ? Object.keys(tokens.data) : [],
      sessionKeys: tokens.session ? Object.keys(tokens.session) : [],
      userKeys: tokens.user ? Object.keys(tokens.user) : [],
    });
    throw new Error("NO_AUTH_TOKEN");
  }

  console.log("[auth] saving access token", getTokenDebugInfo(accessToken));
  await AsyncStorage.setItem(AUTH_TOKEN_KEY, accessToken);

  if (refreshToken) {
    console.log("[auth] saving refresh token", getTokenDebugInfo(refreshToken));
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }

  return { accessToken, refreshToken };
};

const refreshAuthToken = async () => {
  const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);

  if (!refreshToken) {
    throw new Error("SESSION_EXPIRED");
  }

  const response = await api.post<TokenResponse>(
    REFRESH_TOKEN_PATH,
    { refreshToken },
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  const nextAccessToken = getAccessToken(response.data);

  if (!nextAccessToken) {
    throw new Error("SESSION_EXPIRED");
  }

  await saveAuthTokens(response.data);
  return nextAccessToken;
};

const getFreshAccessToken = async () => {
  if (!refreshPromise) {
    refreshPromise = refreshAuthToken().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
};

export async function apiRequest<TResponse = unknown, TData = unknown>({
  method = "GET",
  url,
  data,
  params,
  headers,
  auth = true,
}: ApiRequestOptions<TData>) {
  const token = auth ? await AsyncStorage.getItem(AUTH_TOKEN_KEY) : null;

  if (auth && !token) {
    console.warn(`[apiRequest] ${method} ${url} has no auth token`);
  }

  if (auth && url === "/api/save-form") {
    console.log(`[apiRequest] ${method} ${url} auth`, getTokenDebugInfo(token));
  }

  try {
    const response = await api.request<TResponse>({
      method,
      url,
      data,
      params,
      headers: {
        ...headers,
        ...(auth && token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    return response.data;
  } catch (error) {
    if (!auth || !isAuthExpiredError(error)) {
      throw error;
    }

    try {
      const nextAccessToken = await getFreshAccessToken();
      const retryResponse = await api.request<TResponse>({
        method,
        url,
        data,
        params,
        headers: {
          ...headers,
          Authorization: `Bearer ${nextAccessToken}`,
        },
      });

      return retryResponse.data;
    } catch (refreshError) {
      await logoutUser();
      notifySessionExpired();

      const sessionError = new Error("SESSION_EXPIRED") as Error & {
        cause?: AxiosError | unknown;
      };
      sessionError.cause = refreshError;
      throw sessionError;
    }
  }
}
