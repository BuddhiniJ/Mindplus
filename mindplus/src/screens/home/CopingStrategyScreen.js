import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Animated,
} from "react-native";
import { fetchCopingStrategy } from "../../services/api";

const EMOTION_COLORS = {
  happy: { color: "#FBBF24", emoji: "😊", label: "Happy" },
  sad: { color: "#60A5FA", emoji: "😢", label: "Sad" },
  angry: { color: "#EF4444", emoji: "😠", label: "Angry" },
  anxious: { color: "#8B5CF6", emoji: "😰", label: "Anxious" },
  neutral: { color: "#9CA3AF", emoji: "😐", label: "Neutral" },
  excited: { color: "#EC4899", emoji: "🤩", label: "Excited" },
  calm: { color: "#10B981", emoji: "😌", label: "Calm" },
  confused: { color: "#F59E0B", emoji: "😕", label: "Confused" },
  joy: { color: "#FBBF24", emoji: "😄", label: "Joy" },
  stress: { color: "#F97316", emoji: "😫", label: "Stressed" },
  fear: { color: "#7C3AED", emoji: "😨", label: "Fearful" },
  disgust: { color: "#84CC16", emoji: "🤢", label: "Disgusted" },
  surprise: { color: "#EC4899", emoji: "😲", label: "Surprised" },
  love: { color: "#F43F5E", emoji: "🥰", label: "Loved" },
  anxiety: { color: "#8B5CF6", emoji: "😰", label: "Anxious" },
  sadness: { color: "#60A5FA", emoji: "😢", label: "Sad" },
  anger: { color: "#EF4444", emoji: "😠", label: "Angry" },
  unknown: { color: "#6B7280", emoji: "❓", label: "Unknown" },
};

const SEVERITY_INFO = {
  low: {
    label: "Low Intensity",
    icon: "🌱",
    description: "Minor emotional fluctuation",
    color: "#10B981",
  },
  medium: {
    label: "Moderate Intensity",
    icon: "🌿",
    description: "Noticeable emotional impact",
    color: "#F59E0B",
  },
  high: {
    label: "High Intensity",
    icon: "🌳",
    description: "Strong emotional experience",
    color: "#EF4444",
  },
};

export default function CopingStrategyScreen({ route, navigation }) {
  const [copingData, setCopingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;

  useEffect(() => {
    loadCopingStrategy();
  }, []);

  const loadCopingStrategy = async () => {
    try {
      const { emotion, confidence } = route?.params || {};

      if (!emotion || confidence === undefined) {
        setError(
          "Missing emotion data. Please view your overall emotion first."
        );
        setLoading(false);
        return;
      }

      const result = await fetchCopingStrategy(emotion, confidence);
      setCopingData(result);
      setLoading(false);

      // Trigger animations
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 50,
          friction: 7,
        }),
      ]).start();
    } catch (err) {
      console.error("Error fetching coping strategy:", err);
      setError("Unable to fetch coping strategy. Please try again.");
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>
          Generating your personalized coping strategy...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.headerBackground} />
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.centerContent}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorTitle}>Something Went Wrong</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.8}
            >
              <Text style={styles.retryButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  const emotionInfo =
    EMOTION_COLORS[copingData.emotion] || EMOTION_COLORS.unknown;
  const severityInfo = SEVERITY_INFO[copingData.severity] || SEVERITY_INFO.low;
  const confidencePercentage = Math.round((copingData.confidence || 0) * 100);

  return (
    <View style={styles.container}>
      {/* Header Background */}
      <View
        style={[
          styles.headerBackground,
          { backgroundColor: emotionInfo.color + "15" },
        ]}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <Text style={styles.headerTitle}>Your Coping Strategy</Text>
          <Text style={styles.headerSubtitle}>
            Personalized guidance based on your emotional state
          </Text>
        </Animated.View>

        {/* Emotion Summary Card */}
        <Animated.View
          style={[
            styles.emotionSummaryCard,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.emotionSummaryHeader}>
            <View
              style={[
                styles.emotionIconContainer,
                { backgroundColor: emotionInfo.color + "20" },
              ]}
            >
              <Text style={styles.emotionIcon}>{emotionInfo.emoji}</Text>
            </View>
            <View style={styles.emotionSummaryText}>
              <Text style={styles.emotionName}>{emotionInfo.label}</Text>
              <Text style={styles.confidenceText}>
                {confidencePercentage}% confidence
              </Text>
            </View>
          </View>

          <View style={styles.severityBadge}>
            <Text style={styles.severityIcon}>{severityInfo.icon}</Text>
            <View style={styles.severityTextContainer}>
              <Text style={styles.severityLabel}>{severityInfo.label}</Text>
              <Text style={styles.severityDescription}>
                {severityInfo.description}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Coping Strategy Card */}
        <Animated.View
          style={[
            styles.strategyCard,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.strategyHeader}>
            <Text style={styles.strategyIcon}>💡</Text>
            <Text style={styles.strategyTitle}>Recommended Action</Text>
          </View>

          <View style={styles.strategyContent}>
            <Text style={styles.strategyText}>{copingData.strategy}</Text>
          </View>

          <View style={styles.strategyFooter}>
            <View style={styles.tipContainer}>
              <Text style={styles.tipIcon}>✨</Text>
              <Text style={styles.tipText}>
                Take your time with this suggestion. Small steps make a big
                difference.
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Why This Helps Card */}
        <Animated.View
          style={[
            styles.infoCard,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.infoTitle}>🌟 Why This Helps</Text>
          <Text style={styles.infoText}>
            {copingData.severity === "high"
              ? "When emotions are intense, grounding techniques help you regain a sense of control and presence. These actions activate your body's natural calming response."
              : copingData.severity === "medium"
              ? "Moderate emotional states benefit from focused, purposeful actions. These strategies help you process and redirect your emotional energy constructively."
              : "During mild emotional fluctuations, simple awareness and small actions can prevent escalation and maintain your emotional balance."}
          </Text>
        </Animated.View>

        {/* Additional Resources */}
        <Animated.View
          style={[
            styles.resourcesCard,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.resourcesTitle}>📚 Next Steps</Text>
          <View style={styles.resourcesList}>
            <View style={styles.resourceItem}>
              <Text style={styles.resourceBullet}>•</Text>
              <Text style={styles.resourceText}>
                Track your progress in the daily check-in
              </Text>
            </View>
            <View style={styles.resourceItem}>
              <Text style={styles.resourceBullet}>•</Text>
              <Text style={styles.resourceText}>
                View your emotion patterns on the heatmap
              </Text>
            </View>
            <View style={styles.resourceItem}>
              <Text style={styles.resourceBullet}>•</Text>
              <Text style={styles.resourceText}>
                Chat with our AI companion for more support
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.primaryButton,
              { backgroundColor: emotionInfo.color },
            ]}
            onPress={() => navigation.navigate("HomeDashboardScreen")}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Dashboard</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  headerBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 200,
    backgroundColor: "#EEF2FF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6B7280",
    fontWeight: "500",
    textAlign: "center",
  },
  scrollContent: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  header: {
    marginBottom: 24,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 15,
    color: "#6B7280",
  },
  emotionSummaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  emotionSummaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  emotionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  emotionIcon: {
    fontSize: 32,
  },
  emotionSummaryText: {
    flex: 1,
  },
  emotionName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  confidenceText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  severityBadge: {
    flexDirection: "row",
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  severityIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  severityTextContainer: {
    flex: 1,
  },
  severityLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  severityDescription: {
    fontSize: 13,
    color: "#6B7280",
  },
  strategyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    borderLeftWidth: 4,
    borderLeftColor: "#3B82F6",
  },
  strategyHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  strategyIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  strategyTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
  },
  strategyContent: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  strategyText: {
    fontSize: 16,
    color: "#374151",
    lineHeight: 26,
    fontWeight: "500",
  },
  strategyFooter: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  tipContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  tipIcon: {
    fontSize: 18,
    marginRight: 10,
    marginTop: 2,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
    fontStyle: "italic",
  },
  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  infoText: {
    fontSize: 15,
    color: "#6B7280",
    lineHeight: 24,
  },
  resourcesCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  resourcesTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
  },
  resourcesList: {
    gap: 12,
  },
  resourceItem: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  resourceBullet: {
    fontSize: 20,
    color: "#3B82F6",
    marginRight: 12,
    fontWeight: "700",
  },
  resourceText: {
    flex: 1,
    fontSize: 15,
    color: "#6B7280",
    lineHeight: 22,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E5E7EB",
  },
  secondaryButtonText: {
    color: "#111827",
    fontWeight: "700",
    fontSize: 15,
  },
  bottomSpacer: {
    height: 20,
  },
  centerContent: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
    textAlign: "center",
  },
  errorText: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: "#3B82F6",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
  },
});
