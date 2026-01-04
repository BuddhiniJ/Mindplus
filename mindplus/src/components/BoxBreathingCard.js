import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import CalmTimer from "./CalmTimer";

function formatTime(totalSeconds) {
  const clamped = Math.max(0, Math.floor(totalSeconds));
  const minutes = String(Math.floor(clamped / 60)).padStart(2, "0");
  const seconds = String(clamped % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export default function BoxBreathingCard({
  secondsRemaining,
  progressAnim,
  pulseAnim,
  sessionSeconds = 60,
  title = "Box Breathing (4–4–4–4)",
}) {
  const phase = useMemo(() => {
    const elapsed = sessionSeconds - secondsRemaining;
    const clampedElapsed = Math.max(0, Math.min(sessionSeconds, elapsed));
    const phaseTime = clampedElapsed % 16;
    const phaseIndex = Math.floor(phaseTime / 4);
    const secondsIntoPhase = phaseTime % 4;
    const remainingInPhase = 4 - secondsIntoPhase;

    const phases = [
      { label: "Inhale", note: "Breathe in slowly" },
      { label: "Hold", note: "Keep the breath" },
      { label: "Exhale", note: "Breathe out gently" },
      { label: "Hold", note: "Pause and relax" },
    ];

    return {
      ...(phases[phaseIndex] || phases[0]),
      remainingInPhase,
    };
  }, [secondsRemaining, sessionSeconds]);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>
        {phase.label} — {phase.remainingInPhase}s
      </Text>
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
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  title: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 6,
  },
  text: {
    fontSize: 14,
    color: "#4B5563",
    lineHeight: 20,
    fontWeight: "600",
    marginBottom: 8,
  },
  helper: {
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 18,
    fontWeight: "600",
    marginBottom: 10,
  },
});
