// CardComponent.tsx
import React from "react";
import { ScrollView, View } from "react-native";
import { Card, Text, Button } from "react-native-paper";
import { router } from "expo-router";
import { FormEntry, UserData } from "../types/types";
import { tabsTheme } from "@/theme/tabsTheme";

interface CardComponentProps {
  details: UserData;
}

const CardComponent: React.FC<CardComponentProps> = ({ details }) => {
  const handlePreview = (entry: FormEntry) => {
    try {
      const filteredValues = details.weed.filter((v) => v.entryId === entry.id);
      router.push({
        pathname: "/(tabs)/Preview",
        params: {
          entryId: entry.id,
          values: JSON.stringify(filteredValues),
        },
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 28 }}>
      {details.entries.map((entry) => (
        <Card
          key={entry.id}
          style={{
            marginBottom: 16,
            backgroundColor: tabsTheme.colors.surface,
            borderColor: tabsTheme.colors.border,
            borderRadius: tabsTheme.spacing.radius,
            borderWidth: 1,
            overflow: "hidden",
            ...tabsTheme.shadow,
          }}
        >
          <View style={{ backgroundColor: tabsTheme.colors.primary, height: 4 }} />
          <Card.Content style={{ padding: 16 }}>
            <Text
              variant="titleLarge"
              style={{ color: tabsTheme.colors.text, fontSize: 20, fontWeight: "800", marginBottom: 4 }}
            >
              {entry.title}
            </Text>
            <Text variant="bodyMedium" style={{ color: tabsTheme.colors.textMuted, marginBottom: 8 }}>
              Created on{" "}
              {entry.createdAt
                ? new Date(entry.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "Unknown"}
            </Text>
            <Text variant="bodySmall" style={{ color: tabsTheme.colors.textMuted }}>
              {entry.inputs.length} fields •{" "}
              {details.weed.filter((v) => v.entryId === entry.id).length} submissions
            </Text>
          </Card.Content>
          <Card.Actions style={{ padding: 16 }}>
            <Button
              mode="contained"
              onPress={() => handlePreview(entry)}
              icon="eye-outline"
              buttonColor={tabsTheme.colors.primary}
              style={{ flex: 1, borderRadius: tabsTheme.spacing.radius }}
            >
              Preview
            </Button>
          </Card.Actions>
        </Card>
      ))}
    </ScrollView>
  );
};

export default CardComponent;
