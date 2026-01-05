import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth, db } from "../../firebase/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { startChatSession, sendChatMessage } from "../../services/chatApi";
import ChatHeader from "../../components/chatbot/ChatHeader";
import ChatStatusCard from "../../components/chatbot/ChatStatusCard";
import MessageList from "../../components/chatbot/MessageList";
import PromptChips from "../../components/chatbot/PromptChips";
import TechniqueDetailCard from "../../components/chatbot/TechniqueDetailCard";
import ChatInputBar from "../../components/chatbot/ChatInputBar";
import styles from "../../components/chatbot/chatbotStyles";

const STATUS_THEME = {
  critical: {
    bg: "#F87171", // softer red for readability
    border: "#B91C1C", // deep red border for emphasis
  },
  high_stress: {
    bg: "#FB923C", // warm orange
    border: "#C2410C", // dark orange border
  },
  moderate_stress: {
    bg: "#60A5FA", // bright blue
    border: "#2563EB", // darker blue for border
  },
  low_stress: {
    bg: "#34D399", // fresh green
    border: "#059669", // darker green
  },
  normal: {
    bg: "#3B82F6", // classic primary blue
    border: "#1E40AF", // deep blue border
  },
  idle: {
    bg: "#A1A1AA", // neutral gray
    border: "#52525B", // darker gray border
  },
};

function formatOverallStatus(status) {
  switch (status) {
    case "critical":
      return "Critical Please reach out for real-time help";
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

export default function ChatbotScreen({ navigation }) {
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [selectedTechnique, setSelectedTechnique] = useState(null);
  const [userLabel, setUserLabel] = useState("You");
  const [emergencyContact, setEmergencyContact] = useState(null);
  const [emergencyName, setEmergencyName] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const profileRef = doc(db, "users", user.uid, "profile", "basic");
          const profileSnap = await getDoc(profileRef);

          const nickname = profileSnap.exists()
            ? profileSnap.data()?.nickname
            : null;

          if (profileSnap.exists()) {
            const data = profileSnap.data();
            setEmergencyContact(data?.emergencyContact || null);
            setEmergencyName(data?.emergencyName || null);
          }

          setUserLabel(nickname || user.displayName || "You");
        }

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

    const userMessage = {
      id: Date.now().toString(),
      from: "user",
      text,
      label: userLabel,
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
  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.container}>
        <ChatHeader onBack={() => navigation.goBack()} />

        <ChatStatusCard statusTheme={statusTheme} overallLabel={overallLabel} />

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

          <TechniqueDetailCard
            technique={selectedTechnique}
            emergencyContact={emergencyContact}
            emergencyName={emergencyName}
            onClose={() => setSelectedTechnique(null)}
          />

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
