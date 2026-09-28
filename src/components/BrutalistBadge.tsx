import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { AnonUTheme } from '../constants/theme';

interface BrutalistBadgeProps {
  label: string;
  icon?: React.ReactNode;
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  fontSize?: number;
  hasShadow?: boolean;
  onPress?: () => void;
}

export const BrutalistBadge: React.FC<BrutalistBadgeProps> = ({
  label,
  icon,
  backgroundColor = AnonUTheme.popMint,
  textColor = AnonUTheme.black,
  borderColor = AnonUTheme.black,
  borderWidth = AnonUTheme.borderWidthThin,
  borderRadius = AnonUTheme.radiusSm,
  fontSize = 10.5,
  hasShadow = true,
  onPress,
}) => {
  const content = (
    <View style={styles.wrapper}>
      {hasShadow && (
        <View
          style={[
            styles.shadow,
            {
              backgroundColor: borderColor,
              borderRadius,
              top: 2,
              left: 2,
            },
          ]}
        />
      )}
      <View
        style={[
          styles.badge,
          {
            backgroundColor,
            borderColor,
            borderWidth,
            borderRadius,
          },
        ]}
      >
        {icon ? <View style={styles.icon}>{icon}</View> : null}
        <Text style={[styles.label, { color: textColor, fontSize }]}>
          {label.toUpperCase()}
        </Text>
      </View>
    </View>
  );

  if (onPress) {
    return <Pressable onPress={onPress}>{content}</Pressable>;
  }

  return content;
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    alignSelf: 'flex-start',
  },
  shadow: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  icon: {
    marginRight: 4,
  },
  label: {
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
