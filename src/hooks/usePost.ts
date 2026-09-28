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
    },
  });
}
