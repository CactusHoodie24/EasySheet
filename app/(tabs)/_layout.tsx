import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { FontAwesome5 } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="(home)"
        options={{
          headerShown: false,
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="login"
        options={{
          headerShown: false,
          title: 'Login',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="log-in-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          headerShown: false,
          title: 'Create',
          tabBarIcon: ({ color, size }) => (
          <Ionicons name="document-text-outline" size={24} color="green" />
          ),
        }}
      />
            <Tabs.Screen
        name="edit"
        options={{
          headerShown: false,
          title: 'edit',
          tabBarIcon: ({ color, size }) => (
          <Ionicons name="pencil-outline" size={24} color="green" />
          ),
        }}
      />
         <Tabs.Screen
        name="Preview"
        options={{
          headerShown: false,
          title: 'Preview',
          tabBarIcon: ({ color, size }) => (
          <Ionicons name="pencil-outline" size={24} color="green" />
          ),
        }}
      />
    </Tabs>
  );
}
