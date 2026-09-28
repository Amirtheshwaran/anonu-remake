import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  Pressable,
  Modal,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Image } from 'expo-image';
import { storage } from '../src/services/firebase';
import { postService } from '../src/services/postService';
import { useAuthStore } from '../src/stores/useAuthStore';
import { AnonUTheme } from '../src/constants/theme';
import { AnonUConstants } from '../src/constants/config';
import { DEFAULT_CAMPUSES } from '../src/constants/campuses';
import { PostIdentity, PostType } from '../src/types/post';
import { BrutalistCard } from '../src/components/BrutalistCard';
import { BrutalistButton } from '../src/components/BrutalistButton';

export default function ComposeScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const selectedCampusId = useAuthStore((s) => s.selectedCampusId);
  const campus = DEFAULT_CAMPUSES[user?.campusId || selectedCampusId] || DEFAULT_CAMPUSES['uncc'];

  const [content, setContent] = useState('');
  const [identity, setIdentity] = useState<PostIdentity>('anonymous');
  const [type, setType] = useState<PostType>('text');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [timeLimitHours, setTimeLimitHours] = useState<number | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Poll
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [expiryModalVisible, setExpiryModalVisible] = useState(false);

  const charCount = content.length;
  const canPost =
    content.trim().length > 0 &&
    charCount <= AnonUConstants.maxPostLength &&
    !loading;

  const hasVerifiedProfile = Boolean(user?.displayName);

  const handlePickImages = async () => {
    const remaining = AnonUConstants.maxImages - images.length;
    if (remaining <= 0) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.8,
    });

    if (result.canceled || !result.assets) return;

    // Strip EXIF metadata using ImageManipulator
    const sanitizedUris: string[] = [];
    for (const asset of result.assets) {
      try {
        const manip = await ImageManipulator.manipulateAsync(
          asset.uri,
          [{ resize: { width: 1200 } }], // Resize and strip EXIF
          { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
        );
        sanitizedUris.push(manip.uri);
      } catch (err) {
        console.warn('EXIF sanitization fallback to raw asset:', err);
        sanitizedUris.push(asset.uri);
      }
    }

    setImages((prev) => [...prev, ...sanitizedUris].slice(0, AnonUConstants.maxImages));
    setType('image');
  };

  const uploadImages = async (): Promise<string[]> => {
    if (!user || images.length === 0) return [];
    const downloadUrls: string[] = [];

    for (let i = 0; i < images.length; i++) {
      const uri = images[i];
      const filename = `temp_${Date.now()}_${i}.jpg`;
      const ref = storage().ref(`uploads/${user.uid}/${filename}`);

      // Read blob and upload
      const response = await fetch(uri);
      const blob = await response.blob();
      await ref.put(blob, { contentType: 'image/jpeg' });
      const url = await ref.getDownloadURL();
      downloadUrls.push(url);
    }

    return downloadUrls;
  };

  const handlePublish = async () => {
    if (!canPost) return;
    setLoading(true);

    try {
      const uploadedUrls = await uploadImages();

      let pollData = undefined;
      if (type === 'poll') {
        const validOptions = pollOptions.map((o) => o.trim()).filter((o) => o.length > 0);
        if (validOptions.length < 2) {
          Alert.alert('Incomplete Poll', 'Please provide at least 2 poll options.');
          setLoading(false);
          return;
        }
        pollData = {
          options: validOptions,
          durationHours: 24,
        };
      }

      await postService.createPost({
        content: content.trim(),
        identity,
        type: uploadedUrls.length > 0 ? 'image' : type === 'poll' ? 'poll' : 'text',
        tags: selectedTags,
        imageUrls: uploadedUrls,
        poll: pollData,
        timeLimitHours,
      });

      router.back();
    } catch (err: any) {
      console.error('Publish post failed:', err);
      Alert.alert('Publish Error', err.message || 'Failed to publish post.');
    } finally {
      setLoading(false);
    }
  };

  const toggleTag = (t: string) => {
    if (selectedTags.includes(t)) {
      setSelectedTags((prev) => prev.filter((item) => item !== t));
    } else if (selectedTags.length < AnonUConstants.maxTags) {
      setSelectedTags((prev) => [...prev, t]);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* App Bar */}
      <View style={styles.appBar}>
        <Pressable onPress={() => router.back()} style={styles.closeButtonWrapper}>
          <View style={styles.closeShadow} />
          <View style={styles.closeButton}>
            <Text style={styles.closeIcon}>✕</Text>
          </View>
        </Pressable>

        <Text style={styles.headerTitle}>NEW CAMPUS POST</Text>

        <BrutalistButton
          text="PUBLISH →"
          backgroundColor={canPost ? AnonUTheme.popYellow : '#E5E2D9'}
          isLoading={loading}
          disabled={!canPost}
          shadowOffset={{ width: 2.5, height: 2.5 }}
          paddingVertical={8}
          paddingHorizontal={14}
          onPress={handlePublish}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Campus Scope Banner */}
        <View style={styles.campusScopeBanner}>
          <Text style={styles.campusScopeLabel}>TARGET CAMPUS:</Text>
          <View style={styles.campusScopePill}>
            <Text style={styles.campusScopeName}>{campus.shortName.toUpperCase()}</Text>
          </View>
        </View>

        {/* Identity Selector */}
        <View style={styles.identityCard}>
          <View style={styles.identityShadow} />
          <View style={styles.identityRow}>
            {/* Anonymous Mask */}
            <Pressable
              onPress={() => setIdentity('anonymous')}
              style={[
                styles.identityOption,
                identity === 'anonymous' && styles.identityOptionMint,
              ]}
            >
              <Text style={styles.identityEmoji}>🎭</Text>
              <View style={styles.identityTextCol}>
                <Text style={styles.identityTitle} numberOfLines={1}>
                  {user?.pseudonym || 'Anonymous'}
                </Text>
                <Text style={styles.identitySubtitle}>ANONYMOUS MASK</Text>
              </View>
            </Pressable>

            {/* Verified Profile */}
            <Pressable
              onPress={() => hasVerifiedProfile && setIdentity('identified')}
              disabled={!hasVerifiedProfile}
              style={[
                styles.identityOption,
                identity === 'identified' && styles.identityOptionYellow,
                !hasVerifiedProfile && styles.identityDisabled,
              ]}
            >
              <Text style={styles.identityEmoji}>👤</Text>
              <View style={styles.identityTextCol}>
                <Text
                  style={[
                    styles.identityTitle,
                    !hasVerifiedProfile && { color: AnonUTheme.textMuted },
                  ]}
                  numberOfLines={1}
                >
                  {user?.displayName || 'PROFILE NOT SET'}
                </Text>
                <Text style={styles.identitySubtitle}>VERIFIED REAL NAME</Text>
              </View>
            </Pressable>
          </View>
        </View>

        {/* Content Box */}
        <BrutalistCard padding={14} style={styles.contentCard}>
          <TextInput
            value={content}
            onChangeText={setContent}
            placeholder="What's happening on campus? Speak freely..."
            placeholderTextColor={AnonUTheme.textMuted}
            multiline
            style={styles.contentInput}
          />

          <View style={styles.counterRow}>
            <View
              style={[
                styles.counterBadge,
                charCount > AnonUConstants.maxPostLength && styles.counterBadgeRed,
              ]}
            >
              <Text
                style={[
                  styles.counterText,
                  charCount > AnonUConstants.maxPostLength && styles.counterTextWhite,
                ]}
              >
                {`${charCount} / ${AnonUConstants.maxPostLength}`}
              </Text>
            </View>
          </View>
        </BrutalistCard>

        {/* Option Pills (Poll, Images, Expiry) */}
        <View style={styles.optionPillsRow}>
          {/* Poll Toggle */}
          <Pressable
            onPress={() => setType(type === 'poll' ? 'text' : 'poll')}
            style={[
              styles.pillButton,
              type === 'poll' && { backgroundColor: AnonUTheme.popMint },
            ]}
          >
            <Text style={styles.pillIcon}>📊</Text>
            <Text style={styles.pillLabel}>POLL</Text>
          </Pressable>

          {/* Image Picker */}
          <Pressable
            onPress={handlePickImages}
            style={[
              styles.pillButton,
              images.length > 0 && { backgroundColor: AnonUTheme.popCyan },
            ]}
          >
            <Text style={styles.pillIcon}>📷</Text>
            <Text style={styles.pillLabel}>{`IMAGES (${images.length}/${AnonUConstants.maxImages})`}</Text>
          </Pressable>

          {/* Expiry TTL Picker */}
          <Pressable
            onPress={() => setExpiryModalVisible(true)}
            style={[
              styles.pillButton,
              timeLimitHours !== null && { backgroundColor: AnonUTheme.popOrange },
            ]}
          >
            <Text style={styles.pillIcon}>⏳</Text>
            <Text style={styles.pillLabel}>
              {timeLimitHours ? `EXPIRES IN ${timeLimitHours}H` : 'EXPIRY: NEVER'}
            </Text>
          </Pressable>
        </View>

        {/* Poll Creator Block */}
        {type === 'poll' && (
          <BrutalistCard padding={16} style={styles.blockMargin}>
            <Text style={styles.sectionHeaderTitle}>📊 POLL OPTIONS (2-4)</Text>
            {pollOptions.map((opt, i) => (
              <View key={i} style={styles.pollInputRow}>
                <View style={styles.pollLetterBox}>
                  <Text style={styles.pollLetterText}>
                    {String.fromCharCode(65 + i)}
                  </Text>
                </View>
                <TextInput
                  value={opt}
                  onChangeText={(val) => {
                    const copy = [...pollOptions];
                    copy[i] = val;
                    setPollOptions(copy);
                  }}
                  placeholder={`Option ${i + 1}`}
                  style={styles.pollTextInput}
                />
                {pollOptions.length > 2 && (
                  <Pressable
                    onPress={() =>
                      setPollOptions(pollOptions.filter((_, idx) => idx !== i))
                    }
                    style={styles.pollDeleteButton}
                  >
                    <Text style={styles.pollDeleteText}>✕</Text>
                  </Pressable>
                )}
              </View>
            ))}

            {pollOptions.length < AnonUConstants.maxPollOptions && (
              <BrutalistButton
                text="+ ADD OPTION"
                backgroundColor={AnonUTheme.popMint}
                shadowOffset={{ width: 2, height: 2 }}
                paddingVertical={6}
                paddingHorizontal={12}
                onPress={() => setPollOptions([...pollOptions, ''])}
              />
            )}
          </BrutalistCard>
        )}

        {/* Image Attachment Panel */}
        {images.length > 0 && (
          <BrutalistCard padding={16} style={styles.blockMargin}>
            <Text style={styles.sectionHeaderTitle}>📷 ATTACHED IMAGES</Text>
            <View style={styles.imageThumbnailsRow}>
              {images.map((uri, idx) => (
                <View key={idx} style={styles.thumbWrapper}>
                  <Image source={{ uri }} style={styles.thumbnail} />
                  <Pressable
                    onPress={() =>
                      setImages(images.filter((_, i) => i !== idx))
                    }
                    style={styles.removeImageBadge}
                  >
                    <Text style={styles.removeImageText}>✕</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          </BrutalistCard>
        )}

        {/* Campus Topics & Tags */}
        <BrutalistCard padding={16} style={styles.blockMargin}>
          <Text style={styles.sectionHeaderTitle}>🏷️ CAMPUS TOPICS & TAGS</Text>
          <View style={styles.tagChipsWrap}>
            {AnonUConstants.suggestedTags.map((t) => {
              const isSelected = selectedTags.includes(t);
              return (
                <Pressable
                  key={t}
                  onPress={() => toggleTag(t)}
                  style={[
                    styles.tagChipWrapper,
                    isSelected && styles.tagChipActive,
                  ]}
                >
                  <Text style={styles.tagChipText}>{`#${t}`}</Text>
                </Pressable>
              );
            })}
          </View>
        </BrutalistCard>
      </ScrollView>

      {/* Expiry TTL Sheet Modal */}
      <Modal
        visible={expiryModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setExpiryModalVisible(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setExpiryModalVisible(false)}
        >
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>SET POST EXPIRATION TTL</Text>
            <Text style={styles.modalSubtitle}>
              Expired posts will self-destruct and disappear from the campus feed.
            </Text>

            <Pressable
              onPress={() => {
                setTimeLimitHours(null);
                setExpiryModalVisible(false);
              }}
              style={[
                styles.expiryOptionRow,
                timeLimitHours === null && styles.expiryOptionSelected,
              ]}
            >
              <Text style={styles.expiryOptionText}>NEVER (PERMANENT POST)</Text>
            </Pressable>

            {AnonUConstants.timeLimitOptions.map((h) => (
              <Pressable
                key={h}
                onPress={() => {
                  setTimeLimitHours(h);
                  setExpiryModalVisible(false);
                }}
                style={[
                  styles.expiryOptionRow,
                  timeLimitHours === h && styles.expiryOptionSelected,
                ]}
              >
                <Text style={styles.expiryOptionText}>
                  {`${h} HOUR${h === 1 ? '' : 'S'} (${h < 24 ? `${h} hours` : `${h / 24} day`})`}
                </Text>
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AnonUTheme.bgCream,
  },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomColor: AnonUTheme.black,
    borderBottomWidth: AnonUTheme.borderWidthThin,
  },
  closeButtonWrapper: {
    position: 'relative',
    width: 36,
    height: 36,
  },
  closeShadow: {
    position: 'absolute',
    top: 2,
    left: 2,
    right: 0,
    bottom: 0,
    backgroundColor: AnonUTheme.black,
    borderRadius: AnonUTheme.radiusSm,
    width: 36,
    height: 36,
  },
  closeButton: {
    width: 36,
    height: 36,
    backgroundColor: AnonUTheme.bgSurface,
    borderColor: AnonUTheme.black,
    borderWidth: AnonUTheme.borderWidthThin,
    borderRadius: AnonUTheme.radiusSm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    fontSize: 16,
    fontWeight: '900',
    color: AnonUTheme.black,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: AnonUTheme.black,
    letterSpacing: 0.3,
  },
  scrollContent: {
    padding: 16,
  },
  campusScopeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  campusScopeLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: AnonUTheme.black,
    letterSpacing: 0.5,
  },
  campusScopePill: {
    backgroundColor: AnonUTheme.black,
    borderRadius: AnonUTheme.radiusSm,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  campusScopeName: {
    fontSize: 10.5,
    fontWeight: '900',
    color: AnonUTheme.popYellow,
    letterSpacing: 0.8,
  },
  identityCard: {
    position: 'relative',
    height: 52,
    marginBottom: 14,
  },
  identityShadow: {
    position: 'absolute',
    top: 2.5,
    left: 2.5,
    right: 0,
    bottom: 0,
    backgroundColor: AnonUTheme.black,
    borderRadius: AnonUTheme.radiusSm,
    width: '100%',
    height: 52,
  },
  identityRow: {
    flexDirection: 'row',
    height: 52,
    backgroundColor: AnonUTheme.bgSurface,
    borderColor: AnonUTheme.black,
    borderWidth: AnonUTheme.borderWidthThin,
    borderRadius: AnonUTheme.radiusSm,
    padding: 4,
  },
  identityOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    borderRadius: AnonUTheme.radiusSm - 2,
  },
  identityOptionMint: {
    backgroundColor: AnonUTheme.popMint,
    borderColor: AnonUTheme.black,
    borderWidth: 1.5,
  },
  identityOptionYellow: {
    backgroundColor: AnonUTheme.popYellow,
    borderColor: AnonUTheme.black,
    borderWidth: 1.5,
  },
  identityDisabled: {
    opacity: 0.5,
  },
  identityEmoji: {
    fontSize: 18,
    marginRight: 6,
  },
  identityTextCol: {
    flex: 1,
  },
  identityTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: AnonUTheme.black,
  },
  identitySubtitle: {
    fontSize: 8.5,
    fontWeight: '800',
    color: AnonUTheme.black,
    letterSpacing: 0.4,
  },
  contentCard: {
    marginBottom: 14,
  },
  contentInput: {
    fontSize: 16,
    color: AnonUTheme.black,
    fontWeight: '600',
    lineHeight: 22,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  counterRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  counterBadge: {
    backgroundColor: AnonUTheme.bgCream,
    borderColor: AnonUTheme.black,
    borderWidth: 1.5,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  counterBadgeRed: {
    backgroundColor: AnonUTheme.downvoteRed,
  },
  counterText: {
    fontSize: 11,
    fontWeight: '900',
    color: AnonUTheme.black,
  },
  counterTextWhite: {
    color: AnonUTheme.white,
  },
  optionPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 14,
  },
  pillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AnonUTheme.bgSurface,
    borderColor: AnonUTheme.black,
    borderWidth: AnonUTheme.borderWidthThin,
    borderRadius: AnonUTheme.radiusSm,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginRight: 8,
    marginBottom: 8,
  },
  pillIcon: {
    fontSize: 14,
    marginRight: 5,
  },
  pillLabel: {
    fontSize: 11.5,
    fontWeight: '900',
    color: AnonUTheme.black,
    letterSpacing: 0.3,
  },
  blockMargin: {
    marginBottom: 14,
  },
  sectionHeaderTitle: {
    fontSize: 12.5,
    fontWeight: '900',
    color: AnonUTheme.black,
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  pollInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  pollLetterBox: {
    width: 28,
    height: 40,
    backgroundColor: AnonUTheme.black,
    borderTopLeftRadius: AnonUTheme.radiusSm,
    borderBottomLeftRadius: AnonUTheme.radiusSm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pollLetterText: {
    color: AnonUTheme.white,
    fontWeight: '900',
    fontSize: 12,
  },
  pollTextInput: {
    flex: 1,
    height: 40,
    backgroundColor: AnonUTheme.bgCream,
    borderColor: AnonUTheme.black,
    borderWidth: 1.5,
    paddingHorizontal: 10,
    fontWeight: '700',
    fontSize: 13,
  },
  pollDeleteButton: {
    padding: 8,
    backgroundColor: AnonUTheme.downvoteRed,
    borderRadius: AnonUTheme.radiusSm,
    marginLeft: 6,
  },
  pollDeleteText: {
    color: AnonUTheme.white,
    fontWeight: '900',
    fontSize: 12,
  },
  imageThumbnailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  thumbWrapper: {
    position: 'relative',
    width: 80,
    height: 80,
    marginRight: 10,
    marginBottom: 10,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: AnonUTheme.radiusSm,
    borderColor: AnonUTheme.black,
    borderWidth: 2,
  },
  removeImageBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: AnonUTheme.downvoteRed,
    borderColor: AnonUTheme.black,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageText: {
    color: AnonUTheme.white,
    fontWeight: '900',
    fontSize: 10,
  },
  tagChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tagChipWrapper: {
    backgroundColor: AnonUTheme.bgCream,
    borderColor: AnonUTheme.black,
    borderWidth: 1.5,
    borderRadius: AnonUTheme.radiusSm,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 8,
    marginBottom: 8,
  },
  tagChipActive: {
    backgroundColor: AnonUTheme.popCyan,
  },
  tagChipText: {
    color: AnonUTheme.black,
    fontWeight: '800',
    fontSize: 12,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: AnonUTheme.bgSurface,
    borderTopLeftRadius: AnonUTheme.radiusMd,
    borderTopRightRadius: AnonUTheme.radiusMd,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderRightWidth: 3,
    borderColor: AnonUTheme.black,
    padding: 20,
    paddingBottom: 36,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: AnonUTheme.black,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: AnonUTheme.textSecondary,
    marginBottom: 16,
  },
  expiryOptionRow: {
    backgroundColor: AnonUTheme.bgCream,
    borderColor: AnonUTheme.black,
    borderWidth: 1.5,
    borderRadius: AnonUTheme.radiusSm,
    padding: 12,
    marginBottom: 8,
  },
  expiryOptionSelected: {
    backgroundColor: AnonUTheme.popYellow,
  },
  expiryOptionText: {
    color: AnonUTheme.black,
    fontWeight: '800',
    fontSize: 13,
  },
});
