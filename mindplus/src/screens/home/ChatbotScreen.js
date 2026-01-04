import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth } from "../../firebase/firebaseConfig";
import { startChatSession, sendChatMessage } from "../../services/chatApi";
import ChatHeader from "../../components/chatbot/ChatHeader";
import ChatStatusCard from "../../components/chatbot/ChatStatusCard";
import MessageList from "../../components/chatbot/MessageList";
import PromptChips from "../../components/chatbot/PromptChips";
import TechniqueDetailCard from "../../components/chatbot/TechniqueDetailCard";
import ChatInputBar from "../../components/chatbot/ChatInputBar";
import styles from "../../components/chatbot/chatbotStyles";

const STATUS_THEME = {
  critical: { bg: "#FEE2E2", border: "#EF4444" },
  high_stress: { bg: "#FEF3C7", border: "#F59E0B" },
  moderate_stress: { bg: "#E0F2FE", border: "#38BDF8" },
  low_stress: { bg: "#DCFCE7", border: "#22C55E" },
  normal: { bg: "#EEF2FF", border: "#6366F1" },
  idle: { bg: "#EEF2FF", border: "#CBD5F5" },
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

  const overallLabel = formatOverallStatus(lastStatusMeta?.overallStatus);
  const metaLabel = `${formatEmotion(
    lastStatusMeta?.emotion
  )} · ${formatStressLevel(
    lastStatusMeta?.stressLevel
  )} · ${formatAcademicStress(
    lastStatusMeta?.academicStressCategory
  )} · ${formatRiskLevel(lastStatusMeta?.riskLevel)}`;

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.container}>
        <ChatHeader onBack={() => navigation.goBack()} />

        <ChatStatusCard
          statusTheme={statusTheme}
          overallLabel={overallLabel}
          metaLabel={metaLabel}
        />

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        >
          <View style={styles.chatArea}>
            <MessageList
              messages={messages}
              onSelectTechnique={setSelectedTechnique}
            />
          </View>

          <PromptChips onSelectPrompt={setInput} />

          <TechniqueDetailCard technique={selectedTechnique} />

          <ChatInputBar
            input={input}
            onChangeInput={setInput}
            onSend={handleSend}
            sending={sending}
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
