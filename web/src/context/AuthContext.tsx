"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";
import {
  doc,
  getDoc,
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

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          // Fetch synced profile from Cloud Firestore
          const userDocRef = doc(db, "users", firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);

          let profileData = userDoc.exists() ? userDoc.data() : null;

          if (!profileData) {
            // Initialize document in Firestore with Google Auth details
            const initialDoc = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || "adityananda.dev@gmail.com",
              fullName: firebaseUser.displayName || "Aditya Nanda",
              avatarUrl: firebaseUser.photoURL || "",
              role: "Lead Architect",
              age: 24,
              schedulePreference: "Avoid meetings before 10:00 AM",
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            };
            await setDoc(userDocRef, initialDoc, { merge: true });
            profileData = initialDoc;
          }

          const profile: UserProfile = {
            id: firebaseUser.uid,
            email: firebaseUser.email || "adityananda.dev@gmail.com",
            fullName: profileData.fullName || firebaseUser.displayName || "Aditya Nanda",
            avatarUrl: profileData.avatarUrl || firebaseUser.photoURL || "",
            role: profileData.role || "Lead Architect",
            age: profileData.age || 24,
            schedulePreference:
              profileData.schedulePreference || "Avoid meetings before 10:00 AM",
            googleAccessToken: localStorage.getItem("pact_google_access_token") || undefined,
          };

          setUser(profile);
          localStorage.setItem("pact_auth_user", JSON.stringify(profile));
        } catch (error) {
          console.error("Firestore user profile retrieval error:", error);
          // Fallback to Google Auth metadata directly
          const fallbackProfile: UserProfile = {
            id: firebaseUser.uid,
            email: firebaseUser.email || "adityananda.dev@gmail.com",
            fullName: firebaseUser.displayName || "Aditya Nanda",
            avatarUrl: firebaseUser.photoURL || "",
            role: "Lead Architect",
            age: 24,
            schedulePreference: "Avoid meetings before 10:00 AM",
          };
          setUser(fallbackProfile);
        }
      } else {
        setUser(null);
        localStorage.removeItem("pact_auth_user");
        localStorage.removeItem("pact_google_access_token");
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    setIsLoading(true);
    try {
      // Direct Google Sign In via Firebase popup with Google Workspace scopes
      const result = await signInWithPopup(auth, googleProvider);
      const credential = (await import("firebase/auth")).GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;

      if (token) {
        localStorage.setItem("pact_google_access_token", token);
      }

      const fbUser = result.user;
      const userDocRef = doc(db, "users", fbUser.uid);
      const userDoc = await getDoc(userDocRef);

      const existingData = userDoc.exists() ? userDoc.data() : {};
      const updatedProfile: UserProfile = {
        id: fbUser.uid,
        email: fbUser.email || "adityananda.dev@gmail.com",
        fullName: existingData.fullName || fbUser.displayName || "Aditya Nanda",
        avatarUrl: existingData.avatarUrl || fbUser.photoURL || "",
        role: existingData.role || "Lead Architect",
        age: existingData.age || 24,
        schedulePreference:
          existingData.schedulePreference || "Avoid meetings before 10:00 AM",
        googleAccessToken: token || undefined,
      };

      // Persist to Firestore
      await setDoc(
        userDocRef,
        {
          uid: fbUser.uid,
          email: fbUser.email || "adityananda.dev@gmail.com",
          fullName: updatedProfile.fullName,
          avatarUrl: updatedProfile.avatarUrl,
          role: updatedProfile.role,
          age: updatedProfile.age,
          schedulePreference: updatedProfile.schedulePreference,
          lastLoginAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setUser(updatedProfile);
      localStorage.setItem("pact_auth_user", JSON.stringify(updatedProfile));
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
      // Trigger Google Sign-in to authenticate identity and acquire Google Workspace credentials
      const result = await signInWithPopup(auth, googleProvider);
      const credential = (await import("firebase/auth")).GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;

      if (token) {
        localStorage.setItem("pact_google_access_token", token);
      }

      const fbUser = result.user;
      const userDocRef = doc(db, "users", fbUser.uid);

      const profilePayload = {
        uid: fbUser.uid,
        email: fbUser.email || "adityananda.dev@gmail.com",
        fullName: data.fullName || fbUser.displayName || "Aditya Nanda",
        avatarUrl: fbUser.photoURL || "",
        role: data.role || "Lead Architect",
        age: data.age || 24,
        schedulePreference: data.schedulePreference,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      };

      await setDoc(userDocRef, profilePayload, { merge: true });

      const updatedUser: UserProfile = {
        id: fbUser.uid,
        email: fbUser.email || "adityananda.dev@gmail.com",
        fullName: profilePayload.fullName,
        avatarUrl: profilePayload.avatarUrl,
        role: profilePayload.role,
        age: profilePayload.age,
        schedulePreference: profilePayload.schedulePreference,
        googleAccessToken: token || undefined,
      };

      setUser(updatedUser);
      localStorage.setItem("pact_auth_user", JSON.stringify(updatedUser));
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Firebase Profile Setup error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    localStorage.removeItem("pact_auth_user");
    localStorage.removeItem("pact_google_access_token");
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
