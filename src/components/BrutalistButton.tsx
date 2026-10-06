import React from 'react';
import {
  Pressable,
  Text,
  View,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  StyleProp,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { AnonUTheme } from '../constants/theme';
import { hapticFeedback } from '../utils/haptics';

interface BrutalistButtonProps {
  text?: string;
  icon?: React.ReactNode;
  onPress?: () => void;
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  shadowOffset?: { width: number; height: number };
  isFullWidth?: boolean;
  isLoading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  paddingVertical?: number;
  paddingHorizontal?: number;
  accessibilityRole?: any;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  minHeight?: number;
}

export const BrutalistButton: React.FC<BrutalistButtonProps> = ({
  text,
  icon,
  onPress,
  backgroundColor = AnonUTheme.popYellow,
  textColor = AnonUTheme.textBlack,
  borderColor = AnonUTheme.black,
  borderWidth = AnonUTheme.borderWidth,
  borderRadius = AnonUTheme.radiusSm,
  shadowOffset = { width: 3, height: 3 },
  isFullWidth = false,
  isLoading = false,
  disabled = false,
  style,
  paddingVertical = 10,
  paddingHorizontal = 16,
  accessibilityRole = 'button',
  accessibilityLabel,
  accessibilityHint,
  minHeight = 44,
}) => {
  const isEnabled = !disabled && !isLoading && !!onPress;

  const handlePress = () => {
    if (!isEnabled) return;
    hapticFeedback.light();
    onPress?.();
  };

  return (
    <Pressable
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel || text}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !isEnabled, busy: isLoading }}
      hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
      onPress={handlePress}
      disabled={!isEnabled}
      style={[
        styles.container,
        isFullWidth && styles.fullWidth,
        style,
      ]}
    >
      {({ pressed }) => {
        const isPressed = pressed && isEnabled;
        const shiftX = isPressed ? shadowOffset.width : 0;
        const shiftY = isPressed ? shadowOffset.height : 0;

        return (
          <View style={[styles.buttonWrapper, isFullWidth && styles.fullWidth]}>
            {/* Hard shadow layer */}
            <View
              style={[
                styles.shadow,
                {
                  backgroundColor: borderColor,
                  borderRadius,
                  top: shadowOffset.height,
                  left: shadowOffset.width,
                },
              ]}
            />

            {/* Front tactile layer */}
            <View
              style={[
                styles.front,
                {
                  backgroundColor: isEnabled ? backgroundColor : '#D4D4D4',
                  borderColor,
                  borderWidth,
                  borderRadius,
                  paddingVertical,
                  paddingHorizontal,
                  transform: [{ translateX: shiftX }, { translateY: shiftY }],
                },
                isFullWidth && styles.fullWidth,
              ]}
            >
              {isLoading ? (
                <View style={styles.contentRow}>
                  <ActivityIndicator size="small" color={textColor} />
                  {text ? <Text style={[styles.text, { color: textColor, marginLeft: 8 }]}>{text}</Text> : null}
                </View>
              ) : (
                <View style={styles.contentRow}>
                  {icon}
                  {text ? (
                    <Text
                      style={[
                        styles.text,
                        { color: textColor, marginLeft: icon ? 6 : 0 },
                      ]}
                    >
                      {text}
                    </Text>
                  ) : null}
                </View>
              )}
            </View>
          </View>
        );
      }}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
  },
  fullWidth: {
    alignSelf: 'stretch',
    width: '100%',
  },
  buttonWrapper: {
    position: 'relative',
  },
  shadow: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  front: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '900',
    fontSize: 13.5,
    letterSpacing: 0.3,
  },
});
