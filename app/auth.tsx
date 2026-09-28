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
import { PseudonymService } from '../src/services/pseudonymService';
import { authService } from '../src/services/authService';
import { BrutalistCard } from '../src/components/BrutalistCard';
import { BrutalistButton } from '../src/components/BrutalistButton';
import { BrutalistTextField } from '../src/components/BrutalistTextField';

export default function AuthScreen() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [obscure, setObscure] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [previewPseudonym, setPreviewPseudonym] = useState(
    PseudonymService.generateRandomPreview()
  );

  const previewColor = PseudonymService.colorForPseudonym(previewPseudonym);

  const handleReroll = () => {
    setPreviewPseudonym(PseudonymService.generateRandomPreview());
  };

  const handleSubmit = async () => {
    if (!email.trim() || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      if (isLogin) {
        await authService.signIn(email.trim(), password);
      } else {
        await authService.signUp(email.trim(), password);
      }
      router.replace('/(tabs)');
    } catch (err: any) {
      const msg = err.message || String(err);
      setErrorMsg(msg.replace(/^\[.*?\]\s*/, ''));
    } finally {
      setLoading(false);
    }
  };

  const handleAnonymousSignIn = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      await authService.signInAnonymously();
      router.replace('/(tabs)');
    } catch (err: any) {
      const msg = err.message || String(err);
      setErrorMsg(msg.replace(/^\[.*?\]\s*/, ''));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email.trim()) {
      setErrorMsg('Enter your university email first to receive reset link.');
      return;
    }
    try {
      await authService.sendPasswordResetEmail(email.trim());
      setErrorMsg('Password reset link sent to your email!');
    } catch (err: any) {
      const msg = err.message || String(err);
      setErrorMsg(msg.replace(/^\[.*?\]\s*/, ''));
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Hero Brand Header */}
        <View style={styles.heroWrapper}>
          <BrutalistCard
            backgroundColor={AnonUTheme.popYellow}
            padding={16}
            style={styles.heroCard}
          >
            <View style={styles.heroInner}>
              <View style={styles.campusBadge}>
                <Text style={styles.campusBadgeText}>CAMPUS</Text>
              </View>
              <Text style={styles.brandTitle}>AnonU</Text>
            </View>
            <Text style={styles.brandSubtitle}>
              MICROBLOG // ANONYMOUS & IDENTIFIED
            </Text>
          </BrutalistCard>
        </View>

        {/* Error Banner */}
        {errorMsg && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        )}

        {/* Main Auth Form Card */}
        <BrutalistCard padding={20} style={styles.formCard}>
          {/* Mode Selector Tabs */}
          <View style={styles.tabSelector}>
            <Pressable
              onPress={() => setIsLogin(true)}
              style={[styles.tabButton, isLogin && styles.tabActive]}
            >
              <Text style={[styles.tabText, isLogin && styles.tabTextActive]}>
                SIGN IN
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setIsLogin(false)}
              style={[styles.tabButton, !isLogin && styles.tabActive]}
            >
              <Text style={[styles.tabText, !isLogin && styles.tabTextActive]}>
                SIGN UP
              </Text>
            </Pressable>
          </View>

          {/* Email Field */}
          <Text style={styles.fieldLabel}>UNIVERSITY EMAIL</Text>
          <BrutalistTextField
            value={email}
            onChangeText={setEmail}
            placeholder="student@university.edu"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          {/* Password Field */}
          <Text style={[styles.fieldLabel, { marginTop: 14 }]}>PASSWORD</Text>
          <BrutalistTextField
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••••••"
            secureTextEntry={obscure}
            autoCapitalize="none"
            suffixIcon={
              <Pressable onPress={() => setObscure(!obscure)}>
                <Text style={styles.showHideText}>{obscure ? 'SHOW' : 'HIDE'}</Text>
              </Pressable>
            }
          />

          {/* Pseudonym Preview on Sign Up */}
          {!isLogin && (
            <View style={[styles.previewBox, { backgroundColor: previewColor + '40' }]}>
              <View style={styles.previewHeader}>
                <Text style={styles.previewTitle}>YOUR PSEUDONYM MASK</Text>
                <Pressable onPress={handleReroll} style={styles.rerollButton}>
                  <Text style={styles.rerollText}>🎲 REROLL</Text>
                </Pressable>
              </View>
              <Text style={styles.previewName}>{`"${previewPseudonym}"`}</Text>
              <Text style={styles.previewSub}>
                A unique pseudonym will protect your identity on every post.
              </Text>
            </View>
          )}

          {/* Submit Action */}
          <View style={styles.actionsContainer}>
            <BrutalistButton
              text={isLogin ? 'SIGN IN →' : 'CREATE ACCOUNT →'}
              backgroundColor={AnonUTheme.popYellow}
              isFullWidth={true}
              isLoading={loading}
              onPress={handleSubmit}
            />

            <View style={{ height: 12 }} />

            <BrutalistButton
              text="CONTINUE ANONYMOUSLY"
              backgroundColor={AnonUTheme.popMint}
              isFullWidth={true}
              isLoading={loading}
              onPress={handleAnonymousSignIn}
            />

            {isLogin && (
              <Pressable onPress={handleResetPassword} style={styles.forgotLink}>
                <Text style={styles.forgotText}>FORGOT PASSWORD?</Text>
              </Pressable>
            )}
          </View>
        </BrutalistCard>

        {/* Footer Tagline */}
        <Text style={styles.footerTagline}>
          SAFE • UNFILTERED • ENCRYPTED CAMPUS VOICES
        </Text>
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
    paddingHorizontal: 24,
    paddingVertical: 20,
    justifyContent: 'center',
  },
  heroWrapper: {
    alignItems: 'center',
    marginBottom: 20,
  },
  heroCard: {
    alignItems: 'center',
    width: '100%',
  },
  heroInner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  campusBadge: {
    backgroundColor: AnonUTheme.black,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginRight: 10,
  },
  campusBadgeText: {
    color: AnonUTheme.popYellow,
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 1.2,
  },
  brandTitle: {
    color: AnonUTheme.black,
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -1.2,
  },
  brandSubtitle: {
    color: AnonUTheme.black,
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  errorBanner: {
    backgroundColor: AnonUTheme.downvoteRed,
    borderColor: AnonUTheme.black,
    borderWidth: 2,
    borderRadius: AnonUTheme.radiusSm,
    padding: 10,
    marginBottom: 14,
  },
  errorText: {
    color: AnonUTheme.white,
    fontWeight: '800',
    fontSize: 12.5,
  },
  formCard: {
    width: '100%',
  },
  tabSelector: {
    flexDirection: 'row',
    backgroundColor: AnonUTheme.bgCream,
    borderColor: AnonUTheme.black,
    borderWidth: AnonUTheme.borderWidthThin,
    borderRadius: AnonUTheme.radiusSm,
    padding: 3,
    marginBottom: 20,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: AnonUTheme.radiusSm - 2,
  },
  tabActive: {
    backgroundColor: AnonUTheme.popYellow,
    borderColor: AnonUTheme.black,
    borderWidth: AnonUTheme.borderWidthThin,
  },
  tabText: {
    color: AnonUTheme.black,
    fontWeight: '700',
    fontSize: 12.5,
    letterSpacing: 0.5,
  },
  tabTextActive: {
    fontWeight: '900',
  },
  fieldLabel: {
    color: AnonUTheme.black,
    fontWeight: '800',
    fontSize: 11.5,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  showHideText: {
    color: AnonUTheme.black,
    fontWeight: '900',
    fontSize: 11,
  },
  previewBox: {
    marginTop: 16,
    padding: 12,
    borderColor: AnonUTheme.black,
    borderWidth: AnonUTheme.borderWidthThin,
    borderRadius: AnonUTheme.radiusSm,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  previewTitle: {
    color: AnonUTheme.black,
    fontWeight: '900',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  rerollButton: {
    backgroundColor: AnonUTheme.black,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
  },
  rerollText: {
    color: AnonUTheme.white,
    fontWeight: '800',
    fontSize: 10,
  },
  previewName: {
    fontSize: 16,
    fontWeight: '900',
    color: AnonUTheme.black,
    marginBottom: 2,
  },
  previewSub: {
    fontSize: 11,
    fontWeight: '600',
    color: AnonUTheme.textSecondary,
  },
  actionsContainer: {
    marginTop: 22,
  },
  forgotLink: {
    alignItems: 'center',
    marginTop: 14,
  },
  forgotText: {
    color: AnonUTheme.black,
    fontWeight: '800',
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  footerTagline: {
    textAlign: 'center',
    color: AnonUTheme.textMuted,
    fontWeight: '800',
    fontSize: 10.5,
    letterSpacing: 0.8,
    marginTop: 24,
  },
});
