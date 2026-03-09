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
  compactMode = false,
  showTimestamps = false,
  largeText = false,
  hideLabels = false,
}) {
  const scrollViewRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0));
  const messageAnimationsRef = useRef({});
  const typingAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  useEffect(() => {
    if (!messages || messages.length === 0) return;
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || !lastMessage.id) return;

    if (!messageAnimationsRef.current[lastMessage.id]) {
      messageAnimationsRef.current[lastMessage.id] = new Animated.Value(0);
    }

    const anim = messageAnimationsRef.current[lastMessage.id];
    anim.setValue(0);
    Animated.timing(anim, {
      toValue: 1,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, [messages?.length]);

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

  useEffect(() => {
    if (!isBotTyping) return;

    typingAnim.setValue(0);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(typingAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(typingAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    );

    loop.start();
    return () => {
      loop.stop();
    };
  }, [isBotTyping, typingAnim]);

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    try {
      const d = new Date(timestamp);
      return d.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return "";
    }
  };

  return (
    <ScrollView
      ref={scrollViewRef}
      contentContainerStyle={[
        styles.messagesContainer,
        compactMode && styles.messagesContainerCompact,
      ]}
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

        const bubbleAnim = messageAnimationsRef.current[msg.id];
        const animatedStyle = bubbleAnim
          ? {
              opacity: bubbleAnim,
              transform: [
                {
                  translateY: bubbleAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [8, 0],
                  }),
                },
              ],
            }
          : null;

        return (
          <Animated.View
            key={msg.id}
            style={[
              styles.messageRow,
              { justifyContent: isUser ? "flex-end" : "flex-start" },
              animatedStyle,
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
              {!hideLabels && (
                <Text
                  style={[styles.messageLabel, isUser && { color: "#E5E7EB" }]}
                >
                  {msg.label}
                </Text>
              )}
              <Text
                style={[
                  styles.messageText,
                  largeText && styles.messageTextLarge,
                  isUser && { color: "#FFFFFF" },
                ]}
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

                  {msg.from === "bot" &&
                    msg.meta &&
                    (msg.meta.overallStatus || msg.meta.stressLevel) &&
                    onPressHelpfulResources && (
                      <Pressable
                        style={[styles.commandsButton, { marginLeft: 8 }]}
                        onPress={() => onPressHelpfulResources(msg.meta)}
                      >
                        <Text style={styles.commandsButtonText}>
                          View resources
                        </Text>
                      </Pressable>
                    )}
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
                        <Text style={styles.promptChipText}>{opt.emoji}</Text>
                        <Text style={styles.promptChipText}>{opt.label}</Text>
                      </Pressable>
                    ))}
                  </Animated.View>
                )}

              {msg.from === "bot" &&
                msg.meta &&
                msg.meta.techniques &&
                msg.meta.techniques.length > 0 && (
                  <View style={styles.techniquesRow}>
                    {[...msg.meta.techniques]
                      .sort((a, b) => a.length - b.length)
                      .map((t, index) => (
                        <Pressable
                          key={t}
                          onPress={() => onSelectTechnique(t)}
                          style={styles.techChip}
                        >
                          <Text style={styles.techChipText}>
                            {index + 1}. {t}
                          </Text>
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

              {/* helpful-resources button now sits next to the Listen button in voiceRow */}

              {showTimestamps && msg.timestamp && (
                <Text style={styles.messageTimestamp}>
                  {formatTime(msg.timestamp)}
                </Text>
              )}
            </View>
          </Animated.View>
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
                Thinking of the best reply… 🤔
              </Text>
              <View style={styles.typingDotsContainer}>
                {[0, 1, 2].map((index) => {
                  const dotStyle = {
                    opacity: typingAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange:
                        index === 0
                          ? [0.2, 1]
                          : index === 1
                            ? [0.2, 0.9]
                            : [0.2, 0.8],
                    }),
                    transform: [
                      {
                        translateY: typingAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange:
                            index === 0
                              ? [0, -1]
                              : index === 1
                                ? [0, -0.5]
                                : [0, -0.25],
                        }),
                      },
                    ],
                  };

                  return (
                    <Animated.View
                      key={index}
                      style={[styles.typingDot, dotStyle]}
                    />
                  );
                })}
              </View>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
}
