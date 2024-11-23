import React, { useState } from 'react';
import { StyleSheet, FlatList, TouchableOpacity, RefreshControl, Animated, useColorScheme, Platform, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ThemedView from '../components/ThemedView';
import ThemedText from '../components/ThemedText';
import { Colors } from '../../constants/Colors';

const DUMMY_POSTS = [
  {
    id: '1',
    content: 'Just had the worst experience at the campus cafeteria 😤',
    anonymousId: 'Anonymous123',
    timestamp: new Date().toISOString(),
    likes: 5,
    dislikes: 1,
    tags: ['campus', 'food']
  },
  {
    id: '2',
    content: 'Anyone else think the new library hours are ridiculous?',
    anonymousId: 'Anonymous456',
    timestamp: new Date().toISOString(),
    likes: 12,
    dislikes: 2,
    tags: ['library', 'study']
  }
];

const PostCard = ({ item, index }) => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'dark'];
  const [scaleAnim] = useState(new Animated.Value(1));
  const [likeScale] = useState(new Animated.Value(1));
  const [dislikeScale] = useState(new Animated.Value(1));

  const onPressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
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

  const animateButton = (scale) => {
    Animated.sequence([
      Animated.spring(scale, {
        toValue: 1.2,
        useNativeDriver: true,
        tension: 200,
        friction: 10
      }),
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 200,
        friction: 10
      })
    ]).start();
  };

  return (
    <Animated.View 
      style={[
        { 
          transform: [{ scale: scaleAnim }],
          opacity: scaleAnim.interpolate({
            inputRange: [0.97, 1],
            outputRange: [0.9, 1]
          })
        }
      ]}
    >
      <View style={[
        styles.postCard,
        { 
          marginTop: index === 0 ? 8 : 16,
          backgroundColor: theme.cardBg,
        }
      ]}>
        <View style={styles.postHeader}>
          <View style={styles.userInfo}>
            <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
              <ThemedText style={styles.avatarText}>
                {item.anonymousId.charAt(0)}
              </ThemedText>
            </View>
            <View style={styles.headerText}>
              <ThemedText weight="600" style={styles.username}>
                {item.anonymousId}
              </ThemedText>
              <ThemedText color="secondary" style={styles.timestamp}>
                {new Date(item.timestamp).toLocaleString()}
              </ThemedText>
            </View>
          </View>
        </View>

        <ThemedText style={styles.content}>
          {item.content}
        </ThemedText>

        <View style={styles.tagsContainer}>
          {item.tags.map(tag => (
            <View
              key={tag}
              style={[styles.tag, { backgroundColor: theme.primary + '20' }]}
            >
              <ThemedText color="primary" style={styles.tagText}>
                #{tag}
              </ThemedText>
            </View>
          ))}
        </View>

        <View style={[styles.actions, { borderTopColor: theme.border }]}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => animateButton(likeScale)}
            activeOpacity={0.7}
          >
            <Animated.View style={{ transform: [{ scale: likeScale }] }}>
              <MaterialCommunityIcons 
                name="thumb-up" 
                size={22} 
                color={theme.primary} 
              />
            </Animated.View>
            <ThemedText color="primary" style={styles.actionText}>
              {item.likes}
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => animateButton(dislikeScale)}
            activeOpacity={0.7}
          >
            <Animated.View style={{ transform: [{ scale: dislikeScale }] }}>
              <MaterialCommunityIcons 
                name="thumb-down" 
                size={22} 
                color={theme.secondary} 
              />
            </Animated.View>
            <ThemedText color="secondary" style={styles.actionText}>
              {item.dislikes}
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'dark'];
  const [posts, setPosts] = useState(DUMMY_POSTS);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <FlatList
        data={posts}
        renderItem={({ item, index }) => <PostCard item={item} index={index} />}
        keyExtractor={item => item.id}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={theme.primary}
          />
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  postCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  postHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
  },
  headerText: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    marginBottom: 2,
  },
  timestamp: {
    fontSize: 12,
    opacity: 0.7,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    lineHeight: 22,
    fontSize: 16,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  tag: {
    marginHorizontal: 4,
    marginBottom: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
    padding: 8,
  },
  actionText: {
    marginLeft: 8,
    fontWeight: '600',
  },
});
