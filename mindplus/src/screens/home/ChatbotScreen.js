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
import { useGlobalAudioPlayer } from "../../context/GlobalAudioPlayerContext";
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
      return "Critical Please reach out for help";
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

function getStressPercent({ overallStatus, stressLevel } = {}) {
  const byOverall = {
    critical: 100,
    high_stress: 80,
    moderate_stress: 55,
    low_stress: 30,
    normal: 15,
    idle: 0,
  };
  if (overallStatus && byOverall[overallStatus] != null) {
    return byOverall[overallStatus];
  }

  const byStress = {
    high: 75,
    medium: 50,
    low: 25,
  };
  const key = typeof stressLevel === "string" ? stressLevel.toLowerCase() : "";
  return byStress[key] ?? 0;
}

export default function ChatbotScreen({ navigation }) {
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [botTyping, setBotTyping] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [initialPrompt, setInitialPrompt] = useState(null);
  const [moodOptions, setMoodOptions] = useState([]);
  const [showMoodOptions, setShowMoodOptions] = useState(false);
  const [selectedTechnique, setSelectedTechnique] = useState(null);
  const [userLabel, setUserLabel] = useState("You");
  const [emergencyContact, setEmergencyContact] = useState(null);
  const [emergencyName, setEmergencyName] = useState(null);

  const { selectTrack, togglePlay, closeMiniPlayer, isPlaying } =
    useGlobalAudioPlayer();

  const handleAppAction = async (appAction, meta = {}) => {
    if (!appAction) return;

    try {
      const { action, target, sound, command, mode } = appAction;
      const { emotion } = meta;

      // Soundscape controls: play specific ambience or stop
      if (target === "soundscape") {
        if (action === "navigate") {
          let trackId = null;
          if (sound === "soft_rain") trackId = "rain";
          else if (sound === "forest") trackId = "forest";
          else if (sound === "fireplace") trackId = "fire";

          if (trackId) {
            await selectTrack(trackId);
            if (!isPlaying) {
              await togglePlay();
            }
          }

          navigation.navigate("SoundscapeScreen");
          return;
        }

        if (action === "control" && command === "stop") {
          await closeMiniPlayer();
          return;
        }
      }

      // Breathing exercise: open guided calm/box breathing screen
      if (action === "navigate" && target === "breathing_exercise") {
        navigation.navigate("VisualAffirmationScreen");
        return;
      }

      // Meditation: reuse the same calming session screen
      if (action === "navigate" && target === "meditation") {
        navigation.navigate("VisualAffirmationScreen");
        return;
      }

      // Stress tips / coping techniques list
      if (action === "navigate" && target === "stress_tips") {
        navigation.navigate("CopingStrategyScreen", {
          emotion: emotion || "unknown",
          confidence: 0.7,
        });
        return;
      }

      // Mood tracker module
      if (action === "navigate" && target === "mood_tracker") {
        if (mode === "log_today") {
          navigation.navigate("DailyCheckInScreen");
        } else {
          navigation.navigate("OverallEmotionScreen");
        }
      }
    } catch (e) {
      console.log("Failed to handle app action", e);
    }
  };

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

        const start = await startChatSession();
        setSessionId(start.session_id);

        // Seed the conversation with the mood check-in prompt
        if (start.initial_message) {
          setInitialPrompt(start.initial_message);
          setMoodOptions(start.mood_options || []);
          setShowMoodOptions(false);

          const fullText = start.initial_message || "";
          const botId = `${Date.now()}-init`;

          // Add an empty bot message and progressively fill it, like other replies.
          // Mark it as a mood prompt so the MessageList can render emoji options
          // inside the same message bubble.
          setMessages((prev) => [
            ...prev,
            {
              id: botId,
              from: "bot",
              text: "",
              label: "MindPlus Bot",
              isMoodPrompt: true,
            },
          ]);

          const typingSpeed = 18; // ms per character
          const chars = fullText.split("");
          chars.forEach((_, index) => {
            setTimeout(() => {
              const nextText = fullText.slice(0, index + 1);
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === botId
                    ? {
                        ...m,
                        text: nextText,
                      }
                    : m
                )
              );
            }, typingSpeed * index);
          });

          // After the typing effect finishes, fade in the mood options
          const totalDuration = typingSpeed * chars.length + 150;
          setTimeout(() => {
            setShowMoodOptions(true);
          }, totalDuration);
        }
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
      setBotTyping(true);
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

      if (raw.app_action) {
        await handleAppAction(raw.app_action, { emotion: reply.emotion });
      }
      const delayMs = 1500 + Math.random() * 1500;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      // After a short "thinking" delay, show a typing effect for the bot message
      setBotTyping(false);

      const fullText = reply.botMessage || "";
      const botId = `${Date.now()}-bot`;
      const baseMeta = {
        emotion: reply.emotion,
        stressLevel: reply.stressLevel,
        academicStressCategory: reply.academicStressCategory,
        riskLevel: reply.riskLevel,
        overallStatus: reply.overallStatus,
        techniques: reply.techniques,
      };

      // Add an empty bot message and progressively fill it character by character
      setMessages((prev) => [
        ...prev,
        {
          id: botId,
          from: "bot",
          text: "",
          label: "MindPlus Bot",
          meta: baseMeta,
        },
      ]);

      const typingSpeed = 18; // ms per character
      const chars = fullText.split("");
      chars.forEach((_, index) => {
        setTimeout(() => {
          const nextText = fullText.slice(0, index + 1);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === botId
                ? {
                    ...m,
                    text: nextText,
                  }
                : m
            )
          );
        }, typingSpeed * index);
      });
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
      setBotTyping(false);
    }
  };

  const handleSelectMood = async (option) => {
    if (!sessionId || sending) return;
    const text = `${option.emoji} ${option.label}`;

    const userMessage = {
      id: Date.now().toString(),
      from: "user",
      text,
      label: userLabel,
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      setSending(true);
      setBotTyping(true);
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

      if (raw.app_action) {
        await handleAppAction(raw.app_action, { emotion: reply.emotion });
      }
      const delayMs = 1500 + Math.random() * 1500;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      setBotTyping(false);

      const fullText = reply.botMessage || "";
      const botId = `${Date.now()}-bot`;
      const baseMeta = {
        emotion: reply.emotion,
        stressLevel: reply.stressLevel,
        academicStressCategory: reply.academicStressCategory,
        riskLevel: reply.riskLevel,
        overallStatus: reply.overallStatus,
        techniques: reply.techniques,
      };

      // Add an empty bot message and progressively fill it character by character
      setMessages((prev) => [
        ...prev,
        {
          id: botId,
          from: "bot",
          text: "",
          label: "MindPlus Bot",
          meta: baseMeta,
        },
      ]);

      const typingSpeed = 18; // ms per character
      const chars = fullText.split("");
      chars.forEach((_, index) => {
        setTimeout(() => {
          const nextText = fullText.slice(0, index + 1);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === botId
                ? {
                    ...m,
                    text: nextText,
                  }
                : m
            )
          );
        }, typingSpeed * index);
      });

      // After the mood is selected once, hide the chips
      setMoodOptions([]);
      setShowMoodOptions(false);
    } catch (err) {
      console.log("Failed to send mood selection", err);
    } finally {
      setSending(false);
      setBotTyping(false);
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
  const stressPercent = getStressPercent({
    overallStatus: lastStatusMeta?.overallStatus,
    stressLevel: lastStatusMeta?.stressLevel,
  });
  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.container}>
        <ChatHeader onBack={() => navigation.goBack()} />

        <ChatStatusCard
          statusTheme={statusTheme}
          overallLabel={overallLabel}
          stressPercent={stressPercent}
        />

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        >
          <View style={styles.chatArea}>
            <MessageList
              messages={messages}
              isBotTyping={botTyping}
              emergencyContact={emergencyContact}
              emergencyName={emergencyName}
              onSelectTechnique={setSelectedTechnique}
              moodOptions={moodOptions}
              showMoodOptions={showMoodOptions}
              onSelectMood={handleSelectMood}
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
