import React, { useState, useEffect, useCallback } from 'react';
import { Stack, useRouter } from 'expo-router';
import "../global.css";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import { Text, Pressable, StyleSheet } from 'react-native';
import { PaperProvider, Menu, Divider,  MD3LightTheme, Snackbar } from 'react-native-paper';
import { UserDataProvider, useUserData } from "../components/UserDataContext";
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { logoutUser, onSessionExpired } from '@/lib/api';

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: 'blue',
    onSurfaceVariant: "black", 
  },
};

type Person = {
  email?: string;
  iat?: number;
  exp?: number;
};

const LOGIN_ROUTE = "/login";

export default function RootLayout() {
  const [user, setUser] = useState<Person | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const router = useRouter();

const SessionWatcher = () => {
  const { errorCode } = useUserData();
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (errorCode === "SESSION_EXPIRED") {
      setVisible(true);
      logoutUser();
      router.replace(LOGIN_ROUTE);
    }
  }, [errorCode, router]);

  return (
    <Snackbar
      visible={visible}
      onDismiss={() => setVisible(false)}
      duration={3000}
    >
      Your session has expired. Please sign in again.
    </Snackbar>
  );
};

  // Fetch and decode token
  const fetchAndDecodeToken = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        const decoded = jwtDecode<Person>(token);
        setUser(decoded);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error decoding token:', error);
      setUser(null);
    }
  }, []);

  // Run once on layout mount
  useEffect(() => {
    fetchAndDecodeToken();
  }, [fetchAndDecodeToken]);

  useEffect(() => {
    return onSessionExpired(() => {
      setUser(null);
      router.replace(LOGIN_ROUTE);
    });
  }, [router]);

  const openMenu = () => setMenuVisible(true);
  const closeMenu = () => setMenuVisible(false);

  const handleLogout = async () => {
    try {
      await logoutUser();
      setUser(null);
      closeMenu();
      router.replace(LOGIN_ROUTE); // navigate to login screen
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
    <UserDataProvider>
    <PaperProvider theme={theme}>
      <SessionWatcher />
      <Stack>
        <Stack.Screen
          name="(tabs)"
          options={{
            title: "EasySheet",
            headerRight: () => (
              <Menu
                visible={menuVisible}
                onDismiss={closeMenu}
                anchor={
                  <Pressable onPress={openMenu}>
                    <Text style={styles.headerAvatar}>
                      {user?.email ? user.email.slice(0, 1).toUpperCase() : '?'}
                    </Text>
                  </Pressable>
                }
                anchorPosition="bottom"
              >
                <Menu.Item
                  leadingIcon="account"
                  onPress={() => {
                    console.log('Profile pressed');
                    closeMenu();
                  }}
                  title="Profile"
                />
                <Menu.Item
                  leadingIcon="cog"
                  onPress={() => {
                    console.log('Settings pressed');
                    closeMenu();
                  }}
                  title="Settings"
                />
                <Menu.Item
                  leadingIcon="help-circle"
                  onPress={() => {
                    console.log('Help pressed');
                    closeMenu();
                  }}
                  title="Help"
                />
                <Divider />
                <Menu.Item
                  leadingIcon="logout"
                  onPress={handleLogout}
                  title="Logout"
                />
              </Menu>
            ),
          }}
        />
      </Stack>
    </PaperProvider>
    </UserDataProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  headerAvatar: {
    marginRight: 10,
    width: 30,
    height: 30,
    fontSize: 14,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'black',
    lineHeight: 30,
    textAlign: 'center',
    backgroundColor: '#f0f0f0',
  },
});
