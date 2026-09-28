import React from 'react';
import { View, StyleSheet, Pressable, ViewStyle, StyleProp } from 'react-native';
import { AnonUTheme } from '../constants/theme';

interface BrutalistCardProps {
  children: React.ReactNode;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  shadowColor?: string;
  shadowOffset?: { width: number; height: number };
  hasShadow?: boolean;
  padding?: number;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}

export const BrutalistCard: React.FC<BrutalistCardProps> = ({
  children,
  backgroundColor = AnonUTheme.bgSurface,
  borderColor = AnonUTheme.black,
  borderWidth = AnonUTheme.borderWidth,
  borderRadius = AnonUTheme.radiusSm,
  shadowColor = AnonUTheme.black,
  shadowOffset = AnonUTheme.shadowOffset,
  hasShadow = true,
  padding,
  style,
  onPress,
}) => {
  const content = (
    <View style={[styles.wrapper, style]}>
      {hasShadow && (
        <View
          style={[
            styles.shadowLayer,
            {
              backgroundColor: shadowColor,
              borderRadius,
              top: shadowOffset.height,
              left: shadowOffset.width,
            },
          ]}
        />
      )}
      <View
        style={[
          styles.frontLayer,
          {
            backgroundColor,
            borderColor,
            borderWidth,
            borderRadius,
            padding: padding !== undefined ? padding : 14,
          },
        ]}
      >
        {children}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={styles.pressableContainer}>
        {content}
      </Pressable>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  pressableContainer: {
    width: '100%',
  },
  wrapper: {
    position: 'relative',
    marginVertical: 4,
  },
  shadowLayer: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  frontLayer: {
    width: '100%',
    overflow: 'hidden',
  },
});
