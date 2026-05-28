import React, { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Text } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import CardComponent from "@/components/card";
import { useUserData } from "@/components/UserDataContext";
import { logoutUser } from "@/lib/api";
import { tabsTheme } from "@/theme/tabsTheme";

const LOGIN_ROUTE = "/login";

export default function HomePage() {
  const { data, loading, error, errorCode, lastUpdated, clearData } = useUserData();
  const router = useRouter();

  useEffect(() => {
    console.log("[HomePage] useEffect triggered, errorCode =", errorCode);

    const handleRedirect = async () => {
      if (!errorCode) return;

      if (errorCode === "NO_AUTH_TOKEN" || errorCode === "SESSION_EXPIRED") {
        console.warn("[HomePage] Session expired detected");
        await logoutUser();
        clearData?.();
        router.replace(LOGIN_ROUTE);
      }

      if (errorCode === "PROFILE_INCOMPLETE") {
        console.warn("[HomePage] Profile incomplete, redirecting to verifyProfile");
        await AsyncStorage.removeItem("cachedUserData");
        await AsyncStorage.removeItem("cachedUserProfile");
        clearData?.();
        setTimeout(() => router.replace("/verifyProfile"), 500);
      }
    };

    handleRedirect();
  }, [clearData, errorCode, router]);

  const details = React.useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data.entries)) return data.entries;
    if (Array.isArray(data)) return data;
    return [];
  }, [data]);

  const submissionCount = data && "weed" in data && Array.isArray(data.weed) ? data.weed.length : 0;

  if (errorCode === "NO_AUTH_TOKEN" || errorCode === "SESSION_EXPIRED") {
    return (
      <StatusState
        icon="lock-closed-outline"
        title="Your session has expired"
        message="Please log in again to continue."
        tone="danger"
      />
    );
  }

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={[tabsTheme.colors.primaryDark, tabsTheme.colors.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerTopRow}>
          <View style={styles.headerCopy}>
            <Text variant="headlineSmall" style={styles.headerTitle}>
              Your Forms
            </Text>
            <Text variant="bodyMedium" style={styles.headerSubtitle}>
              Manage entries, submissions, and daily form work.
            </Text>
          </View>
          <View style={styles.headerIcon}>
            <Ionicons name="document-text-outline" size={24} color="#ffffff" />
          </View>
        </View>

        <View style={styles.statsRow}>
          <Metric label="Forms" value={details.length} />
          <Metric label="Submissions" value={submissionCount} />
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {loading ? (
          <CenteredCard text="Loading your forms..." />
        ) : error ? (
          <ErrorCard />
        ) : details.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {lastUpdated && (
              <View style={styles.updatedPill}>
                <Ionicons name="time-outline" size={14} color={tabsTheme.colors.textMuted} />
                <Text variant="bodySmall" style={styles.updatedText}>
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
    <View style={styles.centerWrap}>
      <View style={styles.stateCard}>
        <ActivityIndicator color={tabsTheme.colors.primary} />
        <Text variant="bodyMedium" style={styles.centerText}>
          {text}
        </Text>
      </View>
    </View>
  );
}

function ErrorCard() {
  return (
    <StatusState
      icon="cloud-offline-outline"
      title="Unable to load data"
      message="Please check your connection and try again."
      tone="danger"
    />
  );
}

function EmptyState() {
  return (
    <StatusState
      icon="folder-open-outline"
      title="No forms yet"
      message="Create your first form and it will show up here."
    />
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.metric}>
      <Text variant="titleLarge" style={styles.metricValue}>
        {value}
      </Text>
      <Text variant="labelMedium" style={styles.metricLabel}>
        {label}
      </Text>
    </View>
  );
}

function StatusState({
  icon,
  title,
  message,
  tone = "default",
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
  tone?: "default" | "danger";
}) {
  const isDanger = tone === "danger";

  return (
    <View style={[styles.centerWrap, isDanger && styles.dangerScreen]}>
      <View style={styles.stateCard}>
        <View style={[styles.stateIcon, isDanger && styles.dangerIcon]}>
          <Ionicons
            name={icon}
            size={28}
            color={isDanger ? tabsTheme.colors.danger : tabsTheme.colors.primary}
          />
        </View>
        <Text variant="titleMedium" style={[styles.stateTitle, isDanger && styles.dangerText]}>
          {title}
        </Text>
        <Text variant="bodyMedium" style={styles.stateMessage}>
          {message}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: tabsTheme.colors.background,
  },
  header: {
    paddingBottom: 18,
    paddingHorizontal: tabsTheme.spacing.screen,
    paddingTop: 28,
  },
  headerTopRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 14,
    justifyContent: "space-between",
  },
  headerCopy: {
    flex: 1,
  },
  headerTitle: {
    color: "#ffffff",
    fontWeight: "800",
  },
  headerSubtitle: {
    color: "#d7fffb",
    marginTop: 4,
    maxWidth: 280,
  },
  headerIcon: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.16)",
    borderRadius: tabsTheme.spacing.radius,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  metric: {
    backgroundColor: "rgba(255, 255, 255, 0.14)",
    borderColor: "rgba(255, 255, 255, 0.22)",
    borderRadius: tabsTheme.spacing.radius,
    borderWidth: 1,
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  metricValue: {
    color: "#ffffff",
    fontWeight: "800",
  },
  metricLabel: {
    color: "#d7fffb",
    marginTop: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 4,
  },
  updatedPill: {
    alignItems: "center",
    alignSelf: "flex-start",
    flexDirection: "row",
    gap: 6,
    marginHorizontal: 16,
    marginTop: 14,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  updatedText: {
    color: tabsTheme.colors.textMuted,
  },
  centerWrap: {
    alignItems: "center",
    backgroundColor: tabsTheme.colors.background,
    flex: 1,
    justifyContent: "center",
    padding: tabsTheme.spacing.screen,
  },
  dangerScreen: {
    backgroundColor: tabsTheme.colors.dangerSoft,
  },
  stateCard: {
    alignItems: "center",
    backgroundColor: tabsTheme.colors.surface,
    borderColor: tabsTheme.colors.border,
    borderRadius: tabsTheme.spacing.radius,
    borderWidth: 1,
    maxWidth: 340,
    padding: 22,
    width: "100%",
    ...tabsTheme.shadow,
  },
  stateIcon: {
    alignItems: "center",
    backgroundColor: tabsTheme.colors.primarySoft,
    borderRadius: tabsTheme.spacing.radius,
    height: 48,
    justifyContent: "center",
    marginBottom: 14,
    width: 48,
  },
  dangerIcon: {
    backgroundColor: tabsTheme.colors.dangerSoft,
  },
  stateTitle: {
    color: tabsTheme.colors.text,
    fontWeight: "800",
    textAlign: "center",
  },
  dangerText: {
    color: tabsTheme.colors.danger,
  },
  stateMessage: {
    color: tabsTheme.colors.textMuted,
    marginTop: 6,
    textAlign: "center",
  },
  centerText: {
    color: tabsTheme.colors.primary,
    marginTop: 12,
    textAlign: "center",
  },
});
