// ProfileForm.tsx
import React, { useState } from "react";
import { View, Text, TextInput, Switch, StyleSheet, Alert } from "react-native";
import { Button } from "react-native-paper";
import { ProfileFormData } from "@/types/types";
import { apiRequest } from "@/lib/api";



export default function ProfileForm() {
  const [formData, setFormData] = useState<ProfileFormData>({
    name: "",
    email: "",
    profileCompleted: false,
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (field: keyof ProfileFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    // Basic validation
    if (!formData.name.trim() || !formData.email.trim()) {
      Alert.alert("Validation Error", "Please fill in both name and email.");
      return;
    }

    setLoading(true);

    try {
      const res = await apiRequest<{ success: boolean; message?: string }, ProfileFormData>({
        method: "POST",
        url: "/api/createProfile",
        data: formData,
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (res.success) {
        Alert.alert("Success", "Profile saved successfully!");
      } else {
        Alert.alert("Error", res.message || "Failed to save profile.");
      }
    } catch (error: any) {
      console.error("Profile submit error:", error);
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to save profile."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Name</Text>
      <TextInput
        value={formData.name}
        onChangeText={(text) => handleChange("name", text)}
        placeholder="Enter your name"
        style={styles.input}
      />

      <Text style={styles.label}>Email</Text>
      <TextInput
        value={formData.email}
        onChangeText={(text) => handleChange("email", text)}
        placeholder="Enter your email"
        keyboardType="email-address"
        autoCapitalize="none"
        style={styles.input}
      />

      <View style={styles.switchContainer}>
        <Text style={styles.label}>Profile Completed</Text>
        <Switch
          value={formData.profileCompleted}
          onValueChange={(val) => handleChange("profileCompleted", val)}
        />
      </View>

      <Button
        mode="contained"
        onPress={handleSubmit}
        loading={loading}
        disabled={loading}
        style={styles.button}
      >
        Save Profile
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: "center", backgroundColor: "#f8f8f8" },
  label: { fontWeight: "600", marginBottom: 6, fontSize: 16 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    backgroundColor: "#fff",
  },
  switchContainer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 24 },
  button: { paddingVertical: 6 },
});
