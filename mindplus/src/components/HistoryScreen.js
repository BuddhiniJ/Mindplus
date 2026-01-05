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
} from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import { getLocalHistory, deleteLocalAnalysis, getHistoryStats } from '../services/historyStorageService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function HistoryScreen() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [playingAudio, setPlayingAudio] = useState(null);
  const [sound, setSound] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadHistory();
    
    // Cleanup audio on unmount
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const userId = await AsyncStorage.getItem('userId');
      
      if (!userId) {
        console.log('No userId found');
        setLoading(false);
        return;
      }

      console.log('Loading history from local storage for user:', userId);
      
      // Load from local storage
      const data = await getLocalHistory(userId);
      console.log('✅ History loaded:', data.length, 'records');
      setHistory(data);
      
      // Load stats
      const statistics = await getHistoryStats(userId);
      setStats(statistics);
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading history:', error);
      console.error('Error details:', error.message);
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
      // Check if file still exists
      const fileInfo = await FileSystem.getInfoAsync(localPath);
      
      if (!fileInfo.exists) {
        alert('Audio file no longer exists on device');
        return;
      }

      // Stop current audio if playing
      if (sound) {
        await sound.unloadAsync();
      }

      // Load and play audio from local path
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: localPath },
        { shouldPlay: true }
      );

      setSound(newSound);
      setPlayingAudio(id);

      // Reset playing state when done
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setPlayingAudio(null);
        }
      });

    } catch (error) {
      console.error('Error playing audio:', error);
      alert('Failed to play audio. File may have been deleted.');
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
      'Are you sure you want to delete this recording?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const userId = await AsyncStorage.getItem('userId');
              
              // Delete from local storage
              await deleteLocalAnalysis(userId, item.id);
              
              // Delete audio file if exists
              if (item.localAudioPath) {
                const exists = await FileSystem.getInfoAsync(item.localAudioPath);
                if (exists.exists) {
                  await FileSystem.deleteAsync(item.localAudioPath);
                }
              }
              
              // Reload history
              await loadHistory();
              
              Alert.alert('Success', 'Recording deleted');
            } catch (error) {
              console.error('Error deleting recording:', error);
              Alert.alert('Error', 'Failed to delete recording');
            }
          }
        }
      ]
    );
  };

  const formatDate = (timestamp) => {
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
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
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading history...</Text>
      </View>
    );
  }

  if (history.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyEmoji}>🎤</Text>
        <Text style={styles.emptyTitle}>No recordings yet</Text>
        <Text style={styles.emptyText}>
          Start recording to see your stress analysis history
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Text style={styles.headerTitle}>Your Stress History</Text>
      <Text style={styles.headerSubtitle}>
        {history.length} recording{history.length !== 1 ? 's' : ''}
      </Text>

      {/* Stats Card */}
      {stats && stats.totalRecordings > 0 && (
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>📊 Stress Analysis</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.totalRecordings}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#ef4444' }]}>
                {stats.stressTypes.Academic}
              </Text>
              <Text style={styles.statLabel}>📚 Academic</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#f59e0b' }]}>
                {stats.stressTypes.Financial}
              </Text>
              <Text style={styles.statLabel}>💰 Financial</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#3b82f6' }]}>
                {stats.stressTypes.Social}
              </Text>
              <Text style={styles.statLabel}>👥 Social</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#8b5cf6' }]}>
                {stats.stressTypes.Emotional}
              </Text>
              <Text style={styles.statLabel}>💭 Emotional</Text>
            </View>
          </View>
          {stats.mostCommonType && (
            <Text style={styles.mostCommonText}>
              Most Common: {getStressIcon(stats.mostCommonType)} {stats.mostCommonType}
            </Text>
          )}
        </View>
      )}

      {history.map((item) => (
        <View key={item.id} style={styles.historyCard}>
          <View style={styles.cardHeader}>
            <View
              style={[
                styles.stressIndicator,
                { backgroundColor: getStressColor(item.stressType) }
              ]}
            />
            <View style={styles.headerInfo}>
              <Text style={styles.stressTypeText}>
                {getStressIcon(item.stressType)} {item.stressType} Stress
              </Text>
              <Text style={styles.dateText}>
                {formatDate(item.timestamp)}
              </Text>
            </View>
          </View>

          <Text style={styles.transcriptPreview} numberOfLines={3}>
            {item.text}
          </Text>

          <View style={styles.cardFooter}>
            <View style={styles.confidenceBadge}>
              <Text style={styles.confidenceText}>
                {(item.confidence * 100).toFixed(0)}% confidence
              </Text>
            </View>

            <View style={styles.actionButtons}>
              {item.localAudioPath && (
                <TouchableOpacity
                  style={styles.playButton}
                  onPress={() => {
                    if (playingAudio === item.id) {
                      stopAudio();
                    } else {
                      playAudio(item.localAudioPath, item.id);
                    }
                  }}
                >
                  <Text style={styles.playButtonText}>
                    {playingAudio === item.id ? '⏸️' : '▶️'}
                  </Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteRecording(item)}
              >
                <Text style={styles.deleteButtonText}>🗑️</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  contentContainer: {
    padding: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 24,
  },
  historyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stressIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  stressTypeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  dateText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  transcriptPreview: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  confidenceBadge: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  confidenceText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  playButton: {
    backgroundColor: '#3b82f6',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonText: {
    fontSize: 18,
    color: '#ffffff',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  deleteButton: {
    backgroundColor: '#fee',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 18,
  },
  statsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  mostCommonText: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
  },
});