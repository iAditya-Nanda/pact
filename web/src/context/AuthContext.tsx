"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  User as FirebaseUser,
} from "firebase/auth";
import {
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { auth, googleProvider, db } from "@/lib/firebase";

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string;
  role: string;
  age?: number;
  schedulePreference?: string;
  googleAccessToken?: string;
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
  isLoading: false,
  loginWithGoogle: async () => {},
  saveOnboardingProfile: async () => {},
  logout: async () => {},
});

// Non-blocking Firestore background sync with timeout protection
async function safeFirestoreSync(userId: string, data: Partial<UserProfile>) {
  try {
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Firestore sync timeout")), 2000)
    );
    const syncOp = async () => {
      const userDocRef = doc(db, "users", userId);
      await setDoc(
        userDocRef,
        {
          uid: userId,
          email: data.email,
          fullName: data.fullName,
          avatarUrl: data.avatarUrl,
          role: data.role,
          age: data.age,
          schedulePreference: data.schedulePreference,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    };
    await Promise.race([syncOp(), timeout]);
  } catch (e) {
    // Non-fatal: session is fully saved in localStorage and Firebase Auth
    console.warn("Background Firestore sync skipped or timed out:", e);
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Initialize immediately from localStorage for zero-latency session recovery
  const [user, setUser] = useState<UserProfile | null>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("pact_auth_user");
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          return null;
        }
      }
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState<boolean>(() => {
    // If session exists in cache, loading is false immediately
    if (typeof window !== "undefined") {
      return !localStorage.getItem("pact_auth_user");
    }
    return true;
  });

  const router = useRouter();

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const stored =
          typeof window !== "undefined"
            ? localStorage.getItem("pact_auth_user")
            : null;
        let existing: Partial<UserProfile> = {};
        if (stored) {
          try {
            existing = JSON.parse(stored);
          } catch {}
        }

        const profile: UserProfile = {
          id: firebaseUser.uid,
          email: firebaseUser.email || "adityananda.dev@gmail.com",
          fullName:
            firebaseUser.displayName || existing.fullName || "Aditya Nanda",
          avatarUrl: firebaseUser.photoURL || existing.avatarUrl || "",
          role: existing.role || "Lead Architect",
          age: existing.age || 24,
          schedulePreference:
            existing.schedulePreference || "Avoid meetings before 10:00 AM",
          googleAccessToken:
            typeof window !== "undefined"
              ? localStorage.getItem("pact_google_access_token") || undefined
              : undefined,
        };

        setUser(profile);
        if (typeof window !== "undefined") {
          localStorage.setItem("pact_auth_user", JSON.stringify(profile));
        }

        // Fire-and-forget sync to Firestore
        safeFirestoreSync(firebaseUser.uid, profile);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    setIsLoading(true);
    try {
      // 1. Direct Google Sign In via Firebase popup
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;

      if (token && typeof window !== "undefined") {
        localStorage.setItem("pact_google_access_token", token);
      }

      const fbUser = result.user;
      const stored =
        typeof window !== "undefined"
          ? localStorage.getItem("pact_auth_user")
          : null;
      let existing: Partial<UserProfile> = {};
      if (stored) {
        try {
          existing = JSON.parse(stored);
        } catch {}
      }

      const profile: UserProfile = {
        id: fbUser.uid,
        email: fbUser.email || "adityananda.dev@gmail.com",
        fullName: fbUser.displayName || existing.fullName || "Aditya Nanda",
        avatarUrl: fbUser.photoURL || existing.avatarUrl || "",
        role: existing.role || "Lead Architect",
        age: existing.age || 24,
        schedulePreference:
          existing.schedulePreference || "Avoid meetings before 10:00 AM",
        googleAccessToken: token || undefined,
      };

      // 2. Persist to state and browser session immediately
      setUser(profile);
      if (typeof window !== "undefined") {
        localStorage.setItem("pact_auth_user", JSON.stringify(profile));
      }

      // 3. Background sync to Firestore without blocking navigation
      safeFirestoreSync(fbUser.uid, profile);

      // 4. Instantly navigate to dashboard
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Firebase Google Sign-In error:", error);
      throw error;
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
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;

      if (token && typeof window !== "undefined") {
        localStorage.setItem("pact_google_access_token", token);
      }

      const fbUser = result.user;
      const profile: UserProfile = {
        id: fbUser.uid,
        email: fbUser.email || "adityananda.dev@gmail.com",
        fullName: data.fullName || fbUser.displayName || "Aditya Nanda",
        avatarUrl: fbUser.photoURL || "",
        role: data.role || "Lead Architect",
        age: data.age || 24,
        schedulePreference: data.schedulePreference,
        googleAccessToken: token || undefined,
      };

      setUser(profile);
      if (typeof window !== "undefined") {
        localStorage.setItem("pact_auth_user", JSON.stringify(profile));
      }

      safeFirestoreSync(fbUser.uid, profile);
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Firebase Profile Setup error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("pact_auth_user");
      localStorage.removeItem("pact_google_access_token");
    }
    setUser(null);
    try {
      await signOut(auth);
    } catch (e) {
      console.error("Sign-out error:", e);
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
