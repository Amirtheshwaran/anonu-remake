import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Pressable,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { AnonUTheme } from '../src/constants/theme';
import { useAuthStore } from '../src/stores/useAuthStore';
import { BrutalistCard } from '../src/components/BrutalistCard';
import { BrutalistButton } from '../src/components/BrutalistButton';
import { DEFAULT_CAMPUSES } from '../src/constants/campuses';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, selectedCampusId } = useAuthStore();
  const campus = DEFAULT_CAMPUSES[user?.campusId || selectedCampusId] || DEFAULT_CAMPUSES['uncc'];

  const [expandedSection, setExpandedSection] = useState<'rules' | 'terms' | 'privacy' | 'crisis' | null>(null);

  const toggleSection = (sec: 'rules' | 'terms' | 'privacy' | 'crisis') => {
    setExpandedSection(expandedSection === sec ? null : sec);
  };

  const handleContactSupport = () => {
    Linking.openURL('mailto:support@anonu.app?subject=AnonU%20Campus%20Support');
  };

  const handleCall988 = () => {
    Linking.openURL('tel:988');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>←</Text>
          </Pressable>
          <View style={styles.headerTitleBadge}>
            <Text style={styles.headerTitleText}>SETTINGS & SAFETY</Text>
          </View>
        </View>

        {/* Campus Affiliation Info */}
        <BrutalistCard backgroundColor={AnonUTheme.popYellow} padding={16} style={styles.cardMargin}>
          <Text style={styles.labelSmall}>CAMPUS AFFILIATION</Text>
          <Text style={styles.campusTitle}>{campus.name.toUpperCase()}</Text>
          <Text style={styles.campusSub}>
            Account verified via domain: <Text style={{ fontWeight: '900' }}>@{campus.domains[0]}</Text>
          </Text>
        </BrutalistCard>

        {/* Crisis & Mental Health Resources */}
        <BrutalistCard
          backgroundColor="#FFF0F0"
          padding={16}
          style={[styles.cardMargin, { borderColor: AnonUTheme.downvoteRed }]}
        >
          <View style={styles.sectionHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.sectionTitle, { color: AnonUTheme.downvoteRed }]}>
                🚨 988 CRISIS & MENTAL HEALTH LIFELINE
              </Text>
              <Text style={styles.sectionSub}>Free, confidential 24/7 suicide & crisis support.</Text>
            </View>
            <Pressable onPress={() => toggleSection('crisis')}>
              <Text style={styles.toggleIcon}>{expandedSection === 'crisis' ? '▲' : '▼'}</Text>
            </Pressable>
          </View>

          {expandedSection === 'crisis' && (
            <View style={styles.expandedContent}>
              <View style={styles.resourceBox}>
                <Text style={styles.resourceName}>988 Suicide & Crisis Lifeline</Text>
                <Text style={styles.resourceDetail}>Call or text 988 anytime nationwide (English and Spanish).</Text>
                <View style={{ height: 8 }} />
                <BrutalistButton
                  text="CALL 988 NOW"
                  backgroundColor={AnonUTheme.downvoteRed}
                  textColor={AnonUTheme.white}
                  onPress={handleCall988}
                />
              </View>

              <View style={styles.resourceBox}>
                <Text style={styles.resourceName}>Crisis Text Line</Text>
                <Text style={styles.resourceDetail}>Text HOME to 741741 to connect with a crisis counselor.</Text>
              </View>

              <View style={styles.resourceBox}>
                <Text style={styles.resourceName}>{campus.shortName} Student Counseling</Text>
                <Text style={styles.resourceDetail}>
                  Confidential on-campus psychological services & walk-in urgent care.
                </Text>
              </View>
            </View>
          )}
        </BrutalistCard>

        {/* Community Guidelines */}
        <BrutalistCard padding={16} style={styles.cardMargin}>
          <Pressable onPress={() => toggleSection('rules')} style={styles.sectionHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>📜 COMMUNITY GUIDELINES & HONOR CODE</Text>
              <Text style={styles.sectionSub}>Zero tolerance for harassment, doxxing, or threats.</Text>
            </View>
            <Text style={styles.toggleIcon}>{expandedSection === 'rules' ? '▲' : '▼'}</Text>
          </Pressable>

          {expandedSection === 'rules' && (
            <View style={styles.expandedContent}>
              <Text style={styles.bodyText}>
                AnonU provides honest, anonymous freedom of speech for university students while strictly prohibiting harm against campus community members.
              </Text>
              <View style={styles.ruleBullet}>
                <Text style={styles.bulletTitle}>1. No Harassment or Cyberbullying</Text>
                <Text style={styles.bulletDesc}>
                  Targeting individuals with defamatory remarks, repeated insults, or personal attacks is strictly banned.
                </Text>
              </View>
              <View style={styles.ruleBullet}>
                <Text style={styles.bulletTitle}>2. Absolute Zero Tolerance for Doxxing</Text>
                <Text style={styles.bulletDesc}>
                  Never post telephone numbers, student IDs, dorm room numbers, or private addresses. Any publication with PII is immediately hidden by our automated regex filter.
                </Text>
              </View>
              <View style={styles.ruleBullet}>
                <Text style={styles.bulletTitle}>3. Strike System & Penalties</Text>
                <Text style={styles.bulletDesc}>
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
        <BrutalistCard padding={16} style={styles.cardMargin}>
          <Pressable onPress={() => toggleSection('terms')} style={styles.sectionHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>⚖️ TERMS OF SERVICE</Text>
              <Text style={styles.sectionSub}>User-generated content agreements and moderation policies.</Text>
            </View>
            <Text style={styles.toggleIcon}>{expandedSection === 'terms' ? '▲' : '▼'}</Text>
          </Pressable>

          {expandedSection === 'terms' && (
            <View style={styles.expandedContent}>
              <Text style={styles.bodyText}>
                By accessing AnonU, you affirm that you are an actively enrolled student at an eligible university with a valid .edu email address.
              </Text>
              <Text style={styles.bodyText}>
                You remain solely responsible for the content of your publications. Campus moderators reserve the right to review, hide, or dismiss any publication that violates community standards or university conduct codes.
              </Text>
              <Text style={styles.bodyText}>
                Violations of emergency laws or credible threats of violence are preserved and reported to applicable campus law enforcement authorities.
              </Text>
            </View>
          )}
        </BrutalistCard>

        {/* Privacy Policy */}
        <BrutalistCard padding={16} style={styles.cardMargin}>
          <Pressable onPress={() => toggleSection('privacy')} style={styles.sectionHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>🔐 PRIVACY POLICY & ARCHITECTURE</Text>
              <Text style={styles.sectionSub}>Zero-knowledge cryptography and metadata sanitization.</Text>
            </View>
            <Text style={styles.toggleIcon}>{expandedSection === 'privacy' ? '▲' : '▼'}</Text>
          </Pressable>

          {expandedSection === 'privacy' && (
            <View style={styles.expandedContent}>
              <Text style={styles.bodyText}>
                AnonU protects student identities through architectural database segregation:
              </Text>
              <View style={styles.ruleBullet}>
                <Text style={styles.bulletTitle}>• Zero Author UID Exposure</Text>
                <Text style={styles.bulletDesc}>
                  Public post and comment documents do not store author UIDs. Author mappings are maintained in restricted server collections accessible only by the creator and backend functions.
                </Text>
              </View>
              <View style={styles.ruleBullet}>
                <Text style={styles.bulletTitle}>• Cryptographic Pseudonyms</Text>
                <Text style={styles.bulletDesc}>
                  Pseudonyms are deterministically generated via HMAC-SHA256 with a server-side secret salt. You have a consistent mask within a single thread, but rotating masks across different threads.
                </Text>
              </View>
              <View style={styles.ruleBullet}>
                <Text style={styles.bulletTitle}>• Automated EXIF Stripping & TTL Purging</Text>
                <Text style={styles.bulletDesc}>
                  All uploaded images are processed locally to remove EXIF GPS and camera metadata before transmission. Expired posts are deleted permanently from the database and storage hourly.
                </Text>
              </View>
            </View>
          )}
        </BrutalistCard>

        {/* Contact & Support */}
        <BrutalistCard padding={16} style={styles.cardMargin}>
          <Text style={styles.sectionTitle}>📬 CONTACT & SUPPORT</Text>
          <Text style={styles.bodyText}>
            Questions, bug reports, or legal inquiries? Reach our student safety team directly:
          </Text>
          <View style={{ height: 10 }} />
          <BrutalistButton
            text="EMAIL SUPPORT@ANONU.APP"
            backgroundColor={AnonUTheme.popMint}
            onPress={handleContactSupport}
          />
        </BrutalistCard>

        {/* Moderator Dashboard Link */}
        {user?.isModerator && (
          <BrutalistCard backgroundColor={AnonUTheme.black} padding={16} style={styles.cardMargin}>
            <Text style={[styles.sectionTitle, { color: AnonUTheme.popYellow }]}>
              🛡️ CAMPUS MODERATOR CONSOLE
            </Text>
            <Text style={[styles.bodyText, { color: AnonUTheme.white }]}>
              Access live incident queues, audit logs, and appeal resolutions.
            </Text>
            <View style={{ height: 12 }} />
            <BrutalistButton
              text="OPEN MODERATOR DASHBOARD →"
              backgroundColor={AnonUTheme.popYellow}
              onPress={() => router.push('/admin')}
            />
          </BrutalistCard>
        )}
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
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: AnonUTheme.black,
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  sectionSub: {
    fontSize: 11.5,
    fontWeight: '500',
    color: AnonUTheme.textSecondary,
  },
  toggleIcon: {
    fontSize: 14,
    fontWeight: '900',
    paddingHorizontal: 8,
    color: AnonUTheme.black,
  },
  expandedContent: {
    marginTop: 12,
    paddingTop: 12,
    borderTopColor: AnonUTheme.black,
    borderTopWidth: 1.5,
  },
  bodyText: {
    fontSize: 12.5,
    fontWeight: '500',
    color: AnonUTheme.textBlack,
    lineHeight: 18,
    marginBottom: 10,
  },
  ruleBullet: {
    marginBottom: 10,
    backgroundColor: AnonUTheme.bgCream,
    borderColor: AnonUTheme.black,
    borderWidth: 1,
    borderRadius: 4,
    padding: 8,
  },
  bulletTitle: {
    fontSize: 11.5,
    fontWeight: '900',
    color: AnonUTheme.black,
    marginBottom: 2,
  },
  bulletDesc: {
    fontSize: 11,
    fontWeight: '500',
    color: AnonUTheme.textSecondary,
    lineHeight: 16,
  },
  resourceBox: {
    backgroundColor: AnonUTheme.bgSurface,
    borderColor: AnonUTheme.black,
    borderWidth: 1.5,
    borderRadius: AnonUTheme.radiusSm,
    padding: 10,
    marginBottom: 10,
  },
  resourceName: {
    fontSize: 13,
    fontWeight: '900',
    color: AnonUTheme.downvoteRed,
    marginBottom: 2,
  },
  resourceDetail: {
    fontSize: 11.5,
    color: AnonUTheme.textBlack,
    fontWeight: '500',
  },
});
