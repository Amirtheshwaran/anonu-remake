import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
  Animated,
  useColorScheme,
  Platform,
  Alert,
  Keyboard,
  Image,
  Dimensions,
  ActivityIndicator,
  Switch
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import ThemedView from '../components/ThemedView';
import ThemedText from '../components/ThemedText';
import { Colors } from '../../constants/Colors';

const { width } = Dimensions.get('window');
const MAX_TAGS = 5;
const MAX_CONTENT_LENGTH = 500;

const POPULAR_TAGS = [
  'campus', 'food', 'library', 'study', 'events', 'sports',
  'clubs', 'housing', 'classes', 'professors', 'exams', 'help',
  'roommates', 'parking', 'textbooks', 'internships', 'jobs'
];

const TagChip = ({ tag, onPress, isSelected = false }) => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'dark'];
  
  return (
    <TouchableOpacity
      style={[
        styles.tagChip,
        { 
          backgroundColor: isSelected ? theme.primary : theme.primary + '20',
          borderColor: isSelected ? theme.primary : 'transparent',
        }
      ]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress(tag);
      }}
      activeOpacity={0.7}
    >
      <ThemedText 
        color={isSelected ? 'white' : 'primary'} 
        style={styles.tagChipText}
      >
        #{tag}
      </ThemedText>
    </TouchableOpacity>
  );
};

const AttachmentPreview = ({ uri, onRemove }) => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'dark'];
  
  return (
    <View style={styles.attachmentContainer}>
      <Image 
        source={{ uri }} 
        style={styles.attachmentImage} 
        resizeMode="cover"
      />
      <TouchableOpacity 
        style={[styles.removeButton, { backgroundColor: theme.error }]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onRemove();
        }}
      >
        <MaterialCommunityIcons name="close" size={16} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
};

export default function PostScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'dark'];
  const [content, setContent] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [customTag, setCustomTag] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [isPublic, setIsPublic] = useState(true);
  const [attachments, setAttachments] = useState([]);
  const [isPosting, setIsPosting] = useState(false);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [suggestedTags, setSuggestedTags] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const contentInputRef = useRef(null);
  const customTagInputRef = useRef(null);
  const scrollViewRef = useRef(null);
  const buttonScale = useRef(new Animated.Value(1)).current;
  
  // Listen for keyboard events
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);
  
  // Handle tag suggestions
  useEffect(() => {
    if (customTag.length > 0) {
      const filtered = POPULAR_TAGS.filter(
        tag => tag.toLowerCase().includes(customTag.toLowerCase()) && 
              !selectedTags.includes(tag)
      );
      setSuggestedTags(filtered.slice(0, 5));
      setShowSuggestions(filtered.length > 0);
    } else {
      setSuggestedTags([]);
      setShowSuggestions(false);
    }
  }, [customTag, selectedTags]);

  const handleTagPress = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else if (selectedTags.length < MAX_TAGS) {
      setSelectedTags([...selectedTags, tag]);
    } else {
      Alert.alert('Tag Limit', `You can only select up to ${MAX_TAGS} tags.`);
    }
  };

  const handleAddCustomTag = () => {
    if (!customTag.trim()) return;
    
    const formattedTag = customTag.trim().toLowerCase().replace(/\s+/g, '');
    
    if (formattedTag.length < 2) {
      Alert.alert('Invalid Tag', 'Tags must be at least 2 characters long.');
      return;
    }
    
    if (selectedTags.includes(formattedTag)) {
      Alert.alert('Duplicate Tag', 'This tag has already been added.');
      return;
    }
    
    if (selectedTags.length >= MAX_TAGS) {
      Alert.alert('Tag Limit', `You can only select up to ${MAX_TAGS} tags.`);
      return;
    }
    
    setSelectedTags([...selectedTags, formattedTag]);
    setCustomTag('');
    setShowSuggestions(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSuggestionPress = (tag) => {
    if (selectedTags.length >= MAX_TAGS) {
      Alert.alert('Tag Limit', `You can only select up to ${MAX_TAGS} tags.`);
      return;
    }
    
    setSelectedTags([...selectedTags, tag]);
    setCustomTag('');
    setShowSuggestions(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const pickImage = async () => {
    if (attachments.length >= 4) {
      Alert.alert('Attachment Limit', 'You can only attach up to 4 images.');
      return;
    }
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setAttachments([...attachments, result.assets[0].uri]);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const removeAttachment = (index) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handlePost = () => {
    if (!content.trim()) {
      Alert.alert('Empty Post', 'Please enter some content for your post.');
      return;
    }
    
    // Animate button press
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Simulate posting
    setIsPosting(true);
    
    setTimeout(() => {
      setIsPosting(false);
      
      // Reset form
      setContent('');
      setSelectedTags([]);
      setCustomTag('');
      setAttachments([]);
      
      // Show success message
      Alert.alert(
        'Post Successful',
        'Your post has been published successfully!',
        [{ text: 'OK' }]
      );
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 1500);
  };

  const isPostValid = content.trim().length > 0;
  const remainingChars = MAX_CONTENT_LENGTH - content.length;
  const isNearLimit = remainingChars <= 50;

  return (
    <ThemedView variant="default" style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollContainer}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <ThemedText weight="bold" style={styles.headerTitle}>
            Create Post
          </ThemedText>
        </View>
        
        <View style={[styles.postTypeContainer, { backgroundColor: theme.cardBg }]}>
          <TouchableOpacity
            style={[
              styles.postTypeOption,
              isAnonymous && { backgroundColor: theme.primary + '20' }
            ]}
            onPress={() => {
              setIsAnonymous(true);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <MaterialCommunityIcons
              name="incognito"
              size={24}
              color={isAnonymous ? theme.primary : theme.textSecondary}
            />
            <ThemedText
              weight={isAnonymous ? '600' : 'normal'}
              color={isAnonymous ? 'primary' : 'secondary'}
              style={styles.postTypeText}
            >
              Anonymous
            </ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.postTypeOption,
              !isAnonymous && { backgroundColor: theme.primary + '20' }
            ]}
            onPress={() => {
              setIsAnonymous(false);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <MaterialCommunityIcons
              name="account"
              size={24}
              color={!isAnonymous ? theme.primary : theme.textSecondary}
            />
            <ThemedText
              weight={!isAnonymous ? '600' : 'normal'}
              color={!isAnonymous ? 'primary' : 'secondary'}
              style={styles.postTypeText}
            >
              Public
            </ThemedText>
          </TouchableOpacity>
        </View>
        
        <View style={[styles.inputContainer, { backgroundColor: theme.cardBg }]}>
          <TextInput
            ref={contentInputRef}
            style={[
              styles.contentInput,
              { color: theme.text }
            ]}
            placeholder="What's on your mind?"
            placeholderTextColor={theme.textSecondary}
            multiline
            value={content}
            onChangeText={setContent}
            maxLength={MAX_CONTENT_LENGTH}
          />
          
          <View style={styles.charCounter}>
            <ThemedText
              color={isNearLimit ? (remainingChars <= 0 ? 'error' : 'warning') : 'secondary'}
              style={styles.charCountText}
            >
              {remainingChars}
            </ThemedText>
          </View>
        </View>
        
        {attachments.length > 0 && (
          <View style={styles.attachmentsContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.attachmentsContent}
            >
              {attachments.map((uri, index) => (
                <AttachmentPreview
                  key={index}
                  uri={uri}
                  onRemove={() => removeAttachment(index)}
                />
              ))}
            </ScrollView>
          </View>
        )}
        
        <View style={[styles.tagsSection, { backgroundColor: theme.cardBg }]}>
          <View style={styles.tagsSectionHeader}>
            <ThemedText weight="600" style={styles.tagsSectionTitle}>
              Tags
            </ThemedText>
            <ThemedText color="secondary" style={styles.tagsCounter}>
              {selectedTags.length}/{MAX_TAGS}
            </ThemedText>
          </View>
          
          <View style={styles.selectedTagsContainer}>
            {selectedTags.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.selectedTagsContent}
              >
                {selectedTags.map((tag, index) => (
                  <TagChip
                    key={index}
                    tag={tag}
                    onPress={handleTagPress}
                    isSelected={true}
                  />
                ))}
              </ScrollView>
            ) : (
              <ThemedText color="secondary" style={styles.noTagsText}>
                No tags selected yet
              </ThemedText>
            )}
          </View>
          
          <View style={styles.customTagContainer}>
            <View style={[
              styles.customTagInputContainer,
              { 
                backgroundColor: theme.surfaceHover,
                borderColor: theme.border
              }
            ]}>
              <MaterialCommunityIcons
                name="pound"
                size={18}
                color={theme.textSecondary}
              />
              <TextInput
                ref={customTagInputRef}
                style={[
                  styles.customTagInput,
                  { color: theme.text }
                ]}
                placeholder="Add a custom tag"
                placeholderTextColor={theme.textSecondary}
                value={customTag}
                onChangeText={setCustomTag}
                onSubmitEditing={handleAddCustomTag}
                returnKeyType="done"
              />
            </View>
            
            <TouchableOpacity
              style={[
                styles.addTagButton,
                { backgroundColor: customTag.trim() ? theme.primary : theme.surfaceActive }
              ]}
              onPress={handleAddCustomTag}
              disabled={!customTag.trim()}
            >
              <MaterialCommunityIcons
                name="plus"
                size={20}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          </View>
          
          {showSuggestions && (
            <View style={styles.suggestionsContainer}>
              {suggestedTags.map((tag, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.suggestionItem,
                    { backgroundColor: theme.surfaceHover }
                  ]}
                  onPress={() => handleSuggestionPress(tag)}
                >
                  <MaterialCommunityIcons
                    name="pound"
                    size={16}
                    color={theme.textSecondary}
                    style={styles.suggestionIcon}
                  />
                  <ThemedText style={styles.suggestionText}>
                    {tag}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          )}
          
          <View style={styles.popularTagsContainer}>
            <ThemedText weight="600" style={styles.popularTagsTitle}>
              Popular Tags
            </ThemedText>
            
            <View style={styles.popularTagsContent}>
              {POPULAR_TAGS.slice(0, 10).map((tag, index) => (
                <TagChip
                  key={index}
                  tag={tag}
                  onPress={handleTagPress}
                  isSelected={selectedTags.includes(tag)}
                />
              ))}
            </View>
          </View>
        </View>
        
        <View style={[styles.visibilitySection, { backgroundColor: theme.cardBg }]}>
          <View style={styles.visibilityOption}>
            <View style={styles.visibilityOptionInfo}>
              <MaterialCommunityIcons
                name="earth"
                size={24}
                color={theme.primary}
                style={styles.visibilityIcon}
              />
              <View>
                <ThemedText weight="600" style={styles.visibilityTitle}>
                  Public Post
                </ThemedText>
                <ThemedText color="secondary" style={styles.visibilityDescription}>
                  Visible to everyone on campus
                </ThemedText>
              </View>
            </View>
            
            <Switch
              value={isPublic}
              onValueChange={() => {
                setIsPublic(!isPublic);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              trackColor={{ 
                false: theme.surfaceHover, 
                true: theme.primary + '80'
              }}
              thumbColor={isPublic ? theme.primary : theme.surface}
              ios_backgroundColor={theme.surfaceHover}
            />
          </View>
          
          {!isPublic && (
            <View style={styles.privateNoteContainer}>
              <MaterialCommunityIcons
                name="information"
                size={20}
                color={theme.warning}
                style={styles.privateNoteIcon}
              />
              <ThemedText color="warning" style={styles.privateNoteText}>
                Your post will only be visible to your followers
              </ThemedText>
            </View>
          )}
        </View>
      </ScrollView>
      
      <View style={[
        styles.bottomBar,
        { 
          backgroundColor: theme.cardBg,
          borderTopColor: theme.border
        }
      ]}>
        <TouchableOpacity
          style={[
            styles.attachButton,
            { backgroundColor: theme.surfaceHover }
          ]}
          onPress={pickImage}
        >
          <MaterialCommunityIcons
            name="image-plus"
            size={24}
            color={theme.primary}
          />
        </TouchableOpacity>
        
        <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
          <TouchableOpacity
            style={[
              styles.postButton,
              { 
                backgroundColor: isPostValid ? theme.primary : theme.surfaceActive,
                opacity: isPostValid ? 1 : 0.7
              }
            ]}
            onPress={handlePost}
            disabled={!isPostValid || isPosting}
          >
            {isPosting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <MaterialCommunityIcons
                  name="send"
                  size={20}
                  color="#FFFFFF"
                />
                <ThemedText
                  color="white"
                  weight="600"
                  style={styles.postButtonText}
                >
                  Post
                </ThemedText>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 100,
  },
  header: {
    padding: 16,
    paddingTop: 24,
  },
  headerTitle: {
    fontSize: 28,
  },
  postTypeContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  postTypeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  postTypeText: {
    marginLeft: 8,
    fontSize: 16,
  },
  inputContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
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
  },
  contentInput: {
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
    lineHeight: 22,
  },
  charCounter: {
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  charCountText: {
    fontSize: 12,
  },
  attachmentsContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  attachmentsContent: {
    paddingRight: 16,
  },
  attachmentContainer: {
    position: 'relative',
    marginRight: 8,
  },
  attachmentImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagsSection: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
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
  },
  tagsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tagsSectionTitle: {
    fontSize: 18,
  },
  tagsCounter: {
    fontSize: 14,
  },
  selectedTagsContainer: {
    marginBottom: 16,
    minHeight: 40,
  },
  selectedTagsContent: {
    paddingRight: 16,
  },
  noTagsText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  customTagContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  customTagInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  customTagInput: {
    flex: 1,
    paddingVertical: 10,
    marginLeft: 8,
    fontSize: 16,
  },
  addTagButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestionsContainer: {
    marginBottom: 16,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  suggestionIcon: {
    marginRight: 8,
  },
  suggestionText: {
    fontSize: 14,
  },
  popularTagsContainer: {
    marginTop: 8,
  },
  popularTagsTitle: {
    fontSize: 16,
    marginBottom: 12,
  },
  popularTagsContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tagChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  tagChipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  visibilitySection: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
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
  },
  visibilityOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  visibilityOptionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  visibilityIcon: {
    marginRight: 12,
  },
  visibilityTitle: {
    fontSize: 16,
    marginBottom: 2,
  },
  visibilityDescription: {
    fontSize: 14,
  },
  privateNoteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  privateNoteIcon: {
    marginRight: 8,
  },
  privateNoteText: {
    fontSize: 14,
    flex: 1,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  attachButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  postButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
  },
  postButtonText: {
    marginLeft: 8,
    fontSize: 16,
  },
});
