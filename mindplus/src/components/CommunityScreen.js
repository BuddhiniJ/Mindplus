import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import {
  findSimilarStressUsers,
  getCommunityThread,
  sendCommunityMessage,
  listenToCommunityMessages,
  saveUserProfile,
} from '../firebase/firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function CommunityScreen({ route }) {
  const { stressType } = route?.params || { stressType: 'Academic' }; // Default to Academic
  
  const [userId, setUserId] = useState(null);
  const [userName, setUserName] = useState('');
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' or 'users'
  const [loading, setLoading] = useState(true);
  
  // Community thread state
  const [thread, setThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  
  // Similar users state
  const [similarUsers, setSimilarUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  
  const scrollViewRef = useRef();
  const unsubscribeRef = useRef(null);

  useEffect(() => {
    initialize();
    
    return () => {
      // Cleanup listener on unmount
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  const initialize = async () => {
    try {
      // Get user info
      const id = await AsyncStorage.getItem('userId');
      let name = await AsyncStorage.getItem('userName');
      
      if (!name) {
        name = `User${Math.floor(Math.random() * 1000)}`;
        await AsyncStorage.setItem('userName', name);
      }
      
      setUserId(id);
      setUserName(name);
      
      // Load community thread
      const threadData = await getCommunityThread(stressType);
      setThread(threadData);
      
      // Listen to messages
      unsubscribeRef.current = listenToCommunityMessages(
        threadData.id,
        (msgs) => {
          setMessages(msgs);
          setTimeout(() => scrollToBottom(), 100);
        }
      );
      
      // Load similar users
      await loadSimilarUsers(id);
      
      setLoading(false);
    } catch (error) {
      console.error('Initialization error:', error);
      setLoading(false);
    }
  };

  const loadSimilarUsers = async (currentUserId) => {
    try {
      setLoadingUsers(true);
      const users = await findSimilarStressUsers(stressType, currentUserId);
      setSimilarUsers(users);
      setLoadingUsers(false);
    } catch (error) {
      console.error('Error loading users:', error);
      setLoadingUsers(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return;
    
    try {
      setSending(true);
      await sendCommunityMessage(thread.id, userId, newMessage.trim());
      setNewMessage('');
      setSending(false);
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
      setSending(false);
      alert('Failed to send message');
    }
  };

  const scrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  const getStressColor = () => {
    const colors = {
      'Academic': '#ef4444',
      'Financial': '#f59e0b',
      'Social': '#3b82f6',
      'Emotional': '#8b5cf6'
    };
    return colors[stressType] || '#6b7280';
  };

  const formatTime = (timestamp) => {
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    // Less than 1 minute
    if (diff < 60000) return 'Just now';
    
    // Less than 1 hour
    if (diff < 3600000) {
      const mins = Math.floor(diff / 60000);
      return `${mins}m ago`;
    }
    
    // Less than 24 hours
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours}h ago`;
    }
    
    // Older
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={getStressColor()} />
        <Text style={styles.loadingText}>Loading community...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: getStressColor() }]}>
        <Text style={styles.headerTitle}>{thread?.title}</Text>
        <Text style={styles.headerSubtitle}>{thread?.description}</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'chat' && styles.activeTab]}
          onPress={() => setActiveTab('chat')}
        >
          <Text style={[styles.tabText, activeTab === 'chat' && styles.activeTabText]}>
            💬 Group Chat
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'users' && styles.activeTab]}
          onPress={() => setActiveTab('users')}
        >
          <Text style={[styles.tabText, activeTab === 'users' && styles.activeTabText]}>
            👥 Similar Users ({similarUsers.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === 'chat' ? (
        <>
          {/* Messages */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            onContentSizeChange={scrollToBottom}
          >
            {messages.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>💬</Text>
                <Text style={styles.emptyText}>No messages yet</Text>
                <Text style={styles.emptySubtext}>Be the first to start the conversation!</Text>
              </View>
            ) : (
              messages.map((msg) => (
                <View
                  key={msg.id}
                  style={[
                    styles.messageCard,
                    msg.userId === userId && styles.myMessage
                  ]}
                >
                  <Text style={styles.messageUser}>
                    {msg.userId === userId ? 'You' : `User ${msg.userId.slice(-4)}`}
                  </Text>
                  <Text style={styles.messageText}>{msg.message}</Text>
                  <Text style={styles.messageTime}>
                    {formatTime(msg.timestamp)}
                  </Text>
                </View>
              ))
            )}
          </ScrollView>

          {/* Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Type your message..."
              placeholderTextColor="#9ca3af"
              value={newMessage}
              onChangeText={setNewMessage}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                { backgroundColor: getStressColor() },
                (!newMessage.trim() || sending) && styles.sendButtonDisabled
              ]}
              onPress={handleSendMessage}
              disabled={!newMessage.trim() || sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.sendButtonText}>➤</Text>
              )}
            </TouchableOpacity>
          </View>
        </>
      ) : (
        // Similar Users List
        <ScrollView style={styles.usersContainer}>
          {loadingUsers ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={getStressColor()} />
            </View>
          ) : similarUsers.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>👥</Text>
              <Text style={styles.emptyText}>No users online</Text>
              <Text style={styles.emptySubtext}>
                Check back later or join the group chat
              </Text>
            </View>
          ) : (
            similarUsers.map((user) => (
              <View key={user.id} style={styles.userCard}>
                <View style={styles.userAvatar}>
                  <Text style={styles.userAvatarText}>
                    {user.id.slice(0, 2).toUpperCase()}
                  </Text>
                </View>
                
                <View style={styles.userInfo}>
                  <Text style={styles.userIdText}>
                    User {user.id.slice(-6)}
                  </Text>
                  <View style={styles.userStats}>
                    <View style={[styles.stressIndicator, { backgroundColor: getStressColor() }]} />
                    <Text style={styles.userStatsText}>
                      Same stress level
                    </Text>
                  </View>
                  <Text style={styles.userLastActive}>
                    Active {formatTime(user.lastActive)}
                  </Text>
                </View>
                
                <TouchableOpacity 
                  style={[styles.connectButton, { borderColor: getStressColor() }]}
                  onPress={() => {
                    // Switch to chat tab
                    setActiveTab('chat');
                    // Could also implement direct messaging here
                  }}
                >
                  <Text style={[styles.connectButtonText, { color: getStressColor() }]}>
                    Connect
                  </Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.9,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: '#3b82f6',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeTabText: {
    color: '#1f2937',
    fontWeight: '600',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  messageCard: {
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    maxWidth: '80%',
    alignSelf: 'flex-start',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  myMessage: {
    backgroundColor: '#eff6ff',
    alignSelf: 'flex-end',
  },
  messageUser: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3b82f6',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 15,
    color: '#1f2937',
    lineHeight: 20,
    marginBottom: 4,
  },
  messageTime: {
    fontSize: 11,
    color: '#9ca3af',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1f2937',
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    fontSize: 20,
    color: '#ffffff',
  },
  usersContainer: {
    flex: 1,
    padding: 16,
  },
  userCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e0e7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userAvatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3b82f6',
  },
  userInfo: {
    flex: 1,
  },
  userIdText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  userStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  stressIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  userStatsText: {
    fontSize: 13,
    color: '#6b7280',
  },
  userLastActive: {
    fontSize: 12,
    color: '#9ca3af',
  },
  connectButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  connectButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});