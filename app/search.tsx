import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { AnonUTheme } from '../src/constants/theme';
import { AnonUConstants } from '../src/constants/config';
import { PostModel } from '../src/types/post';
import { useSearchPosts } from '../src/hooks/useSearch';
import { useAuthStore } from '../src/stores/useAuthStore';
import { useVoteMutation, useUserVote } from '../src/hooks/useFeed';
import { useVotePoll, useRepostMutation } from '../src/hooks/usePost';
import { postService } from '../src/services/postService';
import { PostCard } from '../src/components/PostCard';
import { BrutalistCard } from '../src/components/BrutalistCard';
import { BrutalistButton } from '../src/components/BrutalistButton';
import { BrutalistDialog } from '../src/components/BrutalistDialog';

export default function SearchScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const selectedCampusId = useAuthStore((s) => s.selectedCampusId);

  const [searchTerm, setSearchTerm] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [repostTarget, setRepostTarget] = useState<PostModel | null>(null);

  const { data: results, isLoading } = useSearchPosts(activeQuery, selectedCampusId);
  const repostMutation = useRepostMutation();

  const handleSearch = (term: string) => {
    setActiveQuery(term.trim());
  };

  const handleConfirmRepost = async () => {
    if (!repostTarget) return;
    try {
      await repostMutation.mutateAsync(repostTarget.id);
    } catch (err) {
      console.error('Repost error:', err);
    } finally {
      setRepostTarget(null);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Search Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backWrapper}>
          <View style={styles.backShadow} />
          <View style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </View>
        </Pressable>

        <View style={styles.inputWrapper}>
          <View style={styles.inputShadow} />
          <View style={styles.inputFront}>
            <TextInput
              value={searchTerm}
              onChangeText={setSearchTerm}
              placeholder="Search tags or keywords..."
              placeholderTextColor={AnonUTheme.textMuted}
              style={styles.searchInput}
              returnKeyType="search"
              onSubmitEditing={() => handleSearch(searchTerm)}
              autoFocus
            />
            {searchTerm.length > 0 && (
              <Pressable
                onPress={() => {
                  setSearchTerm('');
                  setActiveQuery('');
                }}
                style={styles.clearBtn}
              >
                <Text style={styles.clearText}>✕</Text>
              </Pressable>
            )}
          </View>
        </View>

        <BrutalistButton
          text="GO"
          backgroundColor={AnonUTheme.popYellow}
          shadowOffset={{ width: 2, height: 2 }}
          paddingVertical={7}
          paddingHorizontal={12}
          onPress={() => handleSearch(searchTerm)}
        />
      </View>

      {/* Main Body */}
      <View style={styles.content}>
        {/* Trending Tags Section (when not searched yet) */}
        {!activeQuery && (
          <View style={styles.trendingSection}>
            <View style={styles.trendingHeader}>
              <View style={styles.exploreBadge}>
                <Text style={styles.exploreText}>EXPLORE</Text>
              </View>
              <Text style={styles.trendingTitle}>TRENDING CAMPUS TOPICS</Text>
            </View>

            <View style={styles.tagsGrid}>
              {AnonUConstants.suggestedTags.map((tag) => (
                <Pressable
                  key={tag}
                  onPress={() => {
                    setSearchTerm(tag);
                    handleSearch(tag);
                  }}
                  style={styles.trendingTagWrapper}
                >
                  <View style={styles.tagShadow} />
                  <View style={styles.tagFront}>
                    <Text style={styles.tagLabel}>{`#${tag}`}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Loading Spinner */}
        {isLoading && (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={AnonUTheme.black} />
          </View>
        )}

        {/* No Results */}
        {!isLoading && activeQuery && (!results || results.length === 0) && (
          <View style={styles.emptyContainer}>
            <BrutalistCard padding={20} style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyTitle}>
                {`NO MATCHES FOR "${activeQuery}"`}
              </Text>
              <Text style={styles.emptySub}>
                Try searching by tag (e.g. #rant, #study) or broader terms.
              </Text>
            </BrutalistCard>
          </View>
        )}

        {/* Results List */}
        {!isLoading && results && results.length > 0 && (
          <FlashList
            data={results}
            keyExtractor={(item) => item.id}
            estimatedItemSize={240}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <SearchResultRow
                post={item}
                uid={user?.uid}
                onOpenPost={() => router.push(`/post/${item.id}` as any)}
                onRepost={() => setRepostTarget(item)}
              />
            )}
          />
        )}
      </View>

      {/* Repost Confirmation Dialog */}
      <BrutalistDialog
        visible={repostTarget !== null}
        title="REPOST ON CAMPUS?"
        message="This will repost the publication anonymously to your campus feed under your current pseudonym."
        confirmLabel="REPOST"
        confirmColor={AnonUTheme.popMint}
        onConfirm={handleConfirmRepost}
        onCancel={() => setRepostTarget(null)}
      />
    </SafeAreaView>
  );
}

function SearchResultRow({
  post,
  uid,
  onOpenPost,
  onRepost,
}: {
  post: PostModel;
  uid?: string;
  onOpenPost: () => void;
  onRepost: () => void;
}) {
  const { data: userVote } = useUserVote(post.id, uid);
  const voteMutation = useVoteMutation(post.id, uid);
  const pollVoteMutation = useVotePoll(post.id);

  return (
    <PostCard
      post={post}
      userVote={userVote}
      onPress={onOpenPost}
      onUpvote={() => voteMutation.mutate(true)}
      onDownvote={() => voteMutation.mutate(false)}
      onComment={onOpenPost}
      onRepost={onRepost}
      onReport={() => postService.reportPost(post.id, 'Reported from search')}
      onPollVote={(idx) => pollVoteMutation.mutate(idx)}
    />
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AnonUTheme.bgCream,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomColor: AnonUTheme.black,
    borderBottomWidth: AnonUTheme.borderWidthThin,
  },
  backWrapper: {
    position: 'relative',
    width: 36,
    height: 36,
    marginRight: 10,
  },
  backShadow: {
    position: 'absolute',
    top: 2,
    left: 2,
    right: 0,
    bottom: 0,
    backgroundColor: AnonUTheme.black,
    borderRadius: AnonUTheme.radiusSm,
    width: 36,
    height: 36,
  },
  backButton: {
    width: 36,
    height: 36,
    backgroundColor: AnonUTheme.bgSurface,
    borderColor: AnonUTheme.black,
    borderWidth: AnonUTheme.borderWidthThin,
    borderRadius: AnonUTheme.radiusSm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 18,
    fontWeight: '900',
    color: AnonUTheme.black,
  },
  inputWrapper: {
    position: 'relative',
    flex: 1,
    height: 40,
    marginRight: 10,
  },
  inputShadow: {
    position: 'absolute',
    top: 2,
    left: 2,
    right: 0,
    bottom: 0,
    backgroundColor: AnonUTheme.black,
    borderRadius: AnonUTheme.radiusSm,
    width: '100%',
    height: 40,
  },
  inputFront: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    backgroundColor: AnonUTheme.bgSurface,
    borderColor: AnonUTheme.black,
    borderWidth: AnonUTheme.borderWidthThin,
    borderRadius: AnonUTheme.radiusSm,
    paddingHorizontal: 10,
  },
  searchInput: {
    flex: 1,
    fontWeight: '700',
    fontSize: 14,
    color: AnonUTheme.black,
  },
  clearBtn: {
    padding: 4,
  },
  clearText: {
    fontSize: 14,
    color: AnonUTheme.black,
    fontWeight: '900',
  },
  content: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendingSection: {
    padding: 16,
  },
  trendingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  exploreBadge: {
    backgroundColor: AnonUTheme.popYellow,
    borderColor: AnonUTheme.black,
    borderWidth: 1.5,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 8,
  },
  exploreText: {
    fontSize: 10,
    fontWeight: '900',
    color: AnonUTheme.black,
    letterSpacing: 0.5,
  },
  trendingTitle: {
    fontSize: 12.5,
    fontWeight: '900',
    color: AnonUTheme.black,
    letterSpacing: 0.5,
  },
  tagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  trendingTagWrapper: {
    position: 'relative',
    height: 34,
    marginRight: 8,
    marginBottom: 8,
  },
  tagShadow: {
    position: 'absolute',
    top: 2,
    left: 2,
    right: 0,
    bottom: 0,
    backgroundColor: AnonUTheme.black,
    borderRadius: AnonUTheme.radiusSm,
    width: '100%',
    height: 34,
  },
  tagFront: {
    height: 34,
    backgroundColor: AnonUTheme.bgSurface,
    borderColor: AnonUTheme.black,
    borderWidth: 1.5,
    borderRadius: AnonUTheme.radiusSm,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagLabel: {
    fontWeight: '800',
    fontSize: 12.5,
    color: AnonUTheme.black,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyCard: {
    alignItems: 'center',
    width: '100%',
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: AnonUTheme.black,
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 12,
    fontWeight: '600',
    color: AnonUTheme.textSecondary,
    textAlign: 'center',
  },
  listContent: {
    paddingVertical: 6,
  },
});
