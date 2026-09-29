import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { AnonUTheme } from '../constants/theme';
import { hapticFeedback } from '../utils/haptics';

interface VoteBarProps {
  score: number;
  userVote: boolean | null; // true = up, false = down, null = none
  onUpvote: () => void;
  onDownvote: () => void;
}

export const VoteBar: React.FC<VoteBarProps> = ({
  score,
  userVote,
  onUpvote,
  onDownvote,
}) => {
  const isUp = userVote === true;
  const isDown = userVote === false;

  const handleUpvote = () => {
    hapticFeedback.light();
    onUpvote();
  };

  const handleDownvote = () => {
    hapticFeedback.light();
    onDownvote();
  };

  const scoreColor = isUp
    ? '#008744'
    : isDown
    ? AnonUTheme.downvoteRed
    : AnonUTheme.black;

  const displayScore = score > 0 ? `+${score}` : `${score}`;

  return (
    <View style={styles.wrapper}>
      {/* Hard shadow */}
      <View style={styles.shadow} />

      {/* Front bar */}
      <View style={styles.bar}>
        {/* Upvote Button */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Upvote publication"
          accessibilityHint="Increases the score and pushes this publication up in the campus feed"
          accessibilityState={{ selected: isUp }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 4 }}
          onPress={handleUpvote}
          style={[styles.arrowButton, isUp && styles.upvoteActive]}
        >
          <Text style={[styles.arrowIcon, isUp && styles.activeArrow]}>▲</Text>
        </Pressable>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Score counter */}
        <View
          accessibilityRole="text"
          accessibilityLabel={`Publication score: ${score} points`}
          style={styles.scoreContainer}
        >
          <Text style={[styles.scoreText, { color: scoreColor }]}>
            {displayScore}
          </Text>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Downvote Button */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Downvote publication"
          accessibilityHint="Decreases the score of this publication"
          accessibilityState={{ selected: isDown }}
          hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
          onPress={handleDownvote}
          style={[styles.arrowButton, isDown && styles.downvoteActive]}
        >
          <Text style={[styles.arrowIcon, isDown && styles.activeArrowDown]}>▼</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    height: 36,
    alignSelf: 'flex-start',
  },
  shadow: {
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
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 36,
    backgroundColor: AnonUTheme.bgCream,
    borderColor: AnonUTheme.black,
    borderWidth: AnonUTheme.borderWidthThin,
    borderRadius: AnonUTheme.radiusSm,
    overflow: 'hidden',
  },
  arrowButton: {
    paddingHorizontal: 10,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  upvoteActive: {
    backgroundColor: AnonUTheme.popMint,
  },
  downvoteActive: {
    backgroundColor: AnonUTheme.downvoteRed,
  },
  arrowIcon: {
    fontSize: 12,
    fontWeight: '900',
    color: AnonUTheme.textSecondary,
  },
  activeArrow: {
    color: AnonUTheme.black,
  },
  activeArrowDown: {
    color: AnonUTheme.white,
  },
  divider: {
    width: AnonUTheme.borderWidthThin,
    height: 36,
    backgroundColor: AnonUTheme.black,
  },
  scoreContainer: {
    minWidth: 36,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 13,
    fontWeight: '900',
  },
});
