import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { firestore } from '../services/firebase';
import { authService } from '../services/authService';
import { useAuthStore } from '../stores/useAuthStore';

export function useMoodBoard() {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen to real-time aggregate campus live mood
    const unsubscribe = firestore()
      .collection('moodLive')
      .doc('current')
      .onSnapshot(
        (doc) => {
          if (doc.exists) {
            setCounts(doc.data()?.counts || {});
          }
          setLoading(false);
        },
        (err) => {
          console.warn('Moodboard listener error:', err);
          setLoading(false);
        }
      );

    return () => unsubscribe();
  }, []);

  return { counts, loading };
}

export function useCheckInMood() {
  const queryClient = useQueryClient();
  const { user, setUser } = useAuthStore();

  return useMutation({
    mutationFn: async (mood: string) => {
      const res = await authService.checkInMood(mood);
      if (user) {
        setUser({
          ...user,
          lastMood: mood,
          currentStreak: res.currentStreak,
          longestStreak: res.longestStreak,
        });
      }
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });
}
