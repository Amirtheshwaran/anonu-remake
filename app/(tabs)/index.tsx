import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { AnonUTheme } from '../../src/constants/theme';
import { DEFAULT_CAMPUSES } from '../../src/constants/campuses';
import { FeedSort, PostModel } from '../../src/types/post';
import { useFeed, useVoteMutation, useUserVote } from '../../src/hooks/useFeed';
import { useMoodBoard, useCheckInMood } from '../../src/hooks/useMood';
import { useRepostMutation, useVotePoll } from '../../src/hooks/usePost';
import { postService } from '../../src/services/postService';
import { useAuthStore } from '../../src/stores/useAuthStore';
import { PostCard } from '../../src/components/PostCard';
import { MoodBar } from '../../src/components/MoodBar';
import { BrutalistButton } from '../../src/components/BrutalistButton';
import { BrutalistCard } from '../../src/components/BrutalistCard';
import { BrutalistDialog } from '../../src/components/BrutalistDialog';
import { BrutalistBottomBar } from './_layout';

export default function FeedScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const selectedCampusId = useAuthStore((s) => s.selectedCampusId);
  const currentCampus = DEFAULT_CAMPUSES[selectedCampusId] || DEFAULT_CAMPUSES['uncc'];

  const [selectedSort, setSelectedSort] = useState<FeedSort>('hot');

  const { data: posts, isLoading, isRefetching, refetch } = useFeed(selectedSort, selectedCampusId);
  const { counts: moodCounts } = useMoodBoard(selectedCampusId);
  const checkInMutation = useCheckInMood();
  const repostMutation = useRepostMutation();

  // Modals state
  const [repostTarget, setRepostTarget] = useState<PostModel | null>(null);
  const [reportTargetPostId, setReportTargetPostId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState<string>('Harassment or Hate');

  const sorts: { key: FeedSort; label: string }[] = [
    { key: 'hot', label: '🔥 HOT' },
    { key: 'recent', label: '⚡ NEW' },
    { key: 'top', label: '🏆 TOP' },
  ];

  const reportReasons = [
    'Harassment or Hate',
    'Misinformation',
    'Doxxing / Personal Info',
    'Spam or Scam',
    'Inappropriate Content',
  ];

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

  const handleConfirmReport = async () => {
    if (!reportTargetPostId) return;
    try {
      await postService.reportPost(reportTargetPostId, reportReason);
    } catch (err) {
      console.error('Report error:', err);
    } finally {
      setReportTargetPostId(null);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* App Bar */}
      <View style={styles.appBar}>
        <View style={styles.brandRow}>
          <View style={styles.logoBadgeWrapper}>
            <View style={styles.logoShadow} />
            <View style={styles.logoBadge}>
              <Text style={styles.logoText}>AnonU</Text>
            </View>
          </View>

          <View style={styles.campusBadge}>
            <Text style={styles.campusBadgeText}>{currentCampus.shortName.toUpperCase()}</Text>
          </View>
        </View>

        <Pressable
          onPress={() => router.push('/search')}
          style={styles.searchButtonWrapper}
        >
          <View style={styles.searchShadow} />
          <View style={styles.searchButton}>
            <Text style={styles.searchIcon}>🔍</Text>
          </View>
        </Pressable>
      </View>

      {/* Campus Mood Bar */}
      <MoodBar
        moodCounts={moodCounts}
        campusName={currentCampus.shortName}
        lastMood={user?.lastMood}
        currentStreak={user?.currentStreak}
        onCheckIn={async (mood) => {
          await checkInMutation.mutateAsync(mood);
        }}
      />

      {/* Segmented Feed Tabs */}
      <View style={styles.tabBarWrapper}>
        <View style={styles.tabBarShadow} />
        <View style={styles.tabBar}>
          {sorts.map((s) => {
            const isSelected = selectedSort === s.key;
            return (
              <Pressable
                key={s.key}
                onPress={() => setSelectedSort(s.key)}
                style={[styles.tabButton, isSelected && styles.tabButtonActive]}
              >
                <Text
                  style={[styles.tabText, isSelected && styles.tabTextActive]}
                >
                  {s.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Main Posts List */}
      <View style={styles.listContainer}>
        {isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={AnonUTheme.black} />
          </View>
        ) : !posts || posts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <BrutalistCard padding={24} style={styles.emptyCard}>
              <View style={styles.emptyIconBox}>
                <Text style={styles.emptyEmoji}>📢</Text>
              </View>
              <Text style={styles.emptyTitle}>SILENCE ON CAMPUS</Text>
              <Text style={styles.emptySubtitle}>
                No posts in this feed yet. Speak up anonymously or identified.
              </Text>
              <View style={{ height: 16 }} />
              <BrutalistButton
                text="CREATE FIRST POST →"
                backgroundColor={AnonUTheme.popYellow}
                onPress={() => router.push('/compose')}
              />
            </BrutalistCard>
          </View>
        ) : (
          <FlashList
            data={posts}
            keyExtractor={(item) => item.id}
            estimatedItemSize={240}
            refreshing={isRefetching}
            onRefresh={refetch}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <PostItemRow
                post={item}
                uid={user?.uid}
                onOpenPost={() => router.push(`/post/${item.id}` as any)}
                onRepost={() => setRepostTarget(item)}
                onReport={() => setReportTargetPostId(item.id)}
              />
            )}
          />
        )}
      </View>

      {/* Floating Action Button */}
      <Pressable
        onPress={() => router.push('/compose')}
        style={styles.fabWrapper}
      >
        <View style={styles.fabShadow} />
        <View style={styles.fab}>
          <Text style={styles.fabIcon}>✏️</Text>
          <Text style={styles.fabText}>POST</Text>
        </View>
      </Pressable>

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

      {/* Report Modal */}
      {reportTargetPostId !== null && (
        <BrutalistDialog
          visible={true}
          title="REPORT PUBLICATION"
          message={`Select violation reason for campus moderator review:\n\n${reportReasons.map((r, i) => `${i + 1}. ${r}`).join('\n')}`}
          confirmLabel="SUBMIT REPORT"
          confirmColor={AnonUTheme.downvoteRed}
          onConfirm={handleConfirmReport}
          onCancel={() => setReportTargetPostId(null)}
        />
      )}

      {/* Brutalist Bottom Bar */}
      <BrutalistBottomBar />
    </SafeAreaView>
  );
}

function PostItemRow({
  post,
  uid,
  onOpenPost,
  onRepost,
  onReport,
}: {
  post: PostModel;
  uid?: string;
  onOpenPost: () => void;
  onRepost: () => void;
  onReport: () => void;
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
      onReport={onReport}
      onPollVote={(idx) => pollVoteMutation.mutate(idx)}
    />
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AnonUTheme.bgCream,
  },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  campusBadge: {
    backgroundColor: AnonUTheme.black,
    borderRadius: AnonUTheme.radiusSm,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  campusBadgeText: {
    color: AnonUTheme.popYellow,
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  logoBadgeWrapper: {
    position: 'relative',
    height: 38,
  },
  logoShadow: {
    position: 'absolute',
    top: 2,
    left: 2,
    right: 0,
    bottom: 0,
    backgroundColor: AnonUTheme.black,
    borderRadius: AnonUTheme.radiusSm,
    width: '100%',
    height: 38,
  },
  logoBadge: {
    height: 38,
    backgroundColor: AnonUTheme.popYellow,
    borderColor: AnonUTheme.black,
    borderWidth: AnonUTheme.borderWidthThin,
    borderRadius: AnonUTheme.radiusSm,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    color: AnonUTheme.black,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  searchButtonWrapper: {
    position: 'relative',
    width: 38,
    height: 38,
  },
  searchShadow: {
    position: 'absolute',
    top: 2,
    left: 2,
    right: 0,
    bottom: 0,
    backgroundColor: AnonUTheme.black,
    borderRadius: AnonUTheme.radiusSm,
    width: 38,
    height: 38,
  },
  searchButton: {
    width: 38,
    height: 38,
    backgroundColor: AnonUTheme.bgSurface,
    borderColor: AnonUTheme.black,
    borderWidth: AnonUTheme.borderWidthThin,
    borderRadius: AnonUTheme.radiusSm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchIcon: {
    fontSize: 16,
  },
  tabBarWrapper: {
    position: 'relative',
    marginHorizontal: 14,
    marginVertical: 4,
  },
  tabBarShadow: {
    position: 'absolute',
    top: 2.5,
    left: 2.5,
    right: 0,
    bottom: 0,
    backgroundColor: AnonUTheme.black,
    borderRadius: AnonUTheme.radiusSm,
    width: '100%',
    height: 44,
  },
  tabBar: {
    flexDirection: 'row',
    height: 44,
    backgroundColor: AnonUTheme.bgSurface,
    borderColor: AnonUTheme.black,
    borderWidth: AnonUTheme.borderWidthThin,
    borderRadius: AnonUTheme.radiusSm,
    padding: 3,
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: AnonUTheme.radiusSm - 2,
  },
  tabButtonActive: {
    backgroundColor: AnonUTheme.popYellow,
    borderColor: AnonUTheme.black,
    borderWidth: AnonUTheme.borderWidthThin,
  },
  tabText: {
    color: AnonUTheme.black,
    fontWeight: '700',
    fontSize: 12.5,
    letterSpacing: 0.5,
  },
  tabTextActive: {
    fontWeight: '900',
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingTop: 6,
    paddingBottom: 80,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  emptyIconBox: {
    padding: 12,
    backgroundColor: AnonUTheme.popMint,
    borderColor: AnonUTheme.black,
    borderWidth: 2,
    borderRadius: 8,
    marginBottom: 14,
  },
  emptyEmoji: {
    fontSize: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: AnonUTheme.black,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  emptySubtitle: {
    textAlign: 'center',
    color: AnonUTheme.textSecondary,
    fontSize: 12.5,
    fontWeight: '600',
    lineHeight: 18,
  },
  fabWrapper: {
    position: 'absolute',
    bottom: 74,
    right: 18,
  },
  fabShadow: {
    position: 'absolute',
    top: 3.5,
    left: 3.5,
    right: 0,
    bottom: 0,
    backgroundColor: AnonUTheme.black,
    borderRadius: AnonUTheme.radiusSm,
    width: '100%',
    height: '100%',
  },
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AnonUTheme.popYellow,
    borderColor: AnonUTheme.black,
    borderWidth: AnonUTheme.borderWidth,
    borderRadius: AnonUTheme.radiusSm,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  fabIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  fabText: {
    color: AnonUTheme.black,
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 0.5,
  },
});
