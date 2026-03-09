import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import CalmTimer from "./CalmTimer";
import {
  playBotMessageVoice,
  stopBotMessageVoice,
} from "../services/textToSpeechService";

const VISUAL_PRESETS = {
  "sadness-medium": {
    label: "Self-Compassion",
    title: "A kinder moment",
    affirmation:
      "I am safe, I am present, and I will move through this gently.",
    background: "#ECF2FF",
    pulseColor: "#A5B4FC",
    textColor: "#0F172A",
  },
  "fear-high": {
    label: "Grounding Affirmation",
    title: "You are safe right now",
    affirmation:
      "I am safe, I am present. I can handle this moment, one breath at a time.",
    background: "#E7F5FF",
    pulseColor: "#7DD3FC",
    textColor: "#0B1E34",
  },
};

const EMOTION_FALLBACKS = {
  sadness: {
    label: "Self-Compassion",
    title: "A kinder moment",
    affirmation: "This feeling is valid. I can meet it with gentleness.",
    background: "#ECF2FF",
    pulseColor: "#A5B4FC",
    textColor: "#0F172A",
  },
  fear: {
    label: "Grounding Affirmation",
    title: "You are safe right now",
    affirmation: "I can slow down. In this moment, I am safe enough.",
    background: "#E7F5FF",
    pulseColor: "#7DD3FC",
    textColor: "#0B1E34",
  },
  anxiety: {
    label: "Steady Breath",
    title: "One step at a time",
    affirmation: "I can focus on one breath, then the next.",
    background: "#F3E8FF",
    pulseColor: "#C4B5FD",
    textColor: "#1F1147",
  },
  stress: {
    label: "Reset",
    title: "Return to balance",
    affirmation: "I can release what I cannot control and return to my breath.",
    background: "#FFF7ED",
    pulseColor: "#FDBA74",
    textColor: "#2A1606",
  },
  anger: {
    label: "Pause",
    title: "Respond with clarity",
    affirmation: "I can pause. I choose a calm and clear response.",
    background: "#FEF2F2",
    pulseColor: "#FCA5A5",
    textColor: "#2B0A0A",
  },
  joy: {
    label: "Gratitude",
    title: "Savor this moment",
    affirmation: "I allow myself to feel joy and appreciate this moment.",
    background: "#FFFBEB",
    pulseColor: "#FDE68A",
    textColor: "#1F1A05",
  },
  happy: {
    label: "Positive Moment",
    title: "Stay present",
    affirmation: "I notice this good feeling and let it fill my body.",
    background: "#FFFBEB",
    pulseColor: "#FDE68A",
    textColor: "#1F1A05",
  },
  calm: {
    label: "Calm Presence",
    title: "Keep it steady",
    affirmation: "I breathe slowly and stay grounded in the present.",
    background: "#ECFDF5",
    pulseColor: "#6EE7B7",
    textColor: "#062113",
  },
  neutral: {
    label: "Mindful Check-In",
    title: "Notice without judgment",
    affirmation: "I observe how I feel with curiosity and kindness.",
    background: "#F3F4F6",
    pulseColor: "#CBD5E1",
    textColor: "#0F172A",
  },
  surprise: {
    label: "Settle",
    title: "Find your center",
    affirmation: "I can pause and let my body settle.",
    background: "#FDF2F8",
    pulseColor: "#FBCFE8",
    textColor: "#2A0B1B",
  },
  disgust: {
    label: "Release",
    title: "Let it pass",
    affirmation: "I can soften my body and let this feeling pass through.",
    background: "#F7FEE7",
    pulseColor: "#BEF264",
    textColor: "#17210A",
  },
  confused: {
    label: "Clarity",
    title: "One thing at a time",
    affirmation: "I can slow down and focus on the next small step.",
    background: "#FFFBEB",
    pulseColor: "#FCD34D",
    textColor: "#1F1A05",
  },
  excited: {
    label: "Steady Energy",
    title: "Channel it gently",
    affirmation: "I can enjoy this energy while staying grounded.",
    background: "#FDF2F8",
    pulseColor: "#F9A8D4",
    textColor: "#2A0B1B",
  },
  love: {
    label: "Warmth",
    title: "Open-hearted breath",
    affirmation: "I allow warmth and care to flow through me.",
    background: "#FFF1F2",
    pulseColor: "#FDA4AF",
    textColor: "#2A0B12",
  },
  unknown: {
    label: "Grounding",
    title: "Return to the present",
    affirmation: "I breathe in. I breathe out. I am here, right now.",
    background: "#F3F4F6",
    pulseColor: "#CBD5E1",
    textColor: "#0F172A",
  },
};

const DURATION_OPTIONS = [30, 60, 120, 300, 600];

function normalizeEmotion(emotion) {
  if (!emotion) return "unknown";
  const key = String(emotion).trim().toLowerCase();
  if (key === "sad") return "sadness";
  if (key === "anxious") return "anxiety";
  return key;
}

function normalizeSeverity(severity) {
  const key = String(severity || "")
    .trim()
    .toLowerCase();
  if (key === "low" || key === "medium" || key === "high") return key;
  return "low";
}

function applySeverityToPreset(preset, severity) {
  const sev = normalizeSeverity(severity);
  if (sev === "high") {
    return {
      ...preset,
      title: preset.title,
      affirmation: preset.affirmation,
    };
  }
  if (sev === "medium") {
    return preset;
  }
  return {
    ...preset,
    title: preset.title,
  };
}

function getVisualPreset(emotion, severity) {
  const e = normalizeEmotion(emotion);
  const s = normalizeSeverity(severity);
  const key = `${e}-${s}`;
  if (VISUAL_PRESETS[key]) return VISUAL_PRESETS[key];
  const base = EMOTION_FALLBACKS[e] || EMOTION_FALLBACKS.unknown;
  return applySeverityToPreset(base, s);
}

function formatTime(totalSeconds) {
  const clamped = Math.max(0, Math.floor(totalSeconds));
  const minutes = String(Math.floor(clamped / 60)).padStart(2, "0");
  const seconds = String(clamped % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function formatDurationLabel(totalSeconds) {
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const minutes = totalSeconds / 60;
  return `${minutes}m`;
}

export default function VisualAffirmation({
  emotion,
  severity,
  start,
  autoStart = true,
  durationSeconds = 60,
  onDurationChange,
}) {
  const visualKey = useMemo(
    () => `${emotion}-${severity}`,
    [emotion, severity]
  );
  const preset = useMemo(
    () => getVisualPreset(emotion, severity),
    [emotion, severity, visualKey]
  );

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(1)).current;
  const [selectedDuration, setSelectedDuration] = useState(durationSeconds);
  const [secondsRemaining, setSecondsRemaining] = useState(durationSeconds);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const prevStart = useRef(start);

  const isControlled = typeof start === "boolean";
  const [internalRunning, setInternalRunning] = useState(autoStart);
  const running = isControlled ? start : internalRunning;

  useEffect(() => {
    setSelectedDuration(durationSeconds);
    setSecondsRemaining(durationSeconds);
  }, [durationSeconds]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 900,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  useEffect(() => {
    if (isControlled) {
      const prev = prevStart.current;
      if (start && !prev) {
        setSecondsRemaining(selectedDuration);
      }
      prevStart.current = start;
    }
  }, [isControlled, start, selectedDuration]);

  useEffect(() => {
    let mounted = true;
    const interval = setInterval(() => {
      if (!mounted || !running) return;
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [running]);

  useEffect(() => {
    const fraction =
      selectedDuration > 0 ? secondsRemaining / selectedDuration : 0;
    Animated.timing(progressAnim, {
      toValue: fraction,
      duration: 220,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, [secondsRemaining, selectedDuration, progressAnim]);

  useEffect(() => {
    return () => {
      stopBotMessageVoice();
    };
  }, []);

  const handleSpeakToggle = async () => {
    if (isSpeaking) {
      await stopBotMessageVoice();
      setIsSpeaking(false);
      return;
    }

    setIsSpeaking(true);
    await playBotMessageVoice(preset.affirmation, {
      onFinish: () => {
        setIsSpeaking(false);
      },
    });
  };

  const handleDurationSelect = (nextDuration) => {
    setSelectedDuration(nextDuration);
    setSecondsRemaining(nextDuration);
    if (typeof onDurationChange === "function") {
      onDurationChange(nextDuration);
    }
  };

  if (!preset) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: preset.background },
        { opacity: fadeAnim },
      ]}
    >
      <View style={styles.glowA} />
      <View style={styles.glowB} />

      <Animated.View
        pointerEvents="none"
        style={[
          styles.pulse,
          { borderColor: preset.pulseColor },
          { transform: [{ scale: pulseAnim }] },
        ]}
      />

      <View style={styles.content}>
        <View style={styles.headerRow}>
          <View
            style={[
              styles.labelBadge,
              {
                borderColor: preset.pulseColor,
              },
            ]}
          >
            <Text style={[styles.label, { color: preset.textColor }]}>
              {preset.label}
            </Text>
          </View>
          <Text style={[styles.momentTag, { color: preset.textColor }]}>
            {formatDurationLabel(selectedDuration)} Calm
          </Text>
        </View>

        <Text style={[styles.title, { color: preset.textColor }]}>
          {preset.title}
        </Text>

        <View style={styles.quoteWrap}>
          <Text style={[styles.affirmation, { color: preset.textColor }]}>
            {preset.affirmation}
          </Text>

          <View style={styles.ttsRow}>
            <TouchableOpacity
              style={[
                styles.ttsButton,
                { borderColor: preset.pulseColor },
                isSpeaking && {
                  backgroundColor: preset.pulseColor + "33",
                },
              ]}
              onPress={handleSpeakToggle}
              activeOpacity={0.85}
            >
              <Text style={[styles.ttsButtonText, { color: preset.textColor }]}>
                {isSpeaking ? "Stop Voice" : "Listen Affirmation"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.durationSection}>
          <Text style={[styles.durationTitle, { color: preset.textColor }]}>
            Session Length
          </Text>
          <View style={styles.durationRow}>
            {DURATION_OPTIONS.map((option) => {
              const isActive = option === selectedDuration;
              return (
                <Text
                  key={option}
                  style={[
                    styles.durationChip,
                    { borderColor: preset.pulseColor },
                    isActive && [
                      styles.durationChipActive,
                      { backgroundColor: preset.pulseColor + "33" },
                    ],
                  ]}
                  onPress={() => handleDurationSelect(option)}
                >
                  <Text
                    style={[
                      styles.durationChipText,
                      { color: preset.textColor },
                      isActive && styles.durationChipTextActive,
                    ]}
                  >
                    {formatDurationLabel(option)}
                  </Text>
                </Text>
              );
            })}
          </View>
        </View>

        <CalmTimer
          progressAnim={progressAnim}
          pulseAnim={pulseAnim}
          remainingLabel={formatTime(secondsRemaining)}
          ringColor={preset.pulseColor}
          textColor={preset.textColor}
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    borderRadius: 24,
    padding: 22,
    marginBottom: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#FFFFFFB0",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
  glowA: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "#FFFFFF",
    top: -110,
    right: -60,
    opacity: 0.3,
  },
  glowB: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#FFFFFF",
    bottom: -70,
    left: -40,
    opacity: 0.22,
  },
  pulse: {
    position: "absolute",
    top: -24,
    left: -24,
    right: -24,
    bottom: -24,
    borderRadius: 28,
    borderWidth: 1.2,
    opacity: 0.28,
  },
  content: {
    gap: 12,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  labelBadge: {
    borderWidth: 1,
    borderRadius: 999,
    backgroundColor: "#FFFFFFC5",
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  momentTag: {
    fontSize: 12,
    fontWeight: "700",
    opacity: 0.75,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    lineHeight: 30,
  },
  quoteWrap: {
    backgroundColor: "#FFFFFFA8",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  quoteMark: {
    fontSize: 22,
    lineHeight: 22,
    fontWeight: "800",
    opacity: 0.45,
    marginBottom: 2,
  },
  affirmation: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "600",
    opacity: 0.95,
  },
  ttsRow: {
    marginTop: 12,
    flexDirection: "row",
  },
  ttsButton: {
    borderWidth: 1,
    borderRadius: 999,
    backgroundColor: "#FFFFFFD9",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  ttsButtonText: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  durationSection: {
    marginTop: 2,
  },
  durationTitle: {
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 8,
    opacity: 0.75,
  },
  durationRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  durationChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#FFFFFFCC",
  },
  durationChipActive: {
    borderWidth: 1.5,
  },
  durationChipText: {
    fontSize: 12,
    fontWeight: "700",
  },
  durationChipTextActive: {
    fontWeight: "900",
  },
  timerBadge: {
    marginTop: 8,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "#FFFFFFAA",
  },
});
