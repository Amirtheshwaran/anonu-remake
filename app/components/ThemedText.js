import React from 'react';
import { Text, useColorScheme } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { Colors } from '../../constants/Colors';

const ThemedText = ({
  style,
  variant = 'body',
  color = 'default',
  weight = 'regular',
  align,
  gradient,
  shadow,
  ...otherProps
}) => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const getTextColor = () => {
    switch (color) {
      case 'secondary':
        return theme.textSecondary;
      case 'primary':
        return theme.primary;
      case 'accent':
        return theme.accent;
      case 'success':
        return theme.success;
      case 'error':
        return theme.error;
      case 'warning':
        return theme.warning;
      case 'info':
        return theme.info;
      default:
        return theme.text;
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'h1':
        return {
          fontSize: 32,
          lineHeight: 40,
          letterSpacing: -0.5,
        };
      case 'h2':
        return {
          fontSize: 28,
          lineHeight: 36,
          letterSpacing: -0.25,
        };
      case 'h3':
        return {
          fontSize: 24,
          lineHeight: 32,
          letterSpacing: 0,
        };
      case 'h4':
        return {
          fontSize: 20,
          lineHeight: 28,
          letterSpacing: 0.15,
        };
      case 'subtitle':
        return {
          fontSize: 18,
          lineHeight: 26,
          letterSpacing: 0.15,
        };
      case 'body-lg':
        return {
          fontSize: 16,
          lineHeight: 24,
          letterSpacing: 0.5,
        };
      case 'body':
        return {
          fontSize: 14,
          lineHeight: 22,
          letterSpacing: 0.25,
        };
      case 'caption':
        return {
          fontSize: 12,
          lineHeight: 18,
          letterSpacing: 0.4,
        };
      case 'small':
        return {
          fontSize: 11,
          lineHeight: 16,
          letterSpacing: 0.4,
        };
      case 'button':
        return {
          fontSize: 14,
          lineHeight: 20,
          letterSpacing: 0.75,
          textTransform: 'uppercase',
        };
      default:
        return {
          fontSize: 14,
          lineHeight: 22,
          letterSpacing: 0.25,
        };
    }
  };

  const getFontWeight = () => {
    switch (weight) {
      case 'thin':
        return '200';
      case 'light':
        return '300';
      case 'regular':
        return '400';
      case 'medium':
        return '500';
      case 'semibold':
        return '600';
      case 'bold':
        return '700';
      case 'extrabold':
        return '800';
      case 'black':
        return '900';
      default:
        return '400';
    }
  };

  const getTextShadow = () => {
    if (!shadow) return {};

    switch (shadow) {
      case 'subtle':
        return {
          textShadowColor: 'rgba(0, 0, 0, 0.2)',
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 2,
        };
      case 'medium':
        return {
          textShadowColor: 'rgba(0, 0, 0, 0.3)',
          textShadowOffset: { width: 0, height: 2 },
          textShadowRadius: 4,
        };
      case 'strong':
        return {
          textShadowColor: 'rgba(0, 0, 0, 0.4)',
          textShadowOffset: { width: 0, height: 3 },
          textShadowRadius: 6,
        };
      default:
        return {};
    }
  };

  const textStyle = [
    getTextStyle(),
    {
      color: getTextColor(),
      fontWeight: getFontWeight(),
      textAlign: align,
    },
    getTextShadow(),
    style,
  ];

  if (gradient) {
    return (
      <MaskedView
        maskElement={
          <Text style={textStyle} {...otherProps} />
        }
      >
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1 }}
        >
          <Text style={[textStyle, { opacity: 0 }]} {...otherProps} />
        </LinearGradient>
      </MaskedView>
    );
  }

  return (
    <Text
      style={textStyle}
      {...otherProps}
    />
  );
};

export default ThemedText;
