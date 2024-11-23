import React, { useState } from 'react';
import {
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Animated,
  useColorScheme,
  Platform,
  View
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ThemedView from '../components/ThemedView';
import ThemedText from '../components/ThemedText';
import SearchBar from '../components/SearchBar';
import { Colors } from '../../constants/Colors';

const DUMMY_CONVERSATIONS = [
  {
    id: '1',
    anonymousId: 'Anonymous789',
    lastMessage: 'Hey, about that study group...',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    unread: 2,
  },
  {
    id: '2',
    anonymousId: 'Anonymous456',
    lastMessage: 'Thanks for the help!',
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    unread: 0,
  },
  {
    id: '3',
    anonymousId: 'Anonymous123',
    lastMessage: 'When is the next meeting?',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    unread: 1,
  },
];

const ConversationItem = ({ item, onPress }) => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'dark'];
  const [scaleAnim] = useState(new Animated.Value(1));

  const onPressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 1000 * 60) return 'Just now';
    if (diff < 1000 * 60 * 60) return `${Math.floor(diff / (1000 * 60))}m`;
    if (diff < 1000 * 60 * 60 * 24) return `${Math.floor(diff / (1000 * 60 * 60))}h`;
    return date.toLocaleDateString();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={1}
      >
        <View style={[
          styles.conversationItem,
          { borderBottomColor: theme.border }
        ]}>
          <View style={styles.avatarContainer}>
            <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
              <ThemedText style={styles.avatarText}>
                {item.anonymousId.charAt(9)}
              </ThemedText>
            </View>
            {item.unread > 0 && (
              <View style={[styles.unreadBadge, { backgroundColor: theme.primary }]}>
                <ThemedText style={styles.unreadText}>
                  {item.unread}
                </ThemedText>
              </View>
            )}
          </View>
          
          <View style={styles.conversationContent}>
            <View style={styles.conversationHeader}>
              <ThemedText weight="600" style={styles.username}>
                {item.anonymousId}
              </ThemedText>
              <ThemedText color="secondary" style={styles.timestamp}>
                {formatTimestamp(item.timestamp)}
              </ThemedText>
            </View>
            <ThemedText
              color="secondary"
              numberOfLines={1}
              style={styles.lastMessage}
            >
              {item.lastMessage}
            </ThemedText>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function MessagesScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'dark'];
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SearchBar
        placeholder="Search messages"
        onChangeText={setSearchQuery}
      />
      <FlatList
        data={DUMMY_CONVERSATIONS}
        renderItem={({ item }) => (
          <ConversationItem item={item} onPress={() => {}} />
        )}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
      />
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.primary }]}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons 
          name="message-plus" 
          size={24} 
          color="#FFFFFF"
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    flexGrow: 1,
  },
  conversationItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  unreadBadge: {
    position: 'absolute',
    right: -4,
    top: -4,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  conversationContent: {
    flex: 1,
    marginLeft: 12,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  username: {
    fontSize: 15,
  },
  timestamp: {
    fontSize: 13,
  },
  lastMessage: {
    fontSize: 14,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
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
  },
});
