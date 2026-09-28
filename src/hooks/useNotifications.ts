import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { firestore } from '../services/firebase';
import { NotificationModel } from '../types/user';
import { useUIStore } from '../stores/useUIStore';

export function useNotifications(uid?: string) {
  return useQuery({
    queryKey: ['notifications', uid],
    queryFn: async (): Promise<NotificationModel[]> => {
      if (!uid) return [];
      const snap = await firestore()
        .collection('notifications')
        .where('recipientUid', '==', uid)
        .orderBy('createdAt', 'desc')
        .limit(50)
        .get();

      return snap.docs.map((doc) => {
        const d = doc.data();
        return {
          id: doc.id,
          recipientUid: d.recipientUid,
          type: d.type || 'upvote',
          message: d.message || '',
          postId: d.postId || null,
          postPreview: d.postPreview || null,
          isRead: Boolean(d.isRead),
          createdAt: d.createdAt ? d.createdAt.toDate() : new Date(),
        };
      });
    },
    enabled: !!uid,
  });
}

export function useUnreadNotificationsBadge(uid?: string) {
  const setUnreadCount = useUIStore((s) => s.setUnreadAlertsCount);

  useEffect(() => {
    if (!uid) {
      setUnreadCount(0);
      return;
    }

    const unsubscribe = firestore()
      .collection('notifications')
      .where('recipientUid', '==', uid)
      .where('isRead', '==', false)
      .onSnapshot(
        (snap) => {
          setUnreadCount(snap ? snap.size : 0);
        },
        (err) => {
          console.warn('Unread notifications listener error:', err);
        }
      );

    return () => unsubscribe();
  }, [uid]);
}

export function useMarkAllNotificationsRead(uid?: string) {
  const queryClient = useQueryClient();
  const setUnreadCount = useUIStore((s) => s.setUnreadAlertsCount);

  return useMutation({
    mutationFn: async () => {
      if (!uid) return;
      const unreadSnap = await firestore()
        .collection('notifications')
        .where('recipientUid', '==', uid)
        .where('isRead', '==', false)
        .get();

      const batch = firestore().batch();
      unreadSnap.docs.forEach((doc) => {
        batch.update(doc.ref, { isRead: true });
      });
      await batch.commit();
      setUnreadCount(0);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', uid] });
    },
  });
}
