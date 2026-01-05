import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Animated,
} from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import { getLocalHistory, deleteLocalAnalysis, getHistoryStats } from '../../services/historyStorageService';
import { deleteAudioFile } from '../../services/localStorageService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

export default function HistoryScreen({ navigation }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [playingAudio, setPlayingAudio] = useState(null);
  const [sound, setSound] = useState(null);
  const [stats, setStats] = useState(null);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadHistory();
    
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
    
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadHistory();
    });
    return unsubscribe;
  }, [navigation]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const userId = await AsyncStorage.getItem('userId');
      
      if (!userId) {
        console.log('No userId found');
        setLoading(false);
        return;
      }

      console.log('📖 Loading history for user:', userId);
      
      const data = await getLocalHistory(userId);
      console.log('✅ History loaded:', data.length, 'records');
      setHistory(data);
      
      const statistics = await getHistoryStats(userId);
      setStats(statistics);
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading history:', error);
      setHistory([]);
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  const playAudio = async (localPath, id) => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(localPath);
      
      if (!fileInfo.exists) {
        Alert.alert('Audio Not Found', 'Audio file no longer exists on device');
        return;
      }

      if (sound) {
        await sound.unloadAsync();
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: localPath },
        { shouldPlay: true }
      );

      setSound(newSound);
      setPlayingAudio(id);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setPlayingAudio(null);
        }
      });

    } catch (error) {
      console.error('Error playing audio:', error);
      Alert.alert('Playback Error', 'Failed to play audio. File may have been deleted.');
    }
  };

  const stopAudio = async () => {
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
      setSound(null);
      setPlayingAudio(null);
    }
  };

  const handleDeleteRecording = async (item) => {
    Alert.alert(
      'Delete Recording',
      'Are you sure you want to delete this recording and its analysis?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const userId = await AsyncStorage.getItem('userId');
              
              if (playingAudio === item.id) {
                await stopAudio();
              }
              
              if (item.localAudioPath) {
                await deleteAudioFile(item.localAudioPath);
              }
              
              await deleteLocalAnalysis(userId, item.id);
              await loadHistory();
              
              Alert.alert('Success', 'Recording deleted successfully');
            } catch (error) {
              console.error('Error deleting recording:', error);
              Alert.alert('Error', 'Failed to delete recording');
            }
          }
        }
      ]
    );
  };

  const handleViewAnalysis = (item) => {
    navigation.navigate('StressMindMap', {
      analysis: {
        stress_scores: item.stress_scores,
        stress_levels: item.stress_levels,
        dominant_type: item.stressType,
        total_stress_score: item.total_stress_score,
        overall_level: item.overall_level,
        confidence: item.confidence,
        text: item.text,
        timestamp: item.timestamp,
      }
    });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStressColor = (type) => {
    const colors = {
      'Academic': '#ef4444',
      'Financial': '#f59e0b',
      'Social': '#3b82f6',
      'Emotional': '#8b5cf6'
    };
    return colors[type] || '#6b7280';
  };

  const getStressIcon = (type) => {
    const icons = {
      'Academic': '📚',
      'Financial': '💰',
      'Social': '👥',
      'Emotional': '💭'
    };
    return icons[type] || '📊';
  };

  if (loading) {
    return (
      <LinearGradient
        colors={['#E9EAEB', '#D4E4F7', '#FFFFFF', '#E1F5FE']}
        style={styles.centerContainer}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5777AD" />
          <Text style={styles.loadingText}>Loading your journey...</Text>
        </View>
      </LinearGradient>
    );
  }

  if (history.length === 0) {
    return (
      <LinearGradient
        colors={['#E9EAEB', '#D4E4F7', '#FFFFFF', '#E1F5FE']}
        style={styles.centerContainer}
      >
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🌸</Text>
          <Text style={styles.emptyTitle}>Your Journey Begins Here</Text>
          <Text style={styles.emptyText}>
            Start recording to track your wellness path
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => navigation.goBack()}
          >
            <LinearGradient
              colors={['#7CB9E8', '#5777AD']}
              style={styles.emptyButtonGradient}
            >
              <Text style={styles.emptyButtonText}>Start Recording</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
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
              <View>
                <Text style={styles.headerTitle}>Your Healing Journey</Text>
                <Text style={styles.headerSubtitle}>
                  {history.length} moment{history.length !== 1 ? 's' : ''} of reflection
                </Text>
              </View>
              <View style={styles.headerIcon}>
                <Text style={styles.headerIconText}>🌿</Text>
              </View>
            </View>
          </View>

          {/* Stats Card */}
          {stats && stats.totalRecordings > 0 && (
            <View style={styles.statsCard}>
              <LinearGradient
                colors={['#FFFFFF', '#F8FBFF']}
                style={styles.statsGradient}
              >
                <View style={styles.statsHeader}>
                  <Text style={styles.statsTitle}>Wellness Overview</Text>
                  <View style={styles.statsBadge}>
                    <Text style={styles.statsBadgeText}>📊</Text>
                  </View>
                </View>
                
                <View style={styles.statsGrid}>
                  <View style={styles.statBox}>
                    <LinearGradient
                      colors={['#5777AD', '#7CB9E8']}
                      style={styles.statBoxGradient}
                    >
                      <Text style={styles.statBoxValue}>{stats.totalRecordings}</Text>
                      <Text style={styles.statBoxLabel}>Total Sessions</Text>
                    </LinearGradient>
                  </View>
                  
                  <View style={styles.statBox}>
                    <LinearGradient
                      colors={['#ef4444', '#f87171']}
                      style={styles.statBoxGradient}
                    >
                      <Text style={styles.statBoxValue}>{stats.stressTypes.Academic}</Text>
                      <Text style={styles.statBoxLabel}>📚 Academic</Text>
                    </LinearGradient>
                  </View>
                </View>

                <View style={styles.statsGrid}>
                  <View style={styles.statBox}>
                    <LinearGradient
                      colors={['#f59e0b', '#fbbf24']}
                      style={styles.statBoxGradient}
                    >
                      <Text style={styles.statBoxValue}>{stats.stressTypes.Financial}</Text>
                      <Text style={styles.statBoxLabel}>💰 Financial</Text>
                    </LinearGradient>
                  </View>
                  
                  <View style={styles.statBox}>
                    <LinearGradient
                      colors={['#3b82f6', '#60a5fa']}
                      style={styles.statBoxGradient}
                    >
                      <Text style={styles.statBoxValue}>{stats.stressTypes.Social}</Text>
                      <Text style={styles.statBoxLabel}>👥 Social</Text>
                    </LinearGradient>
                  </View>
                </View>

                <View style={[styles.statsGrid, { marginBottom: 0 }]}>
                  <View style={[styles.statBox, { flex: 1 }]}>
                    <LinearGradient
                      colors={['#8b5cf6', '#a78bfa']}
                      style={styles.statBoxGradient}
                    >
                      <Text style={styles.statBoxValue}>{stats.stressTypes.Emotional}</Text>
                      <Text style={styles.statBoxLabel}>💭 Emotional</Text>
                    </LinearGradient>
                  </View>
                </View>

                {stats.mostCommonType && (
                  <View style={styles.dominantContainer}>
                    <Text style={styles.dominantLabel}>Primary Focus Area</Text>
                    <Text style={styles.dominantType}>
                      {getStressIcon(stats.mostCommonType)} {stats.mostCommonType}
                    </Text>
                  </View>
                )}
              </LinearGradient>
            </View>
          )}

          {/* History Items */}
          <Text style={styles.sectionTitle}>Your Reflections</Text>
          
          {history.map((item, index) => (
            <View key={item.id} style={styles.historyCard}>
              <LinearGradient
                colors={['#FFFFFF', '#F8FBFF']}
                style={styles.cardGradient}
              >
                {/* Card Header */}
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderLeft}>
                    <View
                      style={[
                        styles.stressIndicator,
                        { backgroundColor: getStressColor(item.stressType) }
                      ]}
                    >
                      <Text style={styles.stressIndicatorIcon}>
                        {getStressIcon(item.stressType)}
                      </Text>
                    </View>
                    <View style={styles.headerInfo}>
                      <Text style={styles.stressTypeText}>{item.stressType}</Text>
                      <Text style={styles.dateText}>{formatDate(item.timestamp)}</Text>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.confidenceBadge,
                      { borderColor: getStressColor(item.stressType) }
                    ]}
                  >
                    <Text style={styles.confidenceText}>
                      {(item.confidence * 100).toFixed(0)}%
                    </Text>
                  </View>
                </View>

                {/* Transcript */}
                <View style={styles.transcriptContainer}>
                  <Text style={styles.transcriptPreview} numberOfLines={3}>
                    "{item.text}"
                  </Text>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionContainer}>
                  {item.localAudioPath && (
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => {
                        if (playingAudio === item.id) {
                          stopAudio();
                        } else {
                          playAudio(item.localAudioPath, item.id);
                        }
                      }}
                    >
                      <LinearGradient
                        colors={playingAudio === item.id ? ['#9DB4C0', '#B8D8E8'] : ['#7CB9E8', '#B8D8E8']}
                        style={styles.actionButtonGradient}
                      >
                        <Text style={styles.actionButtonIcon}>
                          {playingAudio === item.id ? '⏸' : '▶'}
                        </Text>
                        <Text style={styles.actionButtonText}>
                          {playingAudio === item.id ? 'Pause' : 'Play'}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  )}
                  
                  <TouchableOpacity
                    style={[styles.actionButton, { flex: 2 }]}
                    onPress={() => handleViewAnalysis(item)}
                  >
                    <LinearGradient
                      colors={['#5777AD', '#7CB9E8']}
                      style={styles.actionButtonGradient}
                    >
                      <Text style={styles.actionButtonIcon}>✨</Text>
                      <Text style={styles.actionButtonText}>View Analysis</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.deleteActionButton}
                    onPress={() => handleDeleteRecording(item)}
                  >
                    <View style={styles.deleteButtonInner}>
                      <Text style={styles.deleteButtonIcon}>🗑️</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </View>
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
  loadingContainer: {
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#5777AD',
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyEmoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#5777AD',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#7CB9E8',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  emptyButton: {
    borderRadius: 25,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#5777AD',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  emptyButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  emptyButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  header: {
    marginBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#5777AD',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 15,
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
  statsCard: {
    marginBottom: 24,
    borderRadius: 28,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#5777AD',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
  },
  statsGradient: {
    padding: 24,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  statsTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#5777AD',
  },
  statsBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(124, 185, 232, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsBadgeText: {
    fontSize: 18,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statBox: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
  },
  statBoxGradient: {
    padding: 16,
    alignItems: 'center',
  },
  statBoxValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  statBoxLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.95)',
    fontWeight: '600',
  },
  dominantContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(87, 119, 173, 0.1)',
    alignItems: 'center',
  },
  dominantLabel: {
    fontSize: 13,
    color: '#9DB4C0',
    marginBottom: 6,
    fontWeight: '500',
  },
  dominantType: {
    fontSize: 18,
    fontWeight: '700',
    color: '#5777AD',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#5777AD',
    marginBottom: 16,
    marginTop: 8,
  },
  historyCard: {
    marginBottom: 16,
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#5777AD',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
  },
  cardGradient: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  stressIndicator: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  stressIndicatorIcon: {
    fontSize: 22,
  },
  headerInfo: {
    flex: 1,
  },
  stressTypeText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#5777AD',
    marginBottom: 2,
  },
  dateText: {
    fontSize: 13,
    color: '#9DB4C0',
    fontWeight: '500',
  },
  confidenceBadge: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  confidenceText: {
    fontSize: 14,
    color: '#5777AD',
    fontWeight: '700',
  },
  transcriptContainer: {
    backgroundColor: 'rgba(124, 185, 232, 0.08)',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  transcriptPreview: {
    fontSize: 15,
    color: '#5777AD',
    lineHeight: 22,
    fontStyle: 'italic',
  },
  actionContainer: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'stretch',
  },
  actionButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#5777AD',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    minHeight: 48,
  },
  actionButtonGradient: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 48,
  },
  actionButtonIcon: {
    fontSize: 18,
    color: '#ffffff',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  deleteActionButton: {
    width: 56,
    height: 48,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
  },
  deleteButtonInner: {
    backgroundColor: '#ffebee',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  deleteButtonIcon: {
    fontSize: 22,
  },
  bottomPadding: {
    height: 40,
  },
});