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
import MovementBreakCard from "../../components/MovementBreakCard";
import SelfCompassionCard from "../../components/SelfCompassionCard";
import { fetchCopingStrategy } from "../../services/api";

const DEFAULT_SESSION_SECONDS = 60;
const MOVEMENT_BREAK_SECONDS = 300;
const SELF_COMPASSION_SECONDS = 60;
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
    technique: techniqueFromRoute,
    duration_seconds: durationFromRoute,
  } = route?.params || {};

  const [started, setStarted] = useState(false);
  const [sessionKey, setSessionKey] = useState(0);
  const [selectedTechnique, setSelectedTechnique] = useState("box");
  const [affirmationDuration, setAffirmationDuration] = useState(60);
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

  const [secondsRemaining, setSecondsRemaining] = useState(
    DEFAULT_SESSION_SECONDS
  );
  const timerPulseAnim = useMemo(() => new Animated.Value(1), []);
  // Progress animation for timer bar
  const timerProgressAnim = useMemo(() => new Animated.Value(1), []);

  // Coping strategy from API or props
  const [copingStrategy, setCopingStrategy] = useState(
    typeof strategyFromRoute === "string" ? strategyFromRoute : null
  );
  const [copingLoading, setCopingLoading] = useState(false);
  const [copingError, setCopingError] = useState(null);
  const [recommendedTechnique, setRecommendedTechnique] = useState(
    typeof techniqueFromRoute === "string" ? techniqueFromRoute : null
  );
  const [recommendedDuration, setRecommendedDuration] = useState(
    Number.isFinite(Number(durationFromRoute))
      ? Number(durationFromRoute)
      : null
  );

  const mapTechniqueKey = (rawTechnique) => {
    const key = String(rawTechnique || "")
      .trim()
      .toLowerCase();
    if (key === "movement_break") return "movement";
    if (key === "box_breathing") return "box";
    if (key === "grounding") return "grounding";
    if (key === "self_compassion") return "self_compassion";
    if (key === "calmtimer") return "affirmation";
    return null;
  };

  const activeSessionSeconds = useMemo(() => {
    if (selectedTechnique === "movement") {
      return Number.isFinite(Number(recommendedDuration)) &&
        Number(recommendedDuration) > 0
        ? Number(recommendedDuration)
        : MOVEMENT_BREAK_SECONDS;
    }
    if (selectedTechnique === "self_compassion") {
      return Number.isFinite(Number(recommendedDuration)) &&
        Number(recommendedDuration) > 0
        ? Number(recommendedDuration)
        : SELF_COMPASSION_SECONDS;
    }
    return DEFAULT_SESSION_SECONDS;
  }, [recommendedDuration, selectedTechnique]);

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
          setRecommendedTechnique(result?.technique || null);
          setRecommendedDuration(result?.duration_seconds ?? null);
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
      activeSessionSeconds > 0 ? secondsRemaining / activeSessionSeconds : 0;
    Animated.timing(timerProgressAnim, {
      toValue: fraction,
      duration: 220,
      useNativeDriver: false,
    }).start();
  }, [
    activeSessionSeconds,
    showBreathing,
    secondsRemaining,
    timerProgressAnim,
  ]);

  // Start or restart the calm session
  const handleStart = () => {
    setSessionKey((prev) => prev + 1);
    setStarted(true);
    setSecondsRemaining(activeSessionSeconds);
    bounceAnim.setValue(0);
    Animated.spring(bounceAnim, {
      toValue: 1,
      friction: 5,
      useNativeDriver: true,
    }).start();
  };

  const handleStop = () => {
    setStarted(false);
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

  useEffect(() => {
    const mapped = mapTechniqueKey(recommendedTechnique);
    if (mapped) {
      setSelectedTechnique(mapped);
      return;
    }

    if (anxietyExercise === "grounding") {
      setSelectedTechnique("grounding");
      return;
    }
    if (anxietyExercise === "box") {
      setSelectedTechnique("box");
      return;
    }
    setSelectedTechnique("affirmation");
  }, [anxietyExercise, recommendedTechnique]);

  useEffect(() => {
    if (!started) {
      setSecondsRemaining(activeSessionSeconds);
    } else {
      setSecondsRemaining((prev) => Math.min(prev, activeSessionSeconds));
    }
  }, [activeSessionSeconds, started]);

  const techniqueOptions = useMemo(
    () => [
      {
        key: "affirmation",
        label: "Calm Timer",
        icon: "🌟",
        caption: "Gentle positive guidance",
      },
      {
        key: "box",
        label: "Box Breathing",
        icon: "🫁",
        caption: "Steady 4-step rhythm",
      },
      {
        key: "grounding",
        label: "Grounding",
        icon: "🌿",
        caption: "Anchor with your senses",
      },
      {
        key: "self_compassion",
        label: "Self Compassion",
        icon: "💗",
        caption: "Pause, speak kindly, and repeat slowly",
      },
      {
        key: "movement",
        label: "Movement Break",
        icon: "🚶",
        caption: "Stand, stretch, and walk for 5 minutes",
      },
    ],
    []
  );

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
          <View style={styles.strategyGlow} />

          <View style={styles.strategyTopRow}>
            <View style={styles.strategyBadge}>
              <Text style={styles.strategyBadgeText}>PERSONALIZED</Text>
            </View>
            <Text style={styles.strategyEmoji}>💡</Text>
          </View>

          <Text style={styles.strategyTitle}>Your Coping Strategy</Text>
          <Text style={styles.strategyLead}>Take this one small step now:</Text>

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

        {selectedTechnique === "box" ? (
          <BoxBreathingCard
            secondsRemaining={secondsRemaining}
            progressAnim={timerProgressAnim}
            pulseAnim={timerPulseAnim}
            sessionSeconds={activeSessionSeconds}
          />
        ) : selectedTechnique === "grounding" ? (
          <GroundingCard
            secondsRemaining={secondsRemaining}
            progressAnim={timerProgressAnim}
            pulseAnim={timerPulseAnim}
            sessionSeconds={activeSessionSeconds}
          />
        ) : selectedTechnique === "movement" ? (
          <MovementBreakCard
            secondsRemaining={secondsRemaining}
            progressAnim={timerProgressAnim}
            pulseAnim={timerPulseAnim}
            sessionSeconds={activeSessionSeconds}
          />
        ) : selectedTechnique === "self_compassion" ? (
          <SelfCompassionCard
            secondsRemaining={secondsRemaining}
            progressAnim={timerProgressAnim}
            pulseAnim={timerPulseAnim}
            sessionSeconds={activeSessionSeconds}
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
              durationSeconds={affirmationDuration}
              onDurationChange={setAffirmationDuration}
            />
          </Animated.View>
        )}

        {/* Start/Restart and Stop controls */}
        <View style={styles.ctaPanel}>
          <View style={styles.sessionStatusRow}>
            <Text style={styles.sessionStatusText}>
              {started ? "Session Active" : "Session Ready"}
            </Text>
            {/* <Text style={styles.sessionStatusTime}>
              {secondsRemaining}s left
            </Text> */}
          </View>

          <View style={styles.ctaRow}>
            <TouchableOpacity
              style={[styles.startButton, started && styles.startButtonActive]}
              activeOpacity={0.9}
              onPress={handleStart}
            >
              <Text style={styles.startButtonText}>
                {started ? "↻ Restart" : "▶ Start Calm"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.stopButton, !started && styles.stopButtonDisabled]}
              activeOpacity={0.9}
              onPress={handleStop}
              disabled={!started}
            >
              <Text
                style={[
                  styles.stopButtonText,
                  !started && styles.stopButtonTextDisabled,
                ]}
              >
                ⏹ Stop
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.techniqueCard}>
          <View style={styles.techniqueHeaderRow}>
            <Text style={styles.techniqueTitle}>
              Try Other Coping Techniques
            </Text>
            <Text style={styles.techniqueHeaderIcon}>🎛️</Text>
          </View>
          <Text style={styles.techniqueSubtitle}>
            Pick the support style that feels best right now.
          </Text>

          {techniqueOptions.map((option) => {
            const isActive = selectedTechnique === option.key;
            return (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.techniqueButton,
                  isActive && styles.techniqueButtonActive,
                ]}
                activeOpacity={0.88}
                onPress={() => setSelectedTechnique(option.key)}
              >
                <Text style={styles.techniqueButtonIcon}>{option.icon}</Text>
                <View style={styles.techniqueTextWrap}>
                  <Text
                    style={[
                      styles.techniqueButtonLabel,
                      isActive && styles.techniqueButtonLabelActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                  <Text
                    style={[
                      styles.techniqueButtonCaption,
                      isActive && styles.techniqueButtonCaptionActive,
                    ]}
                  >
                    {option.caption}
                  </Text>
                </View>
                {isActive ? (
                  <Text style={styles.techniqueSelected}>Selected</Text>
                ) : null}
              </TouchableOpacity>
            );
          })}
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
  ctaPanel: {
    marginTop: 6,
    marginBottom: 12,
    backgroundColor: "#F8FAFF",
    borderWidth: 1,
    borderColor: "#D6E6FF",
    borderRadius: 16,
    padding: 12,
  },
  sessionStatusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  sessionStatusText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1D4ED8",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sessionStatusTime: {
    fontSize: 13,
    fontWeight: "700",
    color: "#334155",
  },
  ctaRow: {
    flexDirection: "row",
    gap: 10,
  },
  strategyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
    position: "relative",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },
  strategyGlow: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "#DBEAFE",
    top: -58,
    right: -48,
    opacity: 0.75,
  },
  strategyTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  strategyBadge: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#93C5FD",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  strategyBadgeText: {
    fontSize: 11,
    color: "#1D4ED8",
    fontWeight: "800",
    letterSpacing: 0.7,
  },
  strategyEmoji: {
    fontSize: 20,
  },
  strategyTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 6,
  },
  strategyLead: {
    fontSize: 13,
    color: "#1D4ED8",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 10,
  },
  strategyText: {
    fontSize: 16,
    color: "#0F172A",
    lineHeight: 24,
    fontWeight: "600",
  },
  strategyTextMuted: {
    fontSize: 14,
    color: "#475569",
    lineHeight: 21,
    fontWeight: "600",
  },
  techniqueCard: {
    backgroundColor: "#F8FAFF",
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#D1E4FF",
  },
  techniqueHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  techniqueTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },
  techniqueHeaderIcon: {
    fontSize: 18,
  },
  techniqueSubtitle: {
    fontSize: 13,
    color: "#475569",
    marginBottom: 10,
  },
  techniqueButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDEAFE",
    borderRadius: 14,
    paddingVertical: 11,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  techniqueButtonActive: {
    borderColor: "#60A5FA",
    backgroundColor: "#EFF6FF",
    shadowColor: "#60A5FA",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 6,
    elevation: 2,
  },
  techniqueButtonIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  techniqueTextWrap: {
    flex: 1,
    paddingRight: 8,
  },
  techniqueButtonLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 2,
  },
  techniqueButtonLabelActive: {
    color: "#1D4ED8",
  },
  techniqueButtonCaption: {
    fontSize: 12,
    color: "#64748B",
  },
  techniqueButtonCaptionActive: {
    color: "#334155",
  },
  techniqueSelected: {
    fontSize: 11,
    fontWeight: "800",
    color: "#1D4ED8",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  startButton: {
    backgroundColor: "#3B82F6",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
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
    fontSize: 15,
    letterSpacing: 0.3,
  },
  stopButton: {
    width: 120,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EEF2FF",
    borderWidth: 1,
    borderColor: "#C7D2FE",
    paddingVertical: 16,
  },
  stopButtonDisabled: {
    backgroundColor: "#F8FAFC",
    borderColor: "#E2E8F0",
  },
  stopButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#475569",
    letterSpacing: 0.2,
  },
  stopButtonTextDisabled: {
    color: "#94A3B8",
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
