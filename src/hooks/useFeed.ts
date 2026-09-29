import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { postService } from '../services/postService';
import { FeedSort, PostModel } from '../types/post';

export function useFeed(
  sort: FeedSort = 'hot',
  campusId?: string,
  blockedPostIds?: Set<string>
) {
  return useQuery({
    queryKey: ['feed', sort, campusId, blockedPostIds ? Array.from(blockedPostIds) : []],
    queryFn: async () => {
      const posts = await postService.getFeed(sort, 25, campusId);
      if (blockedPostIds && blockedPostIds.size > 0) {
        return posts.filter((p) => !blockedPostIds.has(p.id));
      }
      return posts;
    },
    staleTime: 1000 * 30, // 30 seconds
  });
}

export function useInfiniteFeed(
  sort: FeedSort = 'hot',
  campusId?: string,
  blockedPostIds?: Set<string>
) {
  return useInfiniteQuery({
    queryKey: ['infiniteFeed', sort, campusId, blockedPostIds ? Array.from(blockedPostIds) : []],
    queryFn: async ({ pageParam }) => {
      const result = await postService.getFeedPaginated(sort, 20, campusId, pageParam);
      if (blockedPostIds && blockedPostIds.size > 0) {
        result.posts = result.posts.filter((p) => !blockedPostIds.has(p.id));
      }
      return result;
    },
    initialPageParam: null as any,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.lastDoc : undefined),
    staleTime: 1000 * 30,
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
    onMutate: async (isUpvote: boolean) => {
      // 1. Tactile haptic feedback
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}

      // 2. Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['userVote', postId, uid] });
      await queryClient.cancelQueries({ queryKey: ['post', postId] });
      await queryClient.cancelQueries({ queryKey: ['infiniteFeed'] });
      await queryClient.cancelQueries({ queryKey: ['feed'] });

      // 3. Snapshot previous values for rollback
      const previousVote = queryClient.getQueryData<boolean | null>(['userVote', postId, uid]);
      const previousPost = queryClient.getQueryData<PostModel | null>(['post', postId]);

      // Calculate optimistic vote state
      let nextVote: boolean | null = isUpvote;
      let scoreDelta = 0;
      let upvoteDelta = 0;
      let downvoteDelta = 0;

      if (previousVote === isUpvote) {
        // Tapping same vote again removes vote
        nextVote = null;
        if (isUpvote) {
          upvoteDelta = -1;
          scoreDelta = -1;
        } else {
          downvoteDelta = -1;
          scoreDelta = 1;
        }
      } else if (previousVote === null || previousVote === undefined) {
        // Fresh vote
        if (isUpvote) {
          upvoteDelta = 1;
          scoreDelta = 1;
        } else {
          downvoteDelta = 1;
          scoreDelta = -1;
        }
      } else {
        // Flipping vote from up to down or vice-versa
        if (isUpvote) {
          downvoteDelta = -1;
          upvoteDelta = 1;
          scoreDelta = 2;
        } else {
          upvoteDelta = -1;
          downvoteDelta = 1;
          scoreDelta = -2;
        }
      }

      // Optimistically update userVote query
      queryClient.setQueryData(['userVote', postId, uid], nextVote);

      // Optimistically update single post query
      if (previousPost) {
        queryClient.setQueryData<PostModel>(['post', postId], {
          ...previousPost,
          upvotes: Math.max(0, previousPost.upvotes + upvoteDelta),
          downvotes: Math.max(0, previousPost.downvotes + downvoteDelta),
          score: previousPost.score + scoreDelta,
        });
      }

      // Optimistically update post in infinite feed queries
      queryClient.setQueriesData({ queryKey: ['infiniteFeed'] }, (oldData: any) => {
        if (!oldData?.pages) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map((page: any) => ({
            ...page,
            posts: page.posts.map((p: PostModel) => {
              if (p.id !== postId) return p;
              return {
                ...p,
                upvotes: Math.max(0, p.upvotes + upvoteDelta),
                downvotes: Math.max(0, p.downvotes + downvoteDelta),
                score: p.score + scoreDelta,
              };
            }),
          })),
        };
      });

      // Optimistically update standard feed queries
      queryClient.setQueriesData({ queryKey: ['feed'] }, (oldPosts: PostModel[] | undefined) => {
        if (!oldPosts) return oldPosts;
        return oldPosts.map((p) => {
          if (p.id !== postId) return p;
          return {
            ...p,
            upvotes: Math.max(0, p.upvotes + upvoteDelta),
            downvotes: Math.max(0, p.downvotes + downvoteDelta),
            score: p.score + scoreDelta,
          };
        });
      });

      return { previousVote, previousPost };
    },
    onError: (err, _isUpvote, context) => {
      // Rollback on failure
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch {}

      if (context?.previousVote !== undefined) {
        queryClient.setQueryData(['userVote', postId, uid], context.previousVote);
      }
      if (context?.previousPost !== undefined) {
        queryClient.setQueryData(['post', postId], context.previousPost);
      }
      queryClient.invalidateQueries({ queryKey: ['infiniteFeed'] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['userVote', postId, uid] });
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
      queryClient.invalidateQueries({ queryKey: ['infiniteFeed'] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
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
