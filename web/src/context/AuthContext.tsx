"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string;
  role: string;
  age?: number;
  schedulePreference?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  loginWithGoogle: (testEmail?: string, testName?: string, role?: string, age?: number, preference?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  loginWithGoogle: async () => {},
  logout: async () => {},
});

const DEFAULT_TEST_USER: UserProfile = {
  id: "usr_aditya_nanda_01",
  email: "adityananda.dev@gmail.com",
  fullName: "Aditya Nanda",
  avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces",
  role: "Founder & Lead Architect",
  age: 24,
  schedulePreference: "Avoid meetings before 10:00 AM",
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check local storage session first
    const stored = localStorage.getItem("pact_auth_user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem("pact_auth_user");
      }
    }
    setIsLoading(false);
  }, []);

  const loginWithGoogle = async (
    testEmail?: string,
    testName?: string,
    role?: string,
    age?: number,
    preference?: string
  ) => {
    setIsLoading(true);

    try {
      // Create user profile (using provided test details or defaults)
      const authenticatedUser: UserProfile = {
        id: "usr_" + Math.random().toString(36).substring(2, 10),
        email: testEmail || DEFAULT_TEST_USER.email,
        fullName: testName || (testEmail ? testEmail.split("@")[0] : DEFAULT_TEST_USER.fullName),
        avatarUrl: DEFAULT_TEST_USER.avatarUrl,
        role: role || DEFAULT_TEST_USER.role,
        age: age || DEFAULT_TEST_USER.age,
        schedulePreference: preference || DEFAULT_TEST_USER.schedulePreference,
      };

      // Persist local session
      localStorage.setItem("pact_auth_user", JSON.stringify(authenticatedUser));
      setUser(authenticatedUser);

      // Attempt Supabase Auth sign-in if server is online
      try {
        await supabase.auth.signInWithOtp({
          email: authenticatedUser.email,
          options: { shouldCreateUser: true },
        });
      } catch {
        // Fallback gracefully to offline session
      }

      router.push("/dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    localStorage.removeItem("pact_auth_user");
    setUser(null);
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignore if offline
    }
    router.push("/");
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
