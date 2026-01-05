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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function CommunityScreen({ route, navigation }) {
  const { stressType } = route.params || { stressType: 'General' };
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadCurrentUser();
    loadCommunityUsers();
    
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const loadCurrentUser = async () => {
    const userId = await AsyncStorage.getItem('userId');
    setCurrentUserId(userId);
  };

  const loadCommunityUsers = async () => {
    try {
      setLoading(true);
      
      // Hard-coded community users
      const communityUsers = [
        {
          id: 'user_1',
          name: 'Sarah Chen',
          avatar: '🌸',
          stressType: 'Academic',
          lastSeen: 'Online',
          bio: 'Medical student finding balance',
          color: '#ef4444',
        },
        {
          id: 'user_2',
          name: 'Alex Kumar',
          avatar: '🌿',
          stressType: 'Financial',
          lastSeen: '5 min ago',
          bio: 'Learning to manage finances mindfully',
          color: '#f59e0b',
        },
        {
          id: 'user_3',
          name: 'Emma Williams',
          avatar: '🦋',
          stressType: 'Social',
          lastSeen: '15 min ago',
          bio: 'Building meaningful connections',
          color: '#3b82f6',
        },
        {
          id: 'user_4',
          name: 'Michael Torres',
          avatar: '🌊',
          stressType: 'Emotional',
          lastSeen: 'Online',
          bio: 'On a journey of self-discovery',
          color: '#8b5cf6',
        },
        {
          id: 'user_5',
          name: 'Priya Patel',
          avatar: '🌺',
          stressType: 'Academic',
          lastSeen: '1 hour ago',
          bio: 'Graduate student, here to help',
          color: '#ef4444',
        },
        {
          id: 'user_6',
          name: 'David Lee',
          avatar: '🍃',
          stressType: 'Financial',
          lastSeen: '2 hours ago',
          bio: 'Sharing budgeting tips & support',
          color: '#f59e0b',
        },
        {
          id: 'user_7',
          name: 'Sofia Rodriguez',
          avatar: '🌼',
          stressType: 'Social',
          lastSeen: 'Online',
          bio: 'Overcoming social anxiety together',
          color: '#3b82f6',
        },
        {
          id: 'user_8',
          name: 'James Anderson',
          avatar: '🌳',
          stressType: 'Emotional',
          lastSeen: '30 min ago',
          bio: 'Finding peace through mindfulness',
          color: '#8b5cf6',
        },
        {
          id: 'user_9',
          name: 'Lily Zhang',
          avatar: '🌹',
          stressType: 'Academic',
          lastSeen: 'Online',
          bio: 'PhD candidate, stress warrior',
          color: '#ef4444',
        },
        {
          id: 'user_10',
          name: 'Ryan Martinez',
          avatar: '🌻',
          stressType: 'Financial',
          lastSeen: '10 min ago',
          bio: 'Financial freedom seeker',
          color: '#f59e0b',
        },
      ];

      // Filter by stress type if provided
      const filteredUsers = stressType && stressType !== 'General' 
        ? communityUsers.filter(u => u.stressType === stressType)
        : communityUsers;

      setUsers(filteredUsers);
      setLoading(false);
    } catch (error) {
      console.error('Error loading community:', error);
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCommunityUsers();
    setRefreshing(false);
  };

  const handleUserPress = (user) => {
    navigation.navigate('ChatScreen', { 
      user: user,
      currentUserId: currentUserId 
    });
  };

  const getStressIcon = (type) => {
    const icons = {
      'Academic': '📚',
      'Financial': '💰',
      'Social': '👥',
      'Emotional': '💭'
    };
    return icons[type] || '🌟';
  };

  if (loading) {
    return (
      <LinearGradient
        colors={['#E9EAEB', '#D4E4F7', '#FFFFFF', '#E1F5FE']}
        style={styles.centerContainer}
      >
        <ActivityIndicator size="large" color="#5777AD" />
        <Text style={styles.loadingText}>Finding your community...</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#E9EAEB', '#D4E4F7', '#FFFFFF', '#E1F5FE']}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <View style={styles.headerLeft}>
                <Text style={styles.headerTitle}>Support Community</Text>
                <Text style={styles.headerSubtitle}>
                  {stressType && stressType !== 'General' 
                    ? `${getStressIcon(stressType)} ${stressType} Support`
                    : '🌍 All Communities'}
                </Text>
              </View>
              <View style={styles.headerIcon}>
                <Text style={styles.headerIconText}>💬</Text>
              </View>
            </View>
          </View>

          {/* Info Card */}
          <View style={styles.infoCard}>
            <LinearGradient
              colors={['#7CB9E8', '#5777AD']}
              style={styles.infoGradient}
            >
              <Text style={styles.infoEmoji}>🤝</Text>
              <Text style={styles.infoTitle}>Connect & Heal Together</Text>
              <Text style={styles.infoText}>
                Share your journey with others who understand. Every conversation is a step toward wellness.
              </Text>
            </LinearGradient>
          </View>

          {/* Community Members */}
          <Text style={styles.sectionTitle}>
            {users.length} Member{users.length !== 1 ? 's' : ''} Online
          </Text>

          {users.map((user) => (
            <TouchableOpacity
              key={user.id}
              style={styles.userCard}
              onPress={() => handleUserPress(user)}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['#FFFFFF', '#F8FBFF']}
                style={styles.userCardGradient}
              >
                <View style={styles.userCardContent}>
                  {/* Avatar */}
                  <View style={[styles.avatar, { backgroundColor: user.color + '20' }]}>
                    <Text style={styles.avatarEmoji}>{user.avatar}</Text>
                    {user.lastSeen === 'Online' && (
                      <View style={styles.onlineBadge} />
                    )}
                  </View>

                  {/* User Info */}
                  <View style={styles.userInfo}>
                    <View style={styles.userInfoTop}>
                      <Text style={styles.userName}>{user.name}</Text>
                      <View style={[styles.stressTypeBadge, { borderColor: user.color }]}>
                        <Text style={styles.stressTypeBadgeText}>
                          {getStressIcon(user.stressType)}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.userBio}>{user.bio}</Text>
                    <View style={styles.userFooter}>
                      <Text style={[
                        styles.lastSeen,
                        user.lastSeen === 'Online' && styles.lastSeenOnline
                      ]}>
                        {user.lastSeen === 'Online' ? '🟢 ' : ''}
                        {user.lastSeen}
                      </Text>
                    </View>
                  </View>

                  {/* Arrow */}
                  <View style={styles.arrowContainer}>
                    <Text style={styles.arrow}>›</Text>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}

          <View style={styles.bottomPadding} />
        </Animated.View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingTop: 60,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#5777AD',
    fontWeight: '500',
  },
  header: {
    marginBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#5777AD',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#7CB9E8',
    fontStyle: 'italic',
  },
  headerIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#5777AD',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  headerIconText: {
    fontSize: 24,
  },
  infoCard: {
    marginBottom: 24,
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#5777AD',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  infoGradient: {
    padding: 24,
    alignItems: 'center',
  },
  infoEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  infoText: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.95)',
    textAlign: 'center',
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#5777AD',
    marginBottom: 16,
  },
  userCard: {
    marginBottom: 12,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#5777AD',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  userCardGradient: {
    padding: 16,
  },
  userCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    position: 'relative',
  },
  avatarEmoji: {
    fontSize: 28,
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#22c55e',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  userInfo: {
    flex: 1,
  },
  userInfoTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#5777AD',
    flex: 1,
  },
  stressTypeBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  stressTypeBadgeText: {
    fontSize: 16,
  },
  userBio: {
    fontSize: 14,
    color: '#7CB9E8',
    marginBottom: 6,
    lineHeight: 20,
  },
  userFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lastSeen: {
    fontSize: 13,
    color: '#9DB4C0',
    fontWeight: '500',
  },
  lastSeenOnline: {
    color: '#22c55e',
    fontWeight: '600',
  },
  arrowContainer: {
    marginLeft: 8,
  },
  arrow: {
    fontSize: 32,
    color: '#B8D8E8',
    fontWeight: '300',
  },
  bottomPadding: {
    height: 40,
  },
});