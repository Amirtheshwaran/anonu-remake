import React, { useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  useColorScheme,
  Animated,
  Platform,
  View
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ThemedText from '../components/ThemedText';
import { Colors } from '../../constants/Colors';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const SettingItem = ({ icon, title, description, value, onToggle, color = 'primary' }) => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'dark'];
  const [scaleAnim] = useState(new Animated.Value(1));

  const onPressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <AnimatedTouchable
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={[
        { 
          transform: [{ scale: scaleAnim }],
          opacity: scaleAnim.interpolate({
            inputRange: [0.97, 1],
            outputRange: [0.9, 1]
          })
        }
      ]}
    >
      <View style={[
        styles.settingItem,
        { backgroundColor: theme.cardBg }
      ]}>
        <View style={[styles.iconContainer, { backgroundColor: theme[color] + '20' }]}>
          <MaterialCommunityIcons 
            name={icon} 
            size={22} 
            color={theme[color]} 
          />
        </View>

        <View style={styles.settingContent}>
          <ThemedText weight="600" style={styles.settingTitle}>
            {title}
          </ThemedText>
          {description && (
            <ThemedText color="secondary" style={styles.settingDescription}>
              {description}
            </ThemedText>
          )}
        </View>

        <Switch
          value={value}
          onValueChange={onToggle}
          trackColor={{ 
            false: theme.surfaceHover, 
            true: theme[color] + '80'
          }}
          thumbColor={value ? theme[color] : theme.surface}
          ios_backgroundColor={theme.surfaceHover}
          style={styles.switch}
        />
      </View>
    </AnimatedTouchable>
  );
};

const LinkItem = ({ icon, title, onPress, color = 'primary' }) => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'dark'];
  const [scaleAnim] = useState(new Animated.Value(1));

  const onPressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <AnimatedTouchable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={[
        { 
          transform: [{ scale: scaleAnim }],
          opacity: scaleAnim.interpolate({
            inputRange: [0.97, 1],
            outputRange: [0.9, 1]
          })
        }
      ]}
    >
      <View style={[
        styles.linkItem,
        { backgroundColor: theme.cardBg }
      ]}>
        <View style={[styles.iconContainer, { backgroundColor: theme[color] + '20' }]}>
          <MaterialCommunityIcons name={icon} size={22} color={theme[color]} />
        </View>

        <ThemedText weight="600" style={styles.linkText}>
          {title}
        </ThemedText>

        <MaterialCommunityIcons 
          name="chevron-right" 
          size={24} 
          color={theme[color]} 
          style={styles.chevron}
        />
      </View>
    </AnimatedTouchable>
  );
};

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'dark'];
  const [settings, setSettings] = useState({
    darkMode: colorScheme === 'dark',
    notifications: true,
    messageNotifications: true,
    postNotifications: true,
    anonymousMessaging: true,
    showPostHistory: false,
  });

  const toggleSetting = (key) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            // Handle logout logic here
          },
        },
      ]
    );
  };

  const renderSection = (title) => (
    <View style={styles.sectionHeader}>
      <ThemedText color="secondary" style={styles.sectionTitle}>
        {title}
      </ThemedText>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {renderSection('Appearance')}
        <SettingItem
          icon="theme-light-dark"
          title="Dark Mode"
          description="Switch between light and dark theme"
          value={settings.darkMode}
          onToggle={() => toggleSetting('darkMode')}
        />

        {renderSection('Notifications')}
        <SettingItem
          icon="bell"
          title="Enable Notifications"
          description="Receive notifications for activity"
          value={settings.notifications}
          onToggle={() => toggleSetting('notifications')}
        />
        <SettingItem
          icon="message-processing"
          title="Message Notifications"
          description="Get notified for new messages"
          value={settings.messageNotifications}
          onToggle={() => toggleSetting('messageNotifications')}
        />
        <SettingItem
          icon="post"
          title="Post Notifications"
          description="Get notified for post interactions"
          value={settings.postNotifications}
          onToggle={() => toggleSetting('postNotifications')}
        />

        {renderSection('Privacy')}
        <SettingItem
          icon="message-lock"
          title="Anonymous Messaging"
          description="Allow others to message you anonymously"
          value={settings.anonymousMessaging}
          onToggle={() => toggleSetting('anonymousMessaging')}
        />
        <SettingItem
          icon="history"
          title="Show Post History"
          description="Allow others to see your post history"
          value={settings.showPostHistory}
          onToggle={() => toggleSetting('showPostHistory')}
        />

        {renderSection('Support')}
        <LinkItem
          icon="help-circle"
          title="Help & Support"
          onPress={() => {}}
        />
        <LinkItem
          icon="shield-check"
          title="Community Guidelines"
          onPress={() => {}}
        />
        <LinkItem
          icon="file-document"
          title="Privacy Policy"
          onPress={() => {}}
        />

        <View style={styles.logoutContainer}>
          <TouchableOpacity 
            activeOpacity={0.9}
            onPress={handleLogout}
          >
            <View style={[styles.logoutButton, { backgroundColor: theme.error }]}>
              <MaterialCommunityIcons name="logout" size={24} color="#FFFFFF" />
              <ThemedText 
                weight="600" 
                style={styles.logoutText}
              >
                Logout
              </ThemedText>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.versionContainer}>
          <ThemedText color="secondary" style={styles.versionText}>
            Version 1.0.0
          </ThemedText>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  sectionHeader: {
    padding: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    opacity: 0.7,
  },
  switch: {
    transform: [{ scale: 0.9 }],
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
  },
  linkText: {
    flex: 1,
    marginLeft: 16,
    fontSize: 16,
  },
  chevron: {
    opacity: 0.8,
  },
  logoutContainer: {
    padding: 16,
    marginTop: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
  },
  logoutText: {
    marginLeft: 8,
    color: '#FFFFFF',
    fontSize: 16,
  },
  versionContainer: {
    padding: 16,
    alignItems: 'center',
  },
  versionText: {
    opacity: 0.6,
    fontSize: 13,
  },
});
