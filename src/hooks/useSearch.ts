import { useQuery } from '@tanstack/react-query';
import { postService } from '../services/postService';

export function useSearchPosts(query: string) {
  const clean = query.trim();

  return useQuery({
    queryKey: ['search', clean],
    queryFn: () => postService.searchPosts(clean),
    enabled: clean.length > 0,
    staleTime: 1000 * 60,
  });
}
