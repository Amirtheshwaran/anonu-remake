import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { AnonUTheme } from '../constants/theme';

export const PostCardSkeleton: React.FC = () => {
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.85,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [pulseAnim]);

  return (
    <View style={styles.cardContainer}>
      {/* Hard offset shadow */}
      <View style={styles.shadow} />

      {/* Main card box */}
      <View style={styles.card}>
        {/* Header row */}
        <View style={styles.headerRow}>
          {/* Avatar box */}
          <Animated.View style={[styles.avatarBox, { opacity: pulseAnim }]} />

          {/* Author & Badge bars */}
          <View style={styles.headerInfo}>
            <View style={styles.nameRow}>
              <Animated.View style={[styles.nameBar, { opacity: pulseAnim }]} />
              <Animated.View style={[styles.badgePill, { opacity: pulseAnim }]} />
            </View>
            <Animated.View style={[styles.timeBar, { opacity: pulseAnim }]} />
          </View>

          {/* Expiry pill */}
          <Animated.View style={[styles.expiryPill, { opacity: pulseAnim }]} />
        </View>

        {/* Content text bars */}
        <View style={styles.contentSection}>
          <Animated.View style={[styles.textBar, { width: '92%', opacity: pulseAnim }]} />
          <Animated.View style={[styles.textBar, { width: '84%', opacity: pulseAnim }]} />
          <Animated.View style={[styles.textBar, { width: '60%', opacity: pulseAnim }]} />
        </View>

        {/* Bottom VoteBar & actions placeholder */}
        <View style={styles.footerRow}>
          <Animated.View style={[styles.voteBarBlock, { opacity: pulseAnim }]} />
          <View style={styles.footerActions}>
            <Animated.View style={[styles.actionDot, { opacity: pulseAnim }]} />
            <Animated.View style={[styles.actionDot, { opacity: pulseAnim }]} />
          </View>
        </View>
      </View>
    </View>
  );
};

export const FeedSkeletonList: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <View style={styles.listWrap}>
      {Array.from({ length: count }).map((_, index) => (
        <PostCardSkeleton key={`skeleton-${index}`} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  listWrap: {
    paddingHorizontal: 16,
    paddingTop: 6,
  },
  cardContainer: {
    position: 'relative',
    marginBottom: 14,
    width: '100%',
  },
  shadow: {
    position: 'absolute',
    top: 4,
    left: 4,
    right: 0,
    bottom: 0,
    backgroundColor: AnonUTheme.black,
    borderRadius: AnonUTheme.radiusSm,
    width: '100%',
    height: '100%',
  },
  card: {
    backgroundColor: AnonUTheme.bgSurface,
    borderColor: AnonUTheme.black,
    borderWidth: AnonUTheme.borderWidth,
    borderRadius: AnonUTheme.radiusSm,
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatarBox: {
    width: 38,
    height: 38,
    backgroundColor: '#D1CDBC',
    borderColor: AnonUTheme.black,
    borderWidth: 2,
    borderRadius: 8,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 10,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  nameBar: {
    width: 100,
    height: 12,
    backgroundColor: '#D1CDBC',
    borderRadius: 3,
  },
  badgePill: {
    width: 44,
    height: 14,
    backgroundColor: '#D1CDBC',
    borderRadius: 4,
  },
  timeBar: {
    width: 60,
    height: 10,
    backgroundColor: '#E5E2D9',
    borderRadius: 3,
  },
  expiryPill: {
    width: 50,
    height: 20,
    backgroundColor: '#E5E2D9',
    borderWidth: 1.5,
    borderColor: AnonUTheme.black,
    borderRadius: 6,
  },
  contentSection: {
    gap: 8,
    marginBottom: 16,
  },
  textBar: {
    height: 12,
    backgroundColor: '#D1CDBC',
    borderRadius: 3,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1.5,
    borderTopColor: '#E0E0E0',
  },
  voteBarBlock: {
    width: 110,
    height: 32,
    backgroundColor: '#E5E2D9',
    borderColor: AnonUTheme.black,
    borderWidth: 2,
    borderRadius: AnonUTheme.radiusSm,
  },
  footerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionDot: {
    width: 32,
    height: 32,
    backgroundColor: '#E5E2D9',
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: AnonUTheme.black,
  },
});
