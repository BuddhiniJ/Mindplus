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
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{`Progress ${grounding.step}/5`}</Text>
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
        note="1-minute grounding"
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
  helper: {
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 18,
    fontWeight: "600",
    marginBottom: 10,
  },
  list: {
    gap: 8,
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  rowActive: {
    backgroundColor: "#E0F2FE",
    borderColor: "#7DD3FC",
  },
  index: {
    width: 26,
    height: 26,
    borderRadius: 13,
    textAlign: "center",
    textAlignVertical: "center",
    backgroundColor: "#E5E7EB",
    color: "#111827",
    fontWeight: "900",
    marginRight: 10,
  },
  indexActive: {
    backgroundColor: "#38BDF8",
    color: "#FFFFFF",
  },
  rowText: {
    flex: 1,
    fontSize: 14,
    color: "#111827",
    fontWeight: "700",
  },
  rowTextActive: {
    color: "#0B1E34",
  },
});
