import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { postService } from '../services/postService';
import { useAuthStore } from '../stores/useAuthStore';

export function useBlockedPosts() {
  const user = useAuthStore((s) => s.user);
  const [blockedPostIds, setBlockedPostIds] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user?.uid) {
      setBlockedPostIds(new Set());
      return;
    }

    const unsubscribe = postService.subscribeBlockedPosts(user.uid, (ids) => {
      setBlockedPostIds(ids);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const blockMutation = useMutation({
    mutationFn: async (params: { postId?: string; commentId?: string }) => {
      return postService.blockAuthor(params);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });

  return {
    blockedPostIds,
    blockAuthor: blockMutation.mutateAsync,
    isBlocking: blockMutation.isPending,
  };
}
