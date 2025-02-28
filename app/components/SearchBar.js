import React, { useState } from 'react';
import { 
  View, 
  TextInput, 
  StyleSheet, 
  Platform, 
  TouchableOpacity, 
  Animated,
  Keyboard
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { Colors } from '../../constants/Colors';
import { BlurView } from 'expo-blur';

export default function SearchBar({ placeholder, onChangeText, value, onSubmit }) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'dark'];
  const [isFocused, setIsFocused] = useState(false);
  const [animatedValue] = useState(new Animated.Value(0));
  const [text, setText] = useState(value || '');

  const handleFocus = () => {
    setIsFocused(true);
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleBlur = () => {
    setIsFocused(false);
    Animated.timing(animatedValue, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleClear = () => {
    setText('');
    if (onChangeText) {
      onChangeText('');
    }
  };

  const handleChangeText = (text) => {
    setText(text);
    if (onChangeText) {
      onChangeText(text);
    }
  };

  const handleSubmit = () => {
    Keyboard.dismiss();
    if (onSubmit) {
      onSubmit(text);
    }
  };

  const borderColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.border, theme.primary]
  });

  const shadowOpacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.15]
  });

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          backgroundColor: theme.cardBg,
          borderColor: borderColor,
          shadowOpacity: shadowOpacity,
          shadowColor: theme.primary,
          transform: [
            {
              scale: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1.02]
              })
            }
          ]
        }
      ]}
    >
      {Platform.OS === 'ios' && isFocused && (
        <BlurView
          tint={colorScheme}
          intensity={80}
          style={StyleSheet.absoluteFill}
        />
      )}
      
      <MaterialCommunityIcons 
        name="magnify" 
        size={20} 
        color={isFocused ? theme.primary : theme.textSecondary}
        style={styles.icon}
      />
      
      <TextInput
        placeholder={placeholder}
        placeholderTextColor={theme.textSecondary}
        style={[
          styles.input,
          { 
            color: theme.text,
            fontSize: 16,
          }
        ]}
        value={text}
        onChangeText={handleChangeText}
        onFocus={handleFocus}
        onBlur={handleBlur}
        selectionColor={theme.primary}
        returnKeyType="search"
        onSubmitEditing={handleSubmit}
      />
      
      {text.length > 0 && (
        <TouchableOpacity 
          onPress={handleClear}
          style={styles.clearButton}
          activeOpacity={0.7}
        >
          <View style={[styles.clearButtonInner, { backgroundColor: theme.textSecondary + '30' }]}>
            <MaterialCommunityIcons 
              name="close" 
              size={16} 
              color={theme.textSecondary}
            />
          </View>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 8,
  },
  clearButton: {
    padding: 4,
  },
  clearButtonInner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  }
});
