import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { tabsTheme } from '@/theme/tabsTheme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: tabsTheme.colors.primary,
        tabBarInactiveTintColor: tabsTheme.colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '700',
          marginTop: 2,
        },
        tabBarStyle: {
          height: 68,
          paddingTop: 8,
          marginBottom: 50,
          paddingBottom: 20,
          backgroundColor: tabsTheme.colors.surface,
          borderTopWidth: 1,
          borderTopColor: tabsTheme.colors.border,
          ...tabsTheme.shadow,
        },
        tabBarItemStyle: {
          borderRadius: tabsTheme.spacing.radius,
          marginHorizontal: 8,
        },
      }}
    >
      <Tabs.Screen
        name="(home)/index"
        options={{
          title: 'Home',
          tabBarAccessibilityLabel: 'Home tab',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size + 1} color={color} />
          ),
        }}
      />


      <Tabs.Screen
        name="edit/index"
        options={{
          title: 'Submit',
          tabBarAccessibilityLabel: 'Submit form tab',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="create-outline" size={size + 1} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
