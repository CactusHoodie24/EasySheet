import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="(home)/index"  // match the folder/file path
        options={{
          headerShown: false,
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="create/index"
        options={{
          headerShown: false,
          title: 'Create',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text-outline" size={size} color="green" />
          ),
        }}
      />

      <Tabs.Screen
        name="edit/index"
        options={{
          headerShown: false,
          title: 'Edit',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="pencil-outline" size={size} color="green" />
          ),
        }}
      />
         <Tabs.Screen
        name="login/index"
        options={{
          headerShown: false,
          title: 'Login',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="eye-outline" size={size} color="green" />
          ),
        }}
      />

      <Tabs.Screen
        name="Preview/index"
        options={{
          headerShown: false,
          title: 'Preview',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="eye-outline" size={size} color="green" />
          ),
        }}
      />
    </Tabs>
  );
}
