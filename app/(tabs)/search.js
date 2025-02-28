import React, { useState, useRef, useEffect } from 'react';
import { 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Animated,
  useColorScheme,
  Platform,
  View,
  Dimensions,
  ScrollView
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import ThemedView from '../components/ThemedView';
import ThemedText from '../components/ThemedText';
import SearchBar from '../components/SearchBar';
import { Colors } from '../../constants/Colors';

const TRENDING_TOPICS = [
  { id: '1', tag: 'finals', postCount: 156, trend: 'up' },
  { id: '2', tag: 'parking', postCount: 89, trend: 'up' },
  { id: '3', tag: 'cafeteria', postCount: 67, trend: 'down' },
  { id: '4', tag: 'events', postCount: 45, trend: 'up' },
  { id: '5', tag: 'study', postCount: 34, trend: 'neutral' },
  { id: '6', tag: 'housing', postCount: 78, trend: 'up' },
  { id: '7', tag: 'professors', postCount: 56, trend: 'neutral' },
  { id: '8', tag: 'clubs', postCount: 42, trend: 'up' },
  { id: '9', tag: 'sports', postCount: 38, trend: 'down' },
  { id: '10', tag: 'library', postCount: 29, trend: 'up' }
];

const POPULAR_TAGS = [
  'campus', 'food', 'library', 'study', 'events', 'sports',
  'clubs', 'housing', 'classes', 'professors', 'exams', 'help',
  'roommates', 'parking', 'textbooks', 'internships', 'jobs'
];

const RECENT_SEARCHES = [
  'finals schedule', 'parking permit', 'cafeteria hours', 
  'library study rooms', 'campus events'
];

const DUMMY_POSTS = [
  {
    id: '1',
    content: 'Just had the worst experience at the campus cafeteria 😤 The food was cold and they charged me extra for a side that was supposed to be included!',
    anonymousId: 'Anonymous123',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    likes: 24,
    comments: 8,
    tags: ['campus', 'food', 'complaint'],
    isLiked: false
  },
  {
    id: '2',
    content: 'Anyone else think the new library hours are ridiculous? They\'re closing at 8pm now which is exactly when I need to study the most! 📚',
    anonymousId: 'Anonymous456',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    likes: 56,
    comments: 12,
    tags: ['library', 'study', 'hours'],
    isLiked: true
  },
  {
    id: '3',
    content: 'PSA: Free pizza in the student union building right now! First come first served 🍕',
    anonymousId: 'Anonymous789',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    likes: 89,
    comments: 15,
    tags: ['freefood', 'pizza', 'studentunion'],
    isLiked: false
  },
  {
    id: '4',
    content: 'Does anyone have notes from Professor Johnson\'s Calculus lecture today? I missed class because of a doctor\'s appointment.',
    anonymousId: 'Anonymous234',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    likes: 12,
    comments: 7,
    tags: ['notes', 'calculus', 'help'],
    isLiked: false
  }
];

const { width } = Dimensions.get('window');

const TrendingItem = ({ item, onPress }) => {
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

const TagChip = ({ tag, onPress, isActive = false }) => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'dark'];
  
  return (
    <TouchableOpacity
      style={[
        styles.tagChip,
        { 
          backgroundColor: isActive ? theme.primary : theme.primary + '20',
          borderColor: isActive ? theme.primary : 'transparent',
        }
      ]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress(tag);
      }}
      activeOpacity={0.7}
    >
      <ThemedText 
        color={isActive ? 'white' : 'primary'} 
        style={styles.tagChipText}
      >
        #{tag}
      </ThemedText>
    </TouchableOpacity>
  );
};

const RecentSearchItem = ({ search, onPress }) => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'dark'];
  
  return (
    <TouchableOpacity
      style={styles.recentSearchItem}
      onPress={() => onPress(search)}
      activeOpacity={0.7}
    >
      <MaterialCommunityIcons 
        name="history" 
        size={18} 
        color={theme.textSecondary} 
        style={styles.recentSearchIcon}
      />
      <ThemedText style={styles.recentSearchText}>
        {search}
      </ThemedText>
      <MaterialCommunityIcons 
        name="arrow-top-left" 
        size={18} 
        color={theme.textSecondary} 
      />
    </TouchableOpacity>
  );
};

const PostCard = ({ item, onPress }) => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'dark'];
  const [scaleAnim] = useState(new Animated.Value(1));
  const [likeScale] = useState(new Animated.Value(1));
  const [commentScale] = useState(new Animated.Value(1));
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
          </View>

          <ThemedText style={styles.content}>
            {item.content}
          </ThemedText>

          <View style={styles.tagsContainer}>
            {item.tags.map(tag => (
              <View
                key={tag}
                style={[styles.tag, { backgroundColor: theme.primary + '15' }]}
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
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function SearchScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'dark'];
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = (text) => {
    setSearchQuery(text);
    setIsSearching(text.length > 0);
    
    if (text.length > 0) {
      // Filter trending topics
      const filteredTopics = TRENDING_TOPICS.filter(topic => 
        topic.tag.toLowerCase().includes(text.toLowerCase())
      );
      
      // Filter posts
      const filteredPosts = DUMMY_POSTS.filter(post => 
        post.content.toLowerCase().includes(text.toLowerCase()) ||
        post.tags.some(tag => tag.toLowerCase().includes(text.toLowerCase())) ||
        post.anonymousId.toLowerCase().includes(text.toLowerCase())
      );
      
      // Filter tags
      const filteredTags = POPULAR_TAGS.filter(tag => 
        tag.toLowerCase().includes(text.toLowerCase())
      );
      
      setSearchResults({
        topics: filteredTopics,
        posts: filteredPosts,
        tags: filteredTags
      });
    } else {
      setSearchResults({
        topics: [],
        posts: [],
        tags: []
      });
      setSelectedTags([]);
      setShowResults(false);
    }
  };

  const handleTagPress = (tag) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Toggle tag selection
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  // Filter posts based on selected tags
  useEffect(() => {
    if (selectedTags.length > 0) {
      const filtered = DUMMY_POSTS.filter(post => 
        selectedTags.some(tag => post.tags.includes(tag))
      );
      setFilteredPosts(filtered);
      setShowResults(true);
    } else if (searchQuery) {
      setFilteredPosts(searchResults.posts || []);
      setShowResults(true);
    } else {
      setFilteredPosts([]);
      setShowResults(false);
    }
  }, [selectedTags, searchQuery, searchResults]);

  const handleRecentSearchPress = (search) => {
    setSearchQuery(search);
    handleSearch(search);
  };

  const handleTopicPress = (topic) => {
    handleTagPress(topic.tag);
  };

  const renderNoResults = () => (
    <View style={styles.noResults}>
      <View style={[styles.noResultsIcon, { backgroundColor: theme.cardBg }]}>
        <MaterialCommunityIcons 
          name="magnify" 
          size={32} 
          color={theme.secondary} 
        />
      </View>
      <ThemedText 
        weight="600"
        style={styles.noResultsText}
      >
        No results found
      </ThemedText>
      <ThemedText 
        color="secondary"
        style={styles.noResultsSubtext}
      >
        Try searching for different keywords or tags
      </ThemedText>
    </View>
  );

  return (
    <ThemedView variant="default" style={styles.container}>
      <SearchBar
        placeholder="Search posts, topics, or tags"
        onChangeText={handleSearch}
        value={searchQuery}
        onSubmit={() => setShowResults(true)}
      />

      {!isSearching && !showResults ? (
        <ScrollView 
          style={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Recent Searches */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText weight="600" style={styles.sectionTitle}>
                Recent Searches
              </ThemedText>
              <TouchableOpacity>
                <ThemedText color="primary" style={styles.seeAllText}>
                  Clear All
                </ThemedText>
              </TouchableOpacity>
            </View>
            
            <View style={styles.recentSearchesContainer}>
              {RECENT_SEARCHES.map((search, index) => (
                <RecentSearchItem 
                  key={index} 
                  search={search} 
                  onPress={handleRecentSearchPress} 
                />
              ))}
            </View>
          </View>
          
          {/* Popular Tags */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText weight="600" style={styles.sectionTitle}>
                Popular Tags
              </ThemedText>
            </View>
            
            <View style={styles.tagsContainer}>
              {POPULAR_TAGS.slice(0, 12).map((tag, index) => (
                <TagChip 
                  key={index} 
                  tag={tag} 
                  onPress={handleTagPress}
                  isActive={selectedTags.includes(tag)}
                />
              ))}
            </View>
          </View>
          
          {/* Trending Topics */}
          <View style={styles.section}>
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
            
            {TRENDING_TOPICS.slice(0, 5).map((topic) => (
              <TrendingItem 
                key={topic.id} 
                item={topic} 
                onPress={handleTopicPress} 
              />
            ))}
          </View>
        </ScrollView>
      ) : isSearching && !showResults ? (
        <ScrollView 
          style={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Search Results Preview */}
          {searchResults.tags && searchResults.tags.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <ThemedText weight="600" style={styles.sectionTitle}>
                  Tags
                </ThemedText>
                {searchResults.tags.length > 3 && (
                  <TouchableOpacity onPress={() => setShowResults(true)}>
                    <ThemedText color="primary" style={styles.seeAllText}>
                      See All
                    </ThemedText>
                  </TouchableOpacity>
                )}
              </View>
              
              <View style={styles.tagsContainer}>
                {searchResults.tags.slice(0, 6).map((tag, index) => (
                  <TagChip 
                    key={index} 
                    tag={tag} 
                    onPress={handleTagPress}
                    isActive={selectedTags.includes(tag)}
                  />
                ))}
              </View>
            </View>
          )}
          
          {searchResults.topics && searchResults.topics.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <ThemedText weight="600" style={styles.sectionTitle}>
                  Topics
                </ThemedText>
                {searchResults.topics.length > 3 && (
                  <TouchableOpacity onPress={() => setShowResults(true)}>
                    <ThemedText color="primary" style={styles.seeAllText}>
                      See All
                    </ThemedText>
                  </TouchableOpacity>
                )}
              </View>
              
              {searchResults.topics.slice(0, 3).map((topic) => (
                <TrendingItem 
                  key={topic.id} 
                  item={topic} 
                  onPress={handleTopicPress} 
                />
              ))}
            </View>
          )}
          
          {searchResults.posts && searchResults.posts.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <ThemedText weight="600" style={styles.sectionTitle}>
                  Posts
                </ThemedText>
                {searchResults.posts.length > 2 && (
                  <TouchableOpacity onPress={() => setShowResults(true)}>
                    <ThemedText color="primary" style={styles.seeAllText}>
                      See All ({searchResults.posts.length})
                    </ThemedText>
                  </TouchableOpacity>
                )}
              </View>
              
              {searchResults.posts.slice(0, 2).map((post) => (
                <PostCard 
                  key={post.id} 
                  item={post} 
                  onPress={() => {}} 
                />
              ))}
            </View>
          )}
          
          {(!searchResults.tags || searchResults.tags.length === 0) && 
           (!searchResults.topics || searchResults.topics.length === 0) && 
           (!searchResults.posts || searchResults.posts.length === 0) && (
            renderNoResults()
          )}
        </ScrollView>
      ) : (
        <FlatList
          data={filteredPosts}
          renderItem={({ item }) => (
            <PostCard 
              item={item} 
              onPress={() => {}} 
            />
          )}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.resultsContainer}
          ListHeaderComponent={
            <>
              <View style={styles.resultsHeader}>
                <ThemedText weight="600" style={styles.resultsTitle}>
                  {filteredPosts.length} {filteredPosts.length === 1 ? 'Result' : 'Results'}
                </ThemedText>
                {selectedTags.length > 0 && (
                  <TouchableOpacity 
                    style={styles.clearFiltersButton}
                    onPress={() => setSelectedTags([])}
                  >
                    <ThemedText color="primary">
                      Clear Filters
                    </ThemedText>
                  </TouchableOpacity>
                )}
              </View>
              
              {selectedTags.length > 0 && (
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={styles.selectedTagsContainer}
                  contentContainerStyle={styles.selectedTagsContent}
                >
                  {selectedTags.map((tag, index) => (
                    <TagChip 
                      key={index} 
                      tag={tag} 
                      onPress={handleTagPress}
                      isActive={true}
                    />
                  ))}
                </ScrollView>
              )}
            </>
          }
          ListEmptyComponent={renderNoResults()}
        />
      )}
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
  section: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
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
  recentSearchesContainer: {
    marginBottom: 8,
  },
  recentSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  recentSearchIcon: {
    marginRight: 12,
  },
  recentSearchText: {
    flex: 1,
    fontSize: 16,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  tagChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  tagChipText: {
    fontSize: 14,
    fontWeight: '600',
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
  resultsContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultsTitle: {
    fontSize: 18,
  },
  clearFiltersButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  selectedTagsContainer: {
    marginBottom: 16,
  },
  selectedTagsContent: {
    paddingRight: 16,
  },
  noResults: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    flex: 1,
    minHeight: 300,
  },
  noResultsIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  noResultsText: {
    fontSize: 18,
    marginBottom: 8,
  },
  noResultsSubtext: {
    textAlign: 'center',
    fontSize: 14,
    opacity: 0.7,
  },
  postCardContainer: {
    marginBottom: 16,
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
  content: {
    fontSize: 16,
    lineHeight: 22,
    paddingHorizontal: 16,
    paddingBottom: 12,
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
  }
});
