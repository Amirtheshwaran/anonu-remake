import React from 'react';
import { View, Text, StyleSheet, Modal } from 'react-native';
import { AnonUTheme } from '../constants/theme';
import { BrutalistButton } from './BrutalistButton';

interface BrutalistDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmColor?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const BrutalistDialog: React.FC<BrutalistDialogProps> = ({
  visible,
  title,
  message,
  confirmLabel = 'CONFIRM',
  cancelLabel = 'CANCEL',
  confirmColor = AnonUTheme.popYellow,
  onConfirm,
  onCancel,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.cardContainer}>
          {/* Shadow layer */}
          <View style={styles.shadow} />

          {/* Modal body */}
          <View style={styles.dialog}>
            <View style={styles.headerRow}>
              <View style={[styles.badgeIcon, { backgroundColor: confirmColor }]}>
                <Text style={styles.warningEmoji}>⚠️</Text>
              </View>
              <Text style={styles.title}>{title}</Text>
            </View>

            <Text style={styles.message}>{message}</Text>

            <View style={styles.buttonRow}>
              <BrutalistButton
                text={cancelLabel}
                backgroundColor="#ECECEC"
                shadowOffset={{ width: 2, height: 2 }}
                onPress={onCancel}
              />
              <View style={{ width: 10 }} />
              <BrutalistButton
                text={confirmLabel}
                backgroundColor={confirmColor}
                shadowOffset={{ width: 2, height: 2 }}
                onPress={onConfirm}
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  cardContainer: {
    position: 'relative',
    width: '100%',
    maxWidth: 400,
  },
  shadow: {
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
  dialog: {
    backgroundColor: AnonUTheme.bgSurface,
    borderColor: AnonUTheme.black,
    borderWidth: AnonUTheme.borderWidth,
    borderRadius: AnonUTheme.radiusMd,
    padding: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  badgeIcon: {
    padding: 6,
    borderColor: AnonUTheme.black,
    borderWidth: 2,
    borderRadius: 4,
    marginRight: 10,
  },
  warningEmoji: {
    fontSize: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: AnonUTheme.textBlack,
    flex: 1,
  },
  message: {
    fontSize: 14,
    fontWeight: '600',
    color: AnonUTheme.textSecondary,
    lineHeight: 20,
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
});
