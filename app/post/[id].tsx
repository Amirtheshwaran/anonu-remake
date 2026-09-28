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
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AnonUTheme } from '../../src/constants/theme';
import { CommentModel, PostIdentity } from '../../src/types/post';
import { usePost, useComments, useCreateComment, useVotePoll, useRepostMutation } from '../../src/hooks/usePost';
import { useVoteMutation, useUserVote } from '../../src/hooks/useFeed';
import { useAuthStore } from '../../src/stores/useAuthStore';
import { postService } from '../../src/services/postService';
import { PseudonymService } from '../../src/services/pseudonymService';
import { PostCard } from '../../src/components/PostCard';
import { BrutalistCard } from '../../src/components/BrutalistCard';
import { BrutalistBadge } from '../../src/components/BrutalistBadge';
import { BrutalistDialog } from '../../src/components/BrutalistDialog';

export default function PostThreadScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const { data: post, isLoading: postLoading } = usePost(id);
  const { data: comments, isLoading: commentsLoading } = useComments(id);
  const { data: userVote } = useUserVote(id, user?.uid);
  const voteMutation = useVoteMutation(id, user?.uid);
  const pollVoteMutation = useVotePoll(id);
  const repostMutation = useRepostMutation();
  const createCommentMutation = useCreateComment(id);

  const [commentText, setCommentText] = useState('');
  const [commentIdentity, setCommentIdentity] = useState<PostIdentity>('anonymous');
  const [replyingTo, setReplyingTo] = useState<CommentModel | null>(null);
  const [repostConfirmVisible, setRepostConfirmVisible] = useState(false);

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
            onUpvote={() => voteMutation.mutate(true)}
            onDownvote={() => voteMutation.mutate(false)}
            onComment={() => {}}
            onRepost={() => setRepostConfirmVisible(true)}
            onReport={() => postService.reportPost(post.id, 'Reported from thread')}
            onPollVote={(idx) => pollVoteMutation.mutate(idx)}
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function CommentCard({
  comment,
  isReply = false,
  onReply,
}: {
  comment: CommentModel;
  isReply?: boolean;
  onReply: () => void;
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
});
