
import { useEffect, useState } from "react";
import { User as FirebaseUser, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { User } from '@/types/user';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authSource, setAuthSource] = useState<'firebase' | 'oidc' | null>(null);
  // Only use Firebase Auth
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (cancelled) return;
      if (firebaseUser) {
        const userRef = doc(db, "users", firebaseUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = { id: firebaseUser.uid, ...userSnap.data() } as User;
          setUser(userData);
          localStorage.setItem('firebaseUser', JSON.stringify(userData));
        } else {
          const newUser: User = {
            id: firebaseUser.uid,
            email: firebaseUser.email || undefined,
            firstName: firebaseUser.displayName?.split(" ")[0] || "",
            lastName: firebaseUser.displayName?.split(" ")[1] || "",
            username: firebaseUser.email?.split("@")[0] || firebaseUser.uid,
            profileImageUrl: firebaseUser.photoURL || "",
            bio: "",
            role: "user",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          await setDoc(userRef, newUser);
          setUser(newUser);
          localStorage.setItem('firebaseUser', JSON.stringify(newUser));
        }
        setAuthSource('firebase');
      } else {
        setUser(null);
        setAuthSource(null);
      }
      setIsLoading(false);
    });
    return () => { cancelled = true; unsubscribe(); };
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    authSource,
  };
}
