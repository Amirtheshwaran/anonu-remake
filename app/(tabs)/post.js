import React, { useState } from 'react';
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Animated,
  useColorScheme,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ThemedView from '../components/ThemedView';
import ThemedText from '../components/ThemedText';
import { Colors } from '../../constants/Colors';

const MAX_CHARS = 280;

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function PostScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [scaleAnim] = useState(new Animated.Value(1));
  const [actionAnims] = useState({
    image: new Animated.Value(1),
    poll: new Animated.Value(1),
    emoji: new Animated.Value(1)
  });

  const handlePost = () => {
    if (content.trim().length === 0) {
      Alert.alert('Error', 'Post content cannot be empty');
      return;
    }

    Alert.alert(
      'Success',
      'Your post has been shared anonymously!',
      [
        {
          text: 'OK',
          onPress: () => {
            setContent('');
            setTags('');
          },
        },
      ]
    );
  };

  const onPressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      tension: 100,
      friction: 7
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 7
    }).start();
  };

  const animateAction = (key) => {
    Animated.sequence([
      Animated.spring(actionAnims[key], {
        toValue: 0.8,
        useNativeDriver: true,
        tension: 100,
        friction: 7
      }),
      Animated.spring(actionAnims[key], {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 7
      })
    ]).start();
  };

  const remainingChars = MAX_CHARS - content.length;
  const isOverLimit = remainingChars < 0;
  const isValid = content.trim().length > 0 && !isOverLimit;

  const renderActionButton = (icon, key) => (
    <Animated.View style={{ transform: [{ scale: actionAnims[key] }] }}>
      <TouchableOpacity 
        style={styles.actionButton}
        onPress={() => animateAction(key)}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={[theme.surface, theme.surfaceHover]}
          style={styles.actionButtonInner}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <MaterialCommunityIcons 
            name={icon} 
            size={24} 
            color={theme.primary} 
          />
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <ThemedView variant="default" style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ThemedView 
          variant="surface" 
          style={[
            styles.inputContainer,
            { backgroundColor: Platform.select({
              ios: theme.surface + 'F0',
              android: theme.surface
            })}
          ]}
        >
          <LinearGradient
            colors={[theme.primary + '10', 'transparent']}
            style={styles.inputGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          
          <TextInput
            style={[
              styles.contentInput,
              { color: theme.text }
            ]}
            placeholder="What's happening on campus?"
            placeholderTextColor={theme.secondary}
            multiline
            value={content}
            onChangeText={setContent}
            maxLength={MAX_CHARS}
          />
          
          <ThemedView style={[styles.tagsContainer, { borderTopColor: theme.border + '40' }]}>
            <LinearGradient
              colors={[theme.primary, theme.accent]}
              style={styles.tagIcon}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <MaterialCommunityIcons 
                name="tag-multiple" 
                size={16} 
                color="#FFFFFF"
              />
            </LinearGradient>
            <TextInput
              style={[
                styles.tagsInput,
                { color: theme.primary }
              ]}
              placeholder="Add tags (separated by spaces)"
              placeholderTextColor={theme.secondary}
              value={tags}
              onChangeText={setTags}
            />
          </ThemedView>

          <ThemedView style={styles.charCount}>
            <ThemedText
              variant="caption"
              color={isOverLimit ? 'error' : 'secondary'}
              weight={isOverLimit ? 'bold' : 'regular'}
              style={styles.charCountText}
            >
              {remainingChars} characters remaining
            </ThemedText>
          </ThemedView>
        </ThemedView>

        <ThemedView 
          variant="surface" 
          style={[styles.footer, { borderTopColor: theme.border + '40' }]}
        >
          <ThemedView style={styles.actions}>
            {renderActionButton('image', 'image')}
            {renderActionButton('poll', 'poll')}
            {renderActionButton('emoticon', 'emoji')}
          </ThemedView>

          <AnimatedTouchable
            style={[
              styles.postButton,
              { transform: [{ scale: scaleAnim }] }
            ]}
            onPress={handlePost}
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            disabled={!isValid}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={isValid ? [theme.primary, theme.accent] : [theme.surfaceHover, theme.surfaceActive]}
              style={styles.postButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <MaterialCommunityIcons 
                name="send" 
                size={20} 
                color={isValid ? '#FFFFFF' : theme.secondary} 
                style={styles.postIcon}
              />
              <ThemedText
                variant="body"
                weight="bold"
                style={[
                  styles.postButtonText,
                  { color: isValid ? '#FFFFFF' : theme.secondary }
                ]}
              >
                Post
              </ThemedText>
            </LinearGradient>
          </AnimatedTouchable>
        </ThemedView>
      </KeyboardAvoidingView>

      <ThemedView 
        variant="surface" 
        style={[styles.disclaimer, { borderTopColor: theme.border + '40' }]}
      >
        <LinearGradient
          colors={[theme.success + '20', theme.success + '40']}
          style={styles.disclaimerIcon}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <MaterialCommunityIcons 
            name="shield-check" 
            size={16} 
            color={theme.success} 
          />
        </LinearGradient>
        <ThemedText
          variant="caption"
          color="secondary"
          style={styles.disclaimerText}
        >
          Your post will be shared anonymously, but must follow community guidelines
        </ThemedText>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  inputContainer: {
    flex: 1,
    margin: 16,
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  inputGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  contentInput: {
    fontSize: 18,
    height: 150,
    textAlignVertical: 'top',
    margin: 16,
    lineHeight: 24,
  },
  tagsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
  },
  tagIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagsInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
  },
  charCount: {
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  charCountText: {
    fontSize: 13,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
  },
  actions: {
    flexDirection: 'row',
  },
  actionButton: {
    marginRight: 12,
  },
  actionButtonInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  postButton: {
    overflow: 'hidden',
    borderRadius: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  postButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  postIcon: {
    marginRight: 8,
  },
  postButtonText: {
    fontSize: 16,
    letterSpacing: 0.5,
  },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
  },
  disclaimerIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disclaimerText: {
    marginLeft: 12,
    flex: 1,
    lineHeight: 18,
  },
});
