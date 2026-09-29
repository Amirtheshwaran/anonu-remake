import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { AnonUTheme } from '../../src/constants/theme';
import { PostModel } from '../../src/types/post';
import { IncidentReport } from '../../src/types/user';
import { useAuthStore } from '../../src/stores/useAuthStore';
import { authService } from '../../src/services/authService';
import { postService } from '../../src/services/postService';
import { useUserPosts } from '../../src/hooks/useFeed';
import { useBookmarkedPosts } from '../../src/hooks/usePost';
import { CAMPUS_CHANNELS } from '../../src/constants/channels';
import { PseudonymService } from '../../src/services/pseudonymService';
import { BrutalistCard } from '../../src/components/BrutalistCard';
import { BrutalistButton } from '../../src/components/BrutalistButton';
import { BrutalistBadge } from '../../src/components/BrutalistBadge';
import { BrutalistTextField } from '../../src/components/BrutalistTextField';
import { PostCard } from '../../src/components/PostCard';
import { BrutalistBottomBar } from './_layout';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, setUser, reset } = useAuthStore();
  const { data: ownPosts, isLoading: postsLoading, refetch } = useUserPosts(user?.uid);
  const { data: bookmarkedPosts, isLoading: bookmarksLoading, refetch: refetchBookmarks } = useBookmarkedPosts(user?.uid);

  const [profileTab, setProfileTab] = useState<'posts' | 'bookmarks'>('posts');

  // Edit Profile modal
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState(user?.displayName || '');
  const [editAvatar, setEditAvatar] = useState(user?.avatarUrl || '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Moderator reports
  const [reports, setReports] = useState<IncidentReport[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);

  useEffect(() => {
    if (user?.isModerator) {
      loadReports();
    }
  }, [user?.isModerator]);

  const loadReports = async () => {
    setReportsLoading(true);
    try {
      const items = await postService.getReports();
      setReports(
        items.map((i: any) => ({
          id: i.id,
          postId: i.postId,
          reason: i.reason || 'Unspecified',
          status: i.status || 'pending',
          createdAt: i.createdAt ? i.createdAt.toDate() : new Date(),
        }))
      );
    } catch (err) {
      console.warn('Reports load warning:', err);
    } finally {
      setReportsLoading(false);
    }
  };

  const handleLogOut = async () => {
    await authService.signOut();
    reset();
    router.replace('/auth');
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    try {
      const name = editName.trim() || null;
      const avatar = editAvatar.trim() || null;
      await authService.updatePublicProfile(user.uid, name, avatar);
      setUser({
        ...user,
        displayName: name,
        avatarUrl: avatar,
      });
      setEditModalVisible(false);
    } catch (err) {
      console.error('Save profile error:', err);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleResolveReport = async (reportId: string, postId?: string | null, hidePost = false) => {
    try {
      await postService.resolveReport({
        reportId,
        postId: postId || undefined,
        action: hidePost ? 'hide' : 'dismiss',
      });
      setReports((prev) => prev.filter((r) => r.id !== reportId));
    } catch (err) {
      console.error('Resolve report error:', err);
    }
  };

  const avatarColor = user ? PseudonymService.colorForPseudonym(user.pseudonym) : AnonUTheme.popMint;
  const initials = user
    ? user.pseudonym
        .split(' ')
        .map((w) => (w ? w[0] : ''))
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U';

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>CAMPUS IDENTITY</Text>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <Pressable onPress={() => router.push('/settings')} style={styles.settingsBtn}>
            <Text style={styles.settingsIcon}>⚙️</Text>
          </Pressable>
          <BrutalistButton
            text="LOG OUT"
            backgroundColor={AnonUTheme.downvoteRed}
            textColor={AnonUTheme.white}
            shadowOffset={{ width: 2, height: 2 }}
            paddingVertical={6}
            paddingHorizontal={10}
            onPress={handleLogOut}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Card */}
        <BrutalistCard padding={16} style={styles.profileHeaderCard}>
          <View style={styles.profileRow}>
            {/* Avatar */}
            <View style={[styles.avatarBox, { backgroundColor: avatarColor }]}>
              {user?.avatarUrl ? (
                <Image
                  source={{ uri: user.avatarUrl }}
                  style={styles.avatarImg}
                  contentFit="cover"
                />
              ) : (
                <Text style={styles.initialsText}>{initials}</Text>
              )}
            </View>

            {/* Details */}
            <View style={styles.profileDetails}>
              <View style={styles.nameBadgeRow}>
                <Text style={styles.pseudonymText} numberOfLines={1}>
                  {user?.pseudonym || 'Campus Member'}
                </Text>
                <BrutalistBadge
                  label="PERM MASK"
                  backgroundColor={AnonUTheme.popMint}
                  fontSize={8.5}
                  borderWidth={1.5}
                  hasShadow={false}
                />
              </View>

              <Text style={styles.realNameText}>
                {user?.displayName
                  ? `Real Name: ${user.displayName}`
                  : 'Real Name: Not configured yet'}
              </Text>

              <View style={styles.emailPill}>
                <Text style={styles.emailText}>
                  {user?.email || 'GUEST ANONYMOUS SESSION'}
                </Text>
              </View>
            </View>
          </View>
        </BrutalistCard>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCol}>
            <BrutalistCard padding={10} style={styles.statCard}>
              <Text style={styles.statValue}>{user?.postCount ?? 0}</Text>
              <Text style={styles.statLabel}>PUBLICATIONS</Text>
            </BrutalistCard>
          </View>

          <View style={styles.statCol}>
            <BrutalistCard padding={10} style={styles.statCard}>
              <Text style={styles.statValue}>{user?.upvotesReceived ?? 0}</Text>
              <Text style={styles.statLabel}>UPVOTES</Text>
            </BrutalistCard>
          </View>

          <View style={styles.statCol}>
            <BrutalistCard padding={10} style={styles.statCard}>
              <Text style={styles.statValue}>{`${user?.longestStreak ?? 0}🔥`}</Text>
              <Text style={styles.statLabel}>BEST STREAK</Text>
            </BrutalistCard>
          </View>
        </View>

        {/* Edit Profile Action */}
        <View style={styles.editActionWrapper}>
          <BrutalistButton
            text="EDIT IDENTIFIED PROFILE"
            backgroundColor={AnonUTheme.popCyan}
            isFullWidth={true}
            shadowOffset={{ width: 2.5, height: 2.5 }}
            onPress={() => {
              setEditName(user?.displayName || '');
              setEditAvatar(user?.avatarUrl || '');
              setEditModalVisible(true);
            }}
          />
        </View>

        {/* Moderator Panel (if moderator) */}
        {user?.isModerator && (
          <BrutalistCard
            backgroundColor="#FFF7EA"
            borderWidth={AnonUTheme.borderWidth}
            padding={16}
            style={styles.modCard}
          >
            <View style={styles.modHeader}>
              <View style={styles.modBadge}>
                <Text style={styles.modBadgeIcon}>🛡️</Text>
              </View>
              <Text style={styles.modTitle}>CAMPUS MODERATOR QUEUE</Text>
            </View>

            {reportsLoading ? (
              <ActivityIndicator size="small" color={AnonUTheme.black} />
            ) : reports.length === 0 ? (
              <View style={styles.modCleanBox}>
                <Text style={styles.modCleanText}>
                  No open incident reports. Campus is clean.
                </Text>
              </View>
            ) : (
              reports.map((report) => (
                <View key={report.id} style={styles.reportRow}>
                  <View style={styles.reportTextCol}>
                    <Text style={styles.reportReason}>
                      {`Reason: ${report.reason}`}
                    </Text>
                    {report.postId && (
                      <Text style={styles.reportPostId}>
                        {`Post ID: ${report.postId}`}
                      </Text>
                    )}
                  </View>
                  <View style={styles.reportActionButtons}>
                    <BrutalistButton
                      text="DISMISS"
                      backgroundColor={AnonUTheme.bgCream}
                      shadowOffset={{ width: 1.5, height: 1.5 }}
                      paddingVertical={4}
                      paddingHorizontal={8}
                      onPress={() => handleResolveReport(report.id, report.postId, false)}
                    />
                    <View style={{ width: 6 }} />
                    <BrutalistButton
                      text="HIDE POST"
                      backgroundColor={AnonUTheme.downvoteRed}
                      textColor={AnonUTheme.white}
                      shadowOffset={{ width: 1.5, height: 1.5 }}
                      paddingVertical={4}
                      paddingHorizontal={8}
                      onPress={() => handleResolveReport(report.id, report.postId, true)}
                    />
                  </View>
                </View>
              ))
            )}
          </BrutalistCard>
        )}

        {/* Profile Subtabs (Posts / Bookmarks) */}
        <View style={styles.subtabsWrapper}>
          <View style={styles.subtabsShadow} />
          <View style={styles.subtabsRow}>
            <Pressable
              onPress={() => setProfileTab('posts')}
              style={[
                styles.subtabButton,
                profileTab === 'posts' && styles.subtabActive,
              ]}
            >
              <Text
                style={[
                  styles.subtabText,
                  profileTab === 'posts' && styles.subtabTextActive,
                ]}
              >
                {`📜 PUBLICATIONS (${ownPosts?.length || 0})`}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setProfileTab('bookmarks')}
              style={[
                styles.subtabButton,
                profileTab === 'bookmarks' && styles.subtabActive,
              ]}
            >
              <Text
                style={[
                  styles.subtabText,
                  profileTab === 'bookmarks' && styles.subtabTextActive,
                ]}
              >
                {`🔖 SAVED (${bookmarkedPosts?.length || 0})`}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Content based on subtab */}
        {profileTab === 'posts' ? (
          postsLoading ? (
            <ActivityIndicator style={{ marginVertical: 20 }} color={AnonUTheme.black} />
          ) : !ownPosts || ownPosts.length === 0 ? (
            <BrutalistCard padding={20} style={styles.emptyArchiveCard}>
              <Text style={styles.emptyIcon}>📜</Text>
              <Text style={styles.emptyArchiveTitle}>NO POSTS PUBLISHED YET</Text>
              <Text style={styles.emptyArchiveSub}>
                Your anonymous and identified campus posts will be indexed here.
              </Text>
            </BrutalistCard>
          ) : (
            ownPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onPress={() => router.push(`/post/${post.id}` as any)}
                onUpvote={() => {}}
                onDownvote={() => {}}
                onComment={() => router.push(`/post/${post.id}` as any)}
                onRepost={() => {}}
                onReport={() => {}}
              />
            ))
          )
        ) : (
          bookmarksLoading ? (
            <ActivityIndicator style={{ marginVertical: 20 }} color={AnonUTheme.black} />
          ) : !bookmarkedPosts || bookmarkedPosts.length === 0 ? (
            <BrutalistCard padding={20} style={styles.emptyArchiveCard}>
              <Text style={styles.emptyIcon}>🔖</Text>
              <Text style={styles.emptyArchiveTitle}>NO SAVED THREADS</Text>
              <Text style={styles.emptyArchiveSub}>
                Bookmark campus threads using the ribbon icon to save them here for quick access.
              </Text>
            </BrutalistCard>
          ) : (
            bookmarkedPosts.map((bm) => (
              <Pressable
                key={bm.id}
                onPress={() => router.push(`/post/${bm.postId}` as any)}
              >
                <BrutalistCard padding={14} style={styles.bookmarkCard}>
                  <View style={styles.bookmarkHeader}>
                    <BrutalistBadge
                      label={`#${(bm.channel || 'General').toUpperCase()}`}
                      backgroundColor={AnonUTheme.popCyan}
                      fontSize={8}
                      borderWidth={1.5}
                      hasShadow={false}
                    />
                    <Text style={styles.bookmarkAuthor}>@{bm.authorPseudonym}</Text>
                    <Pressable
                      onPress={async () => {
                        if (user) {
                          await postService.unbookmarkPost(user.uid, bm.postId);
                          refetchBookmarks();
                        }
                      }}
                      style={styles.unbookmarkBtn}
                    >
                      <Text style={styles.unbookmarkText}>✕ REMOVE</Text>
                    </Pressable>
                  </View>
                  <Text style={styles.bookmarkPreview} numberOfLines={2}>
                    {bm.postPreview}
                  </Text>
                </BrutalistCard>
              </Pressable>
            ))
          )
        )}
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <BrutalistCard padding={20} style={styles.editProfileCard}>
            <Text style={styles.editModalTitle}>IDENTIFIED PROFILE</Text>
            <Text style={styles.editModalSubtitle}>
              Configure your real name and avatar for identified campus posts.
            </Text>

            <Text style={styles.inputLabel}>DISPLAY NAME</Text>
            <BrutalistTextField
              value={editName}
              onChangeText={setEditName}
              placeholder="e.g. Alex Johnson"
            />

            <Text style={[styles.inputLabel, { marginTop: 12 }]}>AVATAR IMAGE URL</Text>
            <BrutalistTextField
              value={editAvatar}
              onChangeText={setEditAvatar}
              placeholder="https://example.com/avatar.jpg"
            />

            <View style={styles.editButtonsRow}>
              <BrutalistButton
                text="CANCEL"
                backgroundColor="#E5E2D9"
                shadowOffset={{ width: 2, height: 2 }}
                onPress={() => setEditModalVisible(false)}
              />
              <View style={{ width: 10 }} />
              <BrutalistButton
                text="SAVE CHANGES"
                backgroundColor={AnonUTheme.popYellow}
                shadowOffset={{ width: 2, height: 2 }}
                isLoading={savingProfile}
                onPress={handleSaveProfile}
              />
            </View>
          </BrutalistCard>
        </View>
      </Modal>

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
  settingsBtn: {
    width: 32,
    height: 32,
    backgroundColor: AnonUTheme.bgSurface,
    borderColor: AnonUTheme.black,
    borderWidth: AnonUTheme.borderWidthThin,
    borderRadius: AnonUTheme.radiusSm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsIcon: {
    fontSize: 16,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  profileHeaderCard: {
    marginHorizontal: 14,
    marginTop: 10,
    marginBottom: 6,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarBox: {
    width: 60,
    height: 60,
    borderRadius: AnonUTheme.radiusSm,
    borderColor: AnonUTheme.black,
    borderWidth: 2.5,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  initialsText: {
    fontWeight: '900',
    fontSize: 22,
    color: AnonUTheme.black,
  },
  profileDetails: {
    flex: 1,
    marginLeft: 14,
  },
  nameBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pseudonymText: {
    fontSize: 17,
    fontWeight: '900',
    color: AnonUTheme.black,
    letterSpacing: -0.4,
    marginRight: 6,
    maxWidth: '65%',
  },
  realNameText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: AnonUTheme.textSecondary,
    marginVertical: 3,
  },
  emailPill: {
    backgroundColor: AnonUTheme.bgCream,
    borderColor: AnonUTheme.black,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  emailText: {
    fontSize: 10,
    fontWeight: '700',
    color: AnonUTheme.black,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    marginVertical: 4,
  },
  statCol: {
    flex: 1,
    marginHorizontal: 4,
  },
  statCard: {
    alignItems: 'center',
    marginVertical: 0,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '900',
    color: AnonUTheme.black,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: AnonUTheme.textSecondary,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  editActionWrapper: {
    paddingHorizontal: 14,
    marginVertical: 6,
  },
  modCard: {
    marginHorizontal: 14,
    marginVertical: 8,
  },
  modHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  modBadge: {
    padding: 4,
    backgroundColor: AnonUTheme.downvoteRed,
    borderColor: AnonUTheme.black,
    borderWidth: 1.5,
    borderRadius: 4,
    marginRight: 8,
  },
  modBadgeIcon: {
    fontSize: 14,
  },
  modTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: AnonUTheme.black,
    letterSpacing: 0.5,
  },
  modCleanBox: {
    backgroundColor: AnonUTheme.bgCream,
    borderColor: AnonUTheme.black,
    borderWidth: 1,
    borderRadius: 4,
    padding: 10,
  },
  modCleanText: {
    fontSize: 12,
    fontWeight: '700',
    color: AnonUTheme.black,
  },
  reportRow: {
    backgroundColor: AnonUTheme.bgSurface,
    borderColor: AnonUTheme.black,
    borderWidth: 1.5,
    borderRadius: AnonUTheme.radiusSm,
    padding: 10,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  reportTextCol: {
    flex: 1,
  },
  reportReason: {
    fontSize: 13,
    fontWeight: '900',
    color: AnonUTheme.black,
  },
  reportPostId: {
    fontSize: 11,
    color: AnonUTheme.textMuted,
    marginTop: 2,
  },
  reportActionButtons: {
    flexDirection: 'row',
  },
  archiveHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  archiveBadge: {
    backgroundColor: AnonUTheme.popYellow,
    borderColor: AnonUTheme.black,
    borderWidth: 1.5,
    borderRadius: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginRight: 8,
  },
  archiveBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: AnonUTheme.black,
    letterSpacing: 0.5,
  },
  archiveTitle: {
    fontSize: 12.5,
    fontWeight: '900',
    color: AnonUTheme.black,
    letterSpacing: 0.5,
  },
  emptyArchiveCard: {
    marginHorizontal: 14,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 30,
    marginBottom: 6,
  },
  emptyArchiveTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: AnonUTheme.black,
  },
  emptyArchiveSub: {
    fontSize: 11.5,
    color: AnonUTheme.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  editProfileCard: {
    width: '100%',
    maxWidth: 400,
  },
  editModalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: AnonUTheme.black,
  },
  editModalSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: AnonUTheme.textSecondary,
    marginTop: 4,
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: AnonUTheme.black,
    marginBottom: 4,
  },
  editButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 18,
  },
  subtabsWrapper: {
    position: 'relative',
    marginHorizontal: 14,
    marginTop: 16,
    marginBottom: 8,
  },
  subtabsShadow: {
    position: 'absolute',
    top: 2.5,
    left: 2.5,
    right: 0,
    bottom: 0,
    backgroundColor: AnonUTheme.black,
    borderRadius: AnonUTheme.radiusSm,
    width: '100%',
    height: 40,
  },
  subtabsRow: {
    flexDirection: 'row',
    height: 40,
    backgroundColor: AnonUTheme.bgSurface,
    borderColor: AnonUTheme.black,
    borderWidth: AnonUTheme.borderWidthThin,
    borderRadius: AnonUTheme.radiusSm,
    padding: 3,
  },
  subtabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: AnonUTheme.radiusSm - 2,
  },
  subtabActive: {
    backgroundColor: AnonUTheme.popYellow,
    borderColor: AnonUTheme.black,
    borderWidth: AnonUTheme.borderWidthThin,
  },
  subtabText: {
    color: AnonUTheme.black,
    fontWeight: '700',
    fontSize: 11.5,
    letterSpacing: 0.4,
  },
  subtabTextActive: {
    fontWeight: '900',
  },
  bookmarkCard: {
    marginHorizontal: 14,
    marginVertical: 4,
  },
  bookmarkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  bookmarkAuthor: {
    fontSize: 12,
    fontWeight: '800',
    color: AnonUTheme.textSecondary,
    marginLeft: 8,
    flex: 1,
  },
  unbookmarkBtn: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    backgroundColor: AnonUTheme.bgCream,
    borderColor: AnonUTheme.black,
    borderWidth: 1,
    borderRadius: 3,
  },
  unbookmarkText: {
    fontSize: 9,
    fontWeight: '900',
    color: AnonUTheme.downvoteRed,
  },
  bookmarkPreview: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: AnonUTheme.black,
  },
});
