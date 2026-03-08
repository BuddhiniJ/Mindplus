// Grounding card component - displays 5-4-3-2-1 sensory awareness exercise
import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import CalmTimer from "./CalmTimer";

function formatTime(totalSeconds) {
  const clamped = Math.max(0, Math.floor(totalSeconds));
  const minutes = String(Math.floor(clamped / 60)).padStart(2, "0");
  const seconds = String(clamped % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export default function GroundingCard({
  secondsRemaining,
  progressAnim,
  pulseAnim,
  sessionSeconds = 60,
  title = "Grounding (5–4–3–2–1)",
}) {
  // Calculate current grounding step (1-5) based on elapsed time, 12 seconds per step
  const grounding = useMemo(() => {
    const elapsed = sessionSeconds - secondsRemaining;
    const clampedElapsed = Math.max(0, Math.min(sessionSeconds, elapsed));
    const stepDuration = 12;
    const step = Math.min(5, Math.floor(clampedElapsed / stepDuration) + 1);
    // Five sensory awareness steps for grounding technique
    const steps = [
      "Name 5 things you can see",
      "Name 4 things you can touch",
      "Name 3 things you can hear",
      "Name 2 things you can smell",
      "Name 1 thing you can taste",
    ];
    return { step, steps };
  }, [secondsRemaining, sessionSeconds]);

  // Display grounding steps list, progress indicator, and countdown timer
  return (
    <View style={styles.card}>
      <View style={styles.glowOrb} />

      <View style={styles.topRow}>
        <View style={styles.tag}>
          <Text style={styles.tagText}>Sensory Reset</Text>
        </View>
        <Text style={styles.miniTimer}>{formatTime(secondsRemaining)}</Text>
      </View>

      <Text style={styles.title}>{title}</Text>

      <View style={styles.progressCard}>
        <Text style={styles.progressLabel}>Progress</Text>
        <Text style={styles.subtitle}>{`${grounding.step}/5`}</Text>
      </View>

      <Text style={styles.helper}>
        Helpful for anxiety: name items out loud if you can.
      </Text>

      <View style={styles.list}>
        {grounding.steps.map((text, index) => {
          const stepNumber = index + 1;
          const active = stepNumber === grounding.step;
          return (
            <View key={text} style={[styles.row, active && styles.rowActive]}>
              <Text style={[styles.index, active && styles.indexActive]}>
                {stepNumber}
              </Text>
              <Text style={[styles.rowText, active && styles.rowTextActive]}>
                {text}
              </Text>
            </View>
          );
        })}
      </View>

      <CalmTimer
        progressAnim={progressAnim}
        pulseAnim={pulseAnim}
        remainingLabel={formatTime(secondsRemaining)}
        ringColor="#7DD3FC"
        textColor="#0B1E34"
        note="Grounding"
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
    borderColor: "#BAE6FD",
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
    backgroundColor: "#E0F2FE",
    top: -78,
    right: -58,
    opacity: 0.75,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  tag: {
    backgroundColor: "#F0F9FF",
    borderWidth: 1,
    borderColor: "#7DD3FC",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagText: {
    color: "#0369A1",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  miniTimer: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0C4A6E",
  },
  title: {
    fontSize: 17,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 10,
  },
  progressCard: {
    backgroundColor: "#F0F9FF",
    borderWidth: 1,
    borderColor: "#BAE6FD",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#0369A1",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#0C4A6E",
  },
  helper: {
    fontSize: 14,
    color: "#475569",
    lineHeight: 20,
    fontWeight: "600",
    marginBottom: 10,
  },
  list: {
    gap: 9,
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  rowActive: {
    backgroundColor: "#ECFEFF",
    borderColor: "#38BDF8",
    shadowColor: "#38BDF8",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  index: {
    width: 26,
    height: 26,
    borderRadius: 13,
    textAlign: "center",
    textAlignVertical: "center",
    backgroundColor: "#E2E8F0",
    color: "#0F172A",
    fontWeight: "900",
    marginRight: 10,
  },
  indexActive: {
    backgroundColor: "#0EA5E9",
    color: "#FFFFFF",
  },
  rowText: {
    flex: 1,
    fontSize: 14,
    color: "#1E293B",
    fontWeight: "700",
  },
  rowTextActive: {
    color: "#0C4A6E",
  },
});
