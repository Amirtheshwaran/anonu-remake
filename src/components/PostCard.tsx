import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { PostModel } from '../types/post';
import { AnonUTheme } from '../constants/theme';
import { PseudonymService } from '../services/pseudonymService';
import { BrutalistCard } from './BrutalistCard';
import { BrutalistBadge } from './BrutalistBadge';
import { VoteBar } from './VoteBar';
import { TagChip } from './TagChip';
import { ImageGrid } from './ImageGrid';
import { PollWidget } from './PollWidget';

interface PostCardProps {
  post: PostModel;
  userVote?: boolean | null;
  isDetail?: boolean;
  onPress?: () => void;
  onUpvote: () => void;
  onDownvote: () => void;
  onComment: () => void;
  onRepost: () => void;
  onReport: () => void;
  onPollVote?: (index: number) => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  userVote = null,
  isDetail = false,
  onPress,
  onUpvote,
  onDownvote,
  onComment,
  onRepost,
  onReport,
  onPollVote,
}) => {
  const isAnon = post.identity === 'anonymous';
  const authorName = isAnon ? post.pseudonym : post.displayName || post.pseudonym;
  const avatarBgColor = PseudonymService.colorForPseudonym(post.pseudonym);

  // Expiry calculation
  const getExpiryLabel = (expiresAt: Date) => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return 'EXP';
    const hours = Math.floor(diff / (1000 * 3600));
    if (hours > 0) return `${hours}H`;
    const mins = Math.max(1, Math.floor(diff / (1000 * 60)));
    return `${mins}M`;
  };

  // Timeago helper
  const formatTimeago = (date: Date) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'JUST NOW';
    if (mins < 60) return `${mins}M AGO`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}H AGO`;
    const days = Math.floor(hours / 24);
    return `${days}D AGO`;
  };

  return (
    <BrutalistCard
      onPress={isDetail ? undefined : onPress}
      shadowOffset={isDetail ? { width: 2.5, height: 2.5 } : { width: 4, height: 4 }}
      style={[
        styles.cardMargin,
        isDetail ? styles.detailMargin : styles.feedMargin,
      ]}
      padding={16}
    >
      {/* Repost Header Banner */}
      {post.isRepost && (
        <View style={styles.repostBanner}>
          <Text style={styles.repostIcon}>🔁</Text>
          <Text style={styles.repostText}>
            {`REPOSTED FROM @${(post.originalAuthorPseudonym || 'ANONYMOUS').toUpperCase()}`}
          </Text>
        </View>
      )}

      {/* Author Header */}
      <View style={styles.headerRow}>
        {/* Avatar */}
        <View style={[styles.avatarFrame, { backgroundColor: avatarBgColor }]}>
          {!isAnon && post.avatarUrl ? (
            <Image
              source={{ uri: post.avatarUrl }}
              style={styles.avatarImage}
              contentFit="cover"
            />
          ) : (
            <Text style={styles.avatarInitials}>
              {post.pseudonym
                .split(' ')
                .map((w) => (w ? w[0] : ''))
                .slice(0, 2)
                .join('')
                .toUpperCase()}
            </Text>
          )}
        </View>

        {/* Name & Badge */}
        <View style={styles.nameSection}>
          <View style={styles.nameRow}>
            <Text style={styles.authorName} numberOfLines={1}>
              {authorName}
            </Text>
            <BrutalistBadge
              label={isAnon ? 'ANON' : 'VERIFIED'}
              backgroundColor={isAnon ? AnonUTheme.popMint : AnonUTheme.popYellow}
              fontSize={8.5}
              borderWidth={1.5}
              hasShadow={false}
            />
          </View>
          <Text style={styles.timeagoText}>
            {formatTimeago(post.createdAt)}
          </Text>
        </View>

        {/* Expiry Pill */}
        {post.expiresAt && (
          <View style={styles.expiryBadge}>
            <Text style={styles.hourglass}>⏳</Text>
            <Text style={styles.expiryText}>
              {getExpiryLabel(post.expiresAt)}
            </Text>
          </View>
        )}

        {/* Report Button */}
        <Pressable onPress={onReport} style={styles.moreButton}>
          <Text style={styles.moreDots}>⋮</Text>
        </Pressable>
      </View>

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <View style={styles.tagsWrap}>
          {post.tags.map((tag) => (
            <View key={tag} style={styles.tagItem}>
              <TagChip tag={tag} />
            </View>
          ))}
        </View>
      )}

      {/* Content Text */}
      <Text
        style={styles.contentText}
        numberOfLines={isDetail ? undefined : 6}
      >
        {post.content}
      </Text>

      {/* Image Grid */}
      {post.imageUrls && post.imageUrls.length > 0 && (
        <ImageGrid urls={post.imageUrls} />
      )}

      {/* Poll */}
      {post.poll && (
        <PollWidget poll={post.poll} onVote={onPollVote} />
      )}

      {/* Action Bar */}
      <View style={styles.actionBar}>
        <VoteBar
          score={post.score}
          userVote={userVote}
          onUpvote={onUpvote}
          onDownvote={onDownvote}
        />

        <View style={styles.actionRightRow}>
          {/* Comment Pill */}
          <Pressable onPress={onComment} style={styles.actionPill}>
            <View style={styles.pillShadow} />
            <View style={styles.pillFront}>
              <Text style={styles.actionIcon}>💬</Text>
              {post.commentCount > 0 && (
                <Text style={styles.actionCount}>{post.commentCount}</Text>
              )}
            </View>
          </Pressable>

          {/* Repost Pill */}
          <Pressable onPress={onRepost} style={styles.actionPill}>
            <View style={styles.pillShadow} />
            <View style={styles.pillFront}>
              <Text style={styles.actionIcon}>🔁</Text>
              {post.repostCount > 0 && (
                <Text style={styles.actionCount}>{post.repostCount}</Text>
              )}
            </View>
          </Pressable>
        </View>
      </View>
    </BrutalistCard>
  );
};

const styles = StyleSheet.create({
  cardMargin: {
    marginVertical: 6,
  },
  feedMargin: {
    marginHorizontal: 14,
  },
  detailMargin: {
    marginHorizontal: 12,
    marginVertical: 10,
  },
  repostBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AnonUTheme.popYellow,
    borderColor: AnonUTheme.black,
    borderWidth: 1.5,
    borderRadius: AnonUTheme.radiusSm - 2,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  repostIcon: {
    fontSize: 12,
    marginRight: 6,
  },
  repostText: {
    color: AnonUTheme.black,
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarFrame: {
    width: 38,
    height: 38,
    borderColor: AnonUTheme.black,
    borderWidth: 2,
    borderRadius: AnonUTheme.radiusSm,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarInitials: {
    color: AnonUTheme.black,
    fontWeight: '900',
    fontSize: 13,
  },
  nameSection: {
    flex: 1,
    marginLeft: 10,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorName: {
    fontWeight: '900',
    fontSize: 14.5,
    color: AnonUTheme.black,
    letterSpacing: -0.2,
    marginRight: 6,
    maxWidth: '70%',
  },
  timeagoText: {
    color: AnonUTheme.textMuted,
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  expiryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AnonUTheme.popOrange,
    borderColor: AnonUTheme.black,
    borderWidth: 1.5,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    marginRight: 8,
  },
  hourglass: {
    fontSize: 10,
    marginRight: 3,
  },
  expiryText: {
    color: AnonUTheme.black,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  moreButton: {
    padding: 4,
  },
  moreDots: {
    fontSize: 18,
    fontWeight: '900',
    color: AnonUTheme.black,
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  tagItem: {
    marginRight: 6,
    marginBottom: 6,
  },
  contentText: {
    fontSize: 15,
    lineHeight: 21,
    color: AnonUTheme.black,
    fontWeight: '600',
    marginVertical: 4,
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  actionRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionPill: {
    position: 'relative',
    height: 36,
    marginLeft: 8,
  },
  pillShadow: {
    position: 'absolute',
    top: 2,
    left: 2,
    right: 0,
    bottom: 0,
    backgroundColor: AnonUTheme.black,
    borderRadius: AnonUTheme.radiusSm,
    width: '100%',
    height: 36,
  },
  pillFront: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 36,
    paddingHorizontal: 10,
    backgroundColor: AnonUTheme.bgCream,
    borderColor: AnonUTheme.black,
    borderWidth: AnonUTheme.borderWidthThin,
    borderRadius: AnonUTheme.radiusSm,
  },
  actionIcon: {
    fontSize: 14,
  },
  actionCount: {
    color: AnonUTheme.black,
    fontSize: 12,
    fontWeight: '900',
    marginLeft: 5,
  },
});
