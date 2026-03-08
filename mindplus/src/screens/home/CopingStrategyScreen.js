// Coping Strategy screen - displays personalized strategies based on detected emotion
// Shows severity level, confidence, and actionable coping recommendations
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Animated,
  useWindowDimensions,
} from "react-native";
import { fetchCopingStrategy } from "../../services/api";

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

// Severity levels with descriptions and visual indicators
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
  const ctaPulseAnim = React.useRef(new Animated.Value(1)).current;
  const { width } = useWindowDimensions();
  const isCompactScreen = width < 380;

  useEffect(() => {
    loadCopingStrategy();
  }, []);

  const normalizedEmotion = String(copingData?.emotion || "")
    .trim()
    .toLowerCase();
  const confidenceValue = Number(copingData?.confidence);
  const isAnxiety = normalizedEmotion === "anxiety";
  const isStress =
    normalizedEmotion === "stress" || normalizedEmotion === "stressed";
  const anxietyBand = !Number.isFinite(confidenceValue)
    ? "medium"
    : confidenceValue < 0.4
      ? "low"
      : confidenceValue < 0.7
        ? "medium"
        : "high";
  const stressBand = !Number.isFinite(confidenceValue)
    ? "medium"
    : confidenceValue < 0.4
      ? "low"
      : confidenceValue < 0.7
        ? "medium"
        : "high";
  const allowCalmSession =
    !(isAnxiety && anxietyBand === "low") &&
    !(isStress && stressBand === "low");

  useEffect(() => {
    if (!copingData || loading || error || !allowCalmSession) {
      ctaPulseAnim.setValue(1);
      return;
    }

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(ctaPulseAnim, {
          toValue: 1.04,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(ctaPulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );

    pulse.start();

    return () => {
      pulse.stop();
    };
  }, [allowCalmSession, ctaPulseAnim, copingData, loading, error]);

  // Fetch coping strategy from API based on emotion and confidence
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

      // Play entrance animations
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

  // Show loading spinner while fetching data
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

  // Show error message if API call fails
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

  const techniqueDurationSeconds = Number(copingData.duration_seconds);
  const techniqueDurationLabel = Number.isFinite(techniqueDurationSeconds)
    ? `${Math.max(1, Math.round(techniqueDurationSeconds / 60))}-minute`
    : "1-minute";
  const recommendedTechnique = copingData.technique || "Guided affirmation";

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
          <View
            style={[
              styles.summaryGlow,
              { backgroundColor: emotionInfo.color + "22" },
            ]}
          />

          <View style={styles.summaryTopRow}>
            <Text style={styles.summaryTag}>Emotion Snapshot</Text>
            <View style={styles.confidenceChip}>
              <Text style={styles.confidenceChipText}>
                {confidencePercentage}% sure
              </Text>
            </View>
          </View>

          <View style={styles.emotionSummaryHeader}>
            <View
              style={[
                styles.emotionIconContainer,
                { backgroundColor: emotionInfo.color + "25" },
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

          <View style={styles.confidenceBarWrap}>
            <View style={styles.confidenceTrack}>
              <View
                style={[
                  styles.confidenceFill,
                  {
                    backgroundColor: emotionInfo.color,
                    width: `${Math.max(6, confidencePercentage)}%`,
                  },
                ]}
              />
            </View>
          </View>

          <View
            style={[
              styles.severityBadge,
              { borderColor: severityInfo.color + "40" },
            ]}
          >
            <View
              style={[
                styles.severityIconBubble,
                { backgroundColor: severityInfo.color + "25" },
              ]}
            >
              <Text style={styles.severityIcon}>{severityInfo.icon}</Text>
            </View>
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
          <View
            style={[
              styles.strategyGlow,
              { backgroundColor: emotionInfo.color + "20" },
            ]}
          />

          <View style={styles.strategyTopRow}>
            <View
              style={[
                styles.strategyPill,
                { backgroundColor: emotionInfo.color + "20" },
              ]}
            >
              <Text
                style={[styles.strategyPillText, { color: emotionInfo.color }]}
              >
                TOP PICK
              </Text>
            </View>
            <View
              style={[
                styles.strategyPulse,
                { backgroundColor: emotionInfo.color },
              ]}
            />
          </View>

          <View style={styles.strategyHeader}>
            <Text style={styles.strategyIcon}>💡</Text>
            <Text
              style={[
                styles.strategyTitle,
                isCompactScreen && styles.strategyTitleCompact,
              ]}
            >
              {isCompactScreen
                ? "Recommended Action"
                : "Recommended Action for You"}
            </Text>
          </View>

          <View
            style={[
              styles.strategyContent,
              { borderColor: emotionInfo.color + "35" },
            ]}
          >
            <Text style={styles.strategyLead}>Right now, try this:</Text>
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

        {allowCalmSession && (
          <Animated.View
            style={[
              styles.calmingCard,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            <View style={styles.calmingGlow} />

            <View style={styles.calmingTopRow}>
              <View style={styles.calmingBadge}>
                <Text style={styles.calmingBadgeText}>PRIORITY STEP</Text>
              </View>
              <View style={styles.calmingIconWrap}>
                <Text style={styles.calmingCardIcon}>🧘</Text>
              </View>
            </View>

            <View style={styles.calmingPriorityRow}>
              <View style={styles.calmingPriorityDot} />
              <Text style={styles.calmingPriorityText}>
                Most effective action for your current state
              </Text>
            </View>

            <Text style={styles.calmingTitle}>
              Tap here for your next technique
            </Text>
            <Text style={styles.calmingText}>
              Start your {techniqueDurationLabel} coping session now to regulate
              your emotion quickly.
            </Text>

            {/* <View style={styles.calmingTechniqueHighlight}>
              <Text style={styles.calmingTechniqueText}>
                Recommended: {recommendedTechnique}
              </Text>
            </View> */}

            <Animated.View style={{ transform: [{ scale: ctaPulseAnim }] }}>
              <TouchableOpacity
                style={styles.calmingButton}
                onPress={() =>
                  navigation.navigate("VisualAffirmationScreen", {
                    emotion: copingData.emotion,
                    severity: copingData.severity,
                    confidence: copingData.confidence,
                    strategy: copingData.strategy,
                    technique: copingData.technique,
                    duration_seconds: copingData.duration_seconds,
                  })
                }
                activeOpacity={0.85}
              >
                <View style={styles.calmingButtonInnerRow}>
                  <Text style={styles.calmingButtonText}>
                    Start My Technique Now
                  </Text>
                  <Text style={styles.calmingButtonArrow}>→</Text>
                </View>
              </TouchableOpacity>
            </Animated.View>

            <Text style={styles.calmingSubHint}>
              Open your personalized coping technique and begin immediately.
            </Text>
          </Animated.View>
        )}

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
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    position: "relative",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  summaryGlow: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    right: -40,
    top: -60,
  },
  summaryTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  summaryTag: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: "#374151",
  },
  confidenceChip: {
    backgroundColor: "#EEF2FF",
    borderWidth: 1,
    borderColor: "#C7D2FE",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  confidenceChipText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#3730A3",
  },
  emotionSummaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  emotionIconContainer: {
    width: 62,
    height: 62,
    borderRadius: 31,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  emotionIcon: {
    fontSize: 34,
  },
  emotionSummaryText: {
    flex: 1,
  },
  emotionName: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 2,
  },
  confidenceText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  confidenceBarWrap: {
    marginBottom: 14,
  },
  confidenceTrack: {
    height: 8,
    backgroundColor: "#E5E7EB",
    borderRadius: 999,
    overflow: "hidden",
  },
  confidenceFill: {
    height: "100%",
    borderRadius: 999,
  },
  severityBadge: {
    flexDirection: "row",
    backgroundColor: "#F8FAFC",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
  },
  severityIconBubble: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  severityIcon: {
    fontSize: 20,
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
    position: "relative",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 5,
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  strategyGlow: {
    position: "absolute",
    top: -40,
    right: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  strategyTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  strategyPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  strategyPillText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  strategyPulse: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  strategyHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  strategyIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  strategyTitle: {
    fontSize: 23,
    fontWeight: "700",
    color: "#111827",
    flex: 1,
    flexShrink: 1,
    lineHeight: 30,
  },
  strategyTitleCompact: {
    fontSize: 20,
    lineHeight: 26,
  },
  strategyContent: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
  },
  strategyLead: {
    fontSize: 13,
    color: "#2563EB",
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  strategyText: {
    fontSize: 17,
    color: "#1F2937",
    lineHeight: 28,
    fontWeight: "600",
  },
  strategyFooter: {
    paddingTop: 14,
  },
  tipContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    padding: 12,
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
  calmingCard: {
    backgroundColor: "#EFF6FF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#93C5FD",
    position: "relative",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  calmingGlow: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "#BFDBFE",
    top: -60,
    right: -50,
    opacity: 0.6,
  },
  calmingTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  calmingPriorityRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    backgroundColor: "#DBEAFE",
    borderWidth: 1,
    borderColor: "#93C5FD",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: "flex-start",
  },
  calmingPriorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#1D4ED8",
    marginRight: 8,
  },
  calmingPriorityText: {
    color: "#1E3A8A",
    fontSize: 12,
    fontWeight: "700",
  },
  calmingBadge: {
    backgroundColor: "#DBEAFE",
    borderWidth: 1,
    borderColor: "#93C5FD",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  calmingBadgeText: {
    color: "#1D4ED8",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.7,
  },
  calmingIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  calmingCardIcon: {
    fontSize: 18,
  },
  calmingTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0B3B8C",
    marginBottom: 8,
  },
  calmingText: {
    fontSize: 15,
    color: "#1E3A8A",
    marginBottom: 12,
    lineHeight: 22,
  },
  calmingTechniqueHighlight: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  calmingTechniqueText: {
    color: "#1D4ED8",
    fontSize: 14,
    fontWeight: "700",
  },
  calmingButton: {
    backgroundColor: "#1D4ED8",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    shadowColor: "#1D4ED8",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 5,
    borderWidth: 1,
    borderColor: "#1E40AF",
  },
  calmingButtonInnerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  calmingButtonText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 15,
    letterSpacing: 0.5,
  },
  calmingButtonArrow: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 18,
    marginLeft: 8,
    marginTop: -1,
  },
  calmingSubHint: {
    marginTop: 10,
    color: "#1E40AF",
    fontSize: 12,
    textAlign: "center",
    fontWeight: "600",
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
