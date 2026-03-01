import { useState, useEffect } from "react";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  arrayUnion,
  Timestamp,
} from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "@/lib/firebase";

export interface UserStats {
  uid: string;
  totalVersesMastered: number;
  totalWordsMastered: number;
  lastActive: Timestamp;
  masteredVerses: string[]; // List of ref strings
  streak: number;
}

export function useUserStats() {
  const [user] = useAuthState(auth);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setStats(null);
      setLoading(false);
      return;
    }

    const fetchStats = async () => {
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setStats(docSnap.data() as UserStats);
      } else {
        // Create initial stats
        const initialStats: UserStats = {
          uid: user.uid,
          totalVersesMastered: 0,
          totalWordsMastered: 0,
          lastActive: Timestamp.now(),
          masteredVerses: [],
          streak: 0,
        };
        await setDoc(docRef, initialStats);
        setStats(initialStats);
      }
      setLoading(false);
    };

    fetchStats();
  }, [user]);

  const recordWordMastered = async (verseRef: string) => {
    if (!user) return;
    const docRef = doc(db, "users", user.uid);
    await updateDoc(docRef, {
      totalWordsMastered: increment(1),
      lastActive: Timestamp.now(),
    });
  };

  const recordVerseMastered = async (verseRef: string) => {
    if (!user) return;
    const docRef = doc(db, "users", user.uid);
    await updateDoc(docRef, {
      totalVersesMastered: increment(1),
      masteredVerses: arrayUnion(verseRef),
      lastActive: Timestamp.now(),
    });
  };

  return { stats, loading, recordWordMastered, recordVerseMastered };
}
