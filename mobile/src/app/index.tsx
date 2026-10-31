import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { Sparkles } from 'lucide-react-native';

export default function SplashScreen() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => {
        if (user) {
          router.replace('/(tabs)');
        } else {
          router.replace('/login');
        }
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [user, isLoading]);

  return (
    <View style={styles.container}>
      <View style={styles.logoBadge}>
        <Sparkles size={48} color="#ffffff" />
      </View>

      <Text style={styles.title}>PACT</Text>
      <Text style={styles.subTitle}>Executive OS • Mobile</Text>

      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#0b57d0" />
        <Text style={styles.loadingText}>Initializing Workspace Security...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.canvasBackground,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  logoBadge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.light.primaryBrandBlue,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.light.primaryBrandBlue,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 10,
    marginBottom: 20,
  },
  title: {
    ...Typography.headingDisplay,
    fontSize: 32,
    color: Colors.light.textDisplay,
    letterSpacing: -0.5,
  },
  subTitle: {
    ...Typography.bodySecondary,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  footerLoader: {
    position: 'absolute',
    bottom: 60,
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    ...Typography.caption,
    color: Colors.light.textMuted,
  },
});
