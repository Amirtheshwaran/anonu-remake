import React from 'react';
import { Tabs, useRouter, usePathname } from 'expo-router';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AnonUTheme } from '../../src/constants/theme';
import { useUIStore } from '../../src/stores/useUIStore';

export default function TabLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const unreadCount = useUIStore((s) => s.unreadAlertsCount);

  const tabs = [
    { name: 'index', label: 'FEED', icon: '📰', activeIcon: '📰' },
    { name: 'alerts', label: 'ALERTS', icon: '🔔', activeIcon: '🔔', isAlerts: true },
    { name: 'profile', label: 'PROFILE', icon: '👤', activeIcon: '👤' },
  ];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' }, // We render custom brutalist bar
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Feed' }} />
      <Tabs.Screen name="alerts" options={{ title: 'Alerts' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}

export function BrutalistBottomBar() {
  const router = useRouter();
  const pathname = usePathname();
  const unreadCount = useUIStore((s) => s.unreadAlertsCount);

  const isFeed = pathname === '/' || pathname === '/(tabs)' || pathname === '/(tabs)/index';
  const isAlerts = pathname.includes('alerts');
  const isProfile = pathname.includes('profile');

  const destinations = [
    { route: '/(tabs)', label: 'FEED', icon: '📰', active: isFeed },
    { route: '/(tabs)/alerts', label: 'ALERTS', icon: '🔔', active: isAlerts, hasBadge: unreadCount > 0 },
    { route: '/(tabs)/profile', label: 'PROFILE', icon: '👤', active: isProfile },
  ];

  return (
    <SafeAreaView edges={['bottom']} style={styles.barSafeWrapper}>
      <View style={styles.barContainer}>
        {destinations.map((dest) => (
          <Pressable
            key={dest.label}
            onPress={() => router.push(dest.route as any)}
            style={styles.tabItem}
          >
            {dest.active ? (
              <View style={styles.activePillWrapper}>
                <View style={styles.pillShadow} />
                <View style={styles.pillFront}>
                  <View style={styles.iconWithBadge}>
                    <Text style={styles.tabIcon}>{dest.icon}</Text>
                    {dest.hasBadge && <View style={styles.alertDot} />}
                  </View>
                  <Text style={styles.activeLabel}>{dest.label}</Text>
                </View>
              </View>
            ) : (
              <View style={styles.inactivePill}>
                <View style={styles.iconWithBadge}>
                  <Text style={styles.tabIcon}>{dest.icon}</Text>
                  {dest.hasBadge && <View style={styles.alertDot} />}
                </View>
                <Text style={styles.inactiveLabel}>{dest.label}</Text>
              </View>
            )}
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  barSafeWrapper: {
    backgroundColor: AnonUTheme.bgSurface,
    borderTopColor: AnonUTheme.black,
    borderTopWidth: 2.5,
  },
  barContainer: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabItem: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activePillWrapper: {
    position: 'relative',
    height: 38,
  },
  pillShadow: {
    position: 'absolute',
    top: 2,
    left: 2,
    right: 0,
    bottom: 0,
    backgroundColor: AnonUTheme.black,
    borderRadius: AnonUTheme.radiusSm,
    width: '100%',
    height: 38,
  },
  pillFront: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 38,
    backgroundColor: AnonUTheme.popYellow,
    borderColor: AnonUTheme.black,
    borderWidth: AnonUTheme.borderWidthThin,
    borderRadius: AnonUTheme.radiusSm,
    paddingHorizontal: 12,
  },
  inactivePill: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 38,
    paddingHorizontal: 10,
  },
  iconWithBadge: {
    position: 'relative',
  },
  tabIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  alertDot: {
    position: 'absolute',
    top: -2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: AnonUTheme.downvoteRed,
    borderColor: AnonUTheme.black,
    borderWidth: 1.5,
  },
  activeLabel: {
    color: AnonUTheme.black,
    fontWeight: '900',
    fontSize: 11.5,
    letterSpacing: 0.5,
  },
  inactiveLabel: {
    color: AnonUTheme.black,
    fontWeight: '700',
    fontSize: 11.5,
    letterSpacing: 0.5,
  },
});
