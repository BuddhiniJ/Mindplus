import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function StressAnalysisScreen({ route, navigation }) {
  const { analysis } = route.params;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const {
    stress_scores = {},
    stress_levels = {},
    dominant_type,
    total_stress_score,
    overall_level,
    confidence,
    text,
    timestamp,
  } = analysis;

  const getStressColor = (level) => {
    const colors = {
      0: '#22c55e',
      1: '#f59e0b',
      2: '#ef4444',
    };
    return colors[level] || '#6b7280';
  };

  const getStressLevelText = (level) => {
    const levels = {
      0: 'Low',
      1: 'Medium',
      2: 'High',
    };
    return levels[level] || 'Unknown';
  };

  const getStressTypeIcon = (type) => {
    const icons = {
      'Academic': '📚',
      'Financial': '💰',
      'Social': '👥',
      'Emotional': '💭'
    };
    return icons[type] || '📊';
  };

  const getStressTypeColor = (type) => {
    const colors = {
      'Academic': '#ef4444',
      'Financial': '#f59e0b',
      'Social': '#3b82f6',
      'Emotional': '#8b5cf6'
    };
    return colors[type] || '#6b7280';
  };

  // const getHealingAdvice = (type) => {
  //   const advice = {
  //     'Academic': {
  //       title: 'Academic Stress Relief',
  //       tips: [
  //         'Break tasks into smaller, manageable chunks',
  //         'Create a realistic study schedule',
  //         'Take regular breaks (Pomodoro technique)',
  //         'Practice deep breathing before studying',
  //         'Join study groups for support',
  //       ]
  //     },
  //     'Financial': {
  //       title: 'Financial Wellness',
  //       tips: [
  //         'Create a simple budget plan',
  //         'Focus on what you can control today',
  //         'Seek financial counseling if needed',
  //         'Practice gratitude for what you have',
  //         'Avoid comparing yourself to others',
  //       ]
  //     },
  //     'Social': {
  //       title: 'Social Connection',
  //       tips: [
  //         'Reach out to trusted friends',
  //         'Practice active listening',
  //         'Set healthy boundaries',
  //         'Join communities with similar interests',
  //         'Remember: quality over quantity',
  //       ]
  //     },
  //     'Emotional': {
  //       title: 'Emotional Balance',
  //       tips: [
  //         'Journal your feelings daily',
  //         'Practice mindfulness meditation',
  //         'Engage in physical activity',
  //         'Talk to a counselor or therapist',
  //         'Allow yourself to feel emotions',
  //       ]
  //     }
  //   };
  //   return advice[type] || advice['Emotional'];
  // };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // const healingAdvice = getHealingAdvice(dominant_type);

  return (
    <LinearGradient
      colors={['#E9EAEB', '#D4E4F7', '#FFFFFF', '#E1F5FE']}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Animated.View 
          style={[
            styles.content,
            { 
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          {/* Header */}
          <View style={styles.headerSection}>
            <Text style={styles.headerEmoji}></Text>
            <Text style={styles.headerTitle}>Your Healing Path</Text>
            <Text style={styles.headerSubtitle}>Understanding your stress to find peace</Text>
          </View>

          {/* Overall Status Card */}
          <View style={styles.overallCard}>
            <LinearGradient
              colors={['#FFFFFF', '#F8FBFF']}
              style={styles.cardGradient}
            >
              <Text style={styles.cardTitle}>Overall Wellness</Text>
              <View style={styles.overallContent}>
                <View
                  style={[
                    styles.levelBadge,
                    { backgroundColor: getStressColor(overall_level) }
                  ]}
                >
                  <Text style={styles.levelBadgeText}>
                    {getStressLevelText(overall_level)}
                  </Text>
                </View>
                <Text style={styles.scoreText}>
                  Score: {total_stress_score?.toFixed(1) || 'N/A'} / 10
                </Text>
                <View style={styles.confidenceRow}>
                  <Text style={styles.confidenceLabel}>Analysis Confidence</Text>
                  <Text style={styles.confidenceValue}>
                    {((confidence || 0) * 100).toFixed(0)}%
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Dominant Stress Type */}
          {dominant_type && (
            <View style={styles.dominantCard}>
              <LinearGradient
                colors={['#FFFFFF', '#F8FBFF']}
                style={styles.cardGradient}
              >
                <Text style={styles.cardTitle}>Primary Concern</Text>
                <View style={styles.dominantContent}>
                  <Text style={styles.dominantIcon}>
                    {getStressTypeIcon(dominant_type)}
                  </Text>
                  <Text 
                    style={[
                      styles.dominantType,
                      { color: getStressTypeColor(dominant_type) }
                    ]}
                  >
                    {dominant_type} Stress
                  </Text>
                </View>
              </LinearGradient>
            </View>
          )}

          {/* Stress Breakdown */}
          <View style={styles.breakdownCard}>
            <LinearGradient
              colors={['#FFFFFF', '#F8FBFF']}
              style={styles.cardGradient}
            >
              <Text style={styles.cardTitle}>Stress Breakdown</Text>
              {Object.entries(stress_scores).map(([type, score]) => {
                const level = stress_levels[type] || 0;
                return (
                  <View key={type} style={styles.stressItem}>
                    <View style={styles.stressHeader}>
                      <Text style={styles.stressTypeLabel}>
                        {getStressTypeIcon(type)} {type}
                      </Text>
                      <View
                        style={[
                          styles.miniLevelBadge,
                          { backgroundColor: getStressColor(level) }
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
            </LinearGradient>
          </View>

          {/* Healing Guidance */}
          {/* <View style={styles.guidanceCard}>
            <LinearGradient
              colors={['#7CB9E8', '#5777AD']}
              style={styles.guidanceGradient}
            >
              <Text style={styles.guidanceEmoji}>🌿</Text>
              <Text style={styles.guidanceTitle}>{healingAdvice.title}</Text>
              <Text style={styles.guidanceSubtitle}>Gentle steps toward wellness</Text>
              
              <View style={styles.tipsContainer}>
                {healingAdvice.tips.map((tip, index) => (
                  <View key={index} style={styles.tipItem}>
                    <View style={styles.tipBullet}>
                      <Text style={styles.tipBulletText}>•</Text>
                    </View>
                    <Text style={styles.tipText}>{tip}</Text>
                  </View>
                ))
                }
              </View>
            </LinearGradient>
          </View> */}

          {/* Your Words */}
          {text && (
            <View style={styles.transcriptCard}>
              <LinearGradient
                colors={['#FFFFFF', '#F8FBFF']}
                style={styles.cardGradient}
              >
                <Text style={styles.cardTitle}>💭 Your Words</Text>
                <Text style={styles.transcriptText}>{text}</Text>
              </LinearGradient>
            </View>
          )}

          {/* Timestamp */}
          {timestamp && (
            <Text style={styles.timestamp}>
              Analyzed on {formatDate(timestamp)}
            </Text>
          )}

          {/* Action Buttons */}
          <View style={styles.actionSection}>
            <TouchableOpacity
              style={styles.communityButton}
              onPress={() => navigation.navigate('Community', { stressType: dominant_type })}
            >
              <LinearGradient
                colors={['#5777AD', '#7CB9E8']}
                style={styles.communityGradient}
              >
                <Text style={styles.communityButtonText}>
                  💬 Join Support Community
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backButtonText}>← Back to History</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  content: {
    flex: 1,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  headerEmoji: {
    fontSize: 64,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#5777AD',
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#7CB9E8',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  overallCard: {
    marginBottom: 16,
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#5777AD',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  cardGradient: {
    padding: 24,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#5777AD',
    marginBottom: 16,
  },
  overallContent: {
    alignItems: 'center',
  },
  levelBadge: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    marginBottom: 12,
  },
  levelBadgeText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
  },
  scoreText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#5777AD',
    marginBottom: 16,
  },
  confidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(124, 185, 232, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  confidenceLabel: {
    fontSize: 14,
    color: '#7CB9E8',
    marginRight: 8,
  },
  confidenceValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#5777AD',
  },
  dominantCard: {
    marginBottom: 16,
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#5777AD',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  dominantContent: {
    alignItems: 'center',
  },
  dominantIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  dominantType: {
    fontSize: 24,
    fontWeight: '700',
  },
  breakdownCard: {
    marginBottom: 16,
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#5777AD',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  stressItem: {
    marginBottom: 20,
  },
  stressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  stressTypeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5777AD',
  },
  miniLevelBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  miniLevelText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  progressBar: {
    height: 10,
    backgroundColor: 'rgba(124, 185, 232, 0.2)',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  scoreValue: {
    fontSize: 14,
    color: '#9DB4C0',
    fontWeight: '500',
  },
  guidanceCard: {
    marginBottom: 16,
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#5777AD',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  guidanceGradient: {
    padding: 28,
  },
  guidanceEmoji: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: 12,
  },
  guidanceTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  guidanceSubtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 24,
  },
  tipsContainer: {
    gap: 16,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tipBullet: {
    width: 24,
    marginRight: 8,
  },
  tipBulletText: {
    fontSize: 20,
    color: '#ffffff',
    fontWeight: '700',
  },
  tipText: {
    flex: 1,
    fontSize: 15,
    color: '#ffffff',
    lineHeight: 22,
  },
  transcriptCard: {
    marginBottom: 16,
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#5777AD',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  transcriptText: {
    fontSize: 15,
    color: '#5777AD',
    lineHeight: 24,
    fontStyle: 'italic',
  },
  timestamp: {
    fontSize: 13,
    color: '#9DB4C0',
    textAlign: 'center',
    marginBottom: 24,
  },
  actionSection: {
    gap: 12,
  },
  communityButton: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#5777AD',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  communityGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  communityButtonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
  },
  backButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingVertical: 16,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#7CB9E8',
  },
  backButtonText: {
    color: '#5777AD',
    fontSize: 16,
    fontWeight: '600',
  },
});