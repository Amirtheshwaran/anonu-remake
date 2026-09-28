import { useQuery } from '@tanstack/react-query';
import { postService } from '../services/postService';

export function useSearchPosts(query: string, campusId?: string) {
  const clean = query.trim();

  return useQuery({
    queryKey: ['search', clean, campusId],
    queryFn: () => postService.searchPosts(clean, campusId),
    enabled: clean.length > 0,
    staleTime: 1000 * 60,
  });
}
