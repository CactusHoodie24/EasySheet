// CardComponent.tsx
import React from "react";
import { ScrollView, View } from "react-native";
import { Card, Text, Button } from "react-native-paper";
import { router } from "expo-router";
import { FormEntry, UserData } from "../types/types";

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
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      {details.entries.map((entry) => (
        <Card
          key={entry.id}
          style={{
            marginBottom: 16,
            backgroundColor: "white",
            borderRadius: 16,
            overflow: "hidden",
          }}
        >
          <View style={{ backgroundColor: "#0ea5e9", height: 4 }} />
          <Card.Content style={{ padding: 16 }}>
            <Text
              variant="titleLarge"
              style={{ fontSize: 20, fontWeight: "bold", marginBottom: 4 }}
            >
              {entry.title}
            </Text>
            <Text variant="bodyMedium" style={{ color: "#555", marginBottom: 8 }}>
              Created on{" "}
              {entry.createdAt
                ? new Date(entry.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "Unknown"}
            </Text>
            <Text variant="bodySmall" style={{ color: "#777" }}>
              {entry.inputs.length} fields •{" "}
              {details.weed.filter((v) => v.entryId === entry.id).length} submissions
            </Text>
          </Card.Content>
          <Card.Actions style={{ padding: 16 }}>
            <Button
              mode="contained"
              onPress={() => handlePreview(entry)}
              style={{ backgroundColor: "#3b82f6", flex: 1, borderRadius: 8 }}
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
