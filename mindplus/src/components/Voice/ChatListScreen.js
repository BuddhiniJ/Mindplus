import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Animated,
  FlatList,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { getAuth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentUserId, getUserChats, getUserProfile, formatTime } from '../../services/chatService';

export default function ChatListScreen({ navigation }) {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const auth = getAuth();

  useFocusEffect(
    React.useCallback(() => {
      loadChats();
    }, [])
  );

  const loadChats = async () => {
    try {
      setLoading(true);
      const userId = await getCurrentUserId();
      setCurrentUserId(userId);

      if (!userId) {
        Alert.alert('Error', 'Unable to load user information');
        return;
      }

      const activeChats = await getUserChats(userId);
      setChats(activeChats);

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    } catch (error) {
      console.error('[ChatListScreen] Error loading chats:', error);
      Alert.alert('Error', 'Failed to load chats');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadChats();
    setRefreshing(false);
  };

  const handleChatPress = async (chat) => {
    try {
      // Extract the other user ID from the chat ID
      const [user1, user2] = chat.id.split('_');
      const otherUserId = currentUserId === user1 ? user2 : user1;

      // Get other user's profile
      const userProfile = await getUserProfile(otherUserId);
      
      navigation.navigate('Chat', {
        user: {
          id: otherUserId,
          name: userProfile?.nickname || userProfile?.name || `User_${otherUserId.slice(-4)}`,
          stressType: userProfile?.dominantType || 'General',
        },
      });
    } catch (error) {
      console.error('[ChatListScreen] Error opening chat:', error);
      Alert.alert('Error', 'Failed to open chat');
    }
  };

  const renderChatItem = ({ item }) => (
    <TouchableOpacity
      style={styles.chatItem}
      onPress={() => handleChatPress(item)}
      activeOpacity={0.7}
    >
      <LinearGradient
        colors={['#FFFFFF', '#F8FBFF']}
        style={styles.chatItemGradient}
      >
        <View style={styles.chatAvatar}>
          <Text style={styles.chatAvatarEmoji}>💬</Text>
        </View>

        <View style={styles.chatInfo}>
          <Text style={styles.chatTitle} numberOfLines={1}>
            {item.participantIds
              ?.filter((id) => id !== currentUserId)
              .map((id) => `User_${id.slice(-4)}`)
              .join(', ')}
          </Text>
          <Text style={styles.chatLastMessage} numberOfLines={2}>
            {item.lastMessage || 'Start a conversation...'}
          </Text>
        </View>

        <View style={styles.chatTime}>
          <Text style={styles.timeText}>{formatTime(item.lastMessageTime)}</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <LinearGradient
        colors={['#E9EAEB', '#D4E4F7', '#FFFFFF', '#E1F5FE']}
        style={styles.container}
      >
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#5777AD" />
          <Text style={styles.loadingText}>Loading chats...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#E9EAEB', '#D4E4F7', '#FFFFFF', '#E1F5FE']}
      style={styles.container}
    >
      <Animated.View style={[{ opacity: fadeAnim }, { flex: 1 }]}>
        {/* Header */}
        <View style={styles.header}>
          <LinearGradient
            colors={['#FFFFFF', '#F8FBFF']}
            style={styles.headerGradient}
          >
            <Text style={styles.headerTitle}>💬 Messages</Text>
            <Text style={styles.headerSubtitle}>
              {chats.length} {chats.length === 1 ? 'chat' : 'chats'}
            </Text>
          </LinearGradient>
        </View>

        {/* Chats List */}
        {chats.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyTitle}>No chats yet</Text>
            <Text style={styles.emptyText}>
              Start connecting with other users from the community!
            </Text>
          </View>
        ) : (
          <FlatList
            data={chats}
            renderItem={renderChatItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#5777AD"
              />
            }
          />
        )}
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#5777AD',
    fontWeight: '500',
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerGradient: {
    padding: 20,
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#5777AD',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#5777AD',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#7CB9E8',
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  chatItem: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#5777AD',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  chatItemGradient: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  chatAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#E9EAEB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  chatAvatarEmoji: {
    fontSize: 24,
  },
  chatInfo: {
    flex: 1,
    marginRight: 12,
  },
  chatTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#5777AD',
    marginBottom: 4,
  },
  chatLastMessage: {
    fontSize: 13,
    color: '#7CB9E8',
    lineHeight: 18,
  },
  chatTime: {
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  timeText: {
    fontSize: 12,
    color: '#B8D8E8',
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#5777AD',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#7CB9E8',
    textAlign: 'center',
    lineHeight: 20,
  },
});
