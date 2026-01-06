import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import styles from "./chatbotStyles";

export default function MessageList({
  messages,
  onSelectTechnique,
  isBotTyping,
}) {
  const scrollViewRef = useRef(null);

  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  return (
    <ScrollView
      ref={scrollViewRef}
      contentContainerStyle={styles.messagesContainer}
      keyboardShouldPersistTaps="handled"
    >
      {messages.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Start a conversation</Text>
          <Text style={styles.emptyText}>
            Share how you're feeling or what you're dealing with today.
          </Text>
        </View>
      )}

      {messages.map((msg) => {
        const isUser = msg.from === "user";
        const isCritical = msg.meta && msg.meta.overallStatus === "critical";

        return (
          <View
            key={msg.id}
            style={[
              styles.messageRow,
              { justifyContent: isUser ? "flex-end" : "flex-start" },
            ]}
          >
            <View
              style={[
                styles.messageBubble,
                isUser
                  ? styles.userBubble
                  : isCritical
                  ? styles.criticalBubble
                  : styles.botBubble,
              ]}
            >
              <Text
                style={[styles.messageLabel, isUser && { color: "#E5E7EB" }]}
              >
                {msg.label}
              </Text>
              <Text
                style={[styles.messageText, isUser && { color: "#FFFFFF" }]}
              >
                {msg.text}
              </Text>

              {msg.from === "bot" && msg.meta && (
                <View style={styles.metaContainer}>
                  <Text style={styles.metaText}>
                    Insights from this message
                  </Text>
                  <View style={styles.metaChipsRow}>
                    <View style={styles.metaChip}>
                      <Text style={styles.metaChipLabel}>Emotion:</Text>
                      <Text style={styles.metaChipValue}>
                        {msg.meta.emotion || "-"}
                      </Text>
                    </View>
                    <View style={styles.metaChip}>
                      <Text style={styles.metaChipLabel}>Stress:</Text>
                      <Text style={styles.metaChipValue}>
                        {msg.meta.stressLevel || "-"}
                      </Text>
                    </View>
                    <View style={styles.metaChip}>
                      <Text style={styles.metaChipLabel}>Academic:</Text>
                      <Text style={styles.metaChipValue}>
                        {msg.meta.academicStressCategory || "-"}
                      </Text>
                    </View>
                    <View style={styles.metaChip}>
                      <Text style={styles.metaChipLabel}>Risk:</Text>
                      <Text style={styles.metaChipValue}>
                        {msg.meta.riskLevel || "-"}
                      </Text>
                    </View>
                    <View style={styles.metaChip}>
                      <Text style={styles.metaChipLabel}>Overall:</Text>
                      <Text style={styles.metaChipValue}>
                        {msg.meta.overallStatus || "-"}
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {msg.from === "bot" &&
                msg.meta &&
                msg.meta.techniques &&
                msg.meta.techniques.length > 0 && (
                  <View style={styles.techniquesRow}>
                    {msg.meta.techniques.map((t) => (
                      <Pressable
                        key={t}
                        onPress={() => onSelectTechnique(t)}
                        style={styles.techChip}
                      >
                        <Text style={styles.techChipText}>{t}</Text>
                      </Pressable>
                    ))}
                  </View>
                )}
            </View>
          </View>
        );
      })}

      {isBotTyping && (
        <View style={[styles.messageRow, { justifyContent: "flex-start" }]}>
          <View
            style={[
              styles.messageBubble,
              styles.botBubble,
              styles.typingBubble,
            ]}
          >
            <Text style={styles.messageLabel}>MindPlus Bot</Text>
            <View style={styles.typingRow}>
              <ActivityIndicator size="small" color="#6B7280" />
              <Text style={styles.typingText}>
                Thinking of the best way to respond…
              </Text>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
}
