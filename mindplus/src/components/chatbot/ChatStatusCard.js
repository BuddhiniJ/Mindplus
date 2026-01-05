import React from "react";
import { View, Text } from "react-native";
import styles from "./chatbotStyles";

export default function ChatStatusCard({
  statusTheme,
  overallLabel,
  stressPercent = 0,
}) {
  const pct = Math.max(0, Math.min(100, Number(stressPercent) || 0));

  return (
    <View
      style={[
        styles.statusCard,
        { backgroundColor: statusTheme.bg, borderColor: statusTheme.border },
      ]}
    >
      <View style={styles.statusHeaderRow}>
        <Text style={styles.statusLabel} numberOfLines={1}>
          {overallLabel}
        </Text>
        <Text style={styles.statusPercentText}>{pct}%</Text>
      </View>

      <View style={styles.statusBarTrack}>
        <View style={[styles.statusBarFill, { width: `${pct}%` }]} />
      </View>
    </View>
  );
}
