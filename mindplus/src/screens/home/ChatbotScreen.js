import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Switch,
  TouchableOpacity,
  Alert,
  Linking,
  Modal,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth, db } from "../../firebase/firebaseConfig";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { startChatSession, sendChatMessage } from "../../services/chatApi";
import {
  playBotMessageVoice,
  stopBotMessageVoice,
  cleanupTTS,
} from "../../services/textToSpeechService";
import { useGlobalAudioPlayer } from "../../context/GlobalAudioPlayerContext";
import ChatHeader from "../../components/chatbot/ChatHeader";
import ChatStatusCard from "../../components/chatbot/ChatStatusCard";
import MessageList from "../../components/chatbot/MessageList";
import PromptChips from "../../components/chatbot/PromptChips";
import TechniqueDetailCard from "../../components/chatbot/TechniqueDetailCard";
import ChatInputBar from "../../components/chatbot/ChatInputBar";
import styles from "../../components/chatbot/chatbotStyles";
import { getTodayQuote } from "../../utils/dailyMotivation";
import { Audio } from "expo-av";

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

const QUICK_COMMANDS = [
  // Core wellbeing flows
  {
    id: "home_dashboard",
    label: "Go to home dashboard",
    description: "Overview of your wellbeing and shortcuts.",
    appAction: {
      action: "navigate",
      target: "home_dashboard",
    },
  },
  {
    id: "heatmap",
    label: "View emotion heatmap",
    description: "See your stress and emotion patterns over time.",
    appAction: {
      action: "navigate",
      target: "heatmap",
    },
  },

  // Soundscapes & calming
  {
    id: "soft_rain",
    label: "Play soft rain",
    description: "Open Soundscapes and start soft rain ambience.",
    appAction: {
      action: "navigate",
      target: "soundscape",
      sound: "soft_rain",
    },
  },
  {
    id: "forest_sounds",
    label: "Play forest sounds",
    description: "Open Soundscapes and play forest ambience.",
    appAction: {
      action: "navigate",
      target: "soundscape",
      sound: "forest",
    },
  },
  {
    id: "open_soundscapes",
    label: "Open soundscapes",
    description: "Go to the full soundscape library.",
    appAction: {
      action: "navigate",
      target: "soundscape",
    },
  },
  {
    id: "stop_soundscape",
    label: "Stop soundscape",
    description: "Stop any currently playing soundscape.",
    appAction: {
      action: "control",
      target: "soundscape",
      command: "stop",
    },
  },
  {
    id: "breathing_exercise",
    label: "Start breathing exercise",
    description: "Go to a guided breathing / calming exercise.",
    appAction: {
      action: "navigate",
      target: "breathing_exercise",
    },
  },
  {
    id: "meditation",
    label: "Start meditation",
    description: "Open the guided meditation screen.",
    appAction: {
      action: "navigate",
      target: "meditation",
    },
  },

  // Coping & strategies
  {
    id: "coping_tips",
    label: "Show coping strategies",
    description: "Open tips and strategies for managing stress.",
    appAction: {
      action: "navigate",
      target: "stress_tips",
    },
  },

  // Profile & menu
  {
    id: "view_profile",
    label: "Open my profile",
    description: "View or edit your personal details.",
    appAction: {
      action: "navigate",
      target: "profile",
    },
  },

  // Voice features
  {
    id: "voice_recorder",
    label: "Open voice journal",
    description: "Record a voice note about how you feel.",
    appAction: {
      action: "navigate",
      target: "voice_recorder",
    },
  },
  {
    id: "listening_history",
    label: "View listening history",
    description: "See past recordings and sessions.",
    appAction: {
      action: "navigate",
      target: "history",
    },
  },
  {
    id: "community",
    label: "Open community",
    description: "Go to the peer community space.",
    appAction: {
      action: "navigate",
      target: "community",
    },
  },
];

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
  const [speakingMessageId, setSpeakingMessageId] = useState(null);
  const [autoVoiceEnabled, setAutoVoiceEnabled] = useState(false);
  const [dailyQuote, setDailyQuote] = useState(null);
  const [criticalAlert, setCriticalAlert] = useState(null);
  const [alertAcknowledged, setAlertAcknowledged] = useState(false);
  const [alarmSound, setAlarmSound] = useState(null);
  const [autoContactTriggered, setAutoContactTriggered] = useState(false);
  const [showCommands, setShowCommands] = useState(false);

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
          else if (sound === "ocean") trackId = "ocean";
          else if (sound === "white") trackId = "white";

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
        return;
      }

      // Home dashboard
      if (action === "navigate" && target === "home_dashboard") {
        navigation.navigate("HomeDashboardScreen");
        return;
      }

      // Emotion heatmap
      if (action === "navigate" && target === "heatmap") {
        navigation.navigate("HeatmapScreen");
        return;
      }

      // Profile
      if (action === "navigate" && target === "profile") {
        navigation.navigate("UserProfileScreen");
        return;
      }

      // Main menu
      if (action === "navigate" && target === "menu") {
        navigation.navigate("MenuScreen");
        return;
      }

      // Voice features
      if (action === "navigate" && target === "voice_recorder") {
        navigation.navigate("VoiceRecorderScreen");
        return;
      }

      if (action === "navigate" && target === "stress_mind_map") {
        navigation.navigate("StressMindMap");
        return;
      }

      if (action === "navigate" && target === "history") {
        navigation.navigate("HistoryScreen");
        return;
      }

      if (action === "navigate" && target === "community") {
        navigation.navigate("CommunityScreen");
        return;
      }

      if (action === "navigate" && target === "voice_chat") {
        navigation.navigate("ChatScreen");
        return;
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

    // Load or generate today's motivational quote once per mount.
    const loadQuote = async () => {
      try {
        const quote = await getTodayQuote();
        setDailyQuote(quote);
      } catch (error) {
        console.log("Failed to load daily quote", error);
      }
    };
    loadQuote();

    // Preload a short alarm sound for critical alerts (bundled asset).
    const loadAlarm = async () => {
      try {
        const { sound } = await Audio.Sound.createAsync(
          require("../../../assets/soundscapes/alarm-tone.mp3"),
          {
            shouldPlay: false,
            isLooping: false,
            volume: 1.0,
          }
        );
        setAlarmSound(sound);
      } catch (e) {
        console.log("Failed to load alarm sound", e);
      }
    };
    loadAlarm();

    // Clean up any TTS listeners when leaving the chatbot screen
    return () => {
      cleanupTTS();
      if (alarmSound) {
        alarmSound.unloadAsync().catch(() => {});
      }
    };
  }, []);

  const triggerCriticalAlertFlow = async ({ condition, sourceText }) => {
    try {
      const createdAt = new Date().toISOString();
      setCriticalAlert({ condition, sourceText, createdAt });
      setAlertAcknowledged(false);

      // Play an audible alert using the existing TTS pipeline
      playBotMessageVoice(
        "Critical alert. Your message indicates a serious concern. Help is available immediately.",
        {}
      );

      // Play an additional alarm tone to grab attention (if loaded)
      try {
        if (alarmSound) {
          await alarmSound.replayAsync();
        }
      } catch (soundErr) {
        console.log("Failed to play alarm sound", soundErr);
      }

      // Log alert for monitoring / research purposes
      try {
        const user = auth.currentUser;
        if (user) {
          const alertsRef = collection(db, "users", user.uid, "alerts");
          await addDoc(alertsRef, {
            type: "chat_critical_risk",
            condition: condition || "critical",
            source_text: sourceText,
            created_at: serverTimestamp(),
          });
        }
      } catch (logErr) {
        console.log("Failed to log critical alert", logErr);
      }

      // Automatically attempt to contact the user's emergency number (or 1926)
      try {
        if (!autoContactTriggered) {
          setAutoContactTriggered(true);

          const targetNumber = emergencyContact || "1926";
          if (targetNumber) {
            // Open the phone dialer immediately
            handleCallNumber(targetNumber);

            // If a personal emergency contact exists, also prepare an SMS to them
            if (emergencyContact) {
              setTimeout(() => {
                handleSmsNumber(
                  emergencyContact,
                  condition || "critical"
                );
              }, 2000);
            }
          }
        }
      } catch (autoErr) {
        console.log("Failed to auto contact emergency number", autoErr);
      }

      Alert.alert(
        "⚠️ Critical Alert",
        "Your message indicates a serious concern. Help is available immediately.",
        [{ text: "OK" }]
      );
    } catch (e) {
      console.log("Failed to trigger critical alert flow", e);
    }
  };

  const handleCallNumber = (number) => {
    if (!number) return;
    Linking.openURL(`tel:${number}`).catch((err) => {
      console.log("Failed to start phone call", err);
    });
  };

  const buildEmergencySmsBody = (condition) => {
    const now = new Date().toISOString();
    const name = userLabel || "User";
    const label = condition || "critical concern";
    return (
      `This is an automatic safety message from MindPlus.\n\n` +
      `User: ${name}\n` +
      `Detected condition: ${label}\n` +
      `Time: ${now}`
    );
  };

  const handleSmsNumber = (number, condition) => {
    if (!number) return;
    const body = encodeURIComponent(buildEmergencySmsBody(condition));
    const url = `sms:${number}?body=${body}`;
    Linking.openURL(url).catch((err) => {
      console.log("Failed to start SMS", err);
    });
  };

  const handleAcknowledgeAlert = async () => {
    // Mark this alert as acknowledged and hide the critical alert card
    setAlertAcknowledged(true);
    setCriticalAlert(null);
    setAutoContactTriggered(false);

    // Stop alarm sound if it's still playing
    try {
      if (alarmSound) {
        await alarmSound.stopAsync();
      }
    } catch (e) {
      console.log("Failed to stop alarm sound", e);
    }

    // Add a supportive bot response so the user feels heard
    const botId = `${Date.now()}-ack`;
    const text =
      "Thank you for letting me know you're here. I'm still with you. If at any moment you feel unsafe, please call 1926 or your emergency contact immediately.";

    setMessages((prev) => [
      ...prev,
      {
        id: botId,
        from: "bot",
        text,
        label: "MindPlus Bot",
      },
    ]);

    // Optionally speak this reassurance if auto voice is on
    if (autoVoiceEnabled) {
      setSpeakingMessageId(botId);
      playBotMessageVoice(text, {
        onFinish: () => {
          setSpeakingMessageId((currentId) =>
            currentId === botId ? null : currentId
          );
        },
      });
    }
  };

  // Handle play/stop for a specific bot message
  const handleToggleVoice = (message) => {
    if (!message || !message.text) return;

    // If this message is already speaking, stop it
    if (speakingMessageId === message.id) {
      stopBotMessageVoice();
      setSpeakingMessageId(null);
      return;
    }

    // Start playback for the selected bot message
    setSpeakingMessageId(message.id);
    playBotMessageVoice(message.text, {
      onFinish: () => {
        setSpeakingMessageId((currentId) =>
          currentId === message.id ? null : currentId
        );
      },
    });
  };

  // Send either the current typed input or an override text (e.g. from voice).
  const handleSend = async (overrideText) => {
    const sourceText =
      typeof overrideText === "string" && overrideText.length > 0
        ? overrideText
        : input;

    if (!sessionId || !sourceText.trim() || sending) return;

    const text = sourceText.trim();
    // Clear the input after sending (for both typed and voice messages).
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

      if (
        reply.riskLevel === "critical" ||
        reply.overallStatus === "critical"
      ) {
        triggerCriticalAlertFlow({
          condition: reply.riskLevel,
          sourceText: text,
        });
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

      const totalTypingDuration = typingSpeed * chars.length;

      // Auto voice playback once the bot has finished "typing"
      if (autoVoiceEnabled && fullText) {
        setTimeout(() => {
          setSpeakingMessageId(botId);
          playBotMessageVoice(fullText, {
            onFinish: () => {
              setSpeakingMessageId((currentId) =>
                currentId === botId ? null : currentId
              );
            },
          });
        }, totalTypingDuration + 300);
      }

      // Trigger any app action after the bot message has finished typing
      if (raw.app_action) {
        setTimeout(() => {
          handleAppAction(raw.app_action, { emotion: reply.emotion });
        }, totalTypingDuration + 1500);
      }
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

      const totalTypingDuration = typingSpeed * chars.length;

      // Auto voice playback for mood-based replies
      if (autoVoiceEnabled && fullText) {
        setTimeout(() => {
          setSpeakingMessageId(botId);
          playBotMessageVoice(fullText, {
            onFinish: () => {
              setSpeakingMessageId((currentId) =>
                currentId === botId ? null : currentId
              );
            },
          });
        }, totalTypingDuration + 300);
      }

      // Trigger any app action after the bot message has finished typing
      if (raw.app_action) {
        setTimeout(() => {
          handleAppAction(raw.app_action, { emotion: reply.emotion });
        }, totalTypingDuration + 1500);
      }

      if (
        reply.riskLevel === "critical" ||
        reply.overallStatus === "critical"
      ) {
        triggerCriticalAlertFlow({
          condition: reply.riskLevel,
          sourceText: text,
        });
      }

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

        <View style={styles.commandsRow}>
          <TouchableOpacity
            style={styles.commandsButton}
            onPress={() => setShowCommands(true)}
          >
            <Text style={styles.commandsButtonText}>
              View available commands
            </Text>
          </TouchableOpacity>
        </View>

        {dailyQuote && (
          <View style={styles.dailyQuoteCard}>
            <Text style={styles.dailyQuoteLabel}>Today’s reminder</Text>
            <Text style={styles.dailyQuoteText}>“{dailyQuote.text}”</Text>
            {dailyQuote.author ? (
              <Text style={styles.dailyQuoteAuthor}>— {dailyQuote.author}</Text>
            ) : null}
          </View>
        )}

        <Modal
          visible={showCommands}
          animationType="slide"
          transparent
          onRequestClose={() => setShowCommands(false)}
        >
          <View style={styles.commandsModalOverlay}>
            <View style={styles.commandsModalCard}>
              <Text style={styles.commandsModalTitle}>Quick commands</Text>
              <Text style={styles.commandsModalSubtitle}>
                Tap a command to open the related feature.
              </Text>

              <ScrollView style={styles.commandsList}>
                {QUICK_COMMANDS.map((cmd) => (
                  <TouchableOpacity
                    key={cmd.id}
                    style={styles.commandItem}
                    onPress={async () => {
                      setShowCommands(false);
                      await handleAppAction(cmd.appAction);
                    }}
                  >
                    <Text style={styles.commandItemTitle}>{cmd.label}</Text>
                    {cmd.description ? (
                      <Text style={styles.commandItemDescription}>
                        {cmd.description}
                      </Text>
                    ) : null}
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TouchableOpacity
                style={styles.commandsCloseButton}
                onPress={() => setShowCommands(false)}
              >
                <Text style={styles.commandsCloseButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {criticalAlert && (
          <View style={styles.criticalAlertCard}>
            <Text style={styles.criticalAlertTitle}>
              ⚠️ Critical Alert: Your message indicates a serious concern. Help
              is available immediately.
            </Text>
            <Text style={styles.criticalAlertBody}>
              You are not alone. You can reach the official helpline or someone
              you trust right now.
            </Text>

            <View style={styles.criticalContactSection}>
              <Text style={styles.criticalContactLabel}>
                Official emergency line
              </Text>
              <Text style={styles.criticalContactValue}>1926</Text>
              <View style={styles.criticalButtonsRow}>
                <TouchableOpacity
                  style={styles.criticalButtonPrimary}
                  onPress={() => handleCallNumber("1926")}
                >
                  <Text style={styles.criticalButtonPrimaryText}>Call Now</Text>
                </TouchableOpacity>
              </View>
            </View>

            {emergencyContact && (
              <View style={styles.criticalContactSection}>
                <Text style={styles.criticalContactLabel}>
                  Personal emergency contact
                </Text>
                <Text style={styles.criticalContactValue}>
                  {emergencyName
                    ? `${emergencyName} — ${emergencyContact}`
                    : emergencyContact}
                </Text>
                <View style={styles.criticalButtonsRow}>
                  <TouchableOpacity
                    style={styles.criticalButtonSecondary}
                    onPress={() => handleCallNumber(emergencyContact)}
                  >
                    <Text style={styles.criticalButtonSecondaryText}>
                      Call Now
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.criticalButtonSecondary}
                    onPress={() =>
                      handleSmsNumber(
                        emergencyContact,
                        criticalAlert?.condition || "critical"
                      )
                    }
                  >
                    <Text style={styles.criticalButtonSecondaryText}>
                      Send Message
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <View style={styles.criticalCopingRow}>
              <Text style={styles.criticalCopingLabel}>You can also:</Text>
              <View style={styles.criticalCopingButtons}>
                <TouchableOpacity
                  style={styles.criticalCopingChip}
                  onPress={() => navigation.navigate("VisualAffirmationScreen")}
                >
                  <Text style={styles.criticalCopingChipText}>
                    Breathing exercise
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.criticalCopingChip}
                  onPress={() =>
                    navigation.navigate("CopingStrategyScreen", {
                      emotion: "anxious",
                      confidence: 0.9,
                    })
                  }
                >
                  <Text style={styles.criticalCopingChipText}>Coping tips</Text>
                </TouchableOpacity>
              </View>
            </View>

            {!alertAcknowledged && (
              <TouchableOpacity
                style={styles.criticalAcknowledgeButton}
                onPress={handleAcknowledgeAlert}
              >
                <Text style={styles.criticalAcknowledgeText}>
                  I’m here and I understand
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

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
              onPressVoice={handleToggleVoice}
              speakingMessageId={speakingMessageId}
            />
          </View>

          <View style={styles.autoVoiceRow}>
            <Text style={styles.autoVoiceLabel}>Auto voice</Text>
            <Switch
              value={autoVoiceEnabled}
              onValueChange={setAutoVoiceEnabled}
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
