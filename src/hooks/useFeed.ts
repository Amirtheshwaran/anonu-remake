import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { postService } from '../services/postService';
import { FeedSort } from '../types/post';

export function useFeed(sort: FeedSort = 'hot', campusId?: string) {
  return useQuery({
    queryKey: ['feed', sort, campusId],
    queryFn: () => postService.getFeed(sort, 25, campusId),
    staleTime: 1000 * 30, // 30 seconds
  });
}

export function useUserPosts(uid?: string) {
  return useQuery({
    queryKey: ['userPosts', uid],
    queryFn: () => (uid ? postService.getUserPosts(uid) : Promise.resolve([])),
    enabled: !!uid,
    staleTime: 1000 * 30,
  });
}

export function useVoteMutation(postId: string, uid?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (isUpvote: boolean) => {
      if (!uid) throw new Error('Must be signed in to vote.');
      return postService.vote(postId, uid, isUpvote);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
      queryClient.invalidateQueries({ queryKey: ['userVote', postId] });
    },
  });
}

export function useUserVote(postId: string, uid?: string) {
  return useQuery({
    queryKey: ['userVote', postId, uid],
    queryFn: () => (uid ? postService.getUserVote(postId, uid) : Promise.resolve(null)),
    enabled: !!uid && !!postId,
  });
}
