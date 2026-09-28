import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { AnonUTheme } from '../../src/constants/theme';
import { NotificationModel, NotificationType } from '../../src/types/user';
import { useNotifications, useMarkAllNotificationsRead } from '../../src/hooks/useNotifications';
import { useAuthStore } from '../../src/stores/useAuthStore';
import { firestore } from '../../src/services/firebase';
import { BrutalistCard } from '../../src/components/BrutalistCard';
import { BrutalistButton } from '../../src/components/BrutalistButton';
import { BrutalistBottomBar } from './_layout';

export default function AlertsScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const { data: alerts, isLoading, refetch, isRefetching } = useNotifications(user?.uid);
  const markAllReadMutation = useMarkAllNotificationsRead(user?.uid);

  const handleOpenAlert = async (item: NotificationModel) => {
    // Mark as read in Firestore
    if (!item.isRead) {
      firestore().collection('notifications').doc(item.id).update({ isRead: true });
    }

    if (item.postId) {
      router.push(`/post/${item.postId}` as any);
    }
  };

  const getTypeVisual = (type: NotificationType) => {
    switch (type) {
      case 'upvote':
        return { icon: '▲', color: AnonUTheme.popMint };
      case 'comment':
        return { icon: '💬', color: AnonUTheme.popYellow };
      case 'reply':
        return { icon: '↩️', color: AnonUTheme.popCyan };
      case 'repost':
        return { icon: '🔁', color: AnonUTheme.popOrange };
      case 'mention':
        return { icon: '@', color: AnonUTheme.popPurple };
      default:
        return { icon: '🔔', color: AnonUTheme.popYellow };
    }
  };

  const formatTimeago = (date: Date) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'JUST NOW';
    if (mins < 60) return `${mins}M AGO`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}H AGO`;
    return `${Math.floor(hours / 24)}D AGO`;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>CAMPUS ALERTS</Text>

        <BrutalistButton
          text="MARK READ"
          backgroundColor={AnonUTheme.popYellow}
          shadowOffset={{ width: 2, height: 2 }}
          paddingVertical={6}
          paddingHorizontal={10}
          onPress={() => markAllReadMutation.mutate()}
        />
      </View>

      {/* Alerts Content */}
      <View style={styles.listContainer}>
        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={AnonUTheme.black} />
          </View>
        ) : !alerts || alerts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <BrutalistCard padding={24} style={styles.emptyCard}>
              <View style={styles.emptyIconBox}>
                <Text style={styles.emptyEmoji}>🔕</Text>
              </View>
              <Text style={styles.emptyTitle}>ALL QUIET ON CAMPUS</Text>
              <Text style={styles.emptySubtitle}>
                No new notifications. When someone upvotes, replies, or reposts your publications, alerts show up here.
              </Text>
            </BrutalistCard>
          </View>
        ) : (
          <FlashList
            data={alerts}
            keyExtractor={(item) => item.id}
            estimatedItemSize={76}
            refreshing={isRefetching}
            onRefresh={refetch}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              const visual = getTypeVisual(item.type);
              return (
                <BrutalistCard
                  onPress={() => handleOpenAlert(item)}
                  backgroundColor={item.isRead ? AnonUTheme.bgSurface : '#FFFBEA'}
                  borderWidth={AnonUTheme.borderWidthThin}
                  shadowOffset={{ width: 2, height: 2 }}
                  padding={12}
                  style={styles.cardItem}
                >
                  <View style={styles.alertRow}>
                    {/* Visual sticker badge */}
                    <View
                      style={[
                        styles.stickerBadge,
                        { backgroundColor: visual.color },
                      ]}
                    >
                      <Text style={styles.stickerIcon}>{visual.icon}</Text>
                    </View>

                    {/* Content Col */}
                    <View style={styles.contentCol}>
                      <View style={styles.messageRow}>
                        <Text
                          style={[
                            styles.messageText,
                            !item.isRead && styles.unreadBold,
                          ]}
                        >
                          {item.message}
                        </Text>
                        {!item.isRead && <View style={styles.unreadDot} />}
                      </View>

                      {item.postPreview && (
                        <View style={styles.previewBox}>
                          <Text style={styles.previewText} numberOfLines={1}>
                            {item.postPreview}
                          </Text>
                        </View>
                      )}

                      <Text style={styles.timeagoText}>
                        {formatTimeago(item.createdAt)}
                      </Text>
                    </View>
                  </View>
                </BrutalistCard>
              );
            }}
          />
        )}
      </View>

      <BrutalistBottomBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AnonUTheme.bgCream,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomColor: AnonUTheme.black,
    borderBottomWidth: AnonUTheme.borderWidthThin,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: AnonUTheme.black,
    letterSpacing: 0.3,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingVertical: 8,
  },
  cardItem: {
    marginHorizontal: 14,
    marginVertical: 4,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyCard: {
    alignItems: 'center',
    width: '100%',
  },
  emptyIconBox: {
    padding: 12,
    backgroundColor: AnonUTheme.popYellow,
    borderColor: AnonUTheme.black,
    borderWidth: 2,
    borderRadius: 8,
    marginBottom: 14,
  },
  emptyEmoji: {
    fontSize: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: AnonUTheme.black,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  emptySubtitle: {
    textAlign: 'center',
    color: AnonUTheme.textSecondary,
    fontSize: 12.5,
    fontWeight: '600',
    lineHeight: 18,
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stickerBadge: {
    width: 36,
    height: 36,
    borderColor: AnonUTheme.black,
    borderWidth: 2,
    borderRadius: AnonUTheme.radiusSm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stickerIcon: {
    fontSize: 16,
    fontWeight: '900',
    color: AnonUTheme.black,
  },
  contentCol: {
    flex: 1,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  messageText: {
    flex: 1,
    color: AnonUTheme.black,
    fontSize: 13.5,
    fontWeight: '700',
  },
  unreadBold: {
    fontWeight: '900',
  },
  unreadDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: AnonUTheme.popYellow,
    borderColor: AnonUTheme.black,
    borderWidth: 1.5,
    marginLeft: 6,
  },
  previewBox: {
    backgroundColor: AnonUTheme.bgCream,
    borderColor: AnonUTheme.black,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 4,
  },
  previewText: {
    color: AnonUTheme.textSecondary,
    fontSize: 11.5,
    fontWeight: '600',
  },
  timeagoText: {
    color: AnonUTheme.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginTop: 4,
  },
});
