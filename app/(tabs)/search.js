import React, { useState } from 'react';
import { 
  StyleSheet, 
  TextInput, 
  FlatList, 
  TouchableOpacity, 
  Animated,
  useColorScheme,
  Platform,
  View
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ThemedText from '../components/ThemedText';
import SearchBar from '../components/SearchBar';
import { Colors } from '../../constants/Colors';

const TRENDING_TOPICS = [
  { id: '1', tag: 'finals', postCount: 156, trend: 'up' },
  { id: '2', tag: 'parking', postCount: 89, trend: 'up' },
  { id: '3', tag: 'cafeteria', postCount: 67, trend: 'down' },
  { id: '4', tag: 'events', postCount: 45, trend: 'up' },
  { id: '5', tag: 'study', postCount: 34, trend: 'neutral' }
];

const TrendingItem = ({ item, onPress }) => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'dark'];
  const [scaleAnim] = useState(new Animated.Value(1));

  const onPressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const getTrendIcon = () => {
    switch (item.trend) {
      case 'up':
        return { name: 'trending-up', color: theme.success };
      case 'down':
        return { name: 'trending-down', color: theme.error };
      default:
        return { name: 'trending-neutral', color: theme.secondary };
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
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={0.9}
      >
        <View style={[
          styles.trendingItem,
          { backgroundColor: theme.cardBg }
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

export default function SearchScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'dark'];
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const handleSearch = (text) => {
    setSearchQuery(text);
    const filteredTopics = TRENDING_TOPICS.filter(topic => 
      topic.tag.toLowerCase().includes(text.toLowerCase())
    );
    setSearchResults(text ? filteredTopics : []);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SearchBar
        placeholder="Search posts, topics, or tags"
        onChangeText={handleSearch}
      />

      {searchQuery ? (
        <FlatList
          data={searchResults}
          renderItem={({ item }) => (
            <TrendingItem item={item} onPress={() => {}} />
          )}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
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
                color="secondary"
                style={styles.noResultsText}
              >
                No results found
              </ThemedText>
              <ThemedText 
                color="secondary"
                style={styles.noResultsSubtext}
              >
                Try searching for different keywords
              </ThemedText>
            </View>
          }
        />
      ) : (
        <FlatList
          data={TRENDING_TOPICS}
          renderItem={({ item }) => (
            <TrendingItem item={item} onPress={() => {}} />
          )}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          ListHeaderComponent={
            <ThemedText 
              weight="600"
              style={styles.sectionTitle}
            >
              Trending Topics
            </ThemedText>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
    paddingTop: 8,
  },
  sectionTitle: {
    marginBottom: 16,
    fontSize: 24,
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
  noResults: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
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
});
