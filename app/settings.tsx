import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Pressable,
  Linking,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import auth from '@react-native-firebase/auth';
import functions from '@react-native-firebase/functions';
import { AnonUTheme } from '../src/constants/theme';
import { useAuthStore } from '../src/stores/useAuthStore';
import { useThemeStore } from '../src/stores/useThemeStore';
import { useTheme } from '../src/hooks/useTheme';
import { hapticFeedback } from '../src/utils/haptics';
import { BrutalistCard } from '../src/components/BrutalistCard';
import { BrutalistButton } from '../src/components/BrutalistButton';
import { DEFAULT_CAMPUSES } from '../src/constants/campuses';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, selectedCampusId } = useAuthStore();
  const campus = DEFAULT_CAMPUSES[user?.campusId || selectedCampusId] || DEFAULT_CAMPUSES['uncc'];

  const { theme, isDark } = useTheme();
  const {
    themeMode,
    setThemeMode,
    reducedMotion,
    toggleReducedMotion,
    highContrast,
    toggleHighContrast,
    hapticsEnabled,
    toggleHaptics,
  } = useThemeStore();

  const [expandedSection, setExpandedSection] = useState<'rules' | 'terms' | 'privacy' | 'crisis' | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportData = async () => {
    try {
      setIsExporting(true);
      hapticFeedback.medium();
      const res = await functions().httpsCallable('exportUserData')();
      const data = res.data as any;
      hapticFeedback.success();
      Alert.alert(
        'Data Export Ready',
        `Exported ${data.activitySummary?.bookmarksCount || 0} bookmarks and ${data.activitySummary?.authoredPostsCount || 0} publications. Data format is JSON compliant with GDPR & App Store standards.`,
        [{ text: 'OK' }]
      );
    } catch (err: any) {
      hapticFeedback.error();
      Alert.alert('Export Failed', err.message || 'Could not retrieve data package.');
    } finally {
      setIsExporting(false);
    }
  };

  const toggleSection = (sec: 'rules' | 'terms' | 'privacy' | 'crisis') => {
    hapticFeedback.light();
    setExpandedSection(expandedSection === sec ? null : sec);
  };

  const handleContactSupport = () => {
    hapticFeedback.light();
    Linking.openURL('mailto:support@anonu.app?subject=AnonU%20Campus%20Support');
  };

  const handleCall988 = () => {
    hapticFeedback.medium();
    Linking.openURL('tel:988');
  };

  const handleDeleteAccount = () => {
    hapticFeedback.warning();
    Alert.alert(
      'Delete Account Permanently?',
      'All your campus verification status, bookmarks, and private settings will be permanently erased. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Forever',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsDeleting(true);
              hapticFeedback.heavy();
              await functions().httpsCallable('deleteAccount')();
              await auth().signOut();
              useAuthStore.getState().reset();
              router.replace('/login');
            } catch (err: any) {
              setIsDeleting(false);
              hapticFeedback.error();
              Alert.alert('Error Deleting Account', err.message || 'Could not complete request.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bgCanvas }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => {
              hapticFeedback.light();
              router.back();
            }}
            style={[styles.backBtn, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[styles.backText, { color: theme.textPrimary }]}>←</Text>
          </Pressable>
          <View style={[styles.headerTitleBadge, { backgroundColor: theme.border }]}>
            <Text style={[styles.headerTitleText, { color: theme.popYellow }]}>SETTINGS & SAFETY</Text>
          </View>
        </View>

        {/* Campus Affiliation Info */}
        <BrutalistCard backgroundColor={theme.popYellow} padding={16} style={styles.cardMargin}>
          <Text style={styles.labelSmall}>CAMPUS AFFILIATION</Text>
          <Text style={styles.campusTitle}>{campus.name.toUpperCase()}</Text>
          <Text style={styles.campusSub}>
            Account verified via domain: <Text style={{ fontWeight: '900' }}>@{campus.domains[0]}</Text>
          </Text>
        </BrutalistCard>

        {/* Appearance & Accessibility Section */}
        <BrutalistCard
          backgroundColor={theme.bgSurface}
          padding={16}
          style={styles.cardMargin}
          borderWidth={highContrast ? 3 : 2}
        >
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>🎨 APPEARANCE & THEME</Text>
          <Text style={[styles.sectionSub, { color: theme.textSecondary }]}>
            Select visual theme and accessibility preferences.
          </Text>

          {/* Theme Selector */}
          <View style={styles.themeSelector}>
            {(['system', 'light', 'dark'] as const).map((mode) => {
              const active = themeMode === mode;
              return (
                <Pressable
                  key={mode}
                  onPress={() => {
                    hapticFeedback.light();
                    setThemeMode(mode);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Set theme to ${mode}`}
                  accessibilityState={{ selected: active }}
                  style={[
                    styles.themeOptionBtn,
                    {
                      backgroundColor: active ? theme.popMint : theme.bgCanvas,
                      borderColor: theme.border,
                      borderWidth: highContrast ? 2.5 : 2,
                    },
                  ]}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Text
                    style={[
                      styles.themeOptionText,
                      { color: theme.black },
                      active && styles.themeOptionTextActive,
                    ]}
                  >
                    {mode.toUpperCase()}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <Text style={[styles.subsectionTitle, { color: theme.textPrimary }]}>
            ACCESSIBILITY & ERGONOMICS
          </Text>

          {/* Reduced Motion Toggle */}
          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.toggleLabel, { color: theme.textPrimary }]}>Reduced Motion</Text>
              <Text style={[styles.toggleSub, { color: theme.textSecondary }]}>
                Disable spring animations and quick zooms
              </Text>
            </View>
            <Pressable
              onPress={() => {
                hapticFeedback.light();
                toggleReducedMotion();
              }}
              accessibilityRole="switch"
              accessibilityLabel="Reduced Motion"
              accessibilityState={{ checked: reducedMotion }}
              style={[
                styles.toggleBtn,
                {
                  backgroundColor: reducedMotion ? theme.popMint : theme.bgCanvas,
                  borderColor: theme.border,
                },
              ]}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Text style={[styles.toggleBtnText, { color: theme.black }]}>
                {reducedMotion ? 'ON' : 'OFF'}
              </Text>
            </Pressable>
          </View>

          {/* High Contrast Toggle */}
          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.toggleLabel, { color: theme.textPrimary }]}>High Contrast Mode</Text>
              <Text style={[styles.toggleSub, { color: theme.textSecondary }]}>
                Thicker 3px borders and electric accents
              </Text>
            </View>
            <Pressable
              onPress={() => {
                hapticFeedback.light();
                toggleHighContrast();
              }}
              accessibilityRole="switch"
              accessibilityLabel="High Contrast Mode"
              accessibilityState={{ checked: highContrast }}
              style={[
                styles.toggleBtn,
                {
                  backgroundColor: highContrast ? theme.popCyan : theme.bgCanvas,
                  borderColor: theme.border,
                },
              ]}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Text style={[styles.toggleBtnText, { color: theme.black }]}>
                {highContrast ? 'ON' : 'OFF'}
              </Text>
            </Pressable>
          </View>

          {/* Haptic Feedback Toggle */}
          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.toggleLabel, { color: theme.textPrimary }]}>Haptic Feedback</Text>
              <Text style={[styles.toggleSub, { color: theme.textSecondary }]}>
                Tactile vibrations on tap, vote, and modal open
              </Text>
            </View>
            <Pressable
              onPress={() => {
                hapticFeedback.light();
                toggleHaptics();
              }}
              accessibilityRole="switch"
              accessibilityLabel="Haptic Feedback"
              accessibilityState={{ checked: hapticsEnabled }}
              style={[
                styles.toggleBtn,
                {
                  backgroundColor: hapticsEnabled ? theme.popPink : theme.bgCanvas,
                  borderColor: theme.border,
                },
              ]}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Text style={[styles.toggleBtnText, { color: theme.black }]}>
                {hapticsEnabled ? 'ON' : 'OFF'}
              </Text>
            </Pressable>
          </View>
        </BrutalistCard>

        {/* Crisis & Mental Health Resources */}
        <BrutalistCard
          backgroundColor={isDark ? '#2D1515' : '#FFF0F0'}
          padding={16}
          style={[styles.cardMargin, { borderColor: theme.downvoteRed }]}
        >
          <View style={styles.sectionHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.sectionTitle, { color: theme.downvoteRed }]}>
                🚨 988 CRISIS & MENTAL HEALTH LIFELINE
              </Text>
              <Text style={[styles.sectionSub, { color: isDark ? '#FF9999' : theme.textSecondary }]}>
                Free, confidential 24/7 suicide & crisis support.
              </Text>
            </View>
            <Pressable
              onPress={() => toggleSection('crisis')}
              accessibilityRole="button"
              accessibilityLabel="Toggle crisis section"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={[styles.toggleIcon, { color: theme.textPrimary }]}>
                {expandedSection === 'crisis' ? '▲' : '▼'}
              </Text>
            </Pressable>
          </View>

          {expandedSection === 'crisis' && (
            <View style={[styles.expandedContent, { borderTopColor: theme.border }]}>
              <View style={[styles.resourceBox, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
                <Text style={[styles.resourceName, { color: theme.downvoteRed }]}>988 Suicide & Crisis Lifeline</Text>
                <Text style={[styles.resourceDetail, { color: theme.textPrimary }]}>
                  Call or text 988 anytime nationwide (English and Spanish).
                </Text>
                <View style={{ height: 8 }} />
                <BrutalistButton
                  text="CALL 988 NOW"
                  backgroundColor={theme.downvoteRed}
                  textColor={theme.white}
                  onPress={handleCall988}
                  accessibilityRole="button"
                  accessibilityLabel="Call 988 Crisis Lifeline"
                />
              </View>

              <View style={[styles.resourceBox, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
                <Text style={[styles.resourceName, { color: theme.downvoteRed }]}>Crisis Text Line</Text>
                <Text style={[styles.resourceDetail, { color: theme.textPrimary }]}>
                  Text HOME to 741741 to connect with a crisis counselor.
                </Text>
              </View>

              <View style={[styles.resourceBox, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
                <Text style={[styles.resourceName, { color: theme.downvoteRed }]}>{campus.shortName} Student Counseling</Text>
                <Text style={[styles.resourceDetail, { color: theme.textPrimary }]}>
                  Confidential on-campus psychological services & walk-in urgent care.
                </Text>
              </View>
            </View>
          )}
        </BrutalistCard>

        {/* Community Guidelines */}
        <BrutalistCard backgroundColor={theme.bgSurface} padding={16} style={styles.cardMargin}>
          <Pressable
            onPress={() => toggleSection('rules')}
            style={styles.sectionHeaderRow}
            accessibilityRole="button"
            accessibilityLabel="Toggle Community Guidelines"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
                📜 COMMUNITY GUIDELINES & HONOR CODE
              </Text>
              <Text style={[styles.sectionSub, { color: theme.textSecondary }]}>
                Zero tolerance for harassment, doxxing, or threats.
              </Text>
            </View>
            <Text style={[styles.toggleIcon, { color: theme.textPrimary }]}>
              {expandedSection === 'rules' ? '▲' : '▼'}
            </Text>
          </Pressable>

          {expandedSection === 'rules' && (
            <View style={[styles.expandedContent, { borderTopColor: theme.border }]}>
              <Text style={[styles.bodyText, { color: theme.textPrimary }]}>
                AnonU provides honest, anonymous freedom of speech for university students while strictly prohibiting harm against campus community members.
              </Text>
              <View style={[styles.ruleBullet, { backgroundColor: theme.bgCanvas, borderColor: theme.border }]}>
                <Text style={[styles.bulletTitle, { color: theme.textPrimary }]}>1. No Harassment or Cyberbullying</Text>
                <Text style={[styles.bulletDesc, { color: theme.textSecondary }]}>
                  Targeting individuals with defamatory remarks, repeated insults, or personal attacks is strictly banned.
                </Text>
              </View>
              <View style={[styles.ruleBullet, { backgroundColor: theme.bgCanvas, borderColor: theme.border }]}>
                <Text style={[styles.bulletTitle, { color: theme.textPrimary }]}>2. Absolute Zero Tolerance for Doxxing</Text>
                <Text style={[styles.bulletDesc, { color: theme.textSecondary }]}>
                  Never post telephone numbers, student IDs, dorm room numbers, or private addresses. Any publication with PII is immediately hidden by our automated regex filter.
                </Text>
              </View>
              <View style={[styles.ruleBullet, { backgroundColor: theme.bgCanvas, borderColor: theme.border }]}>
                <Text style={[styles.bulletTitle, { color: theme.textPrimary }]}>3. Strike System & Penalties</Text>
                <Text style={[styles.bulletDesc, { color: theme.textSecondary }]}>
                  Violations upheld by campus moderators result in strikes:
                  {"\n"}• 1 Strike: Written warning.
                  {"\n"}• 2 Strikes: 24-hour posting timeout.
                  {"\n"}• 3 Strikes: 7-day campus suspension.
                  {"\n"}• 4+ Strikes: Permanent campus ban.
                </Text>
              </View>
            </View>
          )}
        </BrutalistCard>

        {/* Terms of Service */}
        <BrutalistCard backgroundColor={theme.bgSurface} padding={16} style={styles.cardMargin}>
          <Pressable
            onPress={() => toggleSection('terms')}
            style={styles.sectionHeaderRow}
            accessibilityRole="button"
            accessibilityLabel="Toggle Terms of Service"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>⚖️ TERMS OF SERVICE</Text>
              <Text style={[styles.sectionSub, { color: theme.textSecondary }]}>
                User-generated content agreements and moderation policies.
              </Text>
            </View>
            <Text style={[styles.toggleIcon, { color: theme.textPrimary }]}>
              {expandedSection === 'terms' ? '▲' : '▼'}
            </Text>
          </Pressable>

          {expandedSection === 'terms' && (
            <View style={[styles.expandedContent, { borderTopColor: theme.border }]}>
              <Text style={[styles.bodyText, { color: theme.textPrimary }]}>
                By accessing AnonU, you affirm that you are an actively enrolled student at an eligible university with a valid .edu email address.
              </Text>
              <Text style={[styles.bodyText, { color: theme.textPrimary }]}>
                You remain solely responsible for the content of your publications. Campus moderators reserve the right to review, hide, or dismiss any publication that violates community standards or university conduct codes.
              </Text>
              <Text style={[styles.bodyText, { color: theme.textPrimary }]}>
                Violations of emergency laws or credible threats of violence are preserved and reported to applicable campus law enforcement authorities.
              </Text>
            </View>
          )}
        </BrutalistCard>

        {/* Privacy Policy */}
        <BrutalistCard backgroundColor={theme.bgSurface} padding={16} style={styles.cardMargin}>
          <Pressable
            onPress={() => toggleSection('privacy')}
            style={styles.sectionHeaderRow}
            accessibilityRole="button"
            accessibilityLabel="Toggle Privacy Policy"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>🔐 PRIVACY POLICY & ARCHITECTURE</Text>
              <Text style={[styles.sectionSub, { color: theme.textSecondary }]}>
                Zero-knowledge cryptography and metadata sanitization.
              </Text>
            </View>
            <Text style={[styles.toggleIcon, { color: theme.textPrimary }]}>
              {expandedSection === 'privacy' ? '▲' : '▼'}
            </Text>
          </Pressable>

          {expandedSection === 'privacy' && (
            <View style={[styles.expandedContent, { borderTopColor: theme.border }]}>
              <Text style={[styles.bodyText, { color: theme.textPrimary }]}>
                AnonU protects student identities through architectural database segregation:
              </Text>
              <View style={[styles.ruleBullet, { backgroundColor: theme.bgCanvas, borderColor: theme.border }]}>
                <Text style={[styles.bulletTitle, { color: theme.textPrimary }]}>• Zero Author UID Exposure</Text>
                <Text style={[styles.bulletDesc, { color: theme.textSecondary }]}>
                  Public post and comment documents do not store author UIDs. Author mappings are maintained in restricted server collections accessible only by the creator and backend functions.
                </Text>
              </View>
              <View style={[styles.ruleBullet, { backgroundColor: theme.bgCanvas, borderColor: theme.border }]}>
                <Text style={[styles.bulletTitle, { color: theme.textPrimary }]}>• Cryptographic Pseudonyms</Text>
                <Text style={[styles.bulletDesc, { color: theme.textSecondary }]}>
                  Pseudonyms are deterministically generated via HMAC-SHA256 with a server-side secret salt. You have a consistent mask within a single thread, but rotating masks across different threads.
                </Text>
              </View>
              <View style={[styles.ruleBullet, { backgroundColor: theme.bgCanvas, borderColor: theme.border }]}>
                <Text style={[styles.bulletTitle, { color: theme.textPrimary }]}>• Automated EXIF Stripping & TTL Purging</Text>
                <Text style={[styles.bulletDesc, { color: theme.textSecondary }]}>
                  All uploaded images are processed locally to remove EXIF GPS and camera metadata before transmission. Expired posts are deleted permanently from the database and storage hourly.
                </Text>
              </View>
              <View style={{ height: 10 }} />
              <BrutalistButton
                text={isExporting ? 'EXPORTING DATA...' : 'DOWNLOAD MY DATA (JSON)'}
                backgroundColor={theme.popYellow}
                textColor={theme.black}
                disabled={isExporting}
                onPress={handleExportData}
                accessibilityRole="button"
                accessibilityLabel="Download my data package in JSON format"
              />
            </View>
          )}
        </BrutalistCard>

        {/* Contact & Support */}
        <BrutalistCard backgroundColor={theme.bgSurface} padding={16} style={styles.cardMargin}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>📬 CONTACT & SUPPORT</Text>
          <Text style={[styles.bodyText, { color: theme.textPrimary }]}>
            Questions, bug reports, or legal inquiries? Reach our student safety team directly:
          </Text>
          <View style={{ height: 10 }} />
          <BrutalistButton
            text="EMAIL SUPPORT@ANONU.APP"
            backgroundColor={theme.popMint}
            textColor={theme.black}
            onPress={handleContactSupport}
            accessibilityRole="button"
            accessibilityLabel="Email AnonU support"
          />
        </BrutalistCard>

        {/* Moderator Dashboard Link */}
        {user?.isModerator && (
          <BrutalistCard backgroundColor={theme.black} padding={16} style={styles.cardMargin}>
            <Text style={[styles.sectionTitle, { color: theme.popYellow }]}>
              🛡️ CAMPUS MODERATOR CONSOLE
            </Text>
            <Text style={[styles.bodyText, { color: theme.white }]}>
              Access live incident queues, audit logs, and appeal resolutions.
            </Text>
            <View style={{ height: 12 }} />
            <BrutalistButton
              text="OPEN MODERATOR DASHBOARD →"
              backgroundColor={theme.popYellow}
              textColor={theme.black}
              onPress={() => router.push('/admin')}
              accessibilityRole="button"
              accessibilityLabel="Open Moderator Dashboard"
            />
          </BrutalistCard>
        )}

        {/* Account Deletion (App Store Guideline 5.1.1(v)) */}
        <BrutalistCard
          backgroundColor={isDark ? '#2D1515' : '#FFF5F5'}
          padding={16}
          style={[styles.cardMargin, { borderColor: theme.downvoteRed }]}
        >
          <Text style={[styles.sectionTitle, { color: theme.downvoteRed }]}>
            ⚠️ DANGER ZONE: DELETE ACCOUNT
          </Text>
          <Text style={[styles.bodyText, { color: theme.textPrimary }]}>
            Compliant with Apple App Store Guideline 5.1.1(v) & Google Play User Data Policy. Deleting your account permanently revokes your campus email verification, purges your private bookmarks, removes blocked accounts, and unregisters your auth credentials. This action cannot be reversed.
          </Text>
          <View style={{ height: 10 }} />
          <BrutalistButton
            text={isDeleting ? 'DELETING ACCOUNT...' : 'DELETE ACCOUNT & ALL DATA'}
            backgroundColor={theme.downvoteRed}
            textColor={theme.white}
            disabled={isDeleting}
            onPress={handleDeleteAccount}
            accessibilityRole="button"
            accessibilityLabel="Permanently delete account and all data"
            accessibilityHint="Wipes verification and user profile permanently"
          />
        </BrutalistCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AnonUTheme.bgCream,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  backBtn: {
    width: 38,
    height: 38,
    backgroundColor: AnonUTheme.bgSurface,
    borderColor: AnonUTheme.black,
    borderWidth: AnonUTheme.borderWidthThin,
    borderRadius: AnonUTheme.radiusSm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backText: {
    fontSize: 18,
    fontWeight: '900',
    color: AnonUTheme.black,
  },
  headerTitleBadge: {
    backgroundColor: AnonUTheme.black,
    borderRadius: AnonUTheme.radiusSm,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  headerTitleText: {
    color: AnonUTheme.popYellow,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  cardMargin: {
    marginBottom: 14,
    width: '100%',
  },
  labelSmall: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
    color: AnonUTheme.black,
    marginBottom: 2,
  },
  campusTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: AnonUTheme.black,
    marginBottom: 2,
  },
  campusSub: {
    fontSize: 12,
    color: AnonUTheme.textSecondary,
    fontWeight: '600',
  },
  themeSelector: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    marginBottom: 4,
  },
  themeOptionBtn: {
    flex: 1,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: AnonUTheme.radiusSm,
  },
  themeOptionText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  themeOptionTextActive: {
    fontWeight: '900',
  },
  divider: {
    height: 1.5,
    marginVertical: 14,
  },
  subsectionTitle: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  toggleLabel: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2,
  },
  toggleSub: {
    fontSize: 11,
    fontWeight: '500',
  },
  toggleBtn: {
    width: 62,
    height: 36,
    borderWidth: 2,
    borderRadius: AnonUTheme.radiusSm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleBtnText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  sectionSub: {
    fontSize: 11.5,
    fontWeight: '500',
  },
  toggleIcon: {
    fontSize: 14,
    fontWeight: '900',
    paddingHorizontal: 8,
  },
  expandedContent: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1.5,
  },
  bodyText: {
    fontSize: 12.5,
    fontWeight: '500',
    lineHeight: 18,
    marginBottom: 10,
  },
  ruleBullet: {
    marginBottom: 10,
    borderWidth: 1,
    borderRadius: 4,
    padding: 8,
  },
  bulletTitle: {
    fontSize: 11.5,
    fontWeight: '900',
    marginBottom: 2,
  },
  bulletDesc: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 16,
  },
  resourceBox: {
    borderWidth: 1.5,
    borderRadius: AnonUTheme.radiusSm,
    padding: 10,
    marginBottom: 10,
  },
  resourceName: {
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 2,
  },
  resourceDetail: {
    fontSize: 11.5,
    fontWeight: '500',
  },
});
