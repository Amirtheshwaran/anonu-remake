import React from 'react';
import { View, StyleSheet, useColorScheme, Platform, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Colors } from '../../constants/Colors';

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

const ThemedView = ({
  style,
  variant = 'default',
  elevation = 0,
  radius = 'none',
  gradient,
  glass,
  border,
  animated,
  ...otherProps
}) => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'dark'];

  const getBackgroundColor = () => {
    // Only apply background color for specific variants
    switch (variant) {
      case 'card':
        return theme.cardBg;
      case 'surface':
        return theme.surface;
      case 'elevated':
        return theme.surfaceHover;
      default:
        return 'transparent';
    }
  };

  const getElevation = () => {
    if (elevation === 0) return {};
    
    const shadowColor = colorScheme === 'dark' ? '#000' : '#000';
    switch (elevation) {
      case 1:
        return Platform.select({
          ios: {
            shadowColor,
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: colorScheme === 'dark' ? 0.2 : 0.1,
            shadowRadius: 2,
          },
          android: {
            elevation: 2,
          },
        });
      case 2:
        return Platform.select({
          ios: {
            shadowColor,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: colorScheme === 'dark' ? 0.25 : 0.15,
            shadowRadius: 4,
          },
          android: {
            elevation: 4,
          },
        });
      default:
        return {};
    }
  };

  const getBorderRadius = () => {
    switch (radius) {
      case 'xs':
        return 4;
      case 'sm':
        return 8;
      case 'md':
        return 12;
      case 'lg':
        return 16;
      case 'xl':
        return 20;
      case '2xl':
        return 24;
      case 'full':
        return 9999;
      default:
        return 0;
    }
  };

  const getBorder = () => {
    if (!border) return {};

    return {
      borderWidth: border.width || 1,
      borderColor: border.color ? theme[border.color] || border.color : theme.border,
      borderStyle: border.style || 'solid',
    };
  };

  const containerStyle = [
    {
      backgroundColor: getBackgroundColor(),
      borderRadius: getBorderRadius(),
      overflow: 'hidden',
    },
    getElevation(),
    getBorder(),
    style,
  ];

  const renderContent = () => {
    if (gradient) {
      const GradientComponent = animated ? AnimatedLinearGradient : LinearGradient;
      return (
        <GradientComponent
          colors={gradient.colors}
          start={gradient.start || { x: 0, y: 0 }}
          end={gradient.end || { x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill]}
        />
      );
    }
    return null;
  };

  const renderGlass = () => {
    if (!glass || Platform.OS !== 'ios') return null;

    const BlurComponent = animated ? AnimatedBlurView : BlurView;
    return (
      <BlurComponent
        tint={colorScheme}
        intensity={glass.intensity || 50}
        style={[StyleSheet.absoluteFill]}
      />
    );
  };

  const ViewComponent = animated ? Animated.View : View;

  return (
    <ViewComponent style={containerStyle} {...otherProps}>
      {renderGlass()}
      {renderContent()}
      {otherProps.children}
    </ViewComponent>
  );
};

export default ThemedView;
