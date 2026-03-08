// Self-compassion card component - displays a 1-minute guided kindness reset
import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import CalmTimer from "./CalmTimer";

function formatTime(totalSeconds) {
  const clamped = Math.max(0, Math.floor(totalSeconds));
  const minutes = String(Math.floor(clamped / 60)).padStart(2, "0");
  const seconds = String(clamped % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export default function SelfCompassionCard({
  secondsRemaining,
  progressAnim,
  pulseAnim,
  sessionSeconds = 60,
  title = "Self Compassion (1 Minute)",
}) {
  const flow = useMemo(() => {
    const elapsed = sessionSeconds - secondsRemaining;
    const clampedElapsed = Math.max(0, Math.min(sessionSeconds, elapsed));

    const steps = [
      {
        title: "Pause and breathe",
        note: "Place one hand on your chest and take one slow inhale, longer exhale.",
        mantra: "I can soften this moment.",
      },
      {
        title: "Think of something kind to say to yourself",
        note: "Use the same words you would offer to a close friend.",
        mantra: "I deserve patience and care.",
      },
      {
        title: "Repeat it slowly",
        note: "Whisper your kind phrase 3 times while breathing steadily.",
        mantra: "I am doing my best, and that is enough.",
      },
    ];

    const segment = sessionSeconds / steps.length;
    const stepIndex = Math.min(
      steps.length - 1,
      Math.floor(clampedElapsed / segment)
    );

    return {
      stepNumber: stepIndex + 1,
      totalSteps: steps.length,
      current: steps[stepIndex],
      steps,
    };
  }, [secondsRemaining, sessionSeconds]);

  return (
    <View style={styles.card}>
      <View style={styles.glowOrb} />

      <View style={styles.topRow}>
        <View style={styles.tag}>
          <Text style={styles.tagText}>Kindness Reset</Text>
        </View>
        <Text style={styles.miniTimer}>{formatTime(secondsRemaining)}</Text>
      </View>

      <Text style={styles.title}>{title}</Text>

      <View style={styles.progressCard}>
        <Text style={styles.progressLabel}>Now Practicing</Text>
        <Text style={styles.subtitle}>
          Step {flow.stepNumber}/{flow.totalSteps}
        </Text>
        <Text style={styles.currentMantra}>{flow.current.mantra}</Text>
      </View>

      <View style={styles.list}>
        {flow.steps.map((step, index) => {
          const stepNo = index + 1;
          const active = stepNo === flow.stepNumber;
          return (
            <View
              key={step.title}
              style={[styles.row, active && styles.rowActive]}
            >
              <Text style={[styles.index, active && styles.indexActive]}>
                {stepNo}
              </Text>
              <View style={styles.rowTextWrap}>
                <Text
                  style={[styles.rowTitle, active && styles.rowTitleActive]}
                >
                  {step.title}
                </Text>
                <Text style={[styles.rowText, active && styles.rowTextActive]}>
                  {step.note}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      <CalmTimer
        progressAnim={progressAnim}
        pulseAnim={pulseAnim}
        remainingLabel={formatTime(secondsRemaining)}
        ringColor="#F9A8D4"
        textColor="#4A044E"
        note="Self-compassion"
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
    borderColor: "#FBCFE8",
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
    backgroundColor: "#FCE7F3",
    top: -74,
    right: -56,
    opacity: 0.8,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  tag: {
    backgroundColor: "#FDF2F8",
    borderWidth: 1,
    borderColor: "#F9A8D4",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagText: {
    color: "#9D174D",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  miniTimer: {
    fontSize: 13,
    fontWeight: "800",
    color: "#831843",
  },
  title: {
    fontSize: 17,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 10,
  },
  progressCard: {
    backgroundColor: "#FDF2F8",
    borderWidth: 1,
    borderColor: "#FBCFE8",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#9D174D",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#831843",
  },
  currentMantra: {
    marginTop: 4,
    fontSize: 13,
    color: "#9D174D",
    fontWeight: "700",
  },
  list: {
    gap: 9,
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: "#FDF2F8",
    borderWidth: 1,
    borderColor: "#FBCFE8",
  },
  rowActive: {
    backgroundColor: "#FCE7F3",
    borderColor: "#EC4899",
    shadowColor: "#EC4899",
    shadowOpacity: 0.14,
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
    backgroundColor: "#FBCFE8",
    color: "#831843",
    fontWeight: "900",
    marginRight: 10,
  },
  indexActive: {
    backgroundColor: "#DB2777",
    color: "#FFFFFF",
  },
  rowTextWrap: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 14,
    color: "#831843",
    fontWeight: "800",
    marginBottom: 2,
  },
  rowTitleActive: {
    color: "#9D174D",
  },
  rowText: {
    fontSize: 13,
    color: "#9D174D",
    lineHeight: 18,
    fontWeight: "600",
  },
  rowTextActive: {
    color: "#831843",
  },
});
