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
  loginWithGoogle: () => Promise<void>;
  saveOnboardingProfile: (data: {
    fullName: string;
    age: number;
    role: string;
    schedulePreference: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  loginWithGoogle: async () => {},
  saveOnboardingProfile: async () => {},
  logout: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Load active session from Supabase
  useEffect(() => {
    async function loadSession() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          const u = session.user;
          // Fetch profile details from backend
          const res = await fetch("/api/workspace/overview");
          if (res.ok) {
            const data = await res.json();
            setUser({
              id: u.id,
              email: u.email || "adityananda.dev@gmail.com",
              fullName:
                data.user?.full_name ||
                u.user_metadata?.full_name ||
                u.user_metadata?.name ||
                "Aditya Nanda",
              avatarUrl:
                data.user?.avatar_url ||
                u.user_metadata?.avatar_url ||
                u.user_metadata?.picture ||
                "",
              role: data.user?.role || "Lead Architect",
              age: data.user?.age || 24,
              schedulePreference:
                data.user?.schedule_preference ||
                "Avoid meetings before 10:00 AM",
            });
          }
        } else {
          // Check local stored session for local development
          const stored = localStorage.getItem("pact_auth_user");
          if (stored) {
            setUser(JSON.parse(stored));
          }
        }
      } catch (err) {
        console.error("Error loading session:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadSession();

    // Listen to Supabase auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const u = session.user;
        const profile: UserProfile = {
          id: u.id,
          email: u.email || "adityananda.dev@gmail.com",
          fullName:
            u.user_metadata?.full_name ||
            u.user_metadata?.name ||
            "Aditya Nanda",
          avatarUrl:
            u.user_metadata?.avatar_url ||
            u.user_metadata?.picture ||
            "",
          role: "Lead Architect",
          age: 24,
          schedulePreference: "Avoid meetings before 10:00 AM",
        };
        setUser(profile);
        localStorage.setItem("pact_auth_user", JSON.stringify(profile));
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        localStorage.removeItem("pact_auth_user");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loginWithGoogle = async () => {
    setIsLoading(true);

    try {
      // 1. Trigger real Google OAuth with offline access and required Google Workspace scopes
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          scopes:
            "openid email profile https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/tasks",
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) {
        console.warn("Supabase Google OAuth direct redirect fallback:", error.message);
        // Seamless fallback for local dev if Supabase is stopped or client ID not added yet
        const localUser: UserProfile = {
          id: "usr_adityananda_dev",
          email: "adityananda.dev@gmail.com",
          fullName: "Aditya Nanda",
          avatarUrl: "",
          role: "Lead Architect",
          age: 24,
          schedulePreference: "Avoid meetings before 10:00 AM",
        };
        setUser(localUser);
        localStorage.setItem("pact_auth_user", JSON.stringify(localUser));
        router.push("/dashboard");
      }
    } catch (e) {
      console.error("Sign-in exception:", e);
      // Fallback to allow smooth development testing
      const localUser: UserProfile = {
        id: "usr_adityananda_dev",
        email: "adityananda.dev@gmail.com",
        fullName: "Aditya Nanda",
        avatarUrl: "",
        role: "Lead Architect",
        age: 24,
        schedulePreference: "Avoid meetings before 10:00 AM",
      };
      setUser(localUser);
      localStorage.setItem("pact_auth_user", JSON.stringify(localUser));
      router.push("/dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  const saveOnboardingProfile = async (data: {
    fullName: string;
    age: number;
    role: string;
    schedulePreference: string;
  }) => {
    const updated: UserProfile = {
      id: user?.id || "usr_adityananda_dev",
      email: "adityananda.dev@gmail.com",
      fullName: data.fullName,
      avatarUrl: user?.avatarUrl || "",
      role: data.role,
      age: data.age,
      schedulePreference: data.schedulePreference,
    };

    setUser(updated);
    localStorage.setItem("pact_auth_user", JSON.stringify(updated));

    // Save to database if session exists
    try {
      if (user?.id) {
        await supabase
          .from("user_profiles")
          .update({
            full_name: data.fullName,
            age: data.age,
            role: data.role,
            schedule_preference: data.schedulePreference,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id);
      }
    } catch {
      // Ignore if offline
    }

    router.push("/dashboard");
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
    <AuthContext.Provider
      value={{ user, isLoading, loginWithGoogle, saveOnboardingProfile, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
