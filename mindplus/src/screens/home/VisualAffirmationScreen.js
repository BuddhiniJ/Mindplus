// Visual Affirmation screen - guided calming session with breathing exercises
// Displays affirmations, box breathing, or grounding techniques based on emotion severity
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Animated,
  Platform,
  StatusBar,
} from "react-native";
import VisualAffirmation from "../../components/VisualAffirmation";
import BoxBreathingCard from "../../components/BoxBreathingCard";
import GroundingCard from "../../components/GroundingCard";
import { fetchCopingStrategy } from "../../services/api";

const SESSION_SECONDS = 60;
// Temporary override: show Box Breathing for all emotions/confidence.
const FORCE_BOX_BREATHING = true;

function normalizeEmotionKey(emotion) {
  if (!emotion) return "unknown";
  const key = String(emotion).trim().toLowerCase();
  if (key === "anxious") return "anxiety";
  return key;
}

// Map confidence score to intensity band (low, medium, high)
function getConfidenceBand(confidence) {
  const value =
    typeof confidence === "number" ? confidence : Number(confidence);
  if (!Number.isFinite(value)) return "medium";
  if (value < 0.4) return "low";
  if (value < 0.7) return "medium";
  return "high";
}

export default function VisualAffirmationScreen({ route, navigation }) {
  const {
    emotion = "sadness",
    severity = "medium",
    confidence,
    strategy: strategyFromRoute,
  } = route?.params || {};

  const [started, setStarted] = useState(false);
  const [sessionKey, setSessionKey] = useState(0);
  const bounceAnim = useMemo(() => new Animated.Value(0), []);
  const topPadding =
    Platform.OS === "android" ? StatusBar.currentHeight || 18 : 14;

  const visualSupportKey = useMemo(
    () => `${emotion}-${severity}`,
    [emotion, severity]
  );

  // Check if emotion is anxiety-related and its severity band
  const normalizedEmotion = useMemo(
    () => normalizeEmotionKey(emotion),
    [emotion]
  );
  const isAnxiety = normalizedEmotion === "anxiety";
  const anxietyBand = useMemo(
    () => getConfidenceBand(confidence),
    [confidence]
  );

  const showBreathing = FORCE_BOX_BREATHING || isAnxiety;

  const [secondsRemaining, setSecondsRemaining] = useState(SESSION_SECONDS);
  const timerPulseAnim = useMemo(() => new Animated.Value(1), []);
  // Progress animation for timer bar
  const timerProgressAnim = useMemo(() => new Animated.Value(1), []);

  // Coping strategy from API or props
  const [copingStrategy, setCopingStrategy] = useState(
    typeof strategyFromRoute === "string" ? strategyFromRoute : null
  );
  const [copingLoading, setCopingLoading] = useState(false);
  const [copingError, setCopingError] = useState(null);

  // Fetch or resolve coping strategy based on emotion and confidence
  useEffect(() => {
    let active = true;

    const fallbackByKey = {
      "sadness-medium":
        "Try a short reset: name what you feel, place one hand on your chest, and take 5 slow breaths with longer exhales.",
      "fear-high":
        "Ground yourself: look for 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, and 1 you can taste. Breathe slowly.",
    };

    async function resolveStrategy() {
      setCopingError(null);

      if (typeof strategyFromRoute === "string" && strategyFromRoute.trim()) {
        setCopingStrategy(strategyFromRoute);
        return;
      }

      const numericConfidence =
        typeof confidence === "number" ? confidence : Number(confidence);
      const canFetch = Number.isFinite(numericConfidence);
      if (canFetch) {
        try {
          setCopingLoading(true);
          const result = await fetchCopingStrategy(emotion, numericConfidence);
          if (!active) return;
          setCopingStrategy(result?.strategy || null);
        } catch (e) {
          if (!active) return;
          setCopingError(
            e?.message || "Unable to fetch coping strategy. Please try again."
          );
        } finally {
          if (active) setCopingLoading(false);
        }
        return;
      }

      setCopingStrategy(fallbackByKey[visualSupportKey] || null);
    }

    resolveStrategy();
    return () => {
      active = false;
    };
  }, [confidence, emotion, strategyFromRoute, visualSupportKey]);

  // Redirect back if anxiety level is too low for this screen
  useEffect(() => {
    if (FORCE_BOX_BREATHING) return;
    if (!isAnxiety || anxietyBand !== "low") return;
    navigation.goBack();
  }, [anxietyBand, isAnxiety, navigation]);

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(timerPulseAnim, {
          toValue: 1.08,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(timerPulseAnim, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [timerPulseAnim]);

  // Countdown timer for anxiety breathing exercises
  useEffect(() => {
    if (!showBreathing) return;
    let mounted = true;
    const interval = setInterval(() => {
      if (!mounted || !started) return;
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [showBreathing, started]);

  // Update timer progress bar as countdown progresses
  useEffect(() => {
    if (!showBreathing) return;
    const fraction =
      SESSION_SECONDS > 0 ? secondsRemaining / SESSION_SECONDS : 0;
    Animated.timing(timerProgressAnim, {
      toValue: fraction,
      duration: 220,
      useNativeDriver: false,
    }).start();
  }, [showBreathing, secondsRemaining, timerProgressAnim]);

  // Start or restart the calm session
  const handleStart = () => {
    setSessionKey((prev) => prev + 1);
    setStarted(true);
    setSecondsRemaining(SESSION_SECONDS);
    bounceAnim.setValue(0);
    Animated.spring(bounceAnim, {
      toValue: 1,
      friction: 5,
      useNativeDriver: true,
    }).start();
  };

  const emotionLabel = useMemo(() => {
    const raw = String(emotion || "").trim();
    if (!raw) return "Emotion";
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }, [emotion]);

  const footerTip = useMemo(() => {
    const e = String(emotion || "")
      .trim()
      .toLowerCase();
    if (e === "fear" || e === "anxiety" || e === "anxious" || e === "stress") {
      return "Tip: press your feet into the floor and exhale slowly to signal safety.";
    }
    if (e === "anger" || e === "angry") {
      return "Tip: unclench your jaw and exhale before responding.";
    }
    if (e === "sad" || e === "sadness") {
      return "Tip: use slow inhales and longer exhales to soothe your system.";
    }
    return "Tip: breathe in gently and exhale a little longer.";
  }, [emotion]);

  const heroCopy = {
    title: `${emotionLabel} Calm Minute`,
    subtitle: "Center yourself with slow breath and a gentle affirmation.",
  };

  const headerTitle = "Calm Session";

  const anxietyExercise = useMemo(() => {
    if (FORCE_BOX_BREATHING) return "box";
    if (!isAnxiety) return null;
    if (anxietyBand === "low") return "blocked";
    if (anxietyBand === "medium") return "box";
    return "grounding";
  }, [anxietyBand, isAnxiety]);

  // Do not show this screen if anxiety is very low
  if (!FORCE_BOX_BREATHING && isAnxiety && anxietyBand === "low") {
    return null;
  }

  return (
    <View style={styles.screen}>
      <SafeAreaView style={[styles.safe, { paddingTop: topPadding }]}>
        {/* Header with navigation and title */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            activeOpacity={0.8}
          >
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{headerTitle}</Text>
          <View style={{ width: 64 }} />
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>{heroCopy.title}</Text>
          <Text style={styles.heroSubtitle}>{heroCopy.subtitle}</Text>
        </View>

        <View style={styles.strategyCard}>
          <Text style={styles.strategyTitle}>Coping Strategy</Text>

          {copingLoading ? (
            <Text style={styles.strategyTextMuted}>
              Loading coping strategy...
            </Text>
          ) : copingError ? (
            <Text style={styles.strategyTextMuted}>{copingError}</Text>
          ) : copingStrategy ? (
            <Text style={styles.strategyText}>{copingStrategy}</Text>
          ) : (
            <Text style={styles.strategyTextMuted}>
              Take 5 slow breaths. Inhale softly and exhale a little longer.
            </Text>
          )}
        </View>

        {anxietyExercise === "box" ? (
          <BoxBreathingCard
            secondsRemaining={secondsRemaining}
            progressAnim={timerProgressAnim}
            pulseAnim={timerPulseAnim}
            sessionSeconds={SESSION_SECONDS}
          />
        ) : anxietyExercise === "grounding" ? (
          <GroundingCard
            secondsRemaining={secondsRemaining}
            progressAnim={timerProgressAnim}
            pulseAnim={timerPulseAnim}
            sessionSeconds={SESSION_SECONDS}
          />
        ) : (
          <Animated.View
            style={{
              transform: [
                {
                  scale: bounceAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.04],
                  }),
                },
              ],
            }}
          >
            <VisualAffirmation
              key={sessionKey}
              emotion={emotion}
              severity={severity}
              start={started}
              autoStart={false}
              durationSeconds={60}
            />
          </Animated.View>
        )}

        {/* Start/Restart button for the session */}
        <View style={styles.ctaRow}>
          <TouchableOpacity
            style={[styles.startButton, started && styles.startButtonActive]}
            activeOpacity={0.9}
            onPress={handleStart}
          >
            <Text style={styles.startButtonText}>
              {started ? "Restart 1:00" : "Start 1:00 Calm"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Emotion-specific breathing tip */}
        <View style={styles.footerNote}>
          <Text style={styles.footerText}>{footerTip}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#EAF2FF",
    paddingHorizontal: 18,
    paddingTop: 6,
  },
  scrollContent: {
    paddingBottom: 18,
  },
  safe: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    paddingTop: 6,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "#FFFFFFAA",
  },
  backText: {
    fontSize: 14,
    color: "#1F2937",
    fontWeight: "700",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },
  hero: {
    marginBottom: 18,
    padding: 10,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 15,
    color: "#374151",
    lineHeight: 22,
  },
  ctaRow: {
    marginTop: 6,
    marginBottom: 12,
  },
  strategyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  strategyTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 10,
  },
  strategyText: {
    fontSize: 15,
    color: "#111827",
    lineHeight: 22,
    fontWeight: "600",
  },
  strategyTextMuted: {
    fontSize: 14,
    color: "#4B5563",
    lineHeight: 20,
    fontWeight: "600",
  },
  startButton: {
    backgroundColor: "#3B82F6",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  startButtonActive: {
    backgroundColor: "#2563EB",
  },
  startButtonText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 16,
    letterSpacing: 0.4,
  },
  footerNote: {
    marginTop: 4,
    padding: 10,
    alignItems: "center",
  },
  footerText: {
    fontSize: 13,
    color: "#4B5563",
    textAlign: "center",
    lineHeight: 20,
  },
});
