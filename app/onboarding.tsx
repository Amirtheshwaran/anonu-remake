import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { AnonUTheme } from '../src/constants/theme';
import { useAuthStore } from '../src/stores/useAuthStore';
import { authService } from '../src/services/authService';
import { BrutalistCard } from '../src/components/BrutalistCard';
import { BrutalistButton } from '../src/components/BrutalistButton';
import { DEFAULT_CAMPUSES } from '../src/constants/campuses';

export default function OnboardingScreen() {
  const router = useRouter();
  const { user, setUser, selectedCampusId } = useAuthStore();
  const [step, setStep] = useState<number>(1);
  const [agreedToRules, setAgreedToRules] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const campus = DEFAULT_CAMPUSES[user?.campusId || selectedCampusId] || DEFAULT_CAMPUSES['uncc'];

  const handleComplete = async () => {
    if (!agreedToRules || !user) return;
    setSubmitting(true);
    try {
      await authService.completeOnboarding(user.uid);
      setUser({
        ...user,
        onboardingCompleted: true,
        rulesAcceptedAt: new Date(),
      });
      router.replace('/(tabs)');
    } catch (err) {
      console.error('Failed to complete onboarding:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Step Counter */}
        <View style={styles.header}>
          <View style={styles.badgeWrapper}>
            <View style={styles.badgeShadow} />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{campus.shortName.toUpperCase()}</Text>
            </View>
          </View>
          <View style={styles.stepIndicator}>
            <Text style={styles.stepText}>{`STEP ${step} OF 3`}</Text>
          </View>
        </View>

        {/* Step 1: Identity Per Post */}
        {step === 1 && (
          <View style={styles.stepContainer}>
            <BrutalistCard
              backgroundColor={AnonUTheme.popYellow}
              padding={16}
              style={styles.cardHeader}
            >
              <Text style={styles.screenLabel}>01 // ANONYMITY REINVENTED</Text>
              <Text style={styles.headline}>EVERY POST, A NEW MASK</Text>
            </BrutalistCard>

            <BrutalistCard padding={18} style={styles.bodyCard}>
              <Text style={styles.bodyParagraph}>
                AnonU never exposes your real identity. Whenever you post or comment, the server computes a cryptographically salted pseudonym.
              </Text>

              {/* Visual Demonstration Box */}
              <View style={styles.demoBox}>
                <View style={styles.demoItem}>
                  <Text style={styles.demoTag}>POST #1</Text>
                  <Text style={styles.demoName}>"Neon Badger #42"</Text>
                </View>
                <View style={styles.arrowRow}>
                  <Text style={styles.arrowText}>↓ Different Thread ↓</Text>
                </View>
                <View style={styles.demoItem}>
                  <Text style={styles.demoTag}>POST #2</Text>
                  <Text style={styles.demoName}>"Velvet Falcon #88"</Text>
                </View>
              </View>

              <View style={styles.bulletRow}>
                <Text style={styles.bulletIcon}>🔒</Text>
                <Text style={styles.bulletText}>
                  Your persona stays consistent inside a single thread so replies make sense, but changes across threads so no one can track you.
                </Text>
              </View>

              <View style={styles.bulletRow}>
                <Text style={styles.bulletIcon}>🏷️</Text>
                <Text style={styles.bulletText}>
                  Want credit for organizing a study group or club? You can still toggle to your verified Identified handle anytime.
                </Text>
              </View>

              <View style={styles.buttonSpacer} />
              <BrutalistButton
                text="NEXT: HOW POSTS EXPIRE →"
                backgroundColor={AnonUTheme.popYellow}
                isFullWidth
                onPress={() => setStep(2)}
              />
            </BrutalistCard>
          </View>
        )}

        {/* Step 2: Ephemeral Posts & Real Privacy */}
        {step === 2 && (
          <View style={styles.stepContainer}>
            <BrutalistCard
              backgroundColor={AnonUTheme.popMint}
              padding={16}
              style={styles.cardHeader}
            >
              <Text style={styles.screenLabel}>02 // EPHEMERAL BY DESIGN</Text>
              <Text style={styles.headline}>WORDS DON'T HAUNT YOU</Text>
            </BrutalistCard>

            <BrutalistCard padding={18} style={styles.bodyCard}>
              <Text style={styles.bodyParagraph}>
                College moves fast. Posts shouldn't live forever unless you want them to. Choose when your words disappear forever.
              </Text>

              {/* Expiry Tiers */}
              <View style={styles.tiersContainer}>
                <View style={styles.tierRow}>
                  <View style={[styles.tierPill, { backgroundColor: AnonUTheme.popYellow }]}>
                    <Text style={styles.tierPillText}>1 HOUR</Text>
                  </View>
                  <Text style={styles.tierDesc}>Quick questions, dining hall lines, live vibes</Text>
                </View>

                <View style={styles.tierRow}>
                  <View style={[styles.tierPill, { backgroundColor: AnonUTheme.popMint }]}>
                    <Text style={styles.tierPillText}>24 HOURS</Text>
                  </View>
                  <Text style={styles.tierDesc}>Daily campus gossip, classes, daily chatter</Text>
                </View>

                <View style={styles.tierRow}>
                  <View style={[styles.tierPill, { backgroundColor: AnonUTheme.popCyan }]}>
                    <Text style={styles.tierPillText}>3 DAYS</Text>
                  </View>
                  <Text style={styles.tierDesc}>Weekend plans, lost items, big campus events</Text>
                </View>

                <View style={styles.tierRow}>
                  <View style={[styles.tierPill, { backgroundColor: AnonUTheme.popPurple }]}>
                    <Text style={[styles.tierPillText, { color: AnonUTheme.white }]}>PERMANENT</Text>
                  </View>
                  <Text style={styles.tierDesc}>Legendary stories & timeless campus traditions</Text>
                </View>
              </View>

              <View style={styles.bulletRow}>
                <Text style={styles.bulletIcon}>🗑️</Text>
                <Text style={styles.bulletText}>
                  When a post expires, our automated backend cleans up the document and strips associated images from storage forever.
                </Text>
              </View>

              <View style={styles.buttonSpacer} />
              <View style={styles.actionRow}>
                <Pressable onPress={() => setStep(1)} style={styles.backLink}>
                  <Text style={styles.backLinkText}>← BACK</Text>
                </Pressable>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <BrutalistButton
                    text="NEXT: COMMUNITY RULES →"
                    backgroundColor={AnonUTheme.popMint}
                    isFullWidth
                    onPress={() => setStep(3)}
                  />
                </View>
              </View>
            </BrutalistCard>
          </View>
        )}

        {/* Step 3: Campus Community Rules */}
        {step === 3 && (
          <View style={styles.stepContainer}>
            <BrutalistCard
              backgroundColor={AnonUTheme.downvoteRed}
              padding={16}
              style={styles.cardHeader}
            >
              <Text style={[styles.screenLabel, { color: AnonUTheme.white }]}>03 // CAMPUS HONOR CODE</Text>
              <Text style={[styles.headline, { color: AnonUTheme.white }]}>KEEP IT SAFE & REAL</Text>
            </BrutalistCard>

            <BrutalistCard padding={18} style={styles.bodyCard}>
              <Text style={styles.bodyParagraph}>
                Anonymity gives students a voice, but it requires trust. Zero tolerance policies are strictly enforced on {campus.shortName}.
              </Text>

              {/* Rules List */}
              <View style={styles.ruleItem}>
                <View style={styles.ruleBadge}>
                  <Text style={styles.ruleBadgeText}>1</Text>
                </View>
                <View style={styles.ruleContent}>
                  <Text style={styles.ruleTitle}>NO HARASSMENT OR BULLYING</Text>
                  <Text style={styles.ruleSub}>
                    No targeting individuals, cyberbullying, hate speech, or defamatory attacks.
                  </Text>
                </View>
              </View>

              <View style={styles.ruleItem}>
                <View style={styles.ruleBadge}>
                  <Text style={styles.ruleBadgeText}>2</Text>
                </View>
                <View style={styles.ruleContent}>
                  <Text style={styles.ruleTitle}>ZERO TOLERANCE FOR DOXXING</Text>
                  <Text style={styles.ruleSub}>
                    Never post phone numbers, student IDs, dorm addresses, or private personal data.
                  </Text>
                </View>
              </View>

              <View style={styles.ruleItem}>
                <View style={styles.ruleBadge}>
                  <Text style={styles.ruleBadgeText}>3</Text>
                </View>
                <View style={styles.ruleContent}>
                  <Text style={styles.ruleTitle}>NO THREATS OF VIOLENCE</Text>
                  <Text style={styles.ruleSub}>
                    Direct threats are removed instantly and reported to university authorities.
                  </Text>
                </View>
              </View>

              {/* Acceptance Checkbox */}
              <Pressable
                onPress={() => setAgreedToRules(!agreedToRules)}
                style={styles.checkboxContainer}
              >
                <View style={[styles.checkbox, agreedToRules && styles.checkboxChecked]}>
                  {agreedToRules && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.checkboxLabel}>
                  I agree to follow the AnonU Community Rules. I understand that repeated violations will result in automated timeouts and permanent campus bans.
                </Text>
              </Pressable>

              <View style={styles.buttonSpacer} />
              <View style={styles.actionRow}>
                <Pressable onPress={() => setStep(2)} style={styles.backLink}>
                  <Text style={styles.backLinkText}>← BACK</Text>
                </Pressable>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <BrutalistButton
                    text={submitting ? 'ACTIVATING...' : 'ACCEPT & ENTER CAMPUS →'}
                    backgroundColor={agreedToRules ? AnonUTheme.popYellow : AnonUTheme.bgCream}
                    isFullWidth
                    isLoading={submitting}
                    onPress={handleComplete}
                  />
                </View>
              </View>
            </BrutalistCard>
          </View>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  badgeWrapper: {
    position: 'relative',
    height: 32,
  },
  badgeShadow: {
    position: 'absolute',
    top: 2,
    left: 2,
    right: 0,
    bottom: 0,
    backgroundColor: AnonUTheme.black,
    borderRadius: AnonUTheme.radiusSm,
    width: '100%',
    height: 32,
  },
  badge: {
    height: 32,
    backgroundColor: AnonUTheme.black,
    borderRadius: AnonUTheme.radiusSm,
    paddingHorizontal: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: AnonUTheme.popYellow,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  stepIndicator: {
    backgroundColor: AnonUTheme.bgSurface,
    borderColor: AnonUTheme.black,
    borderWidth: AnonUTheme.borderWidthThin,
    borderRadius: AnonUTheme.radiusSm,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  stepText: {
    color: AnonUTheme.black,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  stepContainer: {
    width: '100%',
  },
  cardHeader: {
    marginBottom: 12,
  },
  screenLabel: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    color: AnonUTheme.black,
    marginBottom: 4,
  },
  headline: {
    fontSize: 22,
    fontWeight: '900',
    color: AnonUTheme.black,
    letterSpacing: -0.5,
  },
  bodyCard: {
    width: '100%',
  },
  bodyParagraph: {
    fontSize: 14,
    color: AnonUTheme.textBlack,
    lineHeight: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  demoBox: {
    backgroundColor: AnonUTheme.bgCream,
    borderColor: AnonUTheme.black,
    borderWidth: AnonUTheme.borderWidthThin,
    borderRadius: AnonUTheme.radiusSm,
    padding: 12,
    marginBottom: 16,
  },
  demoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: AnonUTheme.bgSurface,
    borderColor: AnonUTheme.black,
    borderWidth: 1.5,
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  demoTag: {
    fontSize: 10,
    fontWeight: '900',
    color: AnonUTheme.black,
    letterSpacing: 0.8,
  },
  demoName: {
    fontSize: 13,
    fontWeight: '900',
    color: AnonUTheme.popPurple,
  },
  arrowRow: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  arrowText: {
    fontSize: 10,
    fontWeight: '800',
    color: AnonUTheme.textSecondary,
    letterSpacing: 0.5,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bulletIcon: {
    fontSize: 16,
    marginRight: 10,
    marginTop: 2,
  },
  bulletText: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '600',
    lineHeight: 18,
    color: AnonUTheme.textBlack,
  },
  tiersContainer: {
    marginBottom: 16,
  },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  tierPill: {
    borderColor: AnonUTheme.black,
    borderWidth: 1.5,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 84,
    alignItems: 'center',
    marginRight: 10,
  },
  tierPillText: {
    fontSize: 10,
    fontWeight: '900',
    color: AnonUTheme.black,
    letterSpacing: 0.5,
  },
  tierDesc: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: AnonUTheme.textBlack,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  ruleBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: AnonUTheme.black,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  ruleBadgeText: {
    color: AnonUTheme.white,
    fontSize: 11,
    fontWeight: '900',
  },
  ruleContent: {
    flex: 1,
  },
  ruleTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: AnonUTheme.black,
    marginBottom: 2,
  },
  ruleSub: {
    fontSize: 11.5,
    fontWeight: '500',
    color: AnonUTheme.textSecondary,
    lineHeight: 16,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: AnonUTheme.bgCream,
    borderColor: AnonUTheme.black,
    borderWidth: AnonUTheme.borderWidthThin,
    borderRadius: AnonUTheme.radiusSm,
    padding: 12,
    marginTop: 10,
    marginBottom: 16,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderColor: AnonUTheme.black,
    borderWidth: 2,
    borderRadius: 4,
    backgroundColor: AnonUTheme.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: AnonUTheme.popYellow,
  },
  checkmark: {
    fontSize: 14,
    fontWeight: '900',
    color: AnonUTheme.black,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    color: AnonUTheme.black,
    lineHeight: 16,
  },
  buttonSpacer: {
    height: 10,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backLink: {
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  backLinkText: {
    fontSize: 12,
    fontWeight: '900',
    color: AnonUTheme.black,
    letterSpacing: 0.5,
  },
});
