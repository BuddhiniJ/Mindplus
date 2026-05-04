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
import { getFirestore, collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';

export default function CommunityScreen({ route, navigation }) {
  const { stressType } = route.params || { stressType: 'General' };
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentStressType, setCurrentStressType] = useState('General');
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const db = getFirestore();
  const auth = getAuth();

  const ensureAuthReady = async (timeout = 3000) => {
    const start = Date.now();
    while (!auth.currentUser && Date.now() - start < timeout) {
      console.log('[CommunityScreen] Waiting for auth to be ready...');
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (!auth.currentUser) {
      throw new Error('Authentication not available after timeout');
    }
  };

  useEffect(() => {
    const initialize = async () => {
      try {
        // Step 1: Ensure auth is ready (handles anonymous sign-in)
        if (!auth.currentUser) {
          console.log('[CommunityScreen] No auth user, attempting anonymous sign-in...');
          await signInAnonymously(auth);
        } else {
          console.log('[CommunityScreen] Already authenticated as:', auth.currentUser.uid);
        }
        
        // Step 2: Wait for auth to be fully ready
        await ensureAuthReady();
        
        // Step 3: Load user and community
        await loadCurrentUser();
        await loadCommunityUsers();
      } catch (error) {
        console.error('[CommunityScreen] Initialization error:', error.message);
        // If auth fails, still try to load with whatever userId is available
        await loadCurrentUser();
        await loadCommunityUsers();
      }
    };
    
    initialize();
    
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const loadCurrentUser = async () => {
    try {
      // Use Firebase auth UID (guaranteed to exist after ensureAuthReady)
      const authUid = auth.currentUser?.uid;
      if (authUid) {
        setCurrentUserId(authUid);
        // Sync to AsyncStorage for consistency
        await AsyncStorage.setItem('userId', authUid);
        console.log('[CommunityScreen] Current user ID:', authUid);
        return;
      }
      
      // Fallback to AsyncStorage (should rarely happen)
      const stored = await AsyncStorage.getItem('userId');
      if (stored) {
        setCurrentUserId(stored);
        console.log('[CommunityScreen] Using AsyncStorage userId:', stored);
        return;
      }
      
      console.warn('[CommunityScreen] No user ID available');
      setCurrentUserId(null);
    } catch (e) {
      console.error('[CommunityScreen] loadCurrentUser error:', e);
      setCurrentUserId(null);
    }
  };

  const loadCommunityUsers = async () => {
    try {
      // Ensure auth is ready before querying
      await ensureAuthReady();
      const authUid = auth.currentUser.uid;
      
      setLoading(true);

      let stressTypeToUse = stressType;

      // If no stressType from params, get from current user's latest analysis
      if (!stressType || stressType === 'General') {
        if (authUid) {
          const userDoc = await getDoc(doc(db, 'users', authUid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            stressTypeToUse = userData.dominantType || 'General';
          }
        }
      }

      setCurrentStressType(stressTypeToUse);

      // Query users with the same dominant stress type, excluding current user
      const q = query(
        collection(db, 'users'),
        where('dominantType', '==', stressTypeToUse)
      );
      const querySnapshot = await getDocs(q);

      const fetchedUsers = [];
      for (const userDoc of querySnapshot.docs) {
        const userId = userDoc.id;
        if (userId === authUid) continue; // Skip current user

        const data = userDoc.data();

        try {
          // Fetch the user's profile to get their real nickname
          const profileRef = doc(db, 'users', userId, 'profile', 'basic');
          const profileSnap = await getDoc(profileRef);
          const profileData = profileSnap.exists() ? profileSnap.data() : {};

          const lastAnalysis = data.lastAnalysis?.toDate?.() || new Date();
          const timeDiff = Date.now() - lastAnalysis.getTime();
          const minutesAgo = Math.floor(timeDiff / (1000 * 60));

          let lastSeen;
          if (minutesAgo < 5) lastSeen = 'Online';
          else if (minutesAgo < 60) lastSeen = `${minutesAgo} min ago`;
          else if (minutesAgo < 1440) lastSeen = `${Math.floor(minutesAgo / 60)} hours ago`;
          else lastSeen = `${Math.floor(minutesAgo / 1440)} days ago`;

          fetchedUsers.push({
            id: userId,
            name: profileData.nickname || `User_${userId.slice(-4)}`,
            avatar: getStressIcon(stressTypeToUse),
            stressType: stressTypeToUse,
            overallScore: data.overallScore || 0,
            lastSeen: lastSeen,
            bio: `Sharing experiences with ${stressTypeToUse.toLowerCase()} stress`,
            color: getStressColor(stressTypeToUse),
            lastAnalysis: lastAnalysis,
          });
        } catch (profileError) {
          console.log('Error fetching profile for user:', userId, profileError);
          // Fallback to basic info if profile fetch fails
          fetchedUsers.push({
            id: userId,
            name: `User_${userId.slice(-4)}`,
            avatar: getStressIcon(stressTypeToUse),
            stressType: stressTypeToUse,
            overallScore: data.overallScore || 0,
            lastSeen: 'Unknown',
            bio: `Sharing experiences with ${stressTypeToUse.toLowerCase()} stress`,
            color: getStressColor(stressTypeToUse),
            lastAnalysis: data.lastAnalysis?.toDate?.() || new Date(),
          });
        }
      }

      setUsers(fetchedUsers);
      setLoading(false);
    } catch (error) {
      console.error('[CommunityScreen] Error loading community users:', error);
      setLoading(false);
      setUsers([]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCommunityUsers();
    setRefreshing(false);
  };

  const handleUserPress = (user) => {
    // Use auth.currentUser.uid as source-of-truth
    const authUid = auth.currentUser?.uid || currentUserId;
    navigation.navigate('ChatScreen', { 
      user: user,
      currentUserId: authUid 
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

  const getStressColor = (type) => {
    const colors = {
      'Academic': '#ef4444',
      'Financial': '#f59e0b',
      'Social': '#3b82f6',
      'Emotional': '#8b5cf6'
    };
    return colors[type] || '#5777AD';
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
                  {currentStressType && currentStressType !== 'General' 
                    ? `${getStressIcon(currentStressType)} ${currentStressType} Support`
                    : '🌍 All Communities'}
                </Text>
              </View>
              {/* <View style={styles.headerIcon}>
                <Text style={styles.headerIconText}>💬</Text>
              </View> */}
            </View>
          </View>

          {/* Info Card */}
          <View style={styles.infoCard}>
            <LinearGradient
              colors={['rgb(79, 96, 255)', 'rgb(68, 136, 253)']}
              style={styles.infoGradient}
            >
              <Text style={styles.infoEmoji}>🤝😌</Text>
              <Text style={styles.infoTitle}>Connect & Heal Together</Text>
              <Text style={styles.infoText}>
                Share your journey with others who understand. Every conversation is a step toward wellness.
              </Text>
            </LinearGradient>
          </View>

          {/* Community Members */}
          <Text style={styles.sectionTitle}>
            {users.length} Member{users.length !== 1 ? 's' : ''} To Talk
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
                      {/* <View style={[styles.stressTypeBadge, { borderColor: user.color }]}>
                        <Text style={styles.stressTypeBadgeText}>
                          {getStressIcon(user.stressType)}
                        </Text>
                      </View> */}
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