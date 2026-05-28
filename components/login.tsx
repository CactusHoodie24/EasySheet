import React, { useState } from "react";
import { Alert, Button, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest, saveAuthTokens } from "@/lib/api";

type LoginResponse = {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  tokenType?: string;
  expiresIn?: number;
  message?: string;
};

export default function MobileLogin() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert("Missing details", "Please enter your email and password.");
      return;
    }

    setLoading(true);

    try {
      const res = await apiRequest<LoginResponse, { email: string; password: string }>({
        method: "POST",
        url: "/api/mobile/login",
        data: {
          email: email.trim(),
          password,
        },
        auth: false,
      });

      if (!res.success) {
        Alert.alert("Login failed", res.message || "Please check your credentials.");
        return;
      }

      await saveAuthTokens(res);
      router.replace("/(tabs)/(home)");
      queryClient.removeQueries({ queryKey: ["forms"] });
      queryClient.invalidateQueries({ queryKey: ["forms"] });
    } catch (err: any) {
      console.error("[login] failed", err);

      if (err.response) {
        Alert.alert(
          "Login failed",
          err.response.data?.message || "Please check your credentials and try again."
        );
      } else if (err.request) {
        Alert.alert("Connection failed", "No response from the server.");
      } else {
        Alert.alert("Login failed", err.message || "Something went wrong.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome back</Text>
      <Text style={styles.subtitle}>Sign in with your email and password.</Text>

      <Text style={styles.label}>Email</Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="user@example.com"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        style={styles.input}
      />

      <Text style={styles.label}>Password</Text>
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        autoCapitalize="none"
        secureTextEntry
        style={styles.input}
      />

      <Button title={loading ? "Signing in..." : "Sign in"} onPress={handleLogin} disabled={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  title: {
    color: "#172033",
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 6,
  },
  subtitle: {
    color: "#64748b",
    fontSize: 15,
    marginBottom: 28,
  },
  label: {
    color: "#172033",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
  },
  input: {
    borderColor: "#dbe4ef",
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
});
