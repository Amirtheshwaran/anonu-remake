import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Pressable,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { AnonUTheme } from '../../src/constants/theme';
import { DEFAULT_CAMPUSES } from '../../src/constants/campuses';
import { FeedSort, PostModel } from '../../src/types/post';
import { useInfiniteFeed, useVoteMutation, useUserVote } from '../../src/hooks/useFeed';
import { useBlockedPosts } from '../../src/hooks/useBlockedPosts';
import { useMoodBoard, useCheckInMood } from '../../src/hooks/useMood';
import { useRepostMutation, useVotePoll } from '../../src/hooks/usePost';
import { useOutboxStore } from '../../src/stores/useOutboxStore';
import { postService } from '../../src/services/postService';
import { useAuthStore } from '../../src/stores/useAuthStore';
import { PostCard } from '../../src/components/PostCard';
import { MoodBar } from '../../src/components/MoodBar';
import { BrutalistButton } from '../../src/components/BrutalistButton';
import { BrutalistCard } from '../../src/components/BrutalistCard';
import { BrutalistDialog } from '../../src/components/BrutalistDialog';
import { FeedSkeletonList } from '../../src/components/BrutalistSkeleton';
import { BrutalistBottomBar } from './_layout';

export default function FeedScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const selectedCampusId = useAuthStore((s) => s.selectedCampusId);
  const currentCampus = DEFAULT_CAMPUSES[selectedCampusId] || DEFAULT_CAMPUSES['uncc'];

  const [selectedSort, setSelectedSort] = useState<FeedSort>('hot');

  const { blockedPostIds, blockAuthor } = useBlockedPosts();
  const outboxQueue = useOutboxStore((s) => s.queue);
  const processOutbox = useOutboxStore((s) => s.processQueue);

  const {
    data: infiniteData,
    isLoading,
    isRefetching,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteFeed(selectedSort, selectedCampusId, blockedPostIds);

  const posts = infiniteData?.pages.flatMap((page) => page.posts) || [];
  const { counts: moodCounts } = useMoodBoard(selectedCampusId);
  const checkInMutation = useCheckInMood();
  const repostMutation = useRepostMutation();

  const handleSyncOutbox = async () => {
    if (outboxQueue.length === 0) return;
    await processOutbox(async (item) => {
      await postService.createPost({
        content: item.content,
        identity: item.identity,
        type: item.type,
        tags: item.tags,
        imageUrls: item.imageUrls,
        poll: item.poll,
        timeLimitHours: item.timeLimitHours,
      });
      refetch();
    });
  };

  // Modals state
  const [repostTarget, setRepostTarget] = useState<PostModel | null>(null);
  const [optionsTargetPost, setOptionsTargetPost] = useState<PostModel | null>(null);
  const [blockTargetPost, setBlockTargetPost] = useState<PostModel | null>(null);
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

  const handleStartReport = () => {
    if (!optionsTargetPost) return;
    const pid = optionsTargetPost.id;
    setOptionsTargetPost(null);
    setReportTargetPostId(pid);
  };

  const handleStartBlock = () => {
    if (!optionsTargetPost) return;
    const target = optionsTargetPost;
    setOptionsTargetPost(null);
    setBlockTargetPost(target);
  };

  const handleConfirmBlock = async () => {
    if (!blockTargetPost) return;
    try {
      await blockAuthor({ postId: blockTargetPost.id });
    } catch (err) {
      console.error('Block error:', err);
    } finally {
      setBlockTargetPost(null);
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

      {/* Outbox Pending Banner */}
      {outboxQueue.length > 0 && (
        <Pressable onPress={handleSyncOutbox} style={styles.outboxBanner}>
          <View style={styles.outboxShadow} />
          <View style={styles.outboxCard}>
            <Text style={styles.outboxEmoji}>📤</Text>
            <View style={styles.outboxTextCol}>
              <Text style={styles.outboxTitle}>
                {`${outboxQueue.length} PUBLICATION${outboxQueue.length > 1 ? 'S' : ''} IN OUTBOX`}
              </Text>
              <Text style={styles.outboxSub}>
                Saved offline. Tap to sync with campus network now.
              </Text>
            </View>
            <Text style={styles.syncBtnText}>SYNC ↻</Text>
          </View>
        </Pressable>
      )}

      {/* Main Posts List */}
      <View style={styles.listContainer}>
        {isLoading ? (
          <FeedSkeletonList count={3} />
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
            onEndReached={() => {
              if (hasNextPage && !isFetchingNextPage) {
                fetchNextPage();
              }
            }}
            onEndReachedThreshold={0.5}
            ListFooterComponent={() => {
              if (isFetchingNextPage) {
                return (
                  <View style={styles.footerLoader}>
                    <ActivityIndicator size="small" color={AnonUTheme.black} />
                    <Text style={styles.footerLoaderText}>FETCHING MORE CAMPUS POSTS...</Text>
                  </View>
                );
              }
              if (!hasNextPage && posts.length > 0) {
                return (
                  <View style={styles.endOfFeedContainer}>
                    <View style={styles.endBadge}>
                      <Text style={styles.endBadgeText}>⚡ ALL CAUGHT UP</Text>
                    </View>
                    <Text style={styles.endSubText}>Checked all active publications on your campus.</Text>
                  </View>
                );
              }
              return null;
            }}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <PostItemRow
                post={item}
                uid={user?.uid}
                onOpenPost={() => router.push(`/post/${item.id}` as any)}
                onRepost={() => setRepostTarget(item)}
                onOptions={() => setOptionsTargetPost(item)}
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

      {/* Post Options Action Sheet */}
      <Modal
        visible={optionsTargetPost !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setOptionsTargetPost(null)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setOptionsTargetPost(null)}
        >
          <View style={styles.actionSheetContainer}>
            <View style={styles.actionSheetShadow} />
            <View style={styles.actionSheet}>
              <View style={styles.actionSheetHeader}>
                <Text style={styles.actionSheetTitle}>PUBLICATION OPTIONS</Text>
                <Pressable onPress={() => setOptionsTargetPost(null)}>
                  <Text style={styles.closeIcon}>✕</Text>
                </Pressable>
              </View>

              <Pressable
                style={styles.actionSheetRow}
                onPress={handleStartReport}
              >
                <Text style={styles.actionSheetEmoji}>🚩</Text>
                <View style={styles.actionSheetTextCol}>
                  <Text style={styles.actionSheetItemTitle}>REPORT PUBLICATION</Text>
                  <Text style={styles.actionSheetItemSub}>Flag for community guideline violations</Text>
                </View>
              </Pressable>

              <View style={styles.actionSheetDivider} />

              <Pressable
                style={styles.actionSheetRow}
                onPress={handleStartBlock}
              >
                <Text style={styles.actionSheetEmoji}>🚫</Text>
                <View style={styles.actionSheetTextCol}>
                  <Text style={[styles.actionSheetItemTitle, { color: AnonUTheme.downvoteRed }]}>
                    BLOCK ANONYMOUS USER
                  </Text>
                  <Text style={styles.actionSheetItemSub}>
                    Hide all publications and replies from this author
                  </Text>
                </View>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* Zero-Knowledge User Block Dialog */}
      <BrutalistDialog
        visible={blockTargetPost !== null}
        title="BLOCK THIS USER?"
        message="All current and future publications and replies from this author will be hidden from your feed and campus discussions. This action is zero-knowledge: the author will not be notified."
        confirmLabel="BLOCK USER"
        confirmColor={AnonUTheme.downvoteRed}
        onConfirm={handleConfirmBlock}
        onCancel={() => setBlockTargetPost(null)}
      />

      {/* Selectable Report Modal */}
      <Modal
        visible={reportTargetPostId !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setReportTargetPostId(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.reportModalContainer}>
            <View style={styles.actionSheetShadow} />
            <View style={styles.reportCard}>
              <View style={styles.actionSheetHeader}>
                <Text style={styles.actionSheetTitle}>REPORT PUBLICATION</Text>
                <Pressable onPress={() => setReportTargetPostId(null)}>
                  <Text style={styles.closeIcon}>✕</Text>
                </Pressable>
              </View>
              <Text style={styles.reportSub}>Select violation reason for campus moderator review:</Text>

              {reportReasons.map((reason) => {
                const isSelected = reportReason === reason;
                return (
                  <Pressable
                    key={reason}
                    onPress={() => setReportReason(reason)}
                    style={[
                      styles.reasonOption,
                      isSelected && styles.reasonOptionSelected,
                    ]}
                  >
                    <Text style={styles.reasonRadio}>{isSelected ? '●' : '○'}</Text>
                    <Text style={[styles.reasonText, isSelected && styles.reasonTextSelected]}>
                      {reason}
                    </Text>
                  </Pressable>
                );
              })}

              <View style={styles.reportActions}>
                <BrutalistButton
                  text="CANCEL"
                  backgroundColor="#ECECEC"
                  shadowOffset={{ width: 2, height: 2 }}
                  onPress={() => setReportTargetPostId(null)}
                />
                <BrutalistButton
                  text="SUBMIT REPORT"
                  backgroundColor={AnonUTheme.downvoteRed}
                  shadowOffset={{ width: 2, height: 2 }}
                  onPress={handleConfirmReport}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>

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
  onOptions,
}: {
  post: PostModel;
  uid?: string;
  onOpenPost: () => void;
  onRepost: () => void;
  onOptions: () => void;
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
      onReport={onOptions}
      onOptions={onOptions}
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  actionSheetContainer: {
    position: 'relative',
    width: '100%',
    maxWidth: 380,
  },
  actionSheetShadow: {
    position: 'absolute',
    top: 6,
    left: 6,
    right: 0,
    bottom: 0,
    backgroundColor: AnonUTheme.black,
    borderRadius: AnonUTheme.radiusMd,
    width: '100%',
    height: '100%',
  },
  actionSheet: {
    backgroundColor: AnonUTheme.bgSurface,
    borderColor: AnonUTheme.black,
    borderWidth: AnonUTheme.borderWidth,
    borderRadius: AnonUTheme.radiusMd,
    padding: 20,
  },
  actionSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  actionSheetTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: AnonUTheme.black,
    letterSpacing: 0.5,
  },
  closeIcon: {
    fontSize: 16,
    fontWeight: '900',
    color: AnonUTheme.black,
    padding: 4,
  },
  actionSheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  actionSheetEmoji: {
    fontSize: 22,
    marginRight: 12,
  },
  actionSheetTextCol: {
    flex: 1,
  },
  actionSheetItemTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: AnonUTheme.black,
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  actionSheetItemSub: {
    fontSize: 11,
    color: AnonUTheme.textSecondary,
    fontWeight: '500',
  },
  actionSheetDivider: {
    height: 1.5,
    backgroundColor: AnonUTheme.borderMuted,
    marginVertical: 4,
  },
  reportModalContainer: {
    position: 'relative',
    width: '100%',
    maxWidth: 400,
  },
  reportCard: {
    backgroundColor: AnonUTheme.bgSurface,
    borderColor: AnonUTheme.black,
    borderWidth: AnonUTheme.borderWidth,
    borderRadius: AnonUTheme.radiusMd,
    padding: 20,
  },
  reportSub: {
    fontSize: 12,
    fontWeight: '600',
    color: AnonUTheme.textSecondary,
    marginBottom: 14,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: AnonUTheme.radiusSm,
    borderWidth: 1.5,
    borderColor: AnonUTheme.borderMuted,
    marginBottom: 8,
    backgroundColor: AnonUTheme.bgCream,
  },
  reasonOptionSelected: {
    borderColor: AnonUTheme.black,
    backgroundColor: AnonUTheme.popMint,
  },
  reasonRadio: {
    fontSize: 16,
    fontWeight: '900',
    marginRight: 10,
    color: AnonUTheme.black,
  },
  reasonText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: AnonUTheme.black,
  },
  reasonTextSelected: {
    fontWeight: '900',
  },
  reportActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 14,
  },
  outboxBanner: {
    position: 'relative',
    marginHorizontal: 16,
    marginBottom: 10,
  },
  outboxShadow: {
    position: 'absolute',
    top: 3,
    left: 3,
    right: 0,
    bottom: 0,
    backgroundColor: AnonUTheme.black,
    borderRadius: AnonUTheme.radiusSm,
    width: '100%',
    height: '100%',
  },
  outboxCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AnonUTheme.popYellow,
    borderColor: AnonUTheme.black,
    borderWidth: AnonUTheme.borderWidthThin,
    borderRadius: AnonUTheme.radiusSm,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  outboxEmoji: {
    fontSize: 20,
    marginRight: 10,
  },
  outboxTextCol: {
    flex: 1,
  },
  outboxTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: AnonUTheme.black,
    letterSpacing: 0.4,
  },
  outboxSub: {
    fontSize: 10,
    fontWeight: '600',
    color: AnonUTheme.textSecondary,
    marginTop: 1,
  },
  syncBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: AnonUTheme.black,
    backgroundColor: AnonUTheme.white,
    borderColor: AnonUTheme.black,
    borderWidth: 1.5,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 6,
  },
  footerLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  footerLoaderText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
    color: AnonUTheme.black,
  },
  endOfFeedContainer: {
    alignItems: 'center',
    paddingVertical: 26,
    paddingHorizontal: 20,
  },
  endBadge: {
    backgroundColor: AnonUTheme.black,
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 6,
  },
  endBadgeText: {
    color: AnonUTheme.popMint,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  endSubText: {
    color: AnonUTheme.textSecondary,
    fontSize: 11.5,
    fontWeight: '600',
  },
});
