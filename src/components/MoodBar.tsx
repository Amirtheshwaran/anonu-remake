import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';
import { AnonUTheme } from '../constants/theme';
import { AnonUConstants } from '../constants/config';
import { MoodCheckInSheet } from './MoodCheckInSheet';

interface MoodBarProps {
  moodCounts: Record<string, number>;
  campusName?: string;
  lastMood?: string | null;
  currentStreak?: number;
  onCheckIn: (mood: string) => Promise<void>;
}

export const MoodBar: React.FC<MoodBarProps> = ({
  moodCounts,
  campusName,
  lastMood,
  currentStreak = 0,
  onCheckIn,
}) => {
  const [sheetVisible, setSheetVisible] = useState(false);

  const sortedMoods = Object.entries(moodCounts || {})
    .filter(([_, count]) => count > 0)
    .sort(([_, a], [__, b]) => b - a);

  const handleSelectMood = async (mood: string) => {
    setSheetVisible(false);
    await onCheckIn(mood);
  };

  const getEmoji = (label: string) => {
    const item = AnonUConstants.moods.find((m) => m.label.toLowerCase() === label.toLowerCase());
    return item ? item.emoji : '😐';
  };

  return (
    <>
      <View style={styles.container}>
        <View style={styles.shadow} />
        <View style={styles.card}>
          {/* Live Vibe Ticker */}
          <View style={styles.tickerSection}>
            {sortedMoods.length === 0 ? (
              <View style={styles.emptyTicker}>
                <Text style={styles.boltIcon}>⚡</Text>
                <Text style={styles.tickerTitle}>{`${(campusName || 'CAMPUS').toUpperCase()} PULSE: CHECK IN!`}</Text>
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
              >
                {sortedMoods.map(([label, count]) => (
                  <View key={label} style={styles.vibeBadge}>
                    <Text style={styles.vibeEmoji}>{getEmoji(label)}</Text>
                    <Text style={styles.vibeCount}>{count}</Text>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Check-In Button */}
          <Pressable
            onPress={() => setSheetVisible(true)}
            style={styles.checkInButton}
          >
            <Text style={styles.userLastMood}>
              {lastMood ? getEmoji(lastMood) : '😐'}
            </Text>
            <Text style={styles.checkInText}>CHECK IN</Text>
            {currentStreak > 0 && (
              <View style={styles.streakBadge}>
                <Text style={styles.streakText}>{`${currentStreak}🔥`}</Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>

      <MoodCheckInSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        onSelectMood={handleSelectMood}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    height: 54,
    marginHorizontal: 14,
    marginVertical: 6,
  },
  shadow: {
    position: 'absolute',
    top: 2.5,
    left: 2.5,
    right: 0,
    bottom: 0,
    backgroundColor: AnonUTheme.black,
    borderRadius: AnonUTheme.radiusSm,
    width: '100%',
    height: 54,
  },
  card: {
    flexDirection: 'row',
    height: 54,
    backgroundColor: AnonUTheme.bgSurface,
    borderColor: AnonUTheme.black,
    borderWidth: AnonUTheme.borderWidthThin,
    borderRadius: AnonUTheme.radiusSm,
    overflow: 'hidden',
  },
  tickerSection: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyTicker: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  boltIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  tickerTitle: {
    color: AnonUTheme.black,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  vibeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AnonUTheme.bgCream,
    borderColor: AnonUTheme.black,
    borderWidth: 1.5,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
  },
  vibeEmoji: {
    fontSize: 15,
    marginRight: 4,
  },
  vibeCount: {
    color: AnonUTheme.black,
    fontSize: 11,
    fontWeight: '900',
  },
  divider: {
    width: AnonUTheme.borderWidthThin,
    height: 54,
    backgroundColor: AnonUTheme.black,
  },
  checkInButton: {
    backgroundColor: AnonUTheme.popYellow,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  userLastMood: {
    fontSize: 16,
    marginRight: 6,
  },
  checkInText: {
    color: AnonUTheme.black,
    fontSize: 11.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  streakBadge: {
    backgroundColor: AnonUTheme.black,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
  },
  streakText: {
    color: AnonUTheme.popYellow,
    fontSize: 10,
    fontWeight: '900',
  },
});
