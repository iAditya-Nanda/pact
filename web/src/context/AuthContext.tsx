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
  connectGoogleWorkspace: () => Promise<string | null>;
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
  connectGoogleWorkspace: async () => null,
  saveOnboardingProfile: async () => {},
  logout: async () => {},
});

// Non-blocking Firestore background sync with silent fallback protection
async function safeFirestoreSync(userId: string, data: Partial<UserProfile>) {
  try {
    const timeout = new Promise<string>((resolve) =>
      setTimeout(() => resolve("timeout"), 1500)
    );
    const syncOp = async (): Promise<string> => {
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
      return "synced";
    };
    await Promise.race([syncOp(), timeout]);
  } catch {
    // Non-fatal: session is persistently maintained in localStorage & server database
  }
}

// Safe background server API sync
async function syncProfileToBackend(profile: UserProfile) {
  try {
    await fetch("/api/user/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
  } catch (err) {
    console.warn("Server backend profile sync skipped:", err);
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // User state — starts null, only set once Firebase confirms the session
  const [user, setUser] = useState<UserProfile | null>(null);

  // Loading starts true — we must wait for Firebase to confirm auth state
  const [isLoading, setIsLoading] = useState<boolean>(true);

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
          email: firebaseUser.email || "",
          fullName:
            firebaseUser.displayName || existing.fullName || (firebaseUser.email ? firebaseUser.email.split("@")[0] : "Executive User"),
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

        // Fire-and-forget sync to Firestore and server database
        safeFirestoreSync(firebaseUser.uid, profile);
        syncProfileToBackend(profile);
        setIsLoading(false);
      } else {
        // Firebase confirms no authenticated user — clear all cached session data
        if (typeof window !== "undefined") {
          localStorage.removeItem("pact_auth_user");
          localStorage.removeItem("pact_google_access_token");
        }
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    setIsLoading(true);
    try {
      // Configure Google provider to ALWAYS force account selection and consent screen
      googleProvider.setCustomParameters({
        prompt: "select_account consent",
        access_type: "offline",
      });

      // 1. Direct Google Sign In via Firebase popup
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;

      if (token && typeof window !== "undefined") {
        localStorage.setItem("pact_google_access_token", token);
        // Sync token immediately to server workspace overview so live Google data connects
        try {
          await fetch("/api/workspace/overview", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ googleAccessToken: token }),
          });
        } catch (e) {
          console.warn("Failed to sync token to workspace overview:", e);
        }
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
        email: fbUser.email || "",
        fullName:
          fbUser.displayName || existing.fullName || (fbUser.email ? fbUser.email.split("@")[0] : "Executive User"),
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

      // 3. Background sync to Firestore and server database without blocking navigation
      safeFirestoreSync(fbUser.uid, profile);
      syncProfileToBackend(profile);

      // 4. Instantly navigate to dashboard
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Firebase Google Sign-In error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const connectGoogleWorkspace = async (): Promise<string | null> => {
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;

      if (token) {
        if (typeof window !== "undefined") {
          localStorage.setItem("pact_google_access_token", token);
        }

        // Background server token synchronization
        await fetch("/api/workspace/overview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ googleAccessToken: token }),
        });

        setUser((prev) => (prev ? { ...prev, googleAccessToken: token } : prev));
        return token;
      }
      return null;
    } catch (error: any) {
      console.error("Connect Google Workspace popup error:", error);
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
      googleProvider.setCustomParameters({
        prompt: "select_account consent",
        access_type: "offline",
      });

      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;

      if (token && typeof window !== "undefined") {
        localStorage.setItem("pact_google_access_token", token);
        try {
          await fetch("/api/workspace/overview", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ googleAccessToken: token }),
          });
        } catch (e) {
          console.warn("Failed to sync token to workspace overview:", e);
        }
      }

      const fbUser = result.user;
      const profile: UserProfile = {
        id: fbUser.uid,
        email: fbUser.email || "",
        fullName:
          data.fullName ||
          fbUser.displayName ||
          (fbUser.email ? fbUser.email.split("@")[0] : "Executive User"),
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
      syncProfileToBackend(profile);
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
      value={{
        user,
        isLoading,
        loginWithGoogle,
        connectGoogleWorkspace,
        saveOnboardingProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
