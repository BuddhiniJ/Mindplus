// Overall Emotion screen - displays the dominant emotion from daily check-in responses
// Shows emotion breakdown, confidence level, and detailed insights
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Animated,
  Platform,
  StatusBar,
  Modal,
} from "react-native";
import BottomNavigation from "../../components/BottomNavigation";
import ScreenHeaderCard from "../../components/ScreenHeaderCard";

// Emotion type mappings with colors, emojis, and display labels
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

const calculateOverallEmotion = (answers) => {
  if (!answers || answers.length === 0) {
    return { emotion: "unknown", confidence: 0, colorCode: "#6B7280" };
  }

  // Count emotion occurrences and calculate weighted confidence
  const emotionScores = {};
  let totalConfidence = 0;

  answers.forEach((answer) => {
    let emotion = answer.emotion?.toLowerCase() || "unknown";
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
  const [isAnswersModalVisible, setIsAnswersModalVisible] = useState(false);
  const scaleAnim = React.useRef(new Animated.Value(0)).current;
  const topPadding =
    Platform.OS === "android" ? StatusBar.currentHeight || 18 : 14;
  const headerKicker = route?.params?.headerKicker || "EMOTION INSIGHT";
  const headerTitle = route?.params?.headerTitle || "Today's Overall Emotion";

  // Calculate overall emotion from daily check-in answers and trigger animation
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

  const emotionInfo =
    EMOTION_COLORS[overallEmotion.emotion] || EMOTION_COLORS.unknown;
  const confidencePercentage = Math.round(overallEmotion.confidence * 100);
  const checkInAnswers = route?.params?.answers || [];

  return (
    <View style={styles.container}>
      <ScreenHeaderCard
        topPadding={topPadding}
        kicker={headerKicker}
        title={headerTitle}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionSubtitle}>
          Based on your 4 daily check-in responses
        </Text>

        <TouchableOpacity
          style={styles.viewAnswersButton}
          onPress={() => setIsAnswersModalVisible(true)}
          activeOpacity={0.9}
        >
          <View style={styles.viewAnswersButtonIconBadge}>
            <Text style={styles.viewAnswersButtonIcon}>📝</Text>
          </View>
          <View style={styles.viewAnswersButtonTextWrap}>
            <Text style={styles.viewAnswersButtonTitle}>
              View Today&apos;s Check-In
            </Text>
            <Text style={styles.viewAnswersButtonSubtitle}>
              Tap to see your questions and personal responses
            </Text>
          </View>
          <Text style={styles.viewAnswersButtonArrow}>→</Text>
        </TouchableOpacity>

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
            <Text
              style={[
                styles.confidenceValue,
                { color: overallEmotion.colorCode },
              ]}
            >
              {confidencePercentage}%
            </Text>
            <Text style={styles.confidenceLabel}>Pattern Clarity</Text>
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
                ? "Very clear emotional pattern today"
                : confidencePercentage >= 60
                  ? "Mostly clear emotional pattern"
                  : confidencePercentage >= 40
                    ? "A balanced mix of emotional signals"
                    : "A gentle mix of different emotions"}
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
                const emotionColor =
                  EMOTION_COLORS[emotion] || EMOTION_COLORS.unknown;
                const percentage = ((scores.count / 4) * 100).toFixed(0);
                const avgConfidence =
                  (scores.totalConfidence / scores.count) * 100;

                return (
                  <View
                    key={emotion}
                    style={[
                      styles.breakdownCard,
                      { borderLeftColor: emotionColor.color },
                    ]}
                  >
                    <View style={styles.breakdownHeader}>
                      <Text style={styles.breakdownEmoji}>
                        {emotionColor.emoji}
                      </Text>
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
                        {Math.round(avgConfidence)}% match
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
            emotional pattern with{" "}
            <Text style={{ fontWeight: "700" }}>
              {confidencePercentage}% clarity
            </Text>
            . This suggests your answers are{" "}
            {confidencePercentage >= 80
              ? "very consistent across all questions"
              : confidencePercentage >= 60
                ? "mostly consistent with a little variation"
                : "naturally varied across different moments"}
            .
          </Text>
        </View>

        {/* Coping Strategy Button */}
        <TouchableOpacity
          style={[
            styles.copingStrategyButton,
            { backgroundColor: overallEmotion.colorCode },
          ]}
          onPress={() =>
            navigation.navigate("CopingStrategyScreen", {
              emotion: overallEmotion.emotion,
              confidence: overallEmotion.confidence,
            })
          }
          activeOpacity={0.8}
        >
          <Text style={styles.copingStrategyIcon}>💡</Text>
          <View style={styles.copingStrategyTextContainer}>
            <Text style={styles.copingStrategyTitle}>Get Coping Strategy</Text>
            <Text style={styles.copingStrategySubtitle}>
              Personalized guidance for your emotional state
            </Text>
          </View>
          <Text style={styles.copingStrategyArrow}>→</Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <Modal
        animationType="slide"
        transparent
        visible={isAnswersModalVisible}
        onRequestClose={() => setIsAnswersModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalKicker}>DAILY CHECK-IN</Text>
                <Text style={styles.modalTitle}>Your Questions & Answers</Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setIsAnswersModalVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCloseButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalScrollArea}
              showsVerticalScrollIndicator={false}
            >
              {checkInAnswers.length === 0 ? (
                <View style={styles.modalEmptyState}>
                  <Text style={styles.modalEmptyTitle}>
                    No check-in answers yet
                  </Text>
                  <Text style={styles.modalEmptyText}>
                    Complete your daily check-in to view your questions and
                    responses here.
                  </Text>
                </View>
              ) : null}

              {checkInAnswers.map((answer, index) => {
                const emotionMeta =
                  EMOTION_COLORS[answer?.emotion?.toLowerCase()] ||
                  EMOTION_COLORS.unknown;

                return (
                  <View
                    key={`${answer?.questionId || index}`}
                    style={styles.qaCard}
                  >
                    <View style={styles.qaTopRow}>
                      <Text style={styles.qaIndex}>Q{index + 1}</Text>
                      <View
                        style={[
                          styles.qaEmotionPill,
                          { backgroundColor: `${emotionMeta.color}1F` },
                        ]}
                      >
                        <Text
                          style={[
                            styles.qaEmotionPillText,
                            { color: emotionMeta.color },
                          ]}
                        >
                          {emotionMeta.emoji} {emotionMeta.label}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.qaQuestionText}>
                      {answer?.question || "Question not available"}
                    </Text>

                    <View style={styles.qaAnswerBox}>
                      <Text style={styles.qaAnswerLabel}>Your answer</Text>
                      <Text style={styles.qaAnswerText}>
                        {answer?.response || "No answer captured"}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <BottomNavigation navigation={navigation} activeTab="home" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
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
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionSubtitle: {
    fontSize: 15,
    color: "#6B7280",
    marginBottom: 24,
    paddingHorizontal: 2,
  },
  viewAnswersButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#DBEAFE",
    shadowColor: "#1D4ED8",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  viewAnswersButtonIconBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    marginRight: 12,
  },
  viewAnswersButtonIcon: {
    fontSize: 20,
  },
  viewAnswersButtonTextWrap: {
    flex: 1,
  },
  viewAnswersButtonTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E3A8A",
    marginBottom: 2,
  },
  viewAnswersButtonSubtitle: {
    fontSize: 12,
    color: "#475569",
    lineHeight: 18,
  },
  viewAnswersButtonArrow: {
    fontSize: 22,
    color: "#1D4ED8",
    fontWeight: "700",
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
    fontSize: 25,
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
    fontSize: 15,
    color: "#6B7280",
    lineHeight: 24,
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
  copingStrategyButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  copingStrategyIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  copingStrategyTextContainer: {
    flex: 1,
  },
  copingStrategyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  copingStrategySubtitle: {
    fontSize: 13,
    color: "#FFFFFF",
    opacity: 0.9,
  },
  copingStrategyArrow: {
    fontSize: 24,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  bottomSpacer: {
    height: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "flex-end",
  },
  modalCard: {
    maxHeight: "84%",
    backgroundColor: "#F8FAFC",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 22,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  modalKicker: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 2,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  modalCloseButtonText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#334155",
  },
  modalScrollArea: {
    marginTop: 2,
  },
  modalEmptyState: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 16,
    marginBottom: 12,
  },
  modalEmptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 4,
  },
  modalEmptyText: {
    fontSize: 13,
    color: "#64748B",
    lineHeight: 20,
  },
  qaCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  qaTopRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  qaIndex: {
    fontSize: 12,
    fontWeight: "800",
    color: "#1E293B",
    backgroundColor: "#E2E8F0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    marginRight: 8,
  },
  qaEmotionPill: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  qaEmotionPillText: {
    fontSize: 12,
    fontWeight: "700",
  },
  qaQuestionText: {
    fontSize: 15,
    lineHeight: 22,
    color: "#0F172A",
    fontWeight: "600",
    marginBottom: 10,
  },
  qaAnswerBox: {
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    padding: 10,
  },
  qaAnswerLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
    marginBottom: 4,
    letterSpacing: 0.4,
  },
  qaAnswerText: {
    fontSize: 14,
    color: "#334155",
    lineHeight: 20,
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
