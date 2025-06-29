
import { useEffect, useState } from "react";
import { User as FirebaseUser, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { User } from '@/types/user';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authSource, setAuthSource] = useState<'firebase' | 'oidc' | null>(null);

  // Try OIDC backend auth first
  useEffect(() => {
    let cancelled = false;
    async function fetchBackendUser() {
      setIsLoading(true);
      try {
        const res = await fetch('/api/auth/user', { credentials: 'include' });
        if (res.ok) {
          const backendUser = await res.json();
          if (!cancelled) {
            setUser(backendUser);
            setAuthSource('oidc');
            setIsLoading(false);
            return;
          }
        }
      } catch {}
      // If not logged in OIDC, fallback to Firebase
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
        if (cancelled) return;
        if (firebaseUser) {
          const userRef = doc(db, "users", firebaseUser.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            setUser({ id: firebaseUser.uid, ...userSnap.data() } as User);
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
          }
          setAuthSource('firebase');
        } else {
          setUser(null);
          setAuthSource(null);
        }
        setIsLoading(false);
      });
      return () => unsubscribe();
    }
    fetchBackendUser();
    return () => { cancelled = true; };
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    authSource,
  };
}
