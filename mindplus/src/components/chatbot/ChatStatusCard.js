import React from "react";
import { View, Text } from "react-native";
import styles from "./chatbotStyles";

export default function ChatStatusCard({ statusTheme, overallLabel }) {
  return (
    <View
      style={[
        styles.statusCard,
        { backgroundColor: statusTheme.bg, borderColor: statusTheme.border },
      ]}
    >
      <Text style={styles.statusLabel}>{overallLabel}</Text>
    </View>
  );
}
