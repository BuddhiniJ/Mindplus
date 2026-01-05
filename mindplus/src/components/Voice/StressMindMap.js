import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { auth, db } from '../../firebase/firebaseConfig';
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
} from 'firebase/firestore';

export default function StressMindMap({ onJoinCommunity }) {
  const [latestAnalysis, setLatestAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
    
    if (!user) {
      console.log('❌ No authenticated user');
      setLoading(false);
      return;
    }

    console.log('✅ Authenticated user:', user.uid);

    // ✅ CORRECT PATH: users/{userId}/stressAnalyses
    const stressAnalysesRef = collection(db, 'users', user.uid, 'stressAnalyses');
    
    const q = query(
      stressAnalysesRef,
      orderBy('timestamp', 'desc'),
      limit(1)
    );

    // 🔥 REAL-TIME LISTENER
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        console.log('📊 Snapshot received, docs:', snapshot.size);
        
        if (!snapshot.empty) {
          const data = snapshot.docs[0].data();
          console.log('✅ Latest analysis:', data);
          setLatestAnalysis(data);
        } else {
          console.log('⚠️ No stress analyses found');
          setLatestAnalysis(null);
        }
        setLoading(false);
      },
      (error) => {
        console.error('❌ Firestore error:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading your stress analysis...</Text>
      </View>
    );
  }

  if (!latestAnalysis) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>
          🎤 Record your voice to generate stress analysis
        </Text>
      </View>
    );
  }

  // 🔽 MAP YOUR SAVED DATA FROM THE CORRECT STRUCTURE
  const {
    stress_scores = {},
    stress_levels = {},
    dominant_type,
    total_stress_score,
    overall_level,
    confidence,
    text,
    timestamp,
  } = latestAnalysis;

  // Get stress level color
  const getStressColor = (level) => {
    const colors = {
      0: '#22c55e', // Low - Green
      1: '#f59e0b', // Medium - Orange
      2: '#ef4444', // High - Red
    };
    return colors[level] || '#6b7280';
  };

  // Get stress level text
  const getStressLevelText = (level) => {
    const levels = {
      0: 'Low',
      1: 'Medium',
      2: 'High',
    };
    return levels[level] || 'Unknown';
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>🎯 Your Latest Stress Analysis</Text>

        {/* Overall Stress Level */}
        <View style={styles.overallSection}>
          <Text style={styles.sectionTitle}>Overall Stress Level</Text>
          <View
            style={[
              styles.levelBadge,
              { backgroundColor: getStressColor(overall_level) },
            ]}
          >
            <Text style={styles.levelText}>
              {getStressLevelText(overall_level)}
            </Text>
          </View>
          <Text style={styles.scoreText}>
            Score: {total_stress_score?.toFixed(1) || 'N/A'} / 10
          </Text>
          <Text style={styles.confidenceText}>
            Confidence: {((confidence || 0) * 100).toFixed(0)}%
          </Text>
        </View>

        {/* Dominant Stress Type */}
        {dominant_type && (
          <View style={styles.dominantSection}>
            <Text style={styles.sectionTitle}>Dominant Stress Type</Text>
            <Text style={styles.dominantType}>{dominant_type}</Text>
          </View>
        )}

        {/* Detailed Stress Breakdown */}
        <View style={styles.breakdownSection}>
          <Text style={styles.sectionTitle}>Stress Breakdown</Text>
          {Object.entries(stress_scores).map(([type, score]) => {
            const level = stress_levels[type] || 0;
            return (
              <View key={type} style={styles.stressItem}>
                <View style={styles.stressHeader}>
                  <Text style={styles.stressType}>{type}</Text>
                  <View
                    style={[
                      styles.miniLevelBadge,
                      { backgroundColor: getStressColor(level) },
                    ]}
                  >
                    <Text style={styles.miniLevelText}>
                      {getStressLevelText(level)}
                    </Text>
                  </View>
                </View>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${(score / 10) * 100}%`,
                        backgroundColor: getStressColor(level),
                      },
                    ]}
                  />
                </View>
                <Text style={styles.scoreValue}>
                  {score?.toFixed(1) || '0.0'} / 10
                </Text>
              </View>
            );
          })}
        </View>

        {/* Transcript Preview */}
        {text && (
          <View style={styles.transcriptSection}>
            <Text style={styles.sectionTitle}>Transcript</Text>
            <Text style={styles.transcriptText} numberOfLines={3}>
              {text}
            </Text>
          </View>
        )}

        {/* Timestamp */}
        {timestamp && (
          <Text style={styles.timestamp}>
            Analyzed: {timestamp.toDate
              ? timestamp.toDate().toLocaleString()
              : new Date(timestamp).toLocaleString()}
          </Text>
        )}
      </View>

      {/* Community Button */}
      <TouchableOpacity
        style={styles.communityButton}
        onPress={() => onJoinCommunity(dominant_type || 'general')}
      >
        <Text style={styles.communityButtonText}>
          💬 Join Support Community
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f9fafb',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    color: '#6b7280',
    fontSize: 16,
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 16,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 20,
    color: '#1f2937',
    textAlign: 'center',
  },
  overallSection: {
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 12,
  },
  levelBadge: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 8,
  },
  levelText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
  },
  scoreText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 4,
  },
  confidenceText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  dominantSection: {
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    marginBottom: 16,
  },
  dominantType: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3b82f6',
  },
  breakdownSection: {
    marginBottom: 16,
  },
  stressItem: {
    marginBottom: 16,
  },
  stressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  stressType: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    textTransform: 'capitalize',
  },
  miniLevelBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  miniLevelText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  scoreValue: {
    fontSize: 13,
    color: '#6b7280',
  },
  transcriptSection: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    marginBottom: 12,
  },
  transcriptText: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
  timestamp: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 8,
  },
  communityButton: {
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 2,
  },
  communityButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
});