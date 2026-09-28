import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { PollData } from '../types/post';
import { AnonUTheme } from '../constants/theme';

interface PollWidgetProps {
  poll: PollData;
  onVote?: (index: number) => void;
}

export const PollWidget: React.FC<PollWidgetProps> = ({ poll, onVote }) => {
  const totalVotes = Object.values(poll.votes || {}).reduce((acc, v) => acc + (v || 0), 0);
  const isExpired = new Date(poll.endsAt).getTime() < Date.now();

  const formatExpiry = (endsAt: Date) => {
    const diff = new Date(endsAt).getTime() - Date.now();
    if (diff <= 0) return 'POLL CLOSED';
    const hours = Math.floor(diff / (1000 * 3600));
    if (hours > 24) return `ENDS IN ${Math.floor(hours / 24)}D`;
    if (hours > 0) return `ENDS IN ${hours}H`;
    const mins = Math.max(1, Math.floor(diff / (1000 * 60)));
    return `ENDS IN ${mins}M`;
  };

  return (
    <View style={styles.container}>
      {poll.options.map((option, idx) => {
        const optionVotes = poll.votes?.[idx.toString()] || 0;
        const pct = totalVotes > 0 ? optionVotes / totalVotes : 0;
        const pctString = `${Math.round(pct * 100)}%`;
        const letter = String.fromCharCode(65 + idx); // A, B, C, D

        return (
          <Pressable
            key={idx}
            onPress={() => !isExpired && onVote?.(idx)}
            disabled={isExpired || !onVote}
            style={styles.optionWrapper}
          >
            {/* Hard shadow */}
            <View style={styles.optionShadow} />

            {/* Meter Bar */}
            <View style={styles.optionBar}>
              {/* Mint Progress Fill */}
              {pct > 0 && (
                <View
                  style={[
                    styles.fillMeter,
                    {
                      width: `${Math.min(100, Math.max(0, pct * 100))}%`,
                    },
                  ]}
                />
              )}

              {/* Content overlay */}
              <View style={styles.contentOverlay}>
                <View style={styles.letterBadge}>
                  <Text style={styles.letterText}>{letter}</Text>
                </View>

                <Text style={styles.optionText} numberOfLines={1}>
                  {option}
                </Text>

                {totalVotes > 0 && (
                  <View style={styles.pctBadge}>
                    <Text style={styles.pctText}>{pctString}</Text>
                  </View>
                )}
              </View>
            </View>
          </Pressable>
        );
      })}

      {/* Footer: Total votes & expiry */}
      <View style={styles.footerRow}>
        <View style={styles.totalBadge}>
          <Text style={styles.totalText}>
            {`${totalVotes} VOTE${totalVotes === 1 ? '' : 'S'}`}
          </Text>
        </View>

        <Text
          style={[
            styles.expiryText,
            isExpired && { color: AnonUTheme.downvoteRed },
          ]}
        >
          {formatExpiry(poll.endsAt)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    width: '100%',
  },
  optionWrapper: {
    position: 'relative',
    height: 46,
    marginBottom: 10,
  },
  optionShadow: {
    position: 'absolute',
    top: 2.5,
    left: 2.5,
    right: 0,
    bottom: 0,
    backgroundColor: AnonUTheme.black,
    borderRadius: AnonUTheme.radiusSm,
    width: '100%',
    height: 46,
  },
  optionBar: {
    position: 'relative',
    height: 46,
    backgroundColor: AnonUTheme.bgCream,
    borderColor: AnonUTheme.black,
    borderWidth: AnonUTheme.borderWidthThin,
    borderRadius: AnonUTheme.radiusSm,
    overflow: 'hidden',
  },
  fillMeter: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: AnonUTheme.popMint,
    borderRightColor: AnonUTheme.black,
    borderRightWidth: AnonUTheme.borderWidthThin,
  },
  contentOverlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  letterBadge: {
    width: 22,
    height: 22,
    backgroundColor: AnonUTheme.black,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  letterText: {
    color: AnonUTheme.white,
    fontWeight: '900',
    fontSize: 11,
  },
  optionText: {
    flex: 1,
    color: AnonUTheme.black,
    fontSize: 13.5,
    fontWeight: '800',
  },
  pctBadge: {
    backgroundColor: AnonUTheme.black,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pctText: {
    color: AnonUTheme.white,
    fontWeight: '900',
    fontSize: 11.5,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  totalBadge: {
    backgroundColor: AnonUTheme.bgCream,
    borderColor: AnonUTheme.black,
    borderWidth: 1.5,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  totalText: {
    color: AnonUTheme.black,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  expiryText: {
    color: AnonUTheme.textSecondary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
