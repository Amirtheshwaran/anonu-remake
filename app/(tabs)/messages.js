import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Animated,
  useColorScheme,
  Platform,
  View,
  Alert,
  TextInput,
  Modal,
  Keyboard,
  Dimensions
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import ThemedView from '../components/ThemedView';
import ThemedText from '../components/ThemedText';
import SearchBar from '../components/SearchBar';
import { Colors } from '../../constants/Colors';

// Enhanced dummy data with more conversations and realistic content
const DUMMY_CONVERSATIONS = [
  {
    id: '1',
    anonymousId: 'Anonymous789',
    lastMessage: 'Hey, about that study group for the calculus final... are we meeting in the library tomorrow?',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    unread: 2,
    avatar: 'A7',
    isBlocked: false,
    messages: [
      {
        id: 'm1',
        text: 'Hey, I saw your post about forming a study group for calculus',
        timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
        isFromMe: false,
      },
      {
        id: 'm2',
        text: 'Yes! Are you interested in joining?',
        timestamp: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
        isFromMe: true,
      },
      {
        id: 'm3',
        text: 'Definitely! When and where are you planning to meet?',
        timestamp: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
        isFromMe: false,
      },
      {
        id: 'm4',
        text: 'We\'re thinking the library, 2nd floor study rooms, tomorrow at 4pm',
        timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        isFromMe: true,
      },
      {
        id: 'm5',
        text: 'Perfect! I\'ll be there. Should I bring anything specific?',
        timestamp: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
        isFromMe: false,
      },
      {
        id: 'm6',
        text: 'Just your notes and textbook. We\'ll focus on chapters 7-9',
        timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
        isFromMe: true,
      },
      {
        id: 'm7',
        text: 'Hey, about that study group for the calculus final... are we meeting in the library tomorrow?',
        timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        isFromMe: false,
      },
    ]
  },
  {
    id: '2',
    anonymousId: 'Anonymous456',
    lastMessage: 'Thanks for the help with that programming assignment! I finally got it working.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    unread: 0,
    avatar: 'A4',
    isBlocked: false,
    messages: [
      {
        id: 'm1',
        text: 'Hey, I saw you\'re good with Java. Could you help me with an assignment?',
        timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        isFromMe: false,
      },
      {
        id: 'm2',
        text: 'Sure, what are you stuck on?',
        timestamp: new Date(Date.now() - 1000 * 60 * 115).toISOString(),
        isFromMe: true,
      },
      {
        id: 'm3',
        text: 'I can\'t figure out how to implement this binary search tree',
        timestamp: new Date(Date.now() - 1000 * 60 * 110).toISOString(),
        isFromMe: false,
      },
      {
        id: 'm4',
        text: 'The insert method keeps giving me a null pointer exception',
        timestamp: new Date(Date.now() - 1000 * 60 * 105).toISOString(),
        isFromMe: false,
      },
      {
        id: 'm5',
        text: 'That usually happens when you\'re trying to access a node that doesn\'t exist. Check your null checks before traversing.',
        timestamp: new Date(Date.now() - 1000 * 60 * 100).toISOString(),
        isFromMe: true,
      },
      {
        id: 'm6',
        text: 'Thanks for the help with that programming assignment! I finally got it working.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
        isFromMe: false,
      },
    ]
  },
  {
    id: '3',
    anonymousId: 'Anonymous123',
    lastMessage: 'When is the next meeting for the environmental club? I want to join.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    unread: 1,
    avatar: 'A1',
    isBlocked: false,
    messages: [
      {
        id: 'm1',
        text: 'Hi there! I saw your post about the environmental club',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
        isFromMe: false,
      },
      {
        id: 'm2',
        text: 'Yes, are you interested in joining?',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2.9).toISOString(),
        isFromMe: true,
      },
      {
        id: 'm3',
        text: 'Definitely! I\'ve been looking for ways to get involved with sustainability on campus',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2.8).toISOString(),
        isFromMe: false,
      },
      {
        id: 'm4',
        text: 'That\'s great! We\'re always looking for new members',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2.7).toISOString(),
        isFromMe: true,
      },
      {
        id: 'm5',
        text: 'When is the next meeting for the environmental club? I want to join.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        isFromMe: false,
      },
    ]
  },
  {
    id: '4',
    anonymousId: 'Anonymous872',
    lastMessage: 'Do you know if Professor Johnson postponed the midterm?',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    unread: 0,
    avatar: 'A8',
    isBlocked: false,
    messages: [
      {
        id: 'm1',
        text: 'Hey, were you in Professor Johnson\'s class today?',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
        isFromMe: false,
      },
      {
        id: 'm2',
        text: 'Yes, I was there. Why?',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5.9).toISOString(),
        isFromMe: true,
      },
      {
        id: 'm3',
        text: 'Do you know if Professor Johnson postponed the midterm?',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
        isFromMe: false,
      },
    ]
  },
  {
    id: '5',
    anonymousId: 'Anonymous305',
    lastMessage: 'I found your lost student ID card in the cafeteria. Where can I return it?',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    unread: 0,
    avatar: 'A3',
    isBlocked: false,
    messages: [
      {
        id: 'm1',
        text: 'Hi there! I think I found your student ID card',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 13).toISOString(),
        isFromMe: false,
      },
      {
        id: 'm2',
        text: 'Oh really? Where did you find it?',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12.5).toISOString(),
        isFromMe: true,
      },
      {
        id: 'm3',
        text: 'I found your lost student ID card in the cafeteria. Where can I return it?',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
        isFromMe: false,
      },
    ]
  }
];

const { width, height } = Dimensions.get('window');

const ConversationItem = ({ item, onPress }) => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'dark'];
  const [scaleAnim] = useState(new Animated.Value(1));

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

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 1000 * 60) return 'Just now';
    if (diff < 1000 * 60 * 60) return `${Math.floor(diff / (1000 * 60))}m`;
    if (diff < 1000 * 60 * 60 * 24) return `${Math.floor(diff / (1000 * 60 * 60))}h`;
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
        styles.conversationItemContainer,
        { transform: [{ scale: scaleAnim }] }
      ]}
    >
      <TouchableOpacity
        onPress={() => onPress(item)}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={0.7}
        style={[
          styles.conversationItem,
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
        ]}
      >
        <View style={styles.avatarContainer}>
          <LinearGradient
            colors={[avatarColor, theme.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatar}
          >
            <ThemedText style={styles.avatarText}>
              {item.avatar || item.anonymousId.charAt(9)}
            </ThemedText>
          </LinearGradient>
          {item.unread > 0 && (
            <View style={[styles.unreadBadge, { backgroundColor: theme.accent }]}>
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
            {item.isBlocked ? 'Message blocked' : item.lastMessage}
          </ThemedText>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const MessageBubble = ({ message, theme }) => {
  const isFromMe = message.isFromMe;
  
  return (
    <View style={[
      styles.messageBubbleContainer,
      isFromMe ? styles.myMessageContainer : styles.theirMessageContainer
    ]}>
      {isFromMe ? (
        <View style={[
          styles.messageBubble, 
          styles.myMessage,
          { backgroundColor: theme.primary }
        ]}>
          <ThemedText style={[styles.messageText, { color: '#FFFFFF' }]}>
            {message.text}
          </ThemedText>
          <ThemedText style={styles.messageTime}>
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </ThemedText>
        </View>
      ) : (
        <View style={[
          styles.messageBubble, 
          styles.theirMessage,
          { backgroundColor: theme.cardBg }
        ]}>
          <ThemedText style={styles.messageText}>
            {message.text}
          </ThemedText>
          <ThemedText color="secondary" style={styles.messageTime}>
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </ThemedText>
        </View>
      )}
    </View>
  );
};

const NewMessageModal = ({ visible, onClose, onSend, theme }) => {
  const [recipient, setRecipient] = useState('');
  const [message, setMessage] = useState('');
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    setIsValid(recipient.trim().length > 0 && message.trim().length > 0);
  }, [recipient, message]);

  const handleSend = () => {
    if (isValid) {
      onSend(recipient, message);
      setRecipient('');
      setMessage('');
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
        <View style={[styles.modalContent, { backgroundColor: theme.cardBg }]}>
          <View style={styles.modalHeader}>
            <ThemedText weight="bold" style={styles.modalTitle}>
              New Anonymous Message
            </ThemedText>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialCommunityIcons 
                name="close" 
                size={24} 
                color={theme.textSecondary} 
              />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalBody}>
            <ThemedText weight="semibold" style={styles.inputLabel}>
              Recipient ID
            </ThemedText>
            <TextInput
              style={[
                styles.modalInput,
                { 
                  backgroundColor: theme.surfaceHover,
                  color: theme.text,
                  borderColor: theme.border
                }
              ]}
              placeholder="Enter recipient's anonymous ID"
              placeholderTextColor={theme.textSecondary}
              value={recipient}
              onChangeText={setRecipient}
            />
            
            <ThemedText weight="semibold" style={styles.inputLabel}>
              Message
            </ThemedText>
            <TextInput
              style={[
                styles.modalInput,
                styles.messageInput,
                { 
                  backgroundColor: theme.surfaceHover,
                  color: theme.text,
                  borderColor: theme.border
                }
              ]}
              placeholder="Type your message here"
              placeholderTextColor={theme.textSecondary}
              value={message}
              onChangeText={setMessage}
              multiline
              textAlignVertical="top"
            />
          </View>
          
          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={[
                styles.sendButton,
                { 
                  backgroundColor: isValid ? theme.primary : theme.surfaceActive,
                  opacity: isValid ? 1 : 0.7
                }
              ]}
              onPress={handleSend}
              disabled={!isValid}
            >
              <MaterialCommunityIcons 
                name="send" 
                size={20} 
                color="#FFFFFF" 
              />
              <ThemedText 
                weight="bold" 
                style={styles.sendButtonText}
              >
                Send Anonymously
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const ChatModal = ({ visible, conversation, onClose, onSend, theme }) => {
  const [message, setMessage] = useState('');
  const flatListRef = useRef(null);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
        scrollToBottom();
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

  useEffect(() => {
    if (visible && flatListRef.current) {
      setTimeout(() => scrollToBottom(), 200);
    }
  }, [visible, conversation]);

  const scrollToBottom = () => {
    if (flatListRef.current && conversation?.messages?.length > 0) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  };

  const handleSend = () => {
    if (message.trim().length > 0) {
      onSend(conversation.id, message);
      setMessage('');
      setTimeout(() => scrollToBottom(), 100);
    }
  };

  if (!conversation) return null;

  // Generate a consistent color for the anonymous user
  const getAvatarColor = (id) => {
    const colors = [theme.primary, theme.accent, theme.info, theme.success, theme.warning];
    const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const avatarColor = getAvatarColor(conversation.anonymousId);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={[styles.chatModalContainer, { backgroundColor: theme.background }]}>
        <View style={[styles.chatHeader, { backgroundColor: theme.cardBg }]}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <MaterialCommunityIcons 
              name="arrow-left" 
              size={24} 
              color={theme.text} 
            />
          </TouchableOpacity>
          
          <LinearGradient
            colors={[avatarColor, theme.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.chatAvatar}
          >
            <ThemedText style={styles.chatAvatarText}>
              {conversation.avatar || conversation.anonymousId.charAt(9)}
            </ThemedText>
          </LinearGradient>
          
          <View style={styles.chatHeaderInfo}>
            <ThemedText weight="bold" style={styles.chatUsername}>
              {conversation.anonymousId}
            </ThemedText>
            <ThemedText color="secondary" style={styles.chatStatus}>
              Anonymous Conversation
            </ThemedText>
          </View>
          
          <TouchableOpacity style={styles.moreButton}>
            <MaterialCommunityIcons 
              name="dots-vertical" 
              size={24} 
              color={theme.text} 
            />
          </TouchableOpacity>
        </View>
        
        <FlatList
          ref={flatListRef}
          data={conversation.messages}
          renderItem={({ item }) => <MessageBubble message={item} theme={theme} />}
          keyExtractor={item => item.id}
          contentContainerStyle={[
            styles.chatMessages,
            { paddingBottom: isKeyboardVisible ? 80 : 20 }
          ]}
          showsVerticalScrollIndicator={false}
        />
        
        <View style={[styles.chatInputContainer, { backgroundColor: theme.cardBg }]}>
          <TextInput
            style={[
              styles.chatInput,
              { 
                backgroundColor: theme.surfaceHover,
                color: theme.text,
                borderColor: theme.border
              }
            ]}
            placeholder="Type a message..."
            placeholderTextColor={theme.textSecondary}
            value={message}
            onChangeText={setMessage}
            multiline
          />
          
          <TouchableOpacity 
            style={[
              styles.chatSendButton,
              { 
                backgroundColor: message.trim().length > 0 ? theme.primary : theme.surfaceActive,
                opacity: message.trim().length > 0 ? 1 : 0.7
              }
            ]}
            onPress={handleSend}
            disabled={message.trim().length === 0}
          >
            <MaterialCommunityIcons 
              name="send" 
              size={20} 
              color="#FFFFFF" 
            />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default function MessagesScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'dark'];
  const [searchQuery, setSearchQuery] = useState('');
  const [conversations, setConversations] = useState(DUMMY_CONVERSATIONS);
  const [filteredConversations, setFilteredConversations] = useState(DUMMY_CONVERSATIONS);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);

  useEffect(() => {
    if (searchQuery) {
      const filtered = conversations.filter(conv => 
        conv.anonymousId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredConversations(filtered);
    } else {
      setFilteredConversations(conversations);
    }
  }, [searchQuery, conversations]);

  const handleSearch = (text) => {
    setSearchQuery(text);
  };

  const handleOpenChat = (conversation) => {
    setSelectedConversation(conversation);
    setShowChatModal(true);
    
    // Mark as read
    if (conversation.unread > 0) {
      const updatedConversations = conversations.map(conv => {
        if (conv.id === conversation.id) {
          return { ...conv, unread: 0 };
        }
        return conv;
      });
      setConversations(updatedConversations);
    }
  };

  const handleSendMessage = (conversationId, text) => {
    // Add message to conversation
    const now = new Date();
    const newMessage = {
      id: `m${now.getTime()}`,
      text,
      timestamp: now.toISOString(),
      isFromMe: true,
    };

    const updatedConversations = conversations.map(conv => {
      if (conv.id === conversationId) {
        return {
          ...conv,
          messages: [...conv.messages, newMessage],
          lastMessage: text,
          timestamp: now.toISOString(),
        };
      }
      return conv;
    });

    setConversations(updatedConversations);
    
    // Simulate response after delay
    if (Math.random() > 0.3) { // 70% chance of getting a response
      setTimeout(() => {
        const responseTime = new Date();
        const responseMessage = {
          id: `m${responseTime.getTime()}`,
          text: getRandomResponse(),
          timestamp: responseTime.toISOString(),
          isFromMe: false,
        };
        
        const updatedWithResponse = updatedConversations.map(conv => {
          if (conv.id === conversationId) {
            return {
              ...conv,
              messages: [...conv.messages, newMessage, responseMessage],
              lastMessage: responseMessage.text,
              timestamp: responseTime.toISOString(),
              unread: conv.id === selectedConversation?.id ? 0 : 1,
            };
          }
          return conv;
        });
        
        setConversations(updatedWithResponse);
        
        // Provide haptic feedback for new message
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }, 1500 + Math.random() * 3000); // Random delay between 1.5-4.5 seconds
    }
  };

  const handleNewMessage = (recipient, text) => {
    // Create a new conversation
    const now = new Date();
    const newConversation = {
      id: `conv${now.getTime()}`,
      anonymousId: recipient,
      lastMessage: text,
      timestamp: now.toISOString(),
      unread: 0,
      avatar: recipient.charAt(0) + Math.floor(Math.random() * 9),
      isBlocked: false,
      messages: [
        {
          id: `m${now.getTime()}`,
          text,
          timestamp: now.toISOString(),
          isFromMe: true,
        }
      ]
    };
    
    setConversations([newConversation, ...conversations]);
    
    // Show success message
    Alert.alert(
      'Message Sent',
      'Your anonymous message has been sent successfully.',
      [{ text: 'OK' }]
    );
    
    // Simulate response after delay
    if (Math.random() > 0.5) { // 50% chance of getting a response
      setTimeout(() => {
        const responseTime = new Date();
        const responseMessage = {
          id: `m${responseTime.getTime()}`,
          text: getRandomResponse(),
          timestamp: responseTime.toISOString(),
          isFromMe: false,
        };
        
        const updatedConversations = [
          {
            ...newConversation,
            messages: [...newConversation.messages, responseMessage],
            lastMessage: responseMessage.text,
            timestamp: responseTime.toISOString(),
            unread: 1,
          },
          ...conversations
        ];
        
        setConversations(updatedConversations);
        
        // Provide haptic feedback for new message
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }, 3000 + Math.random() * 5000); // Random delay between 3-8 seconds
    }
  };

  const getRandomResponse = () => {
    const responses = [
      "Thanks for the message!",
      "I'll get back to you soon.",
      "Got it, thanks!",
      "That's helpful, appreciate it.",
      "I'll check and let you know.",
      "Perfect, that works for me.",
      "Can you provide more details?",
      "I'm not sure I understand. Can you clarify?",
      "That's interesting. Tell me more.",
      "I'll be there!",
      "Sorry, I can't make it.",
      "Let me think about it and get back to you.",
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  return (
    <ThemedView variant="default" style={styles.container}>
      <SearchBar
        placeholder="Search messages"
        onChangeText={handleSearch}
        value={searchQuery}
      />
      
      {filteredConversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons 
            name="message-text-outline" 
            size={64} 
            color={theme.textSecondary} 
          />
          <ThemedText 
            weight="semibold" 
            style={styles.emptyTitle}
          >
            No messages found
          </ThemedText>
          <ThemedText 
            color="secondary" 
            style={styles.emptyText}
          >
            {searchQuery ? 
              "No messages match your search" : 
              "Start a conversation by tapping the + button"
            }
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={filteredConversations}
          renderItem={({ item }) => (
            <ConversationItem 
              item={item} 
              onPress={handleOpenChat}
            />
          )}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
      
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.primary }]}
        activeOpacity={0.8}
        onPress={() => setShowNewMessageModal(true)}
      >
        <MaterialCommunityIcons 
          name="message-plus"
          size={24} 
          color="#FFFFFF"
        />
      </TouchableOpacity>

      <ChatModal
        visible={showChatModal}
        conversation={selectedConversation}
        onClose={() => setShowChatModal(false)}
        onSend={handleSendMessage}
        theme={theme}
      />
      <NewMessageModal
        visible={showNewMessageModal}
        onClose={() => setShowNewMessageModal(false)}
        onSend={handleNewMessage}
        theme={theme}
      />
</ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    flexGrow: 1,
    paddingBottom: 80,
  },
  conversationItemContainer: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    overflow: 'hidden',
  },
  conversationItem: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    maxWidth: 500,
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalTitle: {
    fontSize: 18,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBody: {
    padding: 16,
  },
  inputLabel: {
    marginBottom: 8,
    fontSize: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  messageInput: {
    height: 120,
  },
  modalFooter: {
    padding: 16,
    alignItems: 'flex-end',
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
  },
  sendButtonText: {
    color: '#FFFFFF',
    marginLeft: 8,
    fontSize: 16,
  },
  chatModalContainer: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  chatAvatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  chatHeaderInfo: {
    flex: 1,
  },
  chatUsername: {
    fontSize: 16,
  },
  chatStatus: {
    fontSize: 12,
  },
  moreButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatMessages: {
    padding: 16,
  },
  messageBubbleContainer: {
    marginVertical: 4,
    maxWidth: '80%',
  },
  myMessageContainer: {
    alignSelf: 'flex-end',
  },
  theirMessageContainer: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    borderRadius: 16,
    padding: 12,
    minWidth: 80,
  },
  myMessage: {
    borderBottomRightRadius: 4,
  },
  theirMessage: {
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  messageTime: {
    fontSize: 11,
    alignSelf: 'flex-end',
    marginTop: 4,
    opacity: 0.7,
  },
  chatInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  chatInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 120,
    marginRight: 8,
  },
  chatSendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
