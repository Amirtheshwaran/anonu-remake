import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Share,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AnonUTheme } from '../../src/constants/theme';
import { CommentModel, PostIdentity } from '../../src/types/post';
import {
  usePost,
  useComments,
  useCreateComment,
  useVotePoll,
  useRepostMutation,
  useIsBookmarked,
  useBookmarkMutation,
  useUserRsvp,
  useRsvpMutation,
} from '../../src/hooks/usePost';
import { useVoteMutation, useUserVote } from '../../src/hooks/useFeed';
import { useBlockedPosts } from '../../src/hooks/useBlockedPosts';
import { useAuthStore } from '../../src/stores/useAuthStore';
import { postService } from '../../src/services/postService';
import { PseudonymService } from '../../src/services/pseudonymService';
import { PostCard } from '../../src/components/PostCard';
import { BrutalistCard } from '../../src/components/BrutalistCard';
import { BrutalistBadge } from '../../src/components/BrutalistBadge';
import { BrutalistButton } from '../../src/components/BrutalistButton';
import { BrutalistDialog } from '../../src/components/BrutalistDialog';

export default function PostThreadScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const { blockAuthor } = useBlockedPosts();
  const { data: post, isLoading: postLoading } = usePost(id);
  const { data: comments, isLoading: commentsLoading } = useComments(id);
  const { data: userVote } = useUserVote(id, user?.uid);
  const voteMutation = useVoteMutation(id, user?.uid);
  const pollVoteMutation = useVotePoll(id);
  const repostMutation = useRepostMutation();
  const createCommentMutation = useCreateComment(id);
  const { data: isBookmarked } = useIsBookmarked(id, user?.uid);
  const bookmarkMutation = useBookmarkMutation(id, user?.uid);
  const { data: isRsvp } = useUserRsvp(id, user?.uid);
  const rsvpMutation = useRsvpMutation(id);

  const handleShare = async () => {
    if (!post) return;
    try {
      await Share.share({
        message: `Read this AnonU campus post: "${post.content.slice(0, 100)}..."\nhttps://anonu.app/post/${post.id}`,
      });
    } catch (err) {
      console.warn('Share error:', err);
    }
  };

  const [commentText, setCommentText] = useState('');
  const [commentIdentity, setCommentIdentity] = useState<PostIdentity>('anonymous');
  const [replyingTo, setReplyingTo] = useState<CommentModel | null>(null);
  const [repostConfirmVisible, setRepostConfirmVisible] = useState(false);

  // Post moderation options
  const [postOptionsVisible, setPostOptionsVisible] = useState(false);
  const [postBlockConfirmVisible, setPostBlockConfirmVisible] = useState(false);
  const [postReportVisible, setPostReportVisible] = useState(false);
  const [reportReason, setReportReason] = useState('Harassment or Hate');

  // Comment moderation options
  const [commentOptionsTarget, setCommentOptionsTarget] = useState<CommentModel | null>(null);
  const [commentBlockConfirmVisible, setCommentBlockConfirmVisible] = useState(false);
  const [commentReportTargetId, setCommentReportTargetId] = useState<string | null>(null);
  const [commentReportReason, setCommentReportReason] = useState('Harassment or Hate');

  const reportReasons = [
    'Harassment or Hate',
    'Misinformation',
    'Doxxing / Personal Info',
    'Spam or Scam',
    'Inappropriate Content',
  ];

  const handleConfirmPostBlock = async () => {
    if (!post) return;
    try {
      await blockAuthor({ postId: post.id });
      setPostBlockConfirmVisible(false);
      router.back();
    } catch (err) {
      console.error('Block post error:', err);
      setPostBlockConfirmVisible(false);
    }
  };

  const handleConfirmPostReport = async () => {
    if (!post) return;
    try {
      await postService.reportPost(post.id, reportReason);
    } catch (err) {
      console.error('Report post error:', err);
    } finally {
      setPostReportVisible(false);
    }
  };

  const handleConfirmCommentBlock = async () => {
    if (!commentOptionsTarget) return;
    try {
      await blockAuthor({ commentId: commentOptionsTarget.id });
    } catch (err) {
      console.error('Block comment error:', err);
    } finally {
      setCommentBlockConfirmVisible(false);
      setCommentOptionsTarget(null);
    }
  };

  const handleConfirmCommentReport = async () => {
    if (!commentReportTargetId) return;
    try {
      await postService.reportComment(commentReportTargetId, commentReportReason);
    } catch (err) {
      console.error('Report comment error:', err);
    } finally {
      setCommentReportTargetId(null);
    }
  };

  const handleSendComment = async () => {
    const text = commentText.trim();
    if (!text || createCommentMutation.isPending) return;

    try {
      await createCommentMutation.mutateAsync({
        content: text,
        identity: commentIdentity,
        parentCommentId: replyingTo?.id || null,
      });
      setCommentText('');
      setReplyingTo(null);
    } catch (err) {
      console.error('Comment error:', err);
    }
  };

  const handleConfirmRepost = async () => {
    if (!post) return;
    try {
      await repostMutation.mutateAsync(post.id);
    } catch (err) {
      console.error('Repost error:', err);
    } finally {
      setRepostConfirmVisible(false);
    }
  };

  if (postLoading || !post) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={AnonUTheme.black} />
        </View>
      </SafeAreaView>
    );
  }

  // Organize nested comments (root comments and replies)
  const rootComments = (comments || []).filter((c) => !c.parentCommentId);
  const repliesMap: Record<string, CommentModel[]> = {};
  (comments || []).forEach((c) => {
    if (c.parentCommentId) {
      if (!repliesMap[c.parentCommentId]) repliesMap[c.parentCommentId] = [];
      repliesMap[c.parentCommentId].push(c);
    }
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* App Bar */}
        <View style={styles.appBar}>
          <Pressable onPress={() => router.back()} style={styles.backButtonWrapper}>
            <View style={styles.backShadow} />
            <View style={styles.backButton}>
              <Text style={styles.backIcon}>←</Text>
            </View>
          </Pressable>
          <Text style={styles.headerTitle}>CAMPUS THREAD</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Main Expanded Post */}
          <PostCard
            post={post}
            userVote={userVote}
            isDetail={true}
            isBookmarked={!!isBookmarked}
            isRsvp={!!isRsvp}
            onUpvote={() => voteMutation.mutate(true)}
            onDownvote={() => voteMutation.mutate(false)}
            onComment={() => {}}
            onRepost={() => setRepostConfirmVisible(true)}
            onReport={() => setPostOptionsVisible(true)}
            onOptions={() => setPostOptionsVisible(true)}
            onPollVote={(idx) => pollVoteMutation.mutate(idx)}
            onRsvp={() => rsvpMutation.mutate(!isRsvp)}
            onBookmark={() => bookmarkMutation.mutate({ post, isBookmarked: !!isBookmarked })}
            onShare={handleShare}
          />

          {/* Discussion Header */}
          <View style={styles.discussionHeader}>
            <View style={styles.discussionBadge}>
              <Text style={styles.discussionBadgeText}>DISCUSSION</Text>
            </View>
            <Text style={styles.discussionTitle}>CAMPUS REPLIES</Text>
          </View>

          {/* Comments List */}
          {commentsLoading ? (
            <ActivityIndicator style={{ marginVertical: 20 }} color={AnonUTheme.black} />
          ) : rootComments.length === 0 ? (
            <BrutalistCard padding={16} style={styles.emptyCommentsCard}>
              <Text style={styles.emptyIcon}>💬</Text>
              <Text style={styles.emptyTitle}>NO COMMENTS YET</Text>
              <Text style={styles.emptySub}>
                Drop your thoughts anonymously or identified.
              </Text>
            </BrutalistCard>
          ) : (
            rootComments.map((root) => {
              const replies = repliesMap[root.id] || [];
              return (
                <View key={root.id} style={styles.commentTreeBlock}>
                  <CommentCard
                    comment={root}
                    onReply={() => setReplyingTo(root)}
                    onOptions={() => setCommentOptionsTarget(root)}
                  />

                  {/* Indented replies */}
                  {replies.length > 0 && (
                    <View style={styles.repliesIndentation}>
                      <View style={styles.replyBranchLine} />
                      <View style={styles.repliesCol}>
                        {replies.map((reply) => (
                          <CommentCard
                            key={reply.id}
                            comment={reply}
                            isReply={true}
                            onReply={() => setReplyingTo(root)}
                            onOptions={() => setCommentOptionsTarget(reply)}
                          />
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </ScrollView>

        {/* Replying Banner */}
        {replyingTo && (
          <View style={styles.replyingBanner}>
            <Text style={styles.replyIcon}>↩️</Text>
            <Text style={styles.replyingText} numberOfLines={1}>
              {`REPLYING TO @${replyingTo.pseudonym.toUpperCase()}: "${replyingTo.content}"`}
            </Text>
            <Pressable
              onPress={() => setReplyingTo(null)}
              style={styles.cancelReplyBtn}
            >
              <Text style={styles.cancelReplyText}>✕</Text>
            </Pressable>
          </View>
        )}

        {/* Sticky Comment Composer */}
        <View style={styles.composerBar}>
          {/* Identity Toggle */}
          <Pressable
            onPress={() =>
              setCommentIdentity(
                commentIdentity === 'anonymous' ? 'identified' : 'anonymous'
              )
            }
            style={[
              styles.identityTogglePill,
              commentIdentity === 'anonymous'
                ? styles.toggleMint
                : styles.toggleYellow,
            ]}
          >
            <Text style={styles.toggleEmoji}>
              {commentIdentity === 'anonymous' ? '🎭' : '👤'}
            </Text>
            <Text style={styles.toggleLabel}>
              {commentIdentity === 'anonymous' ? 'ANON' : 'IDENTIFIED'}
            </Text>
          </Pressable>

          {/* Text Input */}
          <View style={styles.inputWrapper}>
            <TextInput
              value={commentText}
              onChangeText={setCommentText}
              placeholder={
                replyingTo
                  ? `Reply to @${replyingTo.pseudonym}...`
                  : 'Say something on campus...'
              }
              placeholderTextColor={AnonUTheme.textMuted}
              style={styles.commentInput}
              maxLength={200}
            />
          </View>

          {/* Send Button */}
          <Pressable
            onPress={handleSendComment}
            disabled={createCommentMutation.isPending || !commentText.trim()}
            style={styles.sendButton}
          >
            {createCommentMutation.isPending ? (
              <ActivityIndicator size="small" color={AnonUTheme.black} />
            ) : (
              <Text style={styles.sendIcon}>➤</Text>
            )}
          </Pressable>
        </View>

        {/* Repost Confirmation Dialog */}
        <BrutalistDialog
          visible={repostConfirmVisible}
          title="REPOST ON CAMPUS?"
          message="This will repost the publication anonymously to your campus feed under your current pseudonym."
          confirmLabel="REPOST"
          confirmColor={AnonUTheme.popMint}
          onConfirm={handleConfirmRepost}
          onCancel={() => setRepostConfirmVisible(false)}
        />

        {/* Post Options Action Sheet */}
        <Modal
          visible={postOptionsVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setPostOptionsVisible(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setPostOptionsVisible(false)}
          >
            <View style={styles.actionSheetContainer}>
              <View style={styles.actionSheetShadow} />
              <View style={styles.actionSheet}>
                <View style={styles.actionSheetHeader}>
                  <Text style={styles.actionSheetTitle}>PUBLICATION OPTIONS</Text>
                  <Pressable onPress={() => setPostOptionsVisible(false)}>
                    <Text style={styles.closeIcon}>✕</Text>
                  </Pressable>
                </View>

                <Pressable
                  style={styles.actionSheetRow}
                  onPress={() => {
                    setPostOptionsVisible(false);
                    setPostReportVisible(true);
                  }}
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
                  onPress={() => {
                    setPostOptionsVisible(false);
                    setPostBlockConfirmVisible(true);
                  }}
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

        {/* Post Block Confirm Dialog */}
        <BrutalistDialog
          visible={postBlockConfirmVisible}
          title="BLOCK THIS USER?"
          message="All current and future publications and replies from this author will be hidden from your feed and campus discussions. This action is zero-knowledge: the author will not be notified."
          confirmLabel="BLOCK USER"
          confirmColor={AnonUTheme.downvoteRed}
          onConfirm={handleConfirmPostBlock}
          onCancel={() => setPostBlockConfirmVisible(false)}
        />

        {/* Post Report Modal */}
        <Modal
          visible={postReportVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setPostReportVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.reportModalContainer}>
              <View style={styles.actionSheetShadow} />
              <View style={styles.reportCard}>
                <View style={styles.actionSheetHeader}>
                  <Text style={styles.actionSheetTitle}>REPORT PUBLICATION</Text>
                  <Pressable onPress={() => setPostReportVisible(false)}>
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
                    onPress={() => setPostReportVisible(false)}
                  />
                  <BrutalistButton
                    text="SUBMIT REPORT"
                    backgroundColor={AnonUTheme.downvoteRed}
                    shadowOffset={{ width: 2, height: 2 }}
                    onPress={handleConfirmPostReport}
                  />
                </View>
              </View>
            </View>
          </View>
        </Modal>

        {/* Comment Options Action Sheet */}
        <Modal
          visible={commentOptionsTarget !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setCommentOptionsTarget(null)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setCommentOptionsTarget(null)}
          >
            <View style={styles.actionSheetContainer}>
              <View style={styles.actionSheetShadow} />
              <View style={styles.actionSheet}>
                <View style={styles.actionSheetHeader}>
                  <Text style={styles.actionSheetTitle}>COMMENT OPTIONS</Text>
                  <Pressable onPress={() => setCommentOptionsTarget(null)}>
                    <Text style={styles.closeIcon}>✕</Text>
                  </Pressable>
                </View>

                <Pressable
                  style={styles.actionSheetRow}
                  onPress={() => {
                    const cid = commentOptionsTarget?.id || null;
                    setCommentOptionsTarget(null);
                    setCommentReportTargetId(cid);
                  }}
                >
                  <Text style={styles.actionSheetEmoji}>🚩</Text>
                  <View style={styles.actionSheetTextCol}>
                    <Text style={styles.actionSheetItemTitle}>REPORT COMMENT</Text>
                    <Text style={styles.actionSheetItemSub}>Flag reply for community review</Text>
                  </View>
                </Pressable>

                <View style={styles.actionSheetDivider} />

                <Pressable
                  style={styles.actionSheetRow}
                  onPress={() => {
                    setCommentBlockConfirmVisible(true);
                  }}
                >
                  <Text style={styles.actionSheetEmoji}>🚫</Text>
                  <View style={styles.actionSheetTextCol}>
                    <Text style={[styles.actionSheetItemTitle, { color: AnonUTheme.downvoteRed }]}>
                      BLOCK COMMENT AUTHOR
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

        {/* Comment Block Confirm Dialog */}
        <BrutalistDialog
          visible={commentBlockConfirmVisible}
          title="BLOCK THIS USER?"
          message="All current and future publications and replies from this author will be hidden from your feed and campus discussions. This action is zero-knowledge: the author will not be notified."
          confirmLabel="BLOCK USER"
          confirmColor={AnonUTheme.downvoteRed}
          onConfirm={handleConfirmCommentBlock}
          onCancel={() => {
            setCommentBlockConfirmVisible(false);
            setCommentOptionsTarget(null);
          }}
        />

        {/* Comment Report Modal */}
        <Modal
          visible={commentReportTargetId !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setCommentReportTargetId(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.reportModalContainer}>
              <View style={styles.actionSheetShadow} />
              <View style={styles.reportCard}>
                <View style={styles.actionSheetHeader}>
                  <Text style={styles.actionSheetTitle}>REPORT COMMENT</Text>
                  <Pressable onPress={() => setCommentReportTargetId(null)}>
                    <Text style={styles.closeIcon}>✕</Text>
                  </Pressable>
                </View>
                <Text style={styles.reportSub}>Select violation reason for campus moderator review:</Text>

                {reportReasons.map((reason) => {
                  const isSelected = commentReportReason === reason;
                  return (
                    <Pressable
                      key={reason}
                      onPress={() => setCommentReportReason(reason)}
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
                    onPress={() => setCommentReportTargetId(null)}
                  />
                  <BrutalistButton
                    text="SUBMIT REPORT"
                    backgroundColor={AnonUTheme.downvoteRed}
                    shadowOffset={{ width: 2, height: 2 }}
                    onPress={handleConfirmCommentReport}
                  />
                </View>
              </View>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function CommentCard({
  comment,
  isReply = false,
  onReply,
  onOptions,
}: {
  comment: CommentModel;
  isReply?: boolean;
  onReply: () => void;
  onOptions?: () => void;
}) {
  const isAnon = comment.identity === 'anonymous';
  const name = isAnon ? comment.pseudonym : comment.displayName || comment.pseudonym;
  const avatarBg = PseudonymService.colorForPseudonym(comment.pseudonym);

  return (
    <BrutalistCard
      backgroundColor={isReply ? AnonUTheme.bgCream : AnonUTheme.bgSurface}
      borderWidth={AnonUTheme.borderWidthThin}
      shadowOffset={{ width: 2, height: 2 }}
      padding={12}
      style={[
        styles.commentCard,
        isReply ? styles.replyCardMargin : styles.rootCardMargin,
      ]}
    >
      <View style={styles.commentHeader}>
        <View style={[styles.commentAvatar, { backgroundColor: avatarBg }]}>
          <Text style={styles.commentAvatarText}>
            {name ? name[0].toUpperCase() : '?'}
          </Text>
        </View>

        <Text style={styles.commentAuthorName} numberOfLines={1}>
          {name}
        </Text>

        {isAnon && (
          <BrutalistBadge
            label="ANON"
            backgroundColor={AnonUTheme.popMint}
            fontSize={8}
            borderWidth={1.5}
            hasShadow={false}
          />
        )}

        <Pressable onPress={onReply} style={styles.replyButton}>
          <Text style={styles.replyButtonText}>REPLY</Text>
        </Pressable>

        {onOptions && (
          <Pressable onPress={onOptions} style={styles.commentMoreBtn}>
            <Text style={styles.commentMoreText}>⋮</Text>
          </Pressable>
        )}
      </View>

      <Text style={styles.commentContentText}>{comment.content}</Text>
    </BrutalistCard>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AnonUTheme.bgCream,
  },
  keyboardAvoid: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomColor: AnonUTheme.black,
    borderBottomWidth: AnonUTheme.borderWidthThin,
  },
  backButtonWrapper: {
    position: 'relative',
    width: 36,
    height: 36,
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
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: AnonUTheme.black,
    letterSpacing: 0.3,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  discussionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 14,
    marginBottom: 8,
  },
  discussionBadge: {
    backgroundColor: AnonUTheme.popYellow,
    borderColor: AnonUTheme.black,
    borderWidth: 1.5,
    borderRadius: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginRight: 8,
  },
  discussionBadgeText: {
    fontWeight: '900',
    fontSize: 10.5,
    letterSpacing: 0.5,
    color: AnonUTheme.black,
  },
  discussionTitle: {
    fontWeight: '900',
    fontSize: 12.5,
    color: AnonUTheme.black,
    letterSpacing: 0.5,
  },
  emptyCommentsCard: {
    marginHorizontal: 16,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 26,
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: AnonUTheme.black,
  },
  emptySub: {
    fontSize: 11.5,
    color: AnonUTheme.textSecondary,
    marginTop: 2,
  },
  commentTreeBlock: {
    marginBottom: 6,
  },
  commentCard: {
    marginVertical: 3,
  },
  rootCardMargin: {
    marginHorizontal: 14,
  },
  replyCardMargin: {
    marginRight: 14,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  commentAvatar: {
    width: 26,
    height: 26,
    borderRadius: 4,
    borderColor: AnonUTheme.black,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  commentAvatarText: {
    fontWeight: '900',
    fontSize: 11,
    color: AnonUTheme.black,
  },
  commentAuthorName: {
    fontWeight: '800',
    fontSize: 13,
    color: AnonUTheme.black,
    flex: 1,
    marginRight: 6,
  },
  replyButton: {
    backgroundColor: AnonUTheme.bgCream,
    borderColor: AnonUTheme.black,
    borderWidth: 1.5,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  replyButtonText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: AnonUTheme.black,
  },
  commentMoreBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 4,
  },
  commentMoreText: {
    fontSize: 16,
    fontWeight: '900',
    color: AnonUTheme.black,
  },
  commentContentText: {
    fontSize: 13.5,
    lineHeight: 18,
    fontWeight: '600',
    color: AnonUTheme.black,
  },
  repliesIndentation: {
    flexDirection: 'row',
    marginLeft: 26,
  },
  replyBranchLine: {
    width: 2.5,
    backgroundColor: AnonUTheme.black,
    marginRight: 8,
  },
  repliesCol: {
    flex: 1,
  },
  replyingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AnonUTheme.popYellow,
    borderTopColor: AnonUTheme.black,
    borderBottomColor: AnonUTheme.black,
    borderTopWidth: 2,
    borderBottomWidth: 2,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  replyIcon: {
    fontSize: 13,
    marginRight: 6,
  },
  replyingText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '900',
    color: AnonUTheme.black,
  },
  cancelReplyBtn: {
    padding: 3,
    backgroundColor: AnonUTheme.black,
    borderRadius: 4,
    marginLeft: 6,
  },
  cancelReplyText: {
    color: AnonUTheme.white,
    fontSize: 11,
    fontWeight: '900',
  },
  composerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AnonUTheme.bgSurface,
    borderTopColor: AnonUTheme.black,
    borderTopWidth: 2.5,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  identityTogglePill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: AnonUTheme.black,
    borderWidth: 2,
    borderRadius: AnonUTheme.radiusSm,
    paddingHorizontal: 8,
    paddingVertical: 8,
    marginRight: 8,
  },
  toggleMint: {
    backgroundColor: AnonUTheme.popMint,
  },
  toggleYellow: {
    backgroundColor: AnonUTheme.popYellow,
  },
  toggleEmoji: {
    fontSize: 13,
    marginRight: 4,
  },
  toggleLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: AnonUTheme.black,
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flex: 1,
    height: 42,
    backgroundColor: AnonUTheme.bgCream,
    borderColor: AnonUTheme.black,
    borderWidth: 2,
    borderRadius: AnonUTheme.radiusSm,
    paddingHorizontal: 10,
    justifyContent: 'center',
  },
  commentInput: {
    fontWeight: '700',
    fontSize: 13.5,
    color: AnonUTheme.black,
  },
  sendButton: {
    width: 44,
    height: 42,
    backgroundColor: AnonUTheme.popYellow,
    borderColor: AnonUTheme.black,
    borderWidth: 2,
    borderRadius: AnonUTheme.radiusSm,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendIcon: {
    fontSize: 16,
    color: AnonUTheme.black,
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
});
