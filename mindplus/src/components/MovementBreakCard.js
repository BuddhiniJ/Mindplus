// Movement break card component - displays a 5-minute guided movement reset
import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import CalmTimer from "./CalmTimer";

function formatTime(totalSeconds) {
  const clamped = Math.max(0, Math.floor(totalSeconds));
  const minutes = String(Math.floor(clamped / 60)).padStart(2, "0");
  const seconds = String(clamped % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export default function MovementBreakCard({
  secondsRemaining,
  progressAnim,
  pulseAnim,
  sessionSeconds = 300,
  title = "Movement Break (5 Minutes)",
}) {
  const movement = useMemo(() => {
    const elapsed = sessionSeconds - secondsRemaining;
    const clampedElapsed = Math.max(0, Math.min(sessionSeconds, elapsed));

    const steps = [
      {
        title: "Stand up",
        note: "Plant your feet shoulder-width apart and relax your jaw.",
        cue: "Wake up your posture",
      },
      {
        title: "Stretch shoulders and neck",
        note: "Roll shoulders slowly and tilt your neck side-to-side without strain.",
        cue: "Release upper-body tension",
      },
      {
        title: "Walk slowly for a few minutes",
        note: "Take calm steps, breathe in for 4 and out for 6.",
        cue: "Let your breathing set the pace",
      },
    ];

    const segment = sessionSeconds / steps.length;
    const stepIndex = Math.min(
      steps.length - 1,
      Math.floor(clampedElapsed / segment)
    );
    const current = steps[stepIndex];

    return {
      stepNumber: stepIndex + 1,
      totalSteps: steps.length,
      steps,
      current,
    };
  }, [secondsRemaining, sessionSeconds]);

  return (
    <View style={styles.card}>
      <View style={styles.glowOrb} />

      <View style={styles.topRow}>
        <View style={styles.tag}>
          <Text style={styles.tagText}>Body Reset</Text>
        </View>
        <Text style={styles.miniTimer}>{formatTime(secondsRemaining)}</Text>
      </View>

      <Text style={styles.title}>{title}</Text>

      <View style={styles.progressCard}>
        <Text style={styles.progressLabel}>Current Focus</Text>
        <Text style={styles.subtitle}>
          Step {movement.stepNumber}/{movement.totalSteps}
        </Text>
        <Text style={styles.currentCue}>{movement.current.cue}</Text>
      </View>

      <View style={styles.list}>
        {movement.steps.map((step, index) => {
          const stepNo = index + 1;
          const active = stepNo === movement.stepNumber;
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
        ringColor="#FBBF24"
        textColor="#3F2A00"
        note="5-minute movement break"
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
    borderColor: "#FDE68A",
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
    width: 175,
    height: 175,
    borderRadius: 88,
    backgroundColor: "#FEF3C7",
    top: -76,
    right: -56,
    opacity: 0.78,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  tag: {
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FCD34D",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagText: {
    color: "#B45309",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  miniTimer: {
    fontSize: 13,
    fontWeight: "800",
    color: "#92400E",
  },
  title: {
    fontSize: 17,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 10,
  },
  progressCard: {
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FDE68A",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#B45309",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#78350F",
  },
  currentCue: {
    marginTop: 4,
    fontSize: 13,
    color: "#92400E",
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
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  rowActive: {
    backgroundColor: "#FEF3C7",
    borderColor: "#F59E0B",
    shadowColor: "#F59E0B",
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
    backgroundColor: "#FDE68A",
    color: "#78350F",
    fontWeight: "900",
    marginRight: 10,
  },
  indexActive: {
    backgroundColor: "#D97706",
    color: "#FFFFFF",
  },
  rowTextWrap: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 14,
    color: "#78350F",
    fontWeight: "800",
    marginBottom: 2,
  },
  rowTitleActive: {
    color: "#7C2D12",
  },
  rowText: {
    fontSize: 13,
    color: "#92400E",
    lineHeight: 18,
    fontWeight: "600",
  },
  rowTextActive: {
    color: "#7C2D12",
  },
});
