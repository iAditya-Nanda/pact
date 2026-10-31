import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { Sparkles, ShieldCheck } from 'lucide-react-native';

export default function LoginScreen() {
  const { loginWithGoogle } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const router = useRouter();

  const handleGoogleLogin = async () => {
    setIsSigningIn(true);
    try {
      await loginWithGoogle();
      router.replace('/(tabs)');
    } catch (err) {
      console.error('Login failed:', err);
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Branding Section */}
      <View style={styles.brandContainer}>
        <View style={styles.logoBadge}>
          <Sparkles size={40} color="#ffffff" />
        </View>
        <Text style={styles.brandName}>PACT</Text>
        <Text style={styles.tagline}>Autonomous Cross-App Executive OS</Text>

        <View style={styles.packagePill}>
          <ShieldCheck size={13} color="#0b57d0" />
          <Text style={styles.packageText}>ID: com.aditya.pact • Google Cloud Verified</Text>
        </View>
      </View>

      {/* Center Card with Google Login */}
      <View style={styles.loginCard}>
        <Text style={styles.cardHeader}>Welcome Back</Text>
        <Text style={styles.cardSub}>
          Sign in to coordinate your Gmail, Google Calendar, and Google Tasks with verified AI tool execution.
        </Text>

        <TouchableOpacity
          style={styles.googleBtn}
          onPress={handleGoogleLogin}
          disabled={isSigningIn}
          activeOpacity={0.85}
        >
          {isSigningIn ? (
            <ActivityIndicator size="small" color="#0b57d0" />
          ) : (
            <View style={styles.googleBtnContent}>
              <View style={styles.googleIconBadge}>
                <Text style={styles.googleG}>G</Text>
              </View>
              <Text style={styles.googleBtnText}>Continue with Google</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.securityNote}>
          <Text style={styles.securityText}>
            Secured by Firebase Auth & Google Services. No separate account or signup required.
          </Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>PACT Chief of Staff • Project pact-18</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.canvasBackground,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40,
  },
  brandContainer: {
    alignItems: 'center',
  },
  logoBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.light.primaryBrandBlue,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.light.primaryBrandBlue,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
    marginBottom: 16,
  },
  brandName: {
    ...Typography.headingDisplay,
    fontSize: 28,
    color: Colors.light.textDisplay,
  },
  tagline: {
    ...Typography.bodySecondary,
    color: Colors.light.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  packagePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.light.surfaceActivePill,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    marginTop: 14,
  },
  packageText: {
    ...Typography.caption,
    color: Colors.light.onPrimaryContainer,
    fontWeight: '600',
  },
  loginCard: {
    backgroundColor: Colors.light.cardSurface,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.light.borderSubdued,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  cardHeader: {
    ...Typography.sectionTitle,
    color: Colors.light.textDisplay,
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 6,
  },
  cardSub: {
    ...Typography.bodySecondary,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
  },
  googleBtn: {
    backgroundColor: Colors.light.cardSurfaceMuted,
    borderWidth: 1,
    borderColor: Colors.light.borderSubdued,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  googleBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  googleIconBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e3e7',
  },
  googleG: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 15,
    color: '#0b57d0',
  },
  googleBtnText: {
    ...Typography.buttonLabel,
    color: Colors.light.textPrimary,
    fontSize: 15,
  },
  securityNote: {
    marginTop: 16,
    paddingHorizontal: 8,
  },
  securityText: {
    ...Typography.caption,
    color: Colors.light.textMuted,
    textAlign: 'center',
    lineHeight: 15,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    ...Typography.caption,
    color: Colors.light.textMuted,
  },
});
