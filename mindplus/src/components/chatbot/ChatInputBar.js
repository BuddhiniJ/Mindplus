import React from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  ActivityIndicator,
} from "react-native";
import styles from "./chatbotStyles";

export default function ChatInputBar({
  input,
  onChangeInput,
  onSend,
  sending,
}) {
  const canSend = input.trim().length > 0 && !sending;

  return (
    <View style={styles.inputBar}>
      <TextInput
        style={styles.input}
        value={input}
        onChangeText={onChangeInput}
        placeholder="Type how you're feeling…"
        multiline
        placeholderTextColor="#94A3B8"
      />
      <TouchableOpacity
        style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
        onPress={onSend}
        disabled={!canSend}
      >
        {sending ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.sendText}>Send</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
