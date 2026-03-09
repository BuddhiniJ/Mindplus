import React from "react";
import { View, Text, Pressable } from "react-native";
import styles from "./chatbotStyles";

const PRESET_PROMPTS = [
  "I'm overwhelmed with exams",
  "I can't focus on studying",
  "I'm scared I'll fail my exams",
];

export default function PromptChips({ onSelectPrompt }) {
  return (
    <View style={styles.promptRow}>
      {PRESET_PROMPTS.map((prompt) => (
        <Pressable
          key={prompt}
          onPress={() => onSelectPrompt(prompt)}
          style={({ pressed }) => [
            styles.promptChip,
            pressed && styles.promptChipPressed,
          ]}
        >
          <Text style={styles.promptChipText}>{prompt}</Text>
        </Pressable>
      ))}
    </View>
  );
}
