import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { auth } from "../../firebase/firebaseConfig";
import { startChatSession, sendChatMessage } from "../../services/chatApi";

export default function ChatbotScreen({ navigation }) {
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const scrollViewRef = useRef(null);

  useEffect(() => {
    const init = async () => {
      try {
        const id = await startChatSession();
        setSessionId(id);
      } catch (err) {
        console.log("Failed to start chatbot session", err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!sessionId || !input.trim() || sending) return;
    const text = input.trim();
    setInput("");

    const user = auth.currentUser;
    const nickname = user?.email || "You";

    const userMessage = {
      id: Date.now().toString(),
      from: "user",
      text,
      label: nickname,
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      setSending(true);
      const raw = await sendChatMessage(sessionId, text);
      const reply = {
        botMessage: raw.bot_message,
        emotion: raw.emotion,
        stressLevel: raw.stress_level,
        academicStressCategory: raw.academic_stress_category,
        riskLevel: raw.risk_level,
        overallStatus: raw.overall_status,
        techniques: raw.techniques || [],
      };
      const botMessage = {
        id: `${Date.now()}-bot`,
        from: "bot",
        text: reply.botMessage,
        label: "MindPlus Bot",
        meta: {
          emotion: reply.emotion,
          stressLevel: reply.stressLevel,
          academicStressCategory: reply.academicStressCategory,
          riskLevel: reply.riskLevel,
          overallStatus: reply.overallStatus,
          techniques: reply.techniques,
        },
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.log("Failed to send chatbot message", err);
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-error`,
          from: "bot",
          text: "I had trouble connecting just now. Please try again in a moment.",
          label: "MindPlus Bot",
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Connecting to your chatbot...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>MindPlus Chatbot</Text>
        <Text style={styles.headerSubtitle}>
          Talk about stress, studies, or anything on your mind.
        </Text>
      </View>

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

        {messages.map((msg) => (
          <View
            key={msg.id}
            style={[
              styles.messageBubble,
              msg.from === "user" ? styles.userBubble : styles.botBubble,
            ]}
          >
            <Text style={styles.messageLabel}>{msg.label}</Text>
            <Text style={styles.messageText}>{msg.text}</Text>

            {msg.from === "bot" && msg.meta && (
              <View style={styles.metaContainer}>
                <Text style={styles.metaText}>
                  Emotion: {msg.meta.emotion} · Stress: {msg.meta.stressLevel}
                </Text>
                <Text style={styles.metaText}>
                  Academic: {msg.meta.academicStressCategory} · Risk:{" "}
                  {msg.meta.riskLevel}
                </Text>
                <Text style={styles.metaText}>
                  Overall: {msg.meta.overallStatus}
                </Text>
                {msg.meta.techniques && msg.meta.techniques.length > 0 && (
                  <Text style={styles.metaText}>
                    Techniques: {msg.meta.techniques.join(", ")}
                  </Text>
                )}
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Type a message..."
          multiline
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!input.trim() || sending) && styles.sendButtonDisabled,
          ]}
          onPress={handleSend}
          disabled={!input.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.sendText}>Send</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6B7280",
  },
  header: {
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: "#EEF2FF",
  },
  backText: {
    fontSize: 16,
    color: "#3B82F6",
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 4,
  },
  messagesContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  emptyState: {
    alignItems: "center",
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    maxWidth: 260,
  },
  messageBubble: {
    maxWidth: "90%",
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#3B82F6",
  },
  botBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#FFFFFF",
  },
  messageLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 4,
    color: "#6B7280",
  },
  messageText: {
    fontSize: 15,
    color: "#111827",
  },
  metaContainer: {
    marginTop: 8,
  },
  metaText: {
    fontSize: 11,
    color: "#6B7280",
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  input: {
    flex: 1,
    maxHeight: 100,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    fontSize: 15,
    backgroundColor: "#F9FAFB",
    marginRight: 8,
  },
  sendButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#3B82F6",
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "#9CA3AF",
  },
  sendText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
};
