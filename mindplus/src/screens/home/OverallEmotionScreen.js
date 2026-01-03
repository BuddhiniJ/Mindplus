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
import { useNavigation } from "@react-navigation/native";

const EMOTION_COLORS = {
  happy: { color: "#FBBF24", emoji: "😊", label: "Happy" },
  sad: { color: "#60A5FA", emoji: "😢", label: "Sad" },
  angry: { color: "#EF4444", emoji: "😠", label: "Angry" },
  anxious: { color: "#8B5CF6", emoji: "😰", label: "Anxious" },
  neutral: { color: "#9CA3AF", emoji: "😐", label: "Neutral" },
  excited: { color: "#EC4899", emoji: "🤩", label: "Excited" },
  calm: { color: "#10B981", emoji: "😌", label: "Calm" },
  confused: { color: "#F59E0B", emoji: "😕", label: "Confused" },
  unknown: { color: "#6B7280", emoji: "❓", label: "Unknown" },
};

const calculateOverallEmotion = (answers) => {
  if (!answers || answers.length === 0) {
    return { emotion: "unknown", confidence: 0, colorCode: "#6B7280" };
  }

  // Count emotion occurrences and calculate weighted confidence
  const emotionScores = {};
  let totalConfidence = 0;

  answers.forEach((answer) => {
    const emotion = answer.emotion?.toLowerCase() || "unknown";
    const confidence = answer.confidence || 0;

    if (!emotionScores[emotion]) {
      emotionScores[emotion] = { count: 0, totalConfidence: 0 };
    }
    emotionScores[emotion].count += 1;
    emotionScores[emotion].totalConfidence += confidence;
    totalConfidence += confidence;
  });

  // Find dominant emotion
  let dominantEmotion = "unknown";
  let maxCount = 0;
  let dominantEmotionConfidence = 0;

  Object.entries(emotionScores).forEach(([emotion, scores]) => {
    if (scores.count > maxCount) {
      maxCount = scores.count;
      dominantEmotion = emotion;
      dominantEmotionConfidence = scores.totalConfidence / scores.count;
    }
  });

  // Calculate overall confidence (weighted average)
  const overallConfidence =
    totalConfidence > 0 ? totalConfidence / answers.length : 0;

  const colorCode = EMOTION_COLORS[dominantEmotion]?.color || "#6B7280";

  return {
    emotion: dominantEmotion,
    confidence: overallConfidence,
    colorCode,
    emotionScores,
    dominantEmotionConfidence,
  };
};

export default function OverallEmotionScreen({ route, navigation }) {
  const [overallEmotion, setOverallEmotion] = useState(null);
  const [loading, setLoading] = useState(true);
  const scaleAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (route?.params?.answers) {
      const result = calculateOverallEmotion(route.params.answers);
      setOverallEmotion(result);
      setLoading(false);

      // Trigger scale animation
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        bounciness: 8,
      }).start();
    } else {
      setLoading(false);
    }
  }, [route?.params?.answers]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Analyzing your emotions...</Text>
      </View>
    );
  }

  if (!overallEmotion) {
    return (
      <View style={styles.container}>
        <View style={styles.headerBackground} />
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.centerContent}>
            <Text style={styles.errorTitle}>No Data Available</Text>
            <Text style={styles.errorText}>
              Please complete the daily check-in first.
            </Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  const emotionInfo = EMOTION_COLORS[overallEmotion.emotion] || EMOTION_COLORS.unknown;
  const confidencePercentage = Math.round(overallEmotion.confidence * 100);

  return (
    <View style={styles.container}>
      {/* Header Background */}
      <View style={[styles.headerBackground, { backgroundColor: overallEmotion.colorCode + "20" }]} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Today's Overall Emotion</Text>
          <Text style={styles.headerSubtitle}>
            Based on your 4 daily check-in responses
          </Text>
        </View>

        {/* Main Emotion Card */}
        <Animated.View
          style={[
            styles.mainEmotionCard,
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          <View
            style={[
              styles.emotionCircle,
              { borderColor: overallEmotion.colorCode },
              { backgroundColor: overallEmotion.colorCode + "10" },
            ]}
          >
            <Text style={styles.emotionEmoji}>{emotionInfo.emoji}</Text>
          </View>

          <Text style={styles.emotionLabel}>{emotionInfo.label}</Text>

          <View style={styles.confidenceContainer}>
            <Text style={styles.confidenceValue}>{confidencePercentage}%</Text>
            <Text style={styles.confidenceLabel}>Confidence</Text>
          </View>

          {/* Confidence Bar */}
          <View style={styles.confidenceBarContainer}>
            <View style={styles.confidenceBarBackground}>
              <View
                style={[
                  styles.confidenceBarFill,
                  {
                    width: `${confidencePercentage}%`,
                    backgroundColor: overallEmotion.colorCode,
                  },
                ]}
              />
            </View>
          </View>

          {/* Emotion Quality Description */}
          <View style={styles.qualityDescription}>
            <Text style={styles.qualityText}>
              {confidencePercentage >= 80
                ? "Very Strong - Clearly defined emotional state"
                : confidencePercentage >= 60
                ? "Strong - Consistent emotional indicators"
                : confidencePercentage >= 40
                ? "Moderate - Mixed emotional signals"
                : "Low - Varied emotional responses"}
            </Text>
          </View>
        </Animated.View>

        {/* Emotion Breakdown */}
        <View style={styles.breakdownSection}>
          <Text style={styles.sectionTitle}>Emotion Breakdown</Text>
          <Text style={styles.sectionDescription}>
            How your responses distributed across emotions
          </Text>

          <View style={styles.emotionBreakdownCards}>
            {Object.entries(overallEmotion.emotionScores || {}).map(
              ([emotion, scores]) => {
                const emotionColor = EMOTION_COLORS[emotion] || EMOTION_COLORS.unknown;
                const percentage = ((scores.count / 4) * 100).toFixed(0);
                const avgConfidence = (scores.totalConfidence / scores.count) * 100;

                return (
                  <View
                    key={emotion}
                    style={[
                      styles.breakdownCard,
                      { borderLeftColor: emotionColor.color },
                    ]}
                  >
                    <View style={styles.breakdownHeader}>
                      <Text style={styles.breakdownEmoji}>{emotionColor.emoji}</Text>
                      <View style={styles.breakdownInfo}>
                        <Text style={styles.breakdownLabel}>
                          {emotionColor.label}
                        </Text>
                        <Text style={styles.breakdownPercentage}>
                          {percentage}% ({scores.count}/4 responses)
                        </Text>
                      </View>
                    </View>
                    <View style={styles.breakdownMiniBar}>
                      <View style={styles.breakdownMiniBarBg}>
                        <View
                          style={[
                            styles.breakdownMiniBarFill,
                            {
                              width: `${percentage}%`,
                              backgroundColor: emotionColor.color,
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.breakdownConfidence}>
                        {Math.round(avgConfidence)}% conf.
                      </Text>
                    </View>
                  </View>
                );
              }
            )}
          </View>
        </View>

        {/* Insights Card */}
        <View style={styles.insightsCard}>
          <Text style={styles.insightsTitle}>💡 Insights</Text>
          <Text style={styles.insightsText}>
            Your responses today show a{" "}
            <Text style={{ fontWeight: "700" }}>
              {emotionInfo.label.toLowerCase()}
            </Text>{" "}
            emotional state with{" "}
            <Text style={{ fontWeight: "700" }}>
              {confidencePercentage}% confidence
            </Text>
            . This means your emotional responses are{" "}
            {confidencePercentage >= 80
              ? "very consistent across all questions"
              : confidencePercentage >= 60
              ? "mostly consistent with some variation"
              : "quite varied across different questions"}
            .
          </Text>
        </View>

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
              { backgroundColor: overallEmotion.colorCode },
            ]}
            onPress={() => navigation.navigate("HomeDashboardScreen")}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Go to Dashboard</Text>
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
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6B7280",
    fontWeight: "500",
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
  mainEmotionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  emotionCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emotionEmoji: {
    fontSize: 60,
  },
  emotionLabel: {
    fontSize: 26,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 20,
  },
  confidenceContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  confidenceValue: {
    fontSize: 44,
    fontWeight: "700",
    color: "#3B82F6",
  },
  confidenceLabel: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
    fontWeight: "500",
  },
  confidenceBarContainer: {
    width: "100%",
    marginBottom: 20,
  },
  confidenceBarBackground: {
    height: 12,
    backgroundColor: "#E5E7EB",
    borderRadius: 6,
    overflow: "hidden",
  },
  confidenceBarFill: {
    height: "100%",
    borderRadius: 6,
  },
  qualityDescription: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 14,
    width: "100%",
  },
  qualityText: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
    fontWeight: "500",
    textAlign: "center",
  },
  breakdownSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 16,
  },
  emotionBreakdownCards: {
    gap: 12,
  },
  breakdownCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  breakdownHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  breakdownEmoji: {
    fontSize: 28,
    marginRight: 12,
  },
  breakdownInfo: {
    flex: 1,
  },
  breakdownLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  breakdownPercentage: {
    fontSize: 12,
    color: "#6B7280",
  },
  breakdownMiniBar: {
    gap: 6,
  },
  breakdownMiniBarBg: {
    height: 8,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    overflow: "hidden",
  },
  breakdownMiniBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  breakdownConfidence: {
    fontSize: 11,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  insightsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: "#3B82F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  insightsTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  insightsText: {
    fontSize: 14,
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
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  errorText: {
    fontSize: 15,
    color: "#6B7280",
  },
});
