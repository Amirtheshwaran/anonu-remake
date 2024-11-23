import React from 'react';
import { View, TextInput, StyleSheet, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { Colors } from '../../constants/Colors';

export default function SearchBar({ placeholder, onChangeText }) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'dark'];

  return (
    <View style={[
      styles.container,
      {
        backgroundColor: theme.cardBg,
        borderColor: theme.border,
      }
    ]}>
      <MaterialCommunityIcons 
        name="magnify" 
        size={20} 
        color={theme.textSecondary}
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
        onChangeText={onChangeText}
        selectionColor={theme.primary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 8,
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 8,
  },
});
