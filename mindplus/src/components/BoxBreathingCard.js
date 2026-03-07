// Box breathing card component - displays 4-4-4-4 breathing exercise with countdown timer
import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import CalmTimer from "./CalmTimer";

function formatTime(totalSeconds) {
  const clamped = Math.max(0, Math.floor(totalSeconds));
  const minutes = String(Math.floor(clamped / 60)).padStart(2, "0");
  const seconds = String(clamped % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

// Main component for displaying box breathing exercise (inhale 4s, hold 4s, exhale 4s, hold 4s)
export default function BoxBreathingCard({
  secondsRemaining,
  progressAnim,
  pulseAnim,
  sessionSeconds = 60,
  title = "Box Breathing (4–4–4–4)",
}) {
  // Calculate current breathing phase (inhale, hold, exhale, hold) based on elapsed time
  const phase = useMemo(() => {
    const elapsed = sessionSeconds - secondsRemaining;
    const clampedElapsed = Math.max(0, Math.min(sessionSeconds, elapsed));
    const phaseTime = clampedElapsed % 16;
    const phaseIndex = Math.floor(phaseTime / 4);
    const secondsIntoPhase = phaseTime % 4;
    const remainingInPhase = 4 - secondsIntoPhase;

    // Four phases of box breathing: inhale, hold, exhale, hold (4 seconds each)
    const phases = [
      { label: "Inhale", note: "Breathe in slowly" },
      { label: "Hold", note: "Keep the breath" },
      { label: "Exhale", note: "Breathe out gently" },
      { label: "Hold", note: "Pause and relax" },
    ];

    return {
      ...(phases[phaseIndex] || phases[0]),
      phaseIndex,
      remainingInPhase,
    };
  }, [secondsRemaining, sessionSeconds]);

  const phaseSteps = ["Inhale", "Hold", "Exhale", "Hold"];

  return (
    <View style={styles.card}>
      <View style={styles.glowOrb} />

      <View style={styles.topRow}>
        <View style={styles.tag}>
          <Text style={styles.tagText}>Stress Reset</Text>
        </View>
        <Text style={styles.miniTimer}>{formatTime(secondsRemaining)}</Text>
      </View>

      <Text style={styles.title}>{title}</Text>

      <View style={styles.phaseCard}>
        <Text style={styles.phaseLabel}>Current Phase</Text>
        <Text style={styles.subtitle}>
          {phase.label} - {phase.remainingInPhase}s
        </Text>
      </View>

      <View style={styles.stepperRow}>
        {phaseSteps.map((step, index) => {
          const isActive = index === phase.phaseIndex;
          return (
            <View
              key={`${step}-${index}`}
              style={[styles.stepChip, isActive && styles.stepChipActive]}
            >
              <Text
                style={[styles.stepChipText, isActive && styles.stepChipTextActive]}
              >
                {step}
              </Text>
            </View>
          );
        })}
      </View>

      <Text style={styles.text}>{phase.note}</Text>
      <Text style={styles.helper}>
        Helpful for anxiety: keep the exhale soft and steady.
      </Text>

      <CalmTimer
        progressAnim={progressAnim}
        pulseAnim={pulseAnim}
        remainingLabel={formatTime(secondsRemaining)}
        ringColor="#C4B5FD"
        textColor="#1F1147"
        note="1-minute box breathing"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#DDD6FE",
    position: "relative",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },
  glowOrb: {
    position: "absolute",
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: "#EDE9FE",
    top: -75,
    right: -60,
    opacity: 0.8,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  tag: {
    backgroundColor: "#F5F3FF",
    borderWidth: 1,
    borderColor: "#C4B5FD",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagText: {
    color: "#5B21B6",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  miniTimer: {
    fontSize: 13,
    fontWeight: "800",
    color: "#4C1D95",
  },
  title: {
    fontSize: 17,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 10,
  },
  phaseCard: {
    backgroundColor: "#FAF5FF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E9D5FF",
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  phaseLabel: {
    fontSize: 11,
    color: "#6D28D9",
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#2E1065",
  },
  stepperRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  stepChip: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  stepChipActive: {
    backgroundColor: "#DDD6FE",
    borderColor: "#A78BFA",
  },
  stepChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
  },
  stepChipTextActive: {
    color: "#4C1D95",
  },
  text: {
    fontSize: 15,
    color: "#374151",
    lineHeight: 22,
    fontWeight: "700",
    marginBottom: 8,
  },
  helper: {
    fontSize: 13,
    color: "#5B6270",
    lineHeight: 18,
    fontWeight: "600",
    marginBottom: 10,
  },
});
