import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { firestore } from '../services/firebase';
import { authService } from '../services/authService';
import { useAuthStore } from '../stores/useAuthStore';

export function useMoodBoard(campusId?: string) {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const targetCampus = campusId || 'uncc';

  useEffect(() => {
    // Listen to real-time aggregate campus live mood for specific campus
    const unsubscribe = firestore()
      .collection('moodLive')
      .doc(targetCampus)
      .onSnapshot(
        (doc) => {
          if (doc.exists) {
            setCounts(doc.data()?.counts || {});
          } else {
            // Check fallback current doc if campus doc not yet seeded
            firestore()
              .collection('moodLive')
              .doc('current')
              .get()
              .then((fallbackDoc) => {
                if (fallbackDoc.exists) {
                  setCounts(fallbackDoc.data()?.counts || {});
                }
              })
              .catch(() => {});
          }
          setLoading(false);
        },
        (err) => {
          console.warn('Moodboard listener error:', err);
          setLoading(false);
        }
      );

    return () => unsubscribe();
  }, [targetCampus]);

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
