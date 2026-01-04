import React from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  ActivityIndicator,
} from "react-native";

export default function ChatInputBar({
  input,
  onChangeInput,
  onSend,
  sending,
}) {
  const canSend = input.trim().length > 0 && !sending;

  return (
    <View
      style={{
        flexDirection: "row",
        padding: 12,
        borderTopWidth: 1,
        borderColor: "#E2E8F0",
        backgroundColor: "#FFFFFF",
      }}
    >
      <TextInput
        style={{
          flex: 1,
          minHeight: 44,
          maxHeight: 120,
          paddingHorizontal: 12,
          paddingVertical: 10,
          borderRadius: 20,
          backgroundColor: "#F1F5F9",
          color: "#0F172A",
        }}
        value={input}
        onChangeText={onChangeInput}
        placeholder="Type how you're feeling…"
        placeholderTextColor="#94A3B8"
        multiline
        blurOnSubmit={false}
      />

      <TouchableOpacity
        onPress={onSend}
        disabled={!canSend}
        style={{
          marginLeft: 8,
          backgroundColor: canSend ? "#6366F1" : "#CBD5E1",
          paddingHorizontal: 16,
          borderRadius: 20,
          justifyContent: "center",
        }}
      >
        {sending ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={{ color: "#FFFFFF", fontWeight: "600" }}>Send</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
