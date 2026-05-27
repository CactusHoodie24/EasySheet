import React, { useEffect } from "react";
import { View, Text } from "react-native";
import CardComponent from "@/components/card";
import { useUserData } from "@/components/UserDataContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { logoutUser } from "@/lib/api";

const LOGIN_ROUTE = "/(tabs)/login";

export default function HomePage() {
  const { data, loading, error, errorCode, lastUpdated, clearData } = useUserData();
  const router = useRouter();

  // Handle session expired
  useEffect(() => {
  console.log("[HomePage] useEffect triggered, errorCode =", errorCode);

  const handleRedirect = async () => {
    if (!errorCode) return;

    // ------------------ No auth token → go to login ------------------
    if (errorCode === "NO_AUTH_TOKEN" || errorCode === "SESSION_EXPIRED") {
      console.warn("[HomePage] Session expired detected");

      // Clear storage
      await logoutUser();

      // Clear React Query cache
      clearData?.();

      // Redirect to login
      router.replace(LOGIN_ROUTE);
    }

    // ------------------ Profile incomplete → go to verifyProfile ------------------
    if (errorCode === "PROFILE_INCOMPLETE") {
      console.warn("[HomePage] Profile incomplete, redirecting to verifyProfile");

      // Keep auth token so user can complete profile
      await AsyncStorage.removeItem("cachedUserData");
      await AsyncStorage.removeItem("cachedUserProfile");

      // Clear React Query cache
      clearData?.();

      // Redirect to verifyProfile
      setTimeout(() => router.replace("/verifyProfile"), 500);
    }
  };

  handleRedirect();
}, [clearData, errorCode, router]);

  // Normalize entries
  const details = React.useMemo(() => {
    if (!data) return [];

    if (Array.isArray(data.entries)) return data.entries;
    if (Array.isArray(data)) return data;

    return [];
  }, [data]);

  // Render session expired UI first
  if (errorCode === "NO_AUTH_TOKEN" || errorCode === "SESSION_EXPIRED") {
    return (
      <View className="flex-1 justify-center items-center bg-red-50 p-6">
        <Text className="text-red-600 font-bold text-lg mb-2 text-center">
          Your session has expired
        </Text>
        <Text className="text-red-500 text-sm text-center">
          Please log in again to continue
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-gradient-to-r from-blue-500 to-cyan-500 p-6 shadow-lg">
        <Text className="text-2xl font-bold text-white mb-1">
          Your Forms
        </Text>
        <Text className="text-blue-100">
          Manage and track your form entries
        </Text>
      </View>

      <View className="flex-1 px-4">
        {loading ? (
          <CenteredCard text="Loading your forms..." />
        ) : error ? (
          <ErrorCard />
        ) : details.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {lastUpdated && (
              <View className="py-3 px-1">
                <Text className="text-gray-500 text-sm">
                  Last updated:{" "}
                  {new Date(lastUpdated).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </View>
            )}
            {data && <CardComponent details={data} />}
          </>
        )}
      </View>
    </View>
  );
}

function CenteredCard({ text }: { text: string }) {
  return (
    <View className="flex-1 justify-center items-center">
      <View className="bg-white p-6 rounded-xl shadow-md">
        <Text className="text-blue-600">{text}</Text>
      </View>
    </View>
  );
}

function ErrorCard() {
  return (
    <View className="mt-4 bg-red-50 p-4 rounded-xl">
      <Text className="text-red-600 font-medium text-center">
        Unable to load data
      </Text>
      <Text className="text-red-500 text-sm text-center mt-1">
        Please check your connection and try again
      </Text>
    </View>
  );
}

function EmptyState() {
  return (
    <View className="flex-1 justify-center items-center">
      <View className="bg-white p-6 rounded-xl shadow-md">
        <Text className="text-gray-600 text-center">
          No forms created yet
        </Text>
        <Text className="text-gray-500 text-sm text-center mt-1">
          Create your first form to get started
        </Text>
      </View>
    </View>
  );
}
