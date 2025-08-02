import React, { useState, useCallback } from 'react';
import { Stack } from 'expo-router';
import "../global.css";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import { Text, View, Pressable, StyleSheet } from 'react-native';
import { PaperProvider, Menu, Divider } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native'; // Import useFocusEffect

type Person = {
  email?: string;
  iat?: number;
  exp?: number;
};

export default function RootLayout() {
  const [user, setUser] = useState<Person | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const router = useRouter();

  // Define the function to fetch and decode the token
  const fetchAndDecodeToken = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        const decoded = jwtDecode<Person>(token);
        setUser(decoded);
      } else {
        setUser(null); // Clear user if no token is found
      }
    } catch (error) {
      console.error('Error decoding token:', error);
      setUser(null); // Clear user on error
    }
  }, []); // No dependencies, as it only reads from AsyncStorage

  // Use useFocusEffect to call fetchAndDecodeToken whenever the screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchAndDecodeToken();
      // Optional: return a cleanup function if needed
      return () => {
        // Any cleanup when the screen loses focus
      };
    }, [fetchAndDecodeToken]) // Depend on fetchAndDecodeToken
  );

  const openMenu = () => setMenuVisible(true);
  const closeMenu = () => setMenuVisible(false);

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      // After removing the token, call fetchAndDecodeToken to update the UI
      // useFocusEffect will also trigger it when navigating back to this screen
      fetchAndDecodeToken(); 
      closeMenu();
      router.replace('/login'); // Navigate to login screen
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <PaperProvider>
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