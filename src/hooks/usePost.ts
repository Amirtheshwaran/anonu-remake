import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { postService } from '../services/postService';
import { PostIdentity } from '../types/post';

export function usePost(postId: string) {
  return useQuery({
    queryKey: ['post', postId],
    queryFn: () => postService.getPost(postId),
    enabled: !!postId,
  });
}

export function useComments(postId: string) {
  return useQuery({
    queryKey: ['comments', postId],
    queryFn: () => postService.getComments(postId),
    enabled: !!postId,
  });
}

export function useCreateComment(postId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      content: string;
      identity: PostIdentity;
      parentCommentId?: string | null;
    }) => {
      return postService.createComment({
        postId,
        ...params,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}

export function useVotePoll(postId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (optionIndex: number) => {
      return postService.votePoll(postId, optionIndex);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}

export function useRepostMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      return postService.repostPost(postId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['infiniteFeed'] });
    },
  });
}

export function useRsvpMutation(postId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (isGoing: boolean) => {
      return postService.rsvpEvent(postId, isGoing);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
      queryClient.invalidateQueries({ queryKey: ['userRsvp', postId] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['infiniteFeed'] });
    },
  });
}

export function useUserRsvp(postId: string, uid?: string) {
  return useQuery({
    queryKey: ['userRsvp', postId, uid],
    queryFn: () => (uid ? postService.getUserRsvp(postId, uid) : Promise.resolve(false)),
    enabled: !!postId && !!uid,
  });
}

export function useBookmarkMutation(postId: string, uid?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ post, isBookmarked }: { post: any; isBookmarked: boolean }) => {
      if (!uid) throw new Error('Must be signed in to bookmark.');
      if (isBookmarked) {
        await postService.unbookmarkPost(uid, postId);
      } else {
        await postService.bookmarkPost(uid, post);
      }
      return !isBookmarked;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['isBookmarked', postId, uid] });
      queryClient.invalidateQueries({ queryKey: ['bookmarkedPosts', uid] });
    },
  });
}

export function useIsBookmarked(postId: string, uid?: string) {
  return useQuery({
    queryKey: ['isBookmarked', postId, uid],
    queryFn: () => (uid ? postService.isPostBookmarked(uid, postId) : Promise.resolve(false)),
    enabled: !!postId && !!uid,
  });
}

export function useBookmarkedPosts(uid?: string) {
  return useQuery({
    queryKey: ['bookmarkedPosts', uid],
    queryFn: () => (uid ? postService.getBookmarkedPosts(uid) : Promise.resolve([])),
    enabled: !!uid,
  });
}
