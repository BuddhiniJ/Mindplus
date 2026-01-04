import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import styles from "./chatbotStyles";

export default function ChatHeader({ onBack }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack}>
        <Text style={styles.backText}>‹ Back</Text>
      </TouchableOpacity>
      <Text style={styles.headerTitle}>MindPlus Assistant 💙</Text>
      <Text style={styles.headerSubtitle}>You’re safe to talk here</Text>
    </View>
  );
}
