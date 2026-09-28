import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable } from 'react-native';
import { AnonUConstants } from '../constants/config';
import { AnonUTheme } from '../constants/theme';

interface MoodCheckInSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelectMood: (mood: string) => void;
}

export const MoodCheckInSheet: React.FC<MoodCheckInSheetProps> = ({
  visible,
  onClose,
  onSelectMood,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeEmoji}>🔥</Text>
            </View>
            <View style={styles.headerTextCol}>
              <Text style={styles.title}>HOW ARE YOU FEELING TODAY?</Text>
              <Text style={styles.subtitle}>
                100% Anonymous. Only your emoji joins the campus pulse.
              </Text>
            </View>
          </View>

          {/* 2x3 Grid */}
          <View style={styles.grid}>
            {AnonUConstants.moods.map((m) => (
              <Pressable
                key={m.label}
                onPress={() => onSelectMood(m.label)}
                style={styles.moodTileWrapper}
              >
                <View style={styles.tileShadow} />
                <View style={styles.tile}>
                  <Text style={styles.moodEmoji}>{m.emoji}</Text>
                  <Text style={styles.moodLabel}>{m.label.toUpperCase()}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: AnonUTheme.bgSurface,
    borderTopColor: AnonUTheme.black,
    borderLeftColor: AnonUTheme.black,
    borderRightColor: AnonUTheme.black,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderRightWidth: 3,
    borderTopLeftRadius: AnonUTheme.radiusMd,
    borderTopRightRadius: AnonUTheme.radiusMd,
    padding: 20,
    paddingBottom: 36,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerBadge: {
    padding: 8,
    backgroundColor: AnonUTheme.popYellow,
    borderColor: AnonUTheme.black,
    borderWidth: 2,
    borderRadius: 4,
    marginRight: 10,
  },
  headerBadgeEmoji: {
    fontSize: 20,
  },
  headerTextCol: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '900',
    color: AnonUTheme.black,
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 11.5,
    fontWeight: '600',
    color: AnonUTheme.textSecondary,
    marginTop: 2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  moodTileWrapper: {
    position: 'relative',
    width: '31%',
    height: 72,
    marginBottom: 12,
  },
  tileShadow: {
    position: 'absolute',
    top: 2,
    left: 2,
    right: 0,
    bottom: 0,
    backgroundColor: AnonUTheme.black,
    borderRadius: AnonUTheme.radiusSm,
    width: '100%',
    height: 72,
  },
  tile: {
    width: '100%',
    height: 72,
    backgroundColor: AnonUTheme.bgCream,
    borderColor: AnonUTheme.black,
    borderWidth: 2,
    borderRadius: AnonUTheme.radiusSm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moodEmoji: {
    fontSize: 24,
    marginBottom: 2,
  },
  moodLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: AnonUTheme.black,
    letterSpacing: 0.4,
  },
});
