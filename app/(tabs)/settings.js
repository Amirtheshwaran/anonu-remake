import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  useColorScheme,
  Animated,
  Platform,
  View,
  Modal,
  TextInput
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import ThemedView from '../components/ThemedView';
import ThemedText from '../components/ThemedText';
import { Colors } from '../../constants/Colors';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const SettingItem = ({ icon, title, description, value, onToggle, color = 'primary', disabled = false }) => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'dark'];
  const [scaleAnim] = useState(new Animated.Value(1));

  const onPressIn = () => {
    if (!disabled) {
      Animated.spring(scaleAnim, {
        toValue: 0.97,
        useNativeDriver: true,
        tension: 100,
        friction: 7
      }).start();
    }
  };

  const onPressOut = () => {
    if (!disabled) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 7
      }).start();
    }
  };

  const handlePress = () => {
    if (!disabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onToggle();
    }
  };

  return (
    <AnimatedTouchable
      onPress={handlePress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      activeOpacity={disabled ? 1 : 0.7}
      style={[
        { 
          transform: [{ scale: scaleAnim }],
          opacity: disabled ? 0.6 : scaleAnim.interpolate({
            inputRange: [0.97, 1],
            outputRange: [0.9, 1]
          })
        }
      ]}
    >
      <View style={[
        styles.settingItem,
        { 
          backgroundColor: theme.cardBg,
          ...Platform.select({
            ios: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
            },
            android: {
              elevation: 2,
            },
          }),
        }
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
          onValueChange={disabled ? null : onToggle}
          trackColor={{ 
            false: theme.surfaceHover, 
            true: theme[color] + '80'
          }}
          thumbColor={value ? theme[color] : theme.surface}
          ios_backgroundColor={theme.surfaceHover}
          style={styles.switch}
          disabled={disabled}
        />
      </View>
    </AnimatedTouchable>
  );
};

const LinkItem = ({ icon, title, subtitle, onPress, color = 'primary', badge }) => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'dark'];
  const [scaleAnim] = useState(new Animated.Value(1));

  const onPressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      tension: 100,
      friction: 7
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 7
    }).start();
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <AnimatedTouchable
      onPress={handlePress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      activeOpacity={0.7}
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
        { 
          backgroundColor: theme.cardBg,
          ...Platform.select({
            ios: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
            },
            android: {
              elevation: 2,
            },
          }),
        }
      ]}>
        <View style={[styles.iconContainer, { backgroundColor: theme[color] + '20' }]}>
          <MaterialCommunityIcons name={icon} size={22} color={theme[color]} />
        </View>

        <View style={styles.linkContent}>
          <ThemedText weight="600" style={styles.linkText}>
            {title}
          </ThemedText>
          {subtitle && (
            <ThemedText color="secondary" style={styles.linkSubtitle}>
              {subtitle}
            </ThemedText>
          )}
        </View>

        <View style={styles.linkRight}>
          {badge && (
            <View style={[styles.badge, { backgroundColor: theme.accent }]}>
              <ThemedText style={styles.badgeText} color="white">
                {badge}
              </ThemedText>
            </View>
          )}
          <MaterialCommunityIcons 
            name="chevron-right" 
            size={24} 
            color={theme[color]} 
            style={styles.chevron}
          />
        </View>
      </View>
    </AnimatedTouchable>
  );
};

const ProfileSection = ({ onEditProfile }) => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'dark'];
  
  return (
    <TouchableOpacity 
      style={[styles.profileSection, { backgroundColor: theme.cardBg }]}
      onPress={onEditProfile}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={[theme.primary, theme.accent]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.profileAvatar}
      >
        <ThemedText style={styles.profileAvatarText} color="white">
          A
        </ThemedText>
      </LinearGradient>
      
      <View style={styles.profileInfo}>
        <ThemedText weight="bold" style={styles.profileName}>
          Anonymous User
        </ThemedText>
        <ThemedText color="secondary" style={styles.profileId}>
          ID: AnonU-12345
        </ThemedText>
      </View>
      
      <MaterialCommunityIcons 
        name="pencil" 
        size={22} 
        color={theme.primary} 
      />
    </TouchableOpacity>
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
    mentionNotifications: true,
    anonymousMessaging: true,
    showPostHistory: false,
    locationSharing: false,
    dataCollection: true,
    autoPlayVideos: true,
    saveData: false,
    twoFactorAuth: false,
    biometricLogin: false,
  });
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [displayName, setDisplayName] = useState('Anonymous User');
  const [tempDisplayName, setTempDisplayName] = useState('Anonymous User');

  // Update dark mode setting when system theme changes
  useEffect(() => {
    setSettings(prev => ({
      ...prev,
      darkMode: colorScheme === 'dark'
    }));
  }, [colorScheme]);

  const toggleSetting = (key) => {
    // Special handling for dependent settings
    if (key === 'notifications' && settings.notifications) {
      // If turning off main notifications, disable all notification sub-settings
      setSettings(prev => ({
        ...prev,
        notifications: false,
        messageNotifications: false,
        postNotifications: false,
        mentionNotifications: false
      }));
    } else if (key === 'notifications' && !settings.notifications) {
      // If turning on main notifications, enable all notification sub-settings
      setSettings(prev => ({
        ...prev,
        notifications: true,
        messageNotifications: true,
        postNotifications: true,
        mentionNotifications: true
      }));
    } else {
      // Normal toggle for other settings
      setSettings(prev => ({
        ...prev,
        [key]: !prev[key]
      }));
    }
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
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to permanently delete your account? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // Handle account deletion logic here
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          },
        },
      ]
    );
  };

  const handleEditProfile = () => {
    setTempDisplayName(displayName);
    setShowEditModal(true);
  };

  const saveProfile = () => {
    setDisplayName(tempDisplayName);
    setShowEditModal(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
        <ProfileSection onEditProfile={handleEditProfile} />
        
        {renderSection('Appearance')}
        <SettingItem
          icon="theme-light-dark"
          title="Dark Mode"
          description="Switch between light and dark theme"
          value={settings.darkMode}
          onToggle={() => toggleSetting('darkMode')}
        />
        <SettingItem
          icon="video"
          title="Auto-play Videos"
          description="Automatically play videos in feed"
          value={settings.autoPlayVideos}
          onToggle={() => toggleSetting('autoPlayVideos')}
        />
        <SettingItem
          icon="data-matrix"
          title="Data Saver"
          description="Reduce data usage when on cellular"
          value={settings.saveData}
          onToggle={() => toggleSetting('saveData')}
        />

        {renderSection('Notifications')}
        <SettingItem
          icon="bell"
          title="Enable Notifications"
          description="Master control for all notifications"
          value={settings.notifications}
          onToggle={() => toggleSetting('notifications')}
        />
        <SettingItem
          icon="message-processing"
          title="Message Notifications"
          description="Get notified for new messages"
          value={settings.messageNotifications}
          onToggle={() => toggleSetting('messageNotifications')}
          disabled={!settings.notifications}
        />
        <SettingItem
          icon="post"
          title="Post Notifications"
          description="Get notified for post interactions"
          value={settings.postNotifications}
          onToggle={() => toggleSetting('postNotifications')}
          disabled={!settings.notifications}
        />
        <SettingItem
          icon="at"
          title="Mention Notifications"
          description="Get notified when mentioned"
          value={settings.mentionNotifications}
          onToggle={() => toggleSetting('mentionNotifications')}
          disabled={!settings.notifications}
        />

        {renderSection('Privacy & Security')}
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
        <SettingItem
          icon="map-marker"
          title="Location Sharing"
          description="Share your location with the app"
          value={settings.locationSharing}
          onToggle={() => toggleSetting('locationSharing')}
        />
        <SettingItem
          icon="chart-bar"
          title="Data Collection"
          description="Allow anonymous usage data collection"
          value={settings.dataCollection}
          onToggle={() => toggleSetting('dataCollection')}
        />
        <SettingItem
          icon="two-factor-authentication"
          title="Two-Factor Authentication"
          description="Add an extra layer of security"
          value={settings.twoFactorAuth}
          onToggle={() => toggleSetting('twoFactorAuth')}
        />
        <SettingItem
          icon="fingerprint"
          title="Biometric Login"
          description="Use fingerprint or face recognition"
          value={settings.biometricLogin}
          onToggle={() => toggleSetting('biometricLogin')}
        />

        {renderSection('Account')}
        <LinkItem
          icon="account"
          title="Account Information"
          subtitle="Manage your account details"
          onPress={() => {}}
        />
        <LinkItem
          icon="shield-lock"
          title="Privacy Settings"
          subtitle="Control your data and visibility"
          onPress={() => {}}
        />
        <LinkItem
          icon="block-helper"
          title="Blocked Users"
          subtitle="Manage your blocked users list"
          badge="2"
          onPress={() => {}}
        />
        <LinkItem
          icon="download"
          title="Download Your Data"
          subtitle="Get a copy of your data"
          onPress={() => {}}
        />

        {renderSection('Support')}
        <LinkItem
          icon="help-circle"
          title="Help & Support"
          subtitle="Get assistance with the app"
          onPress={() => {}}
        />
        <LinkItem
          icon="shield-check"
          title="Community Guidelines"
          subtitle="Learn about our community rules"
          onPress={() => {}}
        />
        <LinkItem
          icon="file-document"
          title="Privacy Policy"
          subtitle="Read our privacy policy"
          onPress={() => {}}
        />
        <LinkItem
          icon="information"
          title="About AnonU"
          subtitle="Learn more about the app"
          onPress={() => {}}
        />

        <View style={styles.dangerZone}>
          <ThemedText color="error" weight="600" style={styles.dangerZoneTitle}>
            DANGER ZONE
          </ThemedText>
          
          <TouchableOpacity 
            activeOpacity={0.9}
            onPress={handleDeleteAccount}
            style={[styles.dangerButton, { borderColor: theme.error }]}
          >
            <MaterialCommunityIcons name="delete" size={24} color={theme.error} />
            <ThemedText 
              color="error"
              weight="600" 
              style={styles.dangerButtonText}
            >
              Delete Account
            </ThemedText>
          </TouchableOpacity>
        </View>

        <View style={styles.logoutContainer}>
          <TouchableOpacity 
            activeOpacity={0.9}
            onPress={handleLogout}
          >
            <LinearGradient
              colors={[theme.error, theme.error + 'CC']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.logoutButton}
            >
              <MaterialCommunityIcons name="logout" size={24} color="#FFFFFF" />
              <ThemedText 
                weight="600" 
                style={styles.logoutText}
              >
                Logout
              </ThemedText>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.versionContainer}>
          <ThemedText color="secondary" style={styles.versionText}>
            AnonU Version 1.0.0
          </ThemedText>
          <ThemedText color="secondary" style={styles.copyrightText}>
            © 2025 AnonU Inc. All rights reserved.
          </ThemedText>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.cardBg }]}>
            <View style={styles.modalHeader}>
              <ThemedText weight="bold" style={styles.modalTitle}>
                Edit Profile
              </ThemedText>
              <TouchableOpacity 
                onPress={() => setShowEditModal(false)}
                style={styles.closeButton}
              >
                <MaterialCommunityIcons 
                  name="close" 
                  size={24} 
                  color={theme.text} 
                />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <ThemedText weight="600" style={styles.inputLabel}>
                Display Name
              </ThemedText>
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: theme.surfaceHover,
                    color: theme.text,
                    borderColor: theme.border
                  }
                ]}
                value={tempDisplayName}
                onChangeText={setTempDisplayName}
                placeholder="Enter display name"
                placeholderTextColor={theme.textSecondary}
              />
              
              <ThemedText color="secondary" style={styles.inputNote}>
                This name will be visible to other users. Your anonymous ID will remain unchanged.
              </ThemedText>
            </View>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={[styles.cancelButton, { borderColor: theme.border }]}
                onPress={() => setShowEditModal(false)}
              >
                <ThemedText>Cancel</ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.saveButton, { backgroundColor: theme.primary }]}
                onPress={saveProfile}
              >
                <ThemedText color="white" weight="600">
                  Save Changes
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    margin: 16,
    marginTop: 24,
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  profileAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileAvatarText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  profileName: {
    fontSize: 18,
    marginBottom: 4,
  },
  profileId: {
    fontSize: 14,
  },
  sectionHeader: {
    padding: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    fontWeight: '600',
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
  linkContent: {
    flex: 1,
  },
  linkText: {
    fontSize: 16,
    marginLeft: 16,
  },
  linkSubtitle: {
    fontSize: 14,
    marginLeft: 16,
    opacity: 0.7,
  },
  linkRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    paddingHorizontal: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  chevron: {
    opacity: 0.8,
  },
  dangerZone: {
    marginTop: 24,
    marginHorizontal: 16,
    alignItems: 'center',
  },
  dangerZoneTitle: {
    fontSize: 13,
    letterSpacing: 1,
    marginBottom: 16,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    width: '100%',
  },
  dangerButtonText: {
    marginLeft: 8,
    fontSize: 16,
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
    marginBottom: 4,
  },
  copyrightText: {
    opacity: 0.6,
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    maxWidth: 500,
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalTitle: {
    fontSize: 18,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBody: {
    padding: 16,
  },
  inputLabel: {
    marginBottom: 8,
    fontSize: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 8,
  },
  inputNote: {
    fontSize: 14,
    marginBottom: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    justifyContent: 'flex-end',
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 8,
  },
  saveButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
});
