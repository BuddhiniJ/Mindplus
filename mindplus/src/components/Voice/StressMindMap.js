import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { auth, db } from '../../firebase/firebaseConfig';
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
} from 'firebase/firestore';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Line, Text as SvgText } from 'react-native-svg';

const { width } = Dimensions.get('window');

export default function StressMindMap({ onJoinCommunity }) {
  const [latestAnalysis, setLatestAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    const user = auth.currentUser;
    
    if (!user) {
      console.log('❌ No authenticated user');
      setLoading(false);
      return;
    }

    console.log('✅ Authenticated user:', user.uid);

    const stressAnalysesRef = collection(db, 'users', user.uid, 'stressAnalyses');
    
    const q = query(
      stressAnalysesRef,
      orderBy('timestamp', 'desc'),
      limit(1)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        console.log('📊 Snapshot received, docs:', snapshot.size);
        
        if (!snapshot.empty) {
          const data = snapshot.docs[0].data();
          console.log('✅ Latest analysis:', data);
          setLatestAnalysis(data);
          
          // Animate in
          Animated.parallel([
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
              toValue: 1,
              friction: 8,
              tension: 40,
              useNativeDriver: true,
            }),
          ]).start();
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
      <LinearGradient
        colors={['#E9EAEB', '#D4E4F7']}
        style={styles.loadingContainer}
      >
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color="#5777AD" />
          <Text style={styles.loadingText}>Analyzing your inner peace...</Text>
        </View>
      </LinearGradient>
    );
  }

  if (!latestAnalysis) {
    return (
      <LinearGradient
        colors={['#E9EAEB', '#D4E4F7']}
        style={styles.emptyContainer}
      >
        <View style={styles.emptyContent}>
          <Text style={styles.emptyEmoji}>🎤</Text>
          <Text style={styles.emptyText}>
            Share your thoughts to begin your healing journey
          </Text>
        </View>
      </LinearGradient>
    );
  }

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

  const getStressColor = (level) => {
    const colors = {
      0: '#7CB9E8', // Low - Calm Blue
      1: '#9DB4C0', // Medium - Soft Gray-Blue
      2: '#5777AD', // High - Deep Blue
    };
    return colors[level] || '#E9EAEB';
  };

  const getStressLevelText = (level) => {
    const levels = {
      0: 'Peaceful',
      1: 'Mindful',
      2: 'Needs Care',
    };
    return levels[level] || 'Unknown';
  };

  const getHealingMessage = (level) => {
    const messages = {
      0: '🌸 You\'re in a calm state',
      1: '🌊 Take a moment to breathe',
      2: '🕊️ Let\'s find your peace together',
    };
    return messages[level] || '';
  };

  // Calculate positions for mind map circles
  const stressTypes = Object.keys(stress_scores);
  const centerX = width * 0.45;
  const centerY = 150;
  const radius = 80;

  return (
    <LinearGradient
      colors={['#E9EAEB', '#D4E4F7', '#FFFFFF']}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Animated.View 
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerEmoji}>🌺</Text>
            <Text style={styles.title}>Your Emotional Landscape</Text>
            <Text style={styles.subtitle}>Understanding your inner world</Text>
          </View>

          {/* Central Mind Map Visualization */}
          <View style={styles.mindMapContainer}>
            <View style={styles.svgWrapper}>
              <Svg height="300" width={width - 40}>
                {/* Draw lines from center to stress types */}
                {stressTypes.map((type, index) => {
                  const angle = (index * 2 * Math.PI) / stressTypes.length - Math.PI / 2;
                  const x = centerX + radius * Math.cos(angle);
                  const y = centerY + radius * Math.sin(angle);
                  
                  return (
                    <Line
                      key={`line-${type}`}
                      x1={centerX}
                      y1={centerY}
                      x2={x}
                      y2={y}
                      stroke="#B8C5D6"
                      strokeWidth="2"
                      opacity="0.5"
                    />
                  );
                })}
              </Svg>

              {/* Center circle - Overall stress */}
              <View style={[styles.centerCircle, { top: centerY - 40, left: centerX - 40 }]}>
                <LinearGradient
                  colors={[getStressColor(overall_level), '#FFFFFF']}
                  style={styles.centerGradient}
                >
                  <Text style={styles.centerScore}>
                    {total_stress_score?.toFixed(1) || '0.0'}
                  </Text>
                  <Text style={styles.centerLabel}>Overall</Text>
                </LinearGradient>
              </View>

              {/* Stress type circles */}
              {stressTypes.map((type, index) => {
                const angle = (index * 2 * Math.PI) / stressTypes.length - Math.PI / 2;
                const x = centerX + radius * Math.cos(angle) - 35;
                const y = centerY + radius * Math.sin(angle) - 35;
                const level = stress_levels[type] || 0;
                const score = stress_scores[type] || 0;

                return (
                  <View
                    key={type}
                    style={[
                      styles.stressCircle,
                      { top: y, left: x, backgroundColor: getStressColor(level) }
                    ]}
                  >
                    <Text style={styles.circleScore}>{score.toFixed(1)}</Text>
                    <Text style={styles.circleLabel} numberOfLines={2}>
                      {type.split(' ')[0]}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Overall Status Card */}
          <View style={styles.statusCard}>
            <LinearGradient
              colors={['#FFFFFF', '#F0F4F8']}
              style={styles.statusGradient}
            >
              <Text style={styles.statusTitle}>Current State</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStressColor(overall_level) }]}>
                <Text style={styles.statusText}>{getStressLevelText(overall_level)}</Text>
              </View>
              <Text style={styles.healingMessage}>{getHealingMessage(overall_level)}</Text>
              <Text style={styles.confidenceText}>
                Analysis Confidence: {((confidence || 0) * 100).toFixed(0)}%
              </Text>
            </LinearGradient>
          </View>

          {/* Dominant Type Card */}
          {dominant_type && (
            <View style={styles.dominantCard}>
              <Text style={styles.dominantTitle}>Primary Focus Area</Text>
              <View style={styles.dominantBadge}>
                <Text style={styles.dominantType}>{dominant_type}</Text>
              </View>
              <Text style={styles.dominantMessage}>
                This area needs your gentle attention
              </Text>
            </View>
          )}

          {/* Detailed Breakdown */}
          <View style={styles.breakdownCard}>
            <Text style={styles.breakdownTitle}>Energy Distribution</Text>
            {Object.entries(stress_scores).map(([type, score]) => {
              const level = stress_levels[type] || 0;
              return (
                <View key={type} style={styles.breakdownItem}>
                  <View style={styles.breakdownHeader}>
                    <Text style={styles.breakdownType}>{type}</Text>
                    <Text style={styles.breakdownScore}>{score.toFixed(1)}</Text>
                  </View>
                  <View style={styles.progressBar}>
                    <LinearGradient
                      colors={[getStressColor(level), '#E9EAEB']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[
                        styles.progressFill,
                        { width: `${(score / 10) * 100}%` }
                      ]}
                    />
                  </View>
                  <Text style={styles.levelLabel}>{getStressLevelText(level)}</Text>
                </View>
              );
            })}
          </View>

          {/* Transcript Card */}
          {text && (
            <View style={styles.transcriptCard}>
              <Text style={styles.transcriptTitle}>💭 Your Words</Text>
              <Text style={styles.transcriptText}>{text}</Text>
            </View>
          )}

          {/* Community Button */}
          <TouchableOpacity
            style={styles.communityButton}
            onPress={() => onJoinCommunity(dominant_type || 'general')}
          >
            <LinearGradient
              colors={['#5777AD', '#7CB9E8']}
              style={styles.communityGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.communityIcon}>🤝</Text>
              <Text style={styles.communityText}>Join Healing Community</Text>
              <Text style={styles.communitySubtext}>Connect with others on similar journeys</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Timestamp */}
          {timestamp && (
            <Text style={styles.timestamp}>
              Reflected on: {timestamp.toDate
                ? timestamp.toDate().toLocaleString()
                : new Date(timestamp).toLocaleString()}
            </Text>
          )}
        </Animated.View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#5777AD',
    fontSize: 16,
    fontStyle: 'italic',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyContent: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 40,
    borderRadius: 24,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    color: '#5777AD',
    fontSize: 18,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 26,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  content: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    paddingTop: 20,
  },
  headerEmoji: {
    fontSize: 56,
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#5777AD',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#7CB9E8',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  mindMapContainer: {
    marginBottom: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 24,
    padding: 20,
    elevation: 4,
    shadowColor: '#5777AD',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  svgWrapper: {
    height: 300,
    position: 'relative',
  },
  centerCircle: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    elevation: 8,
    shadowColor: '#5777AD',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  centerGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  centerScore: {
    fontSize: 20,
    fontWeight: '700',
    color: '#5777AD',
  },
  centerLabel: {
    fontSize: 11,
    color: '#5777AD',
    marginTop: 2,
  },
  stressCircle: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#5777AD',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  circleScore: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  circleLabel: {
    fontSize: 10,
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 2,
  },
  statusCard: {
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#5777AD',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  statusGradient: {
    padding: 24,
    alignItems: 'center',
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#5777AD',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    marginBottom: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  healingMessage: {
    fontSize: 16,
    color: '#7CB9E8',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 8,
  },
  confidenceText: {
    fontSize: 13,
    color: '#9DB4C0',
  },
  dominantCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 24,
    borderRadius: 20,
    marginBottom: 20,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#5777AD',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  dominantTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5777AD',
    marginBottom: 12,
  },
  dominantBadge: {
    backgroundColor: '#5777AD',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 16,
    marginBottom: 8,
  },
  dominantType: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  dominantMessage: {
    fontSize: 14,
    color: '#7CB9E8',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  breakdownCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 24,
    borderRadius: 20,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#5777AD',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  breakdownTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#5777AD',
    marginBottom: 20,
  },
  breakdownItem: {
    marginBottom: 20,
  },
  breakdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  breakdownType: {
    fontSize: 15,
    fontWeight: '600',
    color: '#5777AD',
  },
  breakdownScore: {
    fontSize: 16,
    fontWeight: '700',
    color: '#7CB9E8',
  },
  progressBar: {
    height: 10,
    backgroundColor: '#E9EAEB',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  levelLabel: {
    fontSize: 12,
    color: '#9DB4C0',
    fontStyle: 'italic',
  },
  transcriptCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 24,
    borderRadius: 20,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#5777AD',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  transcriptTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#5777AD',
    marginBottom: 12,
  },
  transcriptText: {
    fontSize: 15,
    color: '#5777AD',
    lineHeight: 24,
    fontStyle: 'italic',
  },
  communityButton: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    elevation: 6,
    shadowColor: '#5777AD',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  communityGradient: {
    padding: 24,
    alignItems: 'center',
  },
  communityIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  communityText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  communitySubtext: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 13,
    fontStyle: 'italic',
  },
  timestamp: {
    fontSize: 12,
    color: '#9DB4C0',
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
  },
});