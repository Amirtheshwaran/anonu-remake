import React, { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { authService } from '../src/services/authService';
import { useAuthStore } from '../src/stores/useAuthStore';
import { useUnreadNotificationsBadge } from '../src/hooks/useNotifications';
import { AnonUTheme } from '../src/constants/theme';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function RootNavigation() {
  const router = useRouter();
  const segments = useSegments();
  const { user, setUser, setFirebaseUser, setLoading, isLoading } = useAuthStore();

  useUnreadNotificationsBadge(user?.uid);

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged(async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        try {
          const profile = await authService.getUser(fbUser.uid);
          setUser(profile);
        } catch (err) {
          console.error('Error fetching user profile:', err);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'auth';
    const inOnboarding = segments[0] === 'onboarding';
    const isAuthenticated = !!user;

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/auth');
    } else if (isAuthenticated) {
      if (user.email && !user.onboardingCompleted && !inOnboarding) {
        router.replace('/onboarding');
      } else if (inAuthGroup || (inOnboarding && user.onboardingCompleted)) {
        router.replace('/(tabs)');
      }
    }
  }, [user, isLoading, segments]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={AnonUTheme.black} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" backgroundColor={AnonUTheme.bgCream} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: AnonUTheme.bgCream },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen
          name="compose"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen name="post/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="search" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <RootNavigation />
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: AnonUTheme.bgCream,
  },
});
