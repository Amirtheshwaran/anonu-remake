import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Animated,
  useColorScheme,
  Platform,
  View,
  RefreshControl,
  Dimensions,
  Image,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Link } from 'expo-router';
import ThemedView from '../components/ThemedView';
import ThemedText from '../components/ThemedText';
import SearchBar from '../components/SearchBar';
import { Colors } from '../../constants/Colors';

const { width } = Dimensions.get('window');

// Dummy data for posts
const DUMMY_POSTS = [
  {
    id: '1',
    content: 'Just had the worst experience at the campus cafeteria 😤 The food was cold and they charged me extra for a side that was supposed to be included!',
    anonymousId: 'Anonymous123',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    likes: 24,
    comments: 8,
    tags: ['campus', 'food', 'complaint'],
    isLiked: false,
    images: []
  },
  {
    id: '2',
    content: 'Anyone else think the new library hours are ridiculous? They\'re closing at 8pm now which is exactly when I need to study the most! 📚',
    anonymousId: 'Anonymous456',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    likes: 56,
    comments: 12,
    tags: ['library', 'study', 'hours'],
    isLiked: true,
    images: []
  },
  {
    id: '3',
    content: 'PSA: Free pizza in the student union building right now! First come first served 🍕',
    anonymousId: 'Anonymous789',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    likes: 89,
    comments: 15,
    tags: ['freefood', 'pizza', 'studentunion'],
    isLiked: false,
    images: [
      'https://images.unsplash.com/photo-1513104890138-7c749659a591?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80'
    ]
  },
  {
    id: '4',
    content: 'Does anyone have notes from Professor Johnson\'s Calculus lecture today? I missed class because of a doctor\'s appointment.',
    anonymousId: 'Anonymous234',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    likes: 12,
    comments: 7,
    tags: ['notes', 'calculus', 'help'],
    isLiked: false,
    images: []
  },
  {
    id: '5',
    content: 'The sunset from the top of the science building tonight was absolutely incredible! 🌅',
    anonymousId: 'Anonymous567',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    likes: 143,
    comments: 23,
    tags: ['sunset', 'campus', 'views'],
    isLiked: true,
    images: [
      'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80'
    ]
  },
  {
    id: '6',
    content: 'Anyone know if the gym is open late tonight? The website says it closes at 10pm but I heard they extended hours for finals week.',
    anonymousId: 'Anonymous890',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    likes: 8,
    comments: 4,
    tags: ['gym', 'campus', 'question'],
    isLiked: false,
    images: []
  }
];

// Dummy data for trending topics
const TRENDING_TOPICS = [
  { id: '1', tag: 'finals', postCount: 156, trend: 'up' },
  { id: '2', tag: 'parking', postCount: 89, trend: 'up' },
  { id: '3', tag: 'cafeteria', postCount: 67, trend: 'down' },
  { id: '4', tag: 'events', postCount: 45, trend: 'up' },
  { id: '5', tag: 'study', postCount: 34, trend: 'neutral' }
];

const PostCard = ({ item, onPress }) => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'dark'];
  const [scaleAnim] = useState(new Animated.Value(1));
  const [likeScale] = useState(new Animated.Value(1));
  const [commentScale] = useState(new Animated.Value(1));
  const [shareScale] = useState(new Animated.Value(1));
  const [liked, setLiked] = useState(item.isLiked);
  const [likeCount, setLikeCount] = useState(item.likes);

  const onPressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
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
        toValue: 1.3,
        useNativeDriver: true,
        tension: 300,
        friction: 10
      }),
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 300,
        friction: 10
      })
    ]).start();
  };

  const handleLike = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    animateButton(likeScale);
    setLiked(!liked);
    setLikeCount(prev => liked ? prev - 1 : prev + 1);
  };

  const handleComment = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    animateButton(commentScale);
    onPress(item);
  };

  const handleShare = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    animateButton(shareScale);
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 1000 * 60) return 'Just now';
    if (diff < 1000 * 60 * 60) return `${Math.floor(diff / (1000 * 60))}m ago`;
    if (diff < 1000 * 60 * 60 * 24) return `${Math.floor(diff / (1000 * 60 * 60))}h ago`;
    return date.toLocaleDateString();
  };

  // Generate a consistent color for each anonymous user
  const getAvatarColor = (id) => {
    const colors = [theme.primary, theme.accent, theme.info, theme.success, theme.warning];
    const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const avatarColor = getAvatarColor(item.anonymousId);

  return (
    <Animated.View 
      style={[
        styles.postCardContainer,
        { transform: [{ scale: scaleAnim }] }
      ]}
    >
      <TouchableOpacity
        onPress={() => onPress(item)}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={0.7}
      >
        <View style={[
          styles.postCard,
          { 
            backgroundColor: theme.cardBg,
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
          }
        ]}>
          <View style={styles.postHeader}>
            <View style={styles.userInfo}>
              <LinearGradient
                colors={[avatarColor, theme.accent]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.avatar}
              >
                <ThemedText style={styles.avatarText}>
                  {item.anonymousId.charAt(9) || 'A'}
                </ThemedText>
              </LinearGradient>
              <View style={styles.headerText}>
                <ThemedText weight="600" style={styles.username}>
                  {item.anonymousId}
                </ThemedText>
                <ThemedText color="secondary" style={styles.timestamp}>
                  {formatTimestamp(item.timestamp)}
                </ThemedText>
              </View>
            </View>
            <TouchableOpacity style={styles.moreButton}>
              <MaterialCommunityIcons 
                name="dots-vertical" 
                size={22} 
                color={theme.textSecondary} 
              />
            </TouchableOpacity>
          </View>

          <ThemedText style={styles.content}>
            {item.content}
          </ThemedText>

          {item.images && item.images.length > 0 && (
            <View style={styles.imagesContainer}>
              {item.images.length === 1 ? (
                <Image 
                  source={{ uri: item.images[0] }} 
                  style={styles.singleImage} 
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.multipleImagesContainer}>
                  {item.images.map((image, index) => (
                    <Image 
                      key={index}
                      source={{ uri: image }} 
                      style={[
                        styles.multipleImage,
                        { 
                          width: (width - 64) / 2,
                          height: (width - 64) / 2
                        }
                      ]} 
                      resizeMode="cover"
                    />
                  ))}
                </View>
              )}
            </View>
          )}

          <View style={styles.tagsContainer}>
            {item.tags.map(tag => (
              <TouchableOpacity
                key={tag}
                style={[styles.tag, { backgroundColor: theme.primary + '15' }]}
              >
                <ThemedText color="primary" style={styles.tagText}>
                  #{tag}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>

          <View style={[styles.actions, { borderTopColor: theme.border }]}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleLike}
              activeOpacity={0.7}
            >
              <Animated.View style={{ transform: [{ scale: likeScale }] }}>
                <MaterialCommunityIcons 
                  name={liked ? "heart" : "heart-outline"} 
                  size={22} 
                  color={liked ? theme.accent : theme.textSecondary} 
                />
              </Animated.View>
              <ThemedText 
                color={liked ? "accent" : "secondary"} 
                style={styles.actionText}
              >
                {likeCount}
              </ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleComment}
              activeOpacity={0.7}
            >
              <Animated.View style={{ transform: [{ scale: commentScale }] }}>
                <MaterialCommunityIcons 
                  name="comment-outline" 
                  size={22} 
                  color={theme.textSecondary} 
                />
              </Animated.View>
              <ThemedText color="secondary" style={styles.actionText}>
                {item.comments}
              </ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleShare}
              activeOpacity={0.7}
            >
              <Animated.View style={{ transform: [{ scale: shareScale }] }}>
                <MaterialCommunityIcons 
                  name="share-outline" 
                  size={22} 
                  color={theme.textSecondary} 
                />
              </Animated.View>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const TrendingTopicItem = ({ item, onPress }) => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'dark'];
  const [scaleAnim] = useState(new Animated.Value(1));

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

  const getTrendIcon = () => {
    switch (item.trend) {
      case 'up':
        return { name: 'trending-up', color: 'success' };
      case 'down':
        return { name: 'trending-down', color: 'error' };
      default:
        return { name: 'trending-neutral', color: 'secondary' };
    }
  };

  const trendIcon = getTrendIcon();

  return (
    <Animated.View 
      style={[
        styles.trendingItemContainer,
        { 
          transform: [{ scale: scaleAnim }],
          opacity: scaleAnim.interpolate({
            inputRange: [0.97, 1],
            outputRange: [0.9, 1]
          })
        }
      ]}
    >
      <TouchableOpacity
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress(item);
        }}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={0.9}
      >
        <View style={[
          styles.trendingItem,
          { 
            backgroundColor: theme.cardBg,
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
          }
        ]}>
          <View style={styles.trendingContent}>
            <View style={[styles.trendIconContainer, { backgroundColor: theme[trendIcon.color] + '20' }]}>
              <MaterialCommunityIcons 
                name={trendIcon.name} 
                size={20} 
                color={theme[trendIcon.color]} 
              />
            </View>
            
            <View style={styles.trendingTextContainer}>
              <ThemedText weight="600" style={styles.hashTag}>
                #{item.tag}
              </ThemedText>
              <ThemedText color="secondary" style={styles.postCount}>
                {item.postCount.toLocaleString()} posts
              </ThemedText>
            </View>
            
            <MaterialCommunityIcons 
              name="chevron-right" 
              size={24} 
              color={theme.primary} 
            />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'dark'];
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [posts, setPosts] = useState(DUMMY_POSTS);
  const [trendingTopics, setTrendingTopics] = useState(TRENDING_TOPICS);
  const [activeFilter, setActiveFilter] = useState('all');
  const [showTrending, setShowTrending] = useState(true);
  
  const fabAnim = useRef(new Animated.Value(1)).current;
  const scrollY = useRef(new Animated.Value(0)).current;
  
  // Hide/show FAB based on scroll direction
  const fabOpacity = scrollY.interpolate({
    inputRange: [-50, 0, 50],
    outputRange: [1, 1, 0],
    extrapolate: 'clamp'
  });
  
  const fabTranslateY = scrollY.interpolate({
    inputRange: [-50, 0, 50],
    outputRange: [0, 0, 100],
    extrapolate: 'clamp'
  });

  const handleRefresh = () => {
    setRefreshing(true);
    
    // Simulate API call
    setTimeout(() => {
      // Shuffle posts to simulate new content
      setPosts([...posts].sort(() => Math.random() - 0.5));
      setRefreshing(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 1500);
  };

  const handleLoadMore = () => {
    if (loading) return;
    
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      // Add more posts (just duplicate existing ones for demo)
      const newPosts = [...posts];
      const additionalPosts = DUMMY_POSTS.map(post => ({
        ...post,
        id: `${post.id}-${Date.now()}`,
        timestamp: new Date().toISOString()
      }));
      
      setPosts([...newPosts, ...additionalPosts]);
      setLoading(false);
    }, 1500);
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    
    // Filter posts based on search query
    if (text) {
      const filtered = DUMMY_POSTS.filter(post => 
        post.content.toLowerCase().includes(text.toLowerCase()) ||
        post.tags.some(tag => tag.toLowerCase().includes(text.toLowerCase())) ||
        post.anonymousId.toLowerCase().includes(text.toLowerCase())
      );
      setPosts(filtered);
    } else {
      setPosts(DUMMY_POSTS);
    }
  };

  const handleFilterPress = (filter) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveFilter(filter);
    
    // Filter posts based on selected filter
    switch (filter) {
      case 'all':
        setPosts(DUMMY_POSTS);
        break;
      case 'trending':
        setPosts(DUMMY_POSTS.sort((a, b) => b.likes - a.likes));
        break;
      case 'recent':
        setPosts(DUMMY_POSTS.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
        break;
      default:
        setPosts(DUMMY_POSTS);
    }
  };

  const handlePostPress = (post) => {
    // Navigate to post details or show comments
    console.log('Post pressed:', post.id);
  };

  const handleTopicPress = (topic) => {
    // Filter posts by topic
    const filtered = DUMMY_POSTS.filter(post => 
      post.tags.includes(topic.tag)
    );
    setPosts(filtered);
    setShowTrending(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleFabPress = () => {
    // Animate FAB
    Animated.sequence([
      Animated.timing(fabAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(fabAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const renderHeader = () => (
    <>
      {showTrending && (
        <View style={styles.trendingSection}>
          <View style={styles.sectionHeader}>
            <ThemedText weight="600" style={styles.sectionTitle}>
              Trending Topics
            </ThemedText>
            <TouchableOpacity>
              <ThemedText color="primary" style={styles.seeAllText}>
                See All
              </ThemedText>
            </TouchableOpacity>
          </View>
          
          {trendingTopics.map((topic) => (
            <TrendingTopicItem 
              key={topic.id} 
              item={topic} 
              onPress={handleTopicPress} 
            />
          ))}
        </View>
      )}
      
      <View style={styles.filtersContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersScrollContent}
        >
          <TouchableOpacity
            style={[
              styles.filterButton,
              activeFilter === 'all' && { backgroundColor: theme.primary }
            ]}
            onPress={() => handleFilterPress('all')}
          >
            <ThemedText 
              color={activeFilter === 'all' ? 'white' : 'primary'}
              weight={activeFilter === 'all' ? '600' : 'normal'}
              style={styles.filterText}
            >
              All
            </ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.filterButton,
              activeFilter === 'trending' && { backgroundColor: theme.primary }
            ]}
            onPress={() => handleFilterPress('trending')}
          >
            <MaterialCommunityIcons 
              name="trending-up" 
              size={16} 
              color={activeFilter === 'trending' ? '#FFFFFF' : theme.primary} 
              style={styles.filterIcon}
            />
            <ThemedText 
              color={activeFilter === 'trending' ? 'white' : 'primary'}
              weight={activeFilter === 'trending' ? '600' : 'normal'}
              style={styles.filterText}
            >
              Trending
            </ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.filterButton,
              activeFilter === 'recent' && { backgroundColor: theme.primary }
            ]}
            onPress={() => handleFilterPress('recent')}
          >
            <MaterialCommunityIcons 
              name="clock-outline" 
              size={16} 
              color={activeFilter === 'recent' ? '#FFFFFF' : theme.primary} 
              style={styles.filterIcon}
            />
            <ThemedText 
              color={activeFilter === 'recent' ? 'white' : 'primary'}
              weight={activeFilter === 'recent' ? '600' : 'normal'}
              style={styles.filterText}
            >
              Recent
            </ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.filterButton,
              activeFilter === 'following' && { backgroundColor: theme.primary }
            ]}
            onPress={() => handleFilterPress('following')}
          >
            <MaterialCommunityIcons 
              name="account-group-outline" 
              size={16} 
              color={activeFilter === 'following' ? '#FFFFFF' : theme.primary} 
              style={styles.filterIcon}
            />
            <ThemedText 
              color={activeFilter === 'following' ? 'white' : 'primary'}
              weight={activeFilter === 'following' ? '600' : 'normal'}
              style={styles.filterText}
            >
              Following
            </ThemedText>
          </TouchableOpacity>
        </ScrollView>
      </View>
      
      {!showTrending && (
        <TouchableOpacity 
          style={[styles.showTrendingButton, { borderColor: theme.border }]}
          onPress={() => {
            setShowTrending(true);
            setPosts(DUMMY_POSTS);
            setActiveFilter('all');
          }}
        >
          <MaterialCommunityIcons 
            name="arrow-left" 
            size={16} 
            color={theme.primary} 
            style={styles.showTrendingIcon}
          />
          <ThemedText color="primary" style={styles.showTrendingText}>
            Back to All Posts
          </ThemedText>
        </TouchableOpacity>
      )}
    </>
  );

  const renderFooter = () => {
    if (!loading) return null;
    
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={theme.primary} />
        <ThemedText color="secondary" style={styles.loadingText}>
          Loading more posts...
        </ThemedText>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons 
        name="post-outline" 
        size={64} 
        color={theme.textSecondary} 
      />
      <ThemedText weight="600" style={styles.emptyTitle}>
        No Posts Found
      </ThemedText>
      <ThemedText color="secondary" style={styles.emptyText}>
        {searchQuery ? 
          "No posts match your search criteria" : 
          "Be the first to post something!"
        }
      </ThemedText>
    </View>
  );

  return (
    <ThemedView variant="default" style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <ThemedText weight="bold" style={styles.headerTitle}>
            AnonU
          </ThemedText>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerButton}>
              <MaterialCommunityIcons 
                name="bell-outline" 
                size={24} 
                color={theme.text} 
              />
            </TouchableOpacity>
          </View>
        </View>
        <SearchBar
          placeholder="Search posts, tags, or users"
          onChangeText={handleSearch}
          value={searchQuery}
        />
      </View>
      
      <FlatList
        data={posts}
        renderItem={({ item }) => (
          <PostCard 
            item={item} 
            onPress={handlePostPress}
          />
        )}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.primary]}
            tintColor={theme.primary}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
      />
      
      <Animated.View 
        style={[
          styles.fabContainer,
          { 
            opacity: fabOpacity,
            transform: [
              { translateY: fabTranslateY },
              { scale: fabAnim }
            ]
          }
        ]}
      >
        <Link href="/(tabs)/post" asChild>
          <TouchableOpacity
            style={[styles.fab, { backgroundColor: theme.primary }]}
            activeOpacity={0.8}
            onPress={handleFabPress}
          >
            <MaterialCommunityIcons 
              name="plus"
              size={24} 
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </Link>
      </Animated.View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    paddingBottom: 80,
  },
  trendingSection: {
    padding: 16,
    paddingTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
  },
  seeAllText: {
    fontSize: 14,
  },
  trendingItemContainer: {
    marginBottom: 12,
  },
  trendingItem: {
    borderRadius: 12,
  },
  trendingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  trendIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  trendingTextContainer: {
    flex: 1,
  },
  hashTag: {
    fontSize: 16,
    marginBottom: 4,
  },
  postCount: {
    fontSize: 14,
  },
  filtersContainer: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  filtersScrollContent: {
    paddingRight: 16,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterIcon: {
    marginRight: 6,
  },
  filterText: {
    fontSize: 14,
  },
  showTrendingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginHorizontal: 16,
    marginBottom: 8,
    borderWidth: 1,
  },
  showTrendingIcon: {
    marginRight: 6,
  },
  showTrendingText: {
    fontSize: 14,
  },
  postCardContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  postCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
    fontSize: 16,
    fontWeight: '600',
  },
  headerText: {
    flex: 1,
  },
  username: {
    fontSize: 15,
    marginBottom: 2,
  },
  timestamp: {
    fontSize: 12,
  },
  moreButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    fontSize: 16,
    lineHeight: 22,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  imagesContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  singleImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  multipleImagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  multipleImage: {
    borderRadius: 12,
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
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
    marginRight: 24,
  },
  actionText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
  },
  loadingFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    minHeight: 300,
  },
  emptyTitle: {
    fontSize: 18,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  fabContainer: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  }
});
