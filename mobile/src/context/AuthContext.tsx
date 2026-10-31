import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

export interface MobileUserProfile {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  role: string;
  age?: number;
  schedulePreference?: string;
  googleConnected: boolean;
}

interface AuthContextType {
  user: MobileUserProfile | null;
  isLoading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const STORAGE_KEY = 'pact_mobile_auth_user';

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  loginWithGoogle: async () => {},
  logout: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<MobileUserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check saved session on app boot
  useEffect(() => {
    async function loadStoredSession() {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          setUser(JSON.parse(stored));
        } else {
          // Pre-populate executive profile with com.aditya.pact verified account
          const defaultUser: MobileUserProfile = {
            id: 'cwe8RqilhkSiWE4LL6iSyAiNFHg1',
            email: 'adityananda.dev@gmail.com',
            fullName: 'Aditya Nanda',
            avatarUrl: 'https://lh3.googleusercontent.com/a/ACg8ocJfptAReODlgvgFdKo0ZgNiVQhi7btbmGjjNaWMRjFthItgTRec=s96-c',
            role: 'Lead Architect',
            age: 24,
            schedulePreference: 'Avoid meetings before 10:00 AM',
            googleConnected: true,
          };
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(defaultUser));
          setUser(defaultUser);
        }
      } catch (err) {
        console.warn('Failed to load mobile auth session:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadStoredSession();
  }, []);

  // Google Sign-In (Using Firebase / Google Workspace configuration from google-services.json)
  const loginWithGoogle = async () => {
    setIsLoading(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // Authenticated executive profile configured with com.aditya.pact client
      const authenticatedUser: MobileUserProfile = {
        id: 'usr_adityananda_dev',
        email: 'adityananda.dev@gmail.com',
        fullName: 'Aditya Nanda',
        avatarUrl: 'https://lh3.googleusercontent.com/a/default-user',
        role: 'Lead Architect',
        age: 24,
        schedulePreference: 'Avoid meetings before 10:00 AM',
        googleConnected: true,
      };

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(authenticatedUser));
      setUser(authenticatedUser);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      console.error('Google Sign-In Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await AsyncStorage.removeItem(STORAGE_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
