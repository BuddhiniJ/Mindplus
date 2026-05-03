import React from "react";
import { View, Text, Pressable } from "react-native";
import styles from "./chatbotStyles";

const DEFAULT_PROMPTS = [
  "I'm overwhelmed with exams",
  "I can't focus on studying",
  "I'm scared I'll fail my exams",
  "I feel burnt out",
  "I need help calming down",
  "I want to get back on track",
];

const MAX_VISIBLE_PROMPTS = 6;

export default function PromptChips({ onSelectPrompt, prompts }) {
  const visiblePrompts = (Array.isArray(prompts) && prompts.length
    ? prompts
    : DEFAULT_PROMPTS
  )
    .filter((prompt) => typeof prompt === "string" && prompt.trim())
    .slice(0, MAX_VISIBLE_PROMPTS);

  return (
    <View style={styles.promptRow}>
      {visiblePrompts.map((prompt, index) => (
        <Pressable
          key={`prompt-${index}`}
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
