import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from "react-native";
import { auth } from "../../firebase/firebaseConfig";
import { startChatSession, sendChatMessage } from "../../services/chatApi";

const STATUS_THEME = {
  critical: { bg: "#FEE2E2", border: "#EF4444" },
  high_stress: { bg: "#FEF3C7", border: "#F59E0B" },
  moderate_stress: { bg: "#E0F2FE", border: "#38BDF8" },
  low_stress: { bg: "#DCFCE7", border: "#22C55E" },
  normal: { bg: "#EEF2FF", border: "#6366F1" },
  idle: { bg: "#EEF2FF", border: "#CBD5F5" },
};

const TECHNIQUE_DETAILS = {
  "5-4-3-2-1 grounding":
    "Look around and gently notice: 5 things you can see, 4 you can feel, 3 you can hear, 2 you can smell, and 1 you can taste.",
  "Box breathing (4-4-4-4)":
    "Inhale through your nose for 4 seconds, hold for 4, exhale for 4, hold for 4. Repeat this slow rhythm a few times.",
  "Self-compassion check-in":
    "Pause and speak to yourself as you would to a kind friend. Acknowledge that what you feel is valid and understandable.",
  "Small activation task":
    "Pick one tiny, doable task (like opening your notes or writing a title) to gently move things forward.",
  "4-7-8 breathing":
    "Breathe in for 4 seconds, hold for 7, and exhale slowly for 8. This can calm your nervous system.",
  "Cognitive defusion":
    "Notice your thoughts as mental events, not facts. You might say: 'I am having the thought that…' instead of 'This is true'.",
  "5-minute micro-break":
    "Step away for 5 minutes: stretch, drink water, or look out of a window. Let your body reset a little.",
  "Energy audit":
    "Gently scan your day and notice what activities drain you and what restores you. Adjust one small thing in your favour.",
  "Task chunking (25/5 Pomodoro)":
    "Work for 25 minutes on a single task, then rest for 5. Repeat a few cycles and keep tasks small and specific.",
  "Two-minute small start":
    "Commit to only 2 minutes of a task. Often, starting is the hardest step and momentum will carry you afterwards.",
  "Mindful breathing":
    "Bring attention to your breath. Notice the air moving in and out, and gently return your focus when your mind wanders.",
};

function formatOverallStatus(status) {
  switch (status) {
    case "critical":
      return "Critical · Please reach out for real-time help";
    case "high_stress":
      return "High stress detected";
    case "moderate_stress":
      return "Moderate stress";
    case "low_stress":
      return "Low stress";
    case "normal":
      return "Stable for now";
    default:
      return "Tell me how you're feeling to get a snapshot";
  }
}

function formatEmotion(emotion) {
  if (!emotion) return "Emotion: pending";
  return `Emotion: ${emotion}`;
}

function formatStressLevel(level) {
  if (!level) return "Stress: pending";
  return `Stress: ${level}`;
}

function formatRiskLevel(risk) {
  if (!risk) return "Risk: assessing";
  if (risk === "safe") return "Risk: safe";
  if (risk === "moderate_risk") return "Risk: needs care";
  if (risk === "high_risk") return "Risk: urgent";
  return `Risk: ${risk}`;
}

function formatAcademicStress(label) {
  if (!label) return "Study stress: pending";
  if (label === "burnout") return "Study stress: burnout";
  if (label === "academic_stress_high") return "Study stress: high";
  if (label === "academic_stress_medium") return "Study stress: medium";
  if (label === "academic_stress_low") return "Study stress: low";
  return `Study stress: ${label}`;
}

export default function ChatbotScreen({ navigation }) {
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [selectedTechnique, setSelectedTechnique] = useState(null);
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

  const lastStatusMeta =
    [...messages].reverse().find((m) => m.from === "bot" && m.meta)?.meta ||
    null;

  const statusThemeKey = lastStatusMeta?.overallStatus || "idle";
  const statusTheme = STATUS_THEME[statusThemeKey] || STATUS_THEME.idle;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>MindPlus Assistant 💙</Text>
        <Text style={styles.headerSubtitle}>You’re safe to talk here</Text>
      </View>

      <View
        style={[
          styles.statusCard,
          { backgroundColor: statusTheme.bg, borderColor: statusTheme.border },
        ]}
      >
        <Text style={styles.statusLabel}>
          {formatOverallStatus(lastStatusMeta?.overallStatus)}
        </Text>
        <Text style={styles.statusMeta}>
          {formatEmotion(lastStatusMeta?.emotion)} ·{" "}
          {formatStressLevel(lastStatusMeta?.stressLevel)} ·{" "}
          {formatAcademicStress(lastStatusMeta?.academicStressCategory)} ·{" "}
          {formatRiskLevel(lastStatusMeta?.riskLevel)}
        </Text>
      </View>

      <KeyboardAvoidingView
        style={styles.chatArea}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={90}
      >
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
            const isCritical =
              msg.meta && msg.meta.overallStatus === "critical";

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
                    style={[
                      styles.messageLabel,
                      isUser && { color: "#E5E7EB" },
                    ]}
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
                        Emotion: {msg.meta.emotion} · Stress:{" "}
                        {msg.meta.stressLevel}
                      </Text>
                      <Text style={styles.metaText}>
                        Academic: {msg.meta.academicStressCategory} · Risk:{" "}
                        {msg.meta.riskLevel}
                      </Text>
                      <Text style={styles.metaText}>
                        Overall: {msg.meta.overallStatus}
                      </Text>
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
                            onPress={() => setSelectedTechnique(t)}
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
        </ScrollView>

        <View style={styles.promptRow}>
          {[
            "I'm overwhelmed with exams",
            "I can't focus on studying",
            "I'm scared I'll fail",
          ].map((prompt) => (
            <Pressable
              key={prompt}
              onPress={() => setInput(prompt)}
              style={styles.promptChip}
            >
              <Text style={styles.promptChipText}>{prompt}</Text>
            </Pressable>
          ))}
        </View>

        {selectedTechnique && (
          <View style={styles.techDetailCard}>
            <Text style={styles.techDetailTitle}>{selectedTechnique}</Text>
            <Text style={styles.techDetailBody}>
              {TECHNIQUE_DETAILS[selectedTechnique] ||
                "This is a grounding or coping technique. You can try it gently and notice how your body responds."}
            </Text>
          </View>
        )}

        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Type how you're feeling…"
            multiline
            placeholderTextColor="#94A3B8"
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
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: "#EEF2FF",
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
    paddingTop: 50,
    paddingBottom: 18,
    paddingHorizontal: 20,
    backgroundColor: "#6366F1",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backText: {
    fontSize: 16,
    color: "#E5E7EB",
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.9)",
    marginTop: 4,
  },
  chatArea: {
    flex: 1,
  },
  messagesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    maxWidth: "78%",
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#6366F1",
    borderTopRightRadius: 6,
  },
  botBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#F1F5F9",
    borderTopLeftRadius: 6,
  },
  criticalBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#FEE2E2",
    borderColor: "#EF4444",
    borderWidth: 1,
    borderTopLeftRadius: 6,
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
  techniquesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
  },
  techChip: {
    backgroundColor: "#DBEAFE",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  techChipText: {
    fontSize: 11,
    color: "#1D4ED8",
    fontWeight: "600",
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    margin: 12,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 5,
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
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#6366F1",
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
  statusCard: {
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 2,
    color: "#0F172A",
  },
  statusMeta: {
    fontSize: 12,
    color: "#475569",
  },
  promptRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  promptChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#E0E7FF",
  },
  promptChipText: {
    fontSize: 11,
    color: "#3730A3",
  },
  techDetailCard: {
    marginHorizontal: 16,
    marginBottom: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  techDetailTitle: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 4,
    color: "#0F172A",
  },
  techDetailBody: {
    fontSize: 12,
    lineHeight: 18,
    color: "#4B5563",
  },
};
