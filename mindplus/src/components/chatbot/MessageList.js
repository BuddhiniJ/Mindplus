import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Linking,
  Animated,
} from "react-native";
import styles from "./chatbotStyles";

export default function MessageList({
  messages,
  onSelectTechnique,
  isBotTyping,
  emergencyContact,
  emergencyName,
  moodOptions,
  showMoodOptions,
  onSelectMood,
  onPressVoice,
  speakingMessageId,
  onPressHelpfulResources,
}) {
  const scrollViewRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0));

  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  useEffect(() => {
    if (showMoodOptions && moodOptions && moodOptions.length > 0) {
      fadeAnim.current.setValue(0);
      Animated.timing(fadeAnim.current, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [showMoodOptions, moodOptions?.length]);

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

              {!isUser && !!msg.text && (
                <View style={styles.voiceRow}>
                  <Pressable
                    onPress={() => onPressVoice && onPressVoice(msg)}
                    style={styles.voiceButton}
                  >
                    <Text style={styles.voiceButtonIcon}>
                      {speakingMessageId === msg.id ? "⏹" : "🔊"}
                    </Text>
                    <Text style={styles.voiceButtonLabel}>
                      {speakingMessageId === msg.id ? "Stop" : "Listen"}
                    </Text>
                  </Pressable>
                </View>
              )}

              {msg.from === "bot" &&
                msg.isMoodPrompt &&
                moodOptions &&
                moodOptions.length > 0 &&
                showMoodOptions && (
                  <Animated.View
                    style={[styles.promptRow, { opacity: fadeAnim.current }]}
                  >
                    {moodOptions.map((opt) => (
                      <Pressable
                        key={opt.id}
                        onPress={() => onSelectMood && onSelectMood(opt)}
                        style={styles.promptChip}
                      >
                        <Text style={styles.promptChipText}>
                          {opt.emoji} {opt.label}
                        </Text>
                      </Pressable>
                    ))}
                  </Animated.View>
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

              {msg.from === "bot" &&
                isCritical &&
                (emergencyContact || emergencyName) && (
                  <View style={styles.emergencyContainer}>
                    <Text style={styles.emergencyTitle}>
                      If you can, please reach out to someone you trust.
                    </Text>
                    {emergencyName && (
                      <Text style={styles.emergencyText}>
                        Suggested contact: {emergencyName}
                      </Text>
                    )}
                    {emergencyContact && (
                      <Text style={styles.emergencyText}>
                        Phone: {emergencyContact}
                      </Text>
                    )}
                    {emergencyContact && (
                      <Pressable
                        style={styles.emergencyCallButton}
                        onPress={() =>
                          Linking.openURL(`tel:${emergencyContact}`)
                        }
                      >
                        <Text style={styles.emergencyCallButtonText}>
                          Call {emergencyName || "now"}
                        </Text>
                      </Pressable>
                    )}
                  </View>
                )}

              {msg.from === "bot" &&
                msg.meta &&
                (msg.meta.overallStatus || msg.meta.stressLevel) &&
                onPressHelpfulResources && (
                  <View style={{ marginTop: 8 }}>
                    <Pressable
                      style={styles.commandsButton}
                      onPress={() => onPressHelpfulResources(msg.meta)}
                    >
                      <Text style={styles.commandsButtonText}>
                        View helpful resources
                      </Text>
                    </Pressable>
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
