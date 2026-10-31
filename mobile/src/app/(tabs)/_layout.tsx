import React from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform } from 'react-native';
import { Colors } from '../../theme/colors';
import { Home, Sparkles, Layers } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.light.onPrimaryContainer,
        tabBarInactiveTintColor: Colors.light.textSecondary,
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Overview',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.pillContainer, focused && styles.activePill]}>
              <Home size={20} color={focused ? Colors.light.primaryBrandBlue : color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="copilot"
        options={{
          title: 'AI Copilot',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.pillContainer, focused && styles.activePill]}>
              <Sparkles size={20} color={focused ? Colors.light.primaryBrandBlue : color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="workspace"
        options={{
          title: 'Workspace',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.pillContainer, focused && styles.activePill]}>
              <Layers size={20} color={focused ? Colors.light.primaryBrandBlue : color} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.light.canvasBackground,
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderSubdued,
    height: Platform.OS === 'ios' ? 88 : 68,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 28 : 10,
    elevation: 4,
  },
  pillContainer: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activePill: {
    backgroundColor: Colors.light.surfaceActivePill,
  },
  tabLabel: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 11,
    marginTop: 2,
    fontWeight: '600',
  },
});
