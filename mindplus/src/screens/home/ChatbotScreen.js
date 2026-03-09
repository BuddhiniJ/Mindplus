import React, { useEffect, useRef, useState } from "react";
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
  Share,
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
import AsyncStorage from "@react-native-async-storage/async-storage";
import { startChatSession, sendChatMessage } from "../../services/chatApi";
import {
  loadChatConversation,
  appendChatMessages,
  clearChatHistory,
} from "../../services/chatHistoryService";
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
import HelpfulResourcesSection from "../../components/chatbot/HelpfulResourcesSection";
import ChatInputBar from "../../components/chatbot/ChatInputBar";
import styles from "../../components/chatbot/chatbotStyles";
import { getTodayQuote } from "../../utils/dailyMotivation";
import { Audio } from "expo-av";
import * as Location from "expo-location";

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

const CHAT_THEMES = [
  { id: "calm", label: "Calm blue" },
  { id: "forest", label: "Forest" },
  { id: "dark", label: "Dark" },
];

const SETTINGS_SWITCH_TRACK = { false: "#D1D5DB", true: "#6366F1" };
const SETTINGS_SWITCH_THUMB_ON = "#EEF2FF";
const SETTINGS_SWITCH_THUMB_OFF = "#F9FAFB";

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
  const [userId, setUserId] = useState(null);
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
  const [showResources, setShowResources] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [resourcesMeta, setResourcesMeta] = useState(null);
  const [showStressCard, setShowStressCard] = useState(true);
  const [chatTheme, setChatTheme] = useState("calm");
  const [compactMessages, setCompactMessages] = useState(false);
  const [showTimestamps, setShowTimestamps] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [hideLabels, setHideLabels] = useState(false);
  const [anonymousMode, setAnonymousMode] = useState(false);
  const [simplifiedMode, setSimplifiedMode] = useState(false);
  const [slowInteractionMode, setSlowInteractionMode] = useState(false);
  const [soundFeedbackEnabled, setSoundFeedbackEnabled] = useState(false);
  const uiSoundRef = useRef({});

  const { selectTrack, togglePlay, closeMiniPlayer, isPlaying } =
    useGlobalAudioPlayer();

  const SETTINGS_KEY = "chatbot_settings_v1";

  const loadSettings = async () => {
    try {
      const raw = await AsyncStorage.getItem(SETTINGS_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);

      if (typeof data.autoVoiceEnabled === "boolean") {
        setAutoVoiceEnabled(data.autoVoiceEnabled);
      }
      if (typeof data.showStressCard === "boolean") {
        setShowStressCard(data.showStressCard);
      }
      if (typeof data.chatTheme === "string") {
        setChatTheme(data.chatTheme);
      }
      if (typeof data.compactMessages === "boolean") {
        setCompactMessages(data.compactMessages);
      }
      if (typeof data.showTimestamps === "boolean") {
        setShowTimestamps(data.showTimestamps);
      }
      if (typeof data.largeText === "boolean") {
        setLargeText(data.largeText);
      }
      if (typeof data.hideLabels === "boolean") {
        setHideLabels(data.hideLabels);
      }
      if (typeof data.anonymousMode === "boolean") {
        setAnonymousMode(data.anonymousMode);
      }
      if (typeof data.simplifiedMode === "boolean") {
        setSimplifiedMode(data.simplifiedMode);
      }
      if (typeof data.slowInteractionMode === "boolean") {
        setSlowInteractionMode(data.slowInteractionMode);
      }
      if (typeof data.soundFeedbackEnabled === "boolean") {
        setSoundFeedbackEnabled(data.soundFeedbackEnabled);
      }
    } catch (e) {
      console.log("Failed to load chatbot settings", e);
    }
  };

  const persistSettings = async (overrides = {}) => {
    try {
      const current = {
        autoVoiceEnabled,
        showStressCard,
        chatTheme,
        compactMessages,
        showTimestamps,
        largeText,
        hideLabels,
        anonymousMode,
        simplifiedMode,
        slowInteractionMode,
        soundFeedbackEnabled,
      };
      const payload = { ...current, ...overrides };
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(payload));
    } catch (e) {
      console.log("Failed to save chatbot settings", e);
    }
  };

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

  const playUiSound = async (event) => {
    if (!soundFeedbackEnabled) return;
    try {
      let soundKey = "send";
      if (event === "message_received") soundKey = "received";

      const cache = uiSoundRef.current || {};

      if (!cache[soundKey]) {
        let source;
        if (soundKey === "received") {
          source = require("../../../assets/soundscapes/receving.mp3");
        } else {
          source = require("../../../assets/soundscapes/sending.mp3");
        }

        const { sound } = await Audio.Sound.createAsync(source, {
          volume: 0.18,
          shouldPlay: false,
        });
        cache[soundKey] = sound;
        uiSoundRef.current = cache;
      }

      const sound = uiSoundRef.current[soundKey];
      if (!sound) return;
      await sound.setPositionAsync(0);
      await sound.playAsync();
    } catch (e) {
      // Fail silently to avoid disrupting the conversation.
    }
  };

  useEffect(() => {
    return () => {
      if (uiSoundRef.current) {
        Object.values(uiSoundRef.current).forEach((sound) => {
          if (sound && typeof sound.unloadAsync === "function") {
            sound.unloadAsync().catch(() => {});
          }
        });
        uiSoundRef.current = {};
      }
    };
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        await loadSettings();

        const user = auth.currentUser;
        let resolvedUserId = null;

        if (user) {
          resolvedUserId = user.uid;
          setUserId(user.uid);
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
        // Attempt to restore an existing chat conversation if the user is logged in
        let restored = null;
        if (resolvedUserId) {
          restored = await loadChatConversation(resolvedUserId);
        }

        if (restored && restored.messages && restored.messages.length > 0) {
          setMessages(restored.messages);
          setSessionId(restored.sessionId || null);
        } else {
          const start = await startChatSession();
          setSessionId(start.session_id);

          // Seed the conversation with the mood check-in prompt
          if (start.initial_message) {
            setInitialPrompt(start.initial_message);
            setMoodOptions(start.mood_options || []);
            setShowMoodOptions(false);

            const fullText = start.initial_message || "";
            const createdAt = Date.now();
            const botId = `${createdAt}-init`;

            const uiMessage = {
              id: botId,
              from: "bot",
              text: "",
              label: "MindPlus Bot",
              isMoodPrompt: true,
              timestamp: createdAt,
            };

            // Add an empty bot message and progressively fill it, like other replies.
            // Mark it as a mood prompt so the MessageList can render emoji options
            // inside the same message bubble.
            setMessages((prev) => [...prev, uiMessage]);

            // Persist the full initial message text for this user (if logged in and not in anonymous mode)
            if (resolvedUserId && fullText && !anonymousMode) {
              const storedMessage = {
                ...uiMessage,
                text: fullText,
              };
              appendChatMessages(
                resolvedUserId,
                [storedMessage],
                start.session_id,
              );
            }

            const typingSpeed = slowInteractionMode ? 28 : 18; // ms per character
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
                      : m,
                  ),
                );
              }, typingSpeed * index);
            });

            // After the typing effect finishes, fade in the mood options
            const totalDuration = typingSpeed * chars.length + 150;
            setTimeout(() => {
              setShowMoodOptions(true);
            }, totalDuration);
          }
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
          },
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
        {},
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
                handleSmsNumber(emergencyContact, condition || "critical");
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
        [{ text: "OK" }],
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

  const buildEmergencySmsBody = async (condition) => {
    const now = new Date().toISOString();
    const name = userLabel || "User";
    const label = condition || "critical concern";

    let locationText = "Not available";
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const loc = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = loc.coords || {};
        if (latitude != null && longitude != null) {
          locationText = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
        }
      }
    } catch (e) {
      console.log("Failed to get current location for SMS", e);
    }

    return (
      `This is an automatic safety message from MindPlus.\n\n` +
      `User: ${name}\n` +
      `Detected condition: ${label}\n` +
      `Time: ${now}\n` +
      `Location: ${locationText}`
    );
  };

  const handleSmsNumber = async (number, condition) => {
    if (!number) return;
    try {
      const smsBody = await buildEmergencySmsBody(condition);
      const body = encodeURIComponent(smsBody);
      const url = `sms:${number}?body=${body}`;
      Linking.openURL(url).catch((err) => {
        console.log("Failed to start SMS", err);
      });
    } catch (e) {
      console.log("Failed to build SMS body", e);
    }
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
    const createdAt = Date.now();
    const text =
      "Thank you for letting me know you're here. I'm still with you. If at any moment you feel unsafe, please call 1926 or your emergency contact immediately.";

    setMessages((prev) => [
      ...prev,
      {
        id: botId,
        from: "bot",
        text,
        label: "MindPlus Bot",
        timestamp: createdAt,
      },
    ]);

    if (userId && !anonymousMode) {
      appendChatMessages(
        userId,
        [
          {
            id: botId,
            from: "bot",
            text,
            label: "MindPlus Bot",
            timestamp: createdAt,
          },
        ],
        sessionId,
      );
    }

    // Optionally speak this reassurance if auto voice is on
    if (autoVoiceEnabled) {
      setSpeakingMessageId(botId);
      playBotMessageVoice(text, {
        onFinish: () => {
          setSpeakingMessageId((currentId) =>
            currentId === botId ? null : currentId,
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
          currentId === message.id ? null : currentId,
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

    const createdAt = Date.now();
    const userMessage = {
      id: createdAt.toString(),
      from: "user",
      text,
      label: userLabel,
      timestamp: createdAt,
    };
    setMessages((prev) => [...prev, userMessage]);

    playUiSound("message_sent");

    if (userId && !anonymousMode) {
      appendChatMessages(
        userId,
        [
          {
            ...userMessage,
          },
        ],
        sessionId,
      );
    }

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
      const baseDelay = 1500 + Math.random() * 1500;
      const delayMs = slowInteractionMode ? baseDelay + 2000 : baseDelay;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      // After a short "thinking" delay, show a typing effect for the bot message
      setBotTyping(false);

      const fullText = reply.botMessage || "";
      const botCreatedAt = Date.now();
      const botId = `${botCreatedAt}-bot`;
      const baseMeta = {
        emotion: reply.emotion,
        stressLevel: reply.stressLevel,
        academicStressCategory: reply.academicStressCategory,
        riskLevel: reply.riskLevel,
        overallStatus: reply.overallStatus,
        techniques: reply.techniques,
      };

      // Add an empty bot message and progressively fill it character by character
      const uiBotMessage = {
        id: botId,
        from: "bot",
        text: "",
        label: "MindPlus Bot",
        meta: baseMeta,
        timestamp: botCreatedAt,
      };

      setMessages((prev) => [...prev, uiBotMessage]);

      if (userId && fullText && !anonymousMode) {
        const storedBotMessage = {
          ...uiBotMessage,
          text: fullText,
        };
        appendChatMessages(userId, [storedBotMessage], sessionId);
      }

      const typingSpeed = slowInteractionMode ? 28 : 18; // ms per character
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
                : m,
            ),
          );
        }, typingSpeed * index);
      });

      const totalTypingDuration = typingSpeed * chars.length;
      if (fullText) {
        setTimeout(() => {
          playUiSound("message_received");
        }, totalTypingDuration + 50);
      }

      // Auto voice playback once the bot has finished "typing"
      if (autoVoiceEnabled && fullText) {
        setTimeout(() => {
          setSpeakingMessageId(botId);
          playBotMessageVoice(fullText, {
            onFinish: () => {
              setSpeakingMessageId((currentId) =>
                currentId === botId ? null : currentId,
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

    const createdAt = Date.now();
    const userMessage = {
      id: createdAt.toString(),
      from: "user",
      text,
      label: userLabel,
      timestamp: createdAt,
    };
    setMessages((prev) => [...prev, userMessage]);

    playUiSound("mood_selected");

    if (userId && !anonymousMode) {
      appendChatMessages(
        userId,
        [
          {
            ...userMessage,
          },
        ],
        sessionId,
      );
    }

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
      const baseDelay = 1500 + Math.random() * 1500;
      const delayMs = slowInteractionMode ? baseDelay + 2000 : baseDelay;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      setBotTyping(false);

      const fullText = reply.botMessage || "";
      const botCreatedAt = Date.now();
      const botId = `${botCreatedAt}-bot`;
      const baseMeta = {
        emotion: reply.emotion,
        stressLevel: reply.stressLevel,
        academicStressCategory: reply.academicStressCategory,
        riskLevel: reply.riskLevel,
        overallStatus: reply.overallStatus,
        techniques: reply.techniques,
      };

      // Add an empty bot message and progressively fill it character by character
      const uiBotMessage = {
        id: botId,
        from: "bot",
        text: "",
        label: "MindPlus Bot",
        meta: baseMeta,
        timestamp: botCreatedAt,
      };

      setMessages((prev) => [...prev, uiBotMessage]);

      if (userId && fullText && !anonymousMode) {
        const storedBotMessage = {
          ...uiBotMessage,
          text: fullText,
        };
        appendChatMessages(userId, [storedBotMessage], sessionId);
      }

      const typingSpeed = slowInteractionMode ? 28 : 18; // ms per character
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
                : m,
            ),
          );
        }, typingSpeed * index);
      });

      const totalTypingDuration = typingSpeed * chars.length;

      if (fullText) {
        setTimeout(() => {
          playUiSound("message_received");
        }, totalTypingDuration + 50);
      }

      // Auto voice playback for mood-based replies
      if (autoVoiceEnabled && fullText) {
        setTimeout(() => {
          setSpeakingMessageId(botId);
          playBotMessageVoice(fullText, {
            onFinish: () => {
              setSpeakingMessageId((currentId) =>
                currentId === botId ? null : currentId,
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

  const handleClearChatHistory = () => {
    if (!userId) {
      Alert.alert(
        "Not available",
        "You need to be logged in to clear stored chat history.",
      );
      return;
    }

    Alert.alert(
      "Clear chat history",
      "This will remove your saved chatbot conversation from this device. Your current screen will stay as is.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            try {
              await clearChatHistory(userId);
              Alert.alert("Done", "Chat history cleared on this device.");
            } catch (e) {
              console.log("Failed to clear chat history", e);
            }
          },
        },
      ],
    );
  };

  const handleDownloadData = async () => {
    if (!userId) {
      Alert.alert(
        "Not available",
        "You need to be logged in to download your data.",
      );
      return;
    }

    try {
      const convo = await loadChatConversation(userId);
      if (!convo || !convo.messages || convo.messages.length === 0) {
        Alert.alert("No data", "We couldn't find any saved chatbot data.");
        return;
      }

      const exportPayload = {
        source: "MindPlus chatbot",
        exportedAt: new Date().toISOString(),
        userId,
        sessionId: convo.sessionId,
        startedAt: convo.startedAt,
        messages: convo.messages,
      };

      await Share.share({
        title: "My MindPlus chatbot data",
        message: JSON.stringify(exportPayload, null, 2),
      });
    } catch (e) {
      console.log("Failed to export data", e);
      Alert.alert(
        "Error",
        "Something went wrong while preparing your data. Please try again.",
      );
    }
  };

  const handleDeleteAllData = () => {
    if (!userId) {
      Alert.alert(
        "Not available",
        "You need to be logged in to delete saved data.",
      );
      return;
    }

    Alert.alert(
      "Delete all chatbot data",
      "This will remove your saved chatbot history and local chatbot preferences from this device. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await clearChatHistory(userId);
              await AsyncStorage.removeItem(SETTINGS_KEY);

              setMessages([]);
              setSessionId(null);

              // Reset in-memory preferences to defaults
              setAutoVoiceEnabled(false);
              setShowStressCard(true);
              setChatTheme("calm");
              setCompactMessages(false);
              setShowTimestamps(false);
              setLargeText(false);
              setHideLabels(false);
              setAnonymousMode(false);
              setSimplifiedMode(false);
              setSlowInteractionMode(false);

              Alert.alert("Done", "All local chatbot data has been deleted.");
            } catch (e) {
              console.log("Failed to delete all chatbot data", e);
            }
          },
        },
      ],
    );
  };

  const handleResetPreferences = () => {
    Alert.alert(
      "Reset chatbot preferences",
      "This will restore chatbot appearance and behavior settings to their original defaults.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            try {
              const defaults = {
                autoVoiceEnabled: false,
                showStressCard: true,
                chatTheme: "calm",
                compactMessages: false,
                showTimestamps: false,
                largeText: false,
                hideLabels: false,
                anonymousMode: false,
                simplifiedMode: false,
                slowInteractionMode: false,
              };

              setAutoVoiceEnabled(defaults.autoVoiceEnabled);
              setShowStressCard(defaults.showStressCard);
              setChatTheme(defaults.chatTheme);
              setCompactMessages(defaults.compactMessages);
              setShowTimestamps(defaults.showTimestamps);
              setLargeText(defaults.largeText);
              setHideLabels(defaults.hideLabels);
              setAnonymousMode(defaults.anonymousMode);
              setSimplifiedMode(defaults.simplifiedMode);
              setSlowInteractionMode(defaults.slowInteractionMode);

              await AsyncStorage.removeItem(SETTINGS_KEY);
              await persistSettings(defaults);

              Alert.alert("Done", "Chatbot preferences were reset.");
            } catch (e) {
              console.log("Failed to reset preferences", e);
            }
          },
        },
      ],
    );
  };

  const startFreshConversation = async () => {
    try {
      setLoading(true);
      setMessages([]);
      setInitialPrompt(null);
      setMoodOptions([]);
      setShowMoodOptions(false);

      const start = await startChatSession();
      setSessionId(start.session_id);

      if (start.initial_message) {
        setInitialPrompt(start.initial_message);
        setMoodOptions(start.mood_options || []);
        setShowMoodOptions(false);

        const fullText = start.initial_message || "";
        const createdAt = Date.now();
        const botId = `${createdAt}-init`;

        const uiMessage = {
          id: botId,
          from: "bot",
          text: "",
          label: "MindPlus Bot",
          isMoodPrompt: true,
          timestamp: createdAt,
        };

        setMessages((prev) => [...prev, uiMessage]);

        if (userId && fullText && !anonymousMode) {
          const storedMessage = {
            ...uiMessage,
            text: fullText,
          };
          appendChatMessages(userId, [storedMessage], start.session_id);
        }

        const typingSpeed = slowInteractionMode ? 28 : 18; // ms per character
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
                  : m,
              ),
            );
          }, typingSpeed * index);
        });

        const totalDuration = typingSpeed * chars.length + 150;
        setTimeout(() => {
          setShowMoodOptions(true);
        }, totalDuration);
      }
    } catch (e) {
      console.log("Failed to start fresh conversation", e);
    } finally {
      setLoading(false);
    }
  };

  const handleStartFreshConversation = () => {
    Alert.alert(
      "Start fresh conversation",
      "This will clear the current chat on this screen and start a new session with the assistant.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Start",
          onPress: () => {
            startFreshConversation();
          },
        },
      ],
    );
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

  const themeContainerStyle =
    chatTheme === "dark"
      ? styles.containerDark
      : chatTheme === "forest"
        ? styles.containerForest
        : null;

  const handleOpenResources = (meta) => {
    const targetMeta = meta || lastStatusMeta;
    if (!targetMeta) return;
    setResourcesMeta(targetMeta);
    setShowResources(true);
  };

  return (
    <View style={[styles.container, themeContainerStyle]}>
      <SafeAreaView style={[styles.container, themeContainerStyle]}>
        <ChatHeader
          onBack={() => navigation.goBack()}
          onSettings={() => setShowSettingsPanel(true)}
          theme={chatTheme}
        />

        {dailyQuote && (
          <View style={styles.dailyQuoteCard}>
            <Text style={styles.dailyQuoteLabel}>Today’s reminder</Text>
            <Text style={styles.dailyQuoteText}>“{dailyQuote.text}”</Text>
            {dailyQuote.author ? (
              <Text style={styles.dailyQuoteAuthor}>— {dailyQuote.author}</Text>
            ) : null}
          </View>
        )}

        {showStressCard && (
          <ChatStatusCard
            statusTheme={statusTheme}
            overallLabel={overallLabel}
            stressPercent={stressPercent}
          />
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

        {/* Chatbot settings panel opened from header */}
        <Modal
          visible={showSettingsPanel}
          animationType="fade"
          transparent
          onRequestClose={() => setShowSettingsPanel(false)}
        >
          <View style={styles.commandsModalOverlay}>
            <View style={styles.settingsModalCard}>
              <Text style={styles.commandsModalTitle}>Chatbot settings</Text>
              <Text style={styles.commandsModalSubtitle}>
                Adjust how MindPlus Assistant behaves.
              </Text>

              <ScrollView
                style={styles.settingsScroll}
                contentContainerStyle={styles.settingsScrollContent}
                showsVerticalScrollIndicator
              >
                <TouchableOpacity
                  style={[
                    styles.commandsButton,
                    {
                      alignSelf: "flex-start",
                      marginBottom: 12,
                      marginLeft: 16,
                    },
                  ]}
                  onPress={() => {
                    setShowSettingsPanel(false);
                    setShowCommands(true);
                  }}
                >
                  <Text style={styles.commandsButtonText}>
                    View available commands
                  </Text>
                </TouchableOpacity>

                <View style={[styles.settingsSectionHeader, { marginTop: 4 }]}>
                  <Text style={styles.settingsSectionTitle}>Assistant</Text>
                </View>

                <View style={styles.autoVoiceRow}>
                  <Text style={styles.autoVoiceLabel}>Auto voice</Text>
                  <Switch
                    value={autoVoiceEnabled}
                    onValueChange={(value) => {
                      setAutoVoiceEnabled(value);
                      persistSettings({ autoVoiceEnabled: value });
                    }}
                    trackColor={SETTINGS_SWITCH_TRACK}
                    thumbColor={
                      autoVoiceEnabled
                        ? SETTINGS_SWITCH_THUMB_ON
                        : SETTINGS_SWITCH_THUMB_OFF
                    }
                    ios_backgroundColor={SETTINGS_SWITCH_TRACK.false}
                  />
                </View>

                <View style={styles.autoVoiceRow}>
                  <Text style={styles.autoVoiceLabel}>Sound feedback</Text>
                  <Switch
                    value={soundFeedbackEnabled}
                    onValueChange={(value) => {
                      setSoundFeedbackEnabled(value);
                      persistSettings({ soundFeedbackEnabled: value });
                    }}
                    trackColor={SETTINGS_SWITCH_TRACK}
                    thumbColor={
                      soundFeedbackEnabled
                        ? SETTINGS_SWITCH_THUMB_ON
                        : SETTINGS_SWITCH_THUMB_OFF
                    }
                    ios_backgroundColor={SETTINGS_SWITCH_TRACK.false}
                  />
                </View>

                <View style={[styles.settingsSectionHeader, { marginTop: 12 }]}>
                  <Text style={styles.settingsSectionTitle}>Insights</Text>
                </View>

                <View style={styles.autoVoiceRow}>
                  <Text style={styles.autoVoiceLabel}>
                    Show stress insight card
                  </Text>
                  <Switch
                    value={showStressCard}
                    onValueChange={(value) => {
                      setShowStressCard(value);
                      persistSettings({ showStressCard: value });
                    }}
                    trackColor={SETTINGS_SWITCH_TRACK}
                    thumbColor={
                      showStressCard
                        ? SETTINGS_SWITCH_THUMB_ON
                        : SETTINGS_SWITCH_THUMB_OFF
                    }
                    ios_backgroundColor={SETTINGS_SWITCH_TRACK.false}
                  />
                </View>

                <View style={[styles.settingsSectionHeader, { marginTop: 12 }]}>
                  <Text style={styles.settingsSectionTitle}>
                    Chat appearance
                  </Text>
                </View>

                <View style={styles.settingsThemeRow}>
                  {CHAT_THEMES.map((theme) => {
                    const isActive = chatTheme === theme.id;
                    return (
                      <TouchableOpacity
                        key={theme.id}
                        style={[
                          styles.settingsThemePill,
                          isActive && styles.settingsThemePillActive,
                        ]}
                        onPress={() => {
                          setChatTheme(theme.id);
                          persistSettings({ chatTheme: theme.id });
                        }}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.settingsThemePillLabel,
                            isActive && styles.settingsThemePillLabelActive,
                          ]}
                        >
                          {theme.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <View style={[styles.autoVoiceRow, { marginTop: 10 }]}>
                  <Text style={styles.autoVoiceLabel}>
                    Compact message layout
                  </Text>
                  <Switch
                    value={compactMessages}
                    onValueChange={(value) => {
                      setCompactMessages(value);
                      persistSettings({ compactMessages: value });
                    }}
                    trackColor={SETTINGS_SWITCH_TRACK}
                    thumbColor={
                      compactMessages
                        ? SETTINGS_SWITCH_THUMB_ON
                        : SETTINGS_SWITCH_THUMB_OFF
                    }
                    ios_backgroundColor={SETTINGS_SWITCH_TRACK.false}
                  />
                </View>

                <View style={[styles.settingsSectionHeader, { marginTop: 16 }]}>
                  <Text style={styles.settingsSectionTitle}>
                    Details & accessibility
                  </Text>
                </View>

                <View style={styles.autoVoiceRow}>
                  <Text style={styles.autoVoiceLabel}>Show message time</Text>
                  <Switch
                    value={showTimestamps}
                    onValueChange={(value) => {
                      setShowTimestamps(value);
                      persistSettings({ showTimestamps: value });
                    }}
                    trackColor={SETTINGS_SWITCH_TRACK}
                    thumbColor={
                      showTimestamps
                        ? SETTINGS_SWITCH_THUMB_ON
                        : SETTINGS_SWITCH_THUMB_OFF
                    }
                    ios_backgroundColor={SETTINGS_SWITCH_TRACK.false}
                  />
                </View>

                <View style={[styles.autoVoiceRow, { marginTop: 8 }]}>
                  <Text style={styles.autoVoiceLabel}>Larger chat text</Text>
                  <Switch
                    value={largeText}
                    onValueChange={(value) => {
                      setLargeText(value);
                      persistSettings({ largeText: value });
                    }}
                    trackColor={SETTINGS_SWITCH_TRACK}
                    thumbColor={
                      largeText
                        ? SETTINGS_SWITCH_THUMB_ON
                        : SETTINGS_SWITCH_THUMB_OFF
                    }
                    ios_backgroundColor={SETTINGS_SWITCH_TRACK.false}
                  />
                </View>

                <View style={[styles.autoVoiceRow, { marginTop: 8 }]}>
                  <Text style={styles.autoVoiceLabel}>Hide sender labels</Text>
                  <Switch
                    value={hideLabels}
                    onValueChange={(value) => {
                      setHideLabels(value);
                      persistSettings({ hideLabels: value });
                    }}
                    trackColor={SETTINGS_SWITCH_TRACK}
                    thumbColor={
                      hideLabels
                        ? SETTINGS_SWITCH_THUMB_ON
                        : SETTINGS_SWITCH_THUMB_OFF
                    }
                    ios_backgroundColor={SETTINGS_SWITCH_TRACK.false}
                  />
                </View>

                <View style={[styles.autoVoiceRow, { marginTop: 8 }]}>
                  <Text style={styles.autoVoiceLabel}>
                    Simplified instructions
                  </Text>
                  <Switch
                    value={simplifiedMode}
                    onValueChange={(value) => {
                      setSimplifiedMode(value);
                      persistSettings({ simplifiedMode: value });
                    }}
                    trackColor={SETTINGS_SWITCH_TRACK}
                    thumbColor={
                      simplifiedMode
                        ? SETTINGS_SWITCH_THUMB_ON
                        : SETTINGS_SWITCH_THUMB_OFF
                    }
                    ios_backgroundColor={SETTINGS_SWITCH_TRACK.false}
                  />
                </View>

                <View style={[styles.autoVoiceRow, { marginTop: 8 }]}>
                  <Text style={styles.autoVoiceLabel}>
                    Slow interaction mode
                  </Text>
                  <Switch
                    value={slowInteractionMode}
                    onValueChange={(value) => {
                      setSlowInteractionMode(value);
                      persistSettings({ slowInteractionMode: value });
                    }}
                    trackColor={SETTINGS_SWITCH_TRACK}
                    thumbColor={
                      slowInteractionMode
                        ? SETTINGS_SWITCH_THUMB_ON
                        : SETTINGS_SWITCH_THUMB_OFF
                    }
                    ios_backgroundColor={SETTINGS_SWITCH_TRACK.false}
                  />
                </View>

                <View style={[styles.settingsSectionHeader, { marginTop: 18 }]}>
                  <Text style={styles.settingsSectionTitle}>
                    Privacy & data
                  </Text>
                </View>

                <View style={styles.autoVoiceRow}>
                  <Text style={styles.autoVoiceLabel}>
                    Anonymous mode (don’t save chats)
                  </Text>
                  <Switch
                    value={anonymousMode}
                    onValueChange={(value) => {
                      setAnonymousMode(value);
                      persistSettings({ anonymousMode: value });
                    }}
                    trackColor={SETTINGS_SWITCH_TRACK}
                    thumbColor={
                      anonymousMode
                        ? SETTINGS_SWITCH_THUMB_ON
                        : SETTINGS_SWITCH_THUMB_OFF
                    }
                    ios_backgroundColor={SETTINGS_SWITCH_TRACK.false}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.settingsActionButton, { marginTop: 10 }]}
                  onPress={handleClearChatHistory}
                >
                  <Text style={styles.settingsActionButtonText}>
                    Clear chat history
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.settingsActionButton, { marginTop: 6 }]}
                  onPress={handleDownloadData}
                >
                  <Text style={styles.settingsActionButtonText}>
                    Download personal data
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.settingsDangerButton, { marginTop: 6 }]}
                  onPress={handleDeleteAllData}
                >
                  <Text style={styles.settingsDangerButtonText}>
                    Delete all data
                  </Text>
                </TouchableOpacity>

                <View style={[styles.settingsSectionHeader, { marginTop: 18 }]}>
                  <Text style={styles.settingsSectionTitle}>Session</Text>
                </View>

                <TouchableOpacity
                  style={[styles.settingsActionButton, { marginTop: 4 }]}
                  onPress={handleStartFreshConversation}
                >
                  <Text style={styles.settingsActionButtonText}>
                    Start fresh conversation
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.settingsActionButton, { marginTop: 6 }]}
                  onPress={handleResetPreferences}
                >
                  <Text style={styles.settingsActionButtonText}>
                    Reset preferences
                  </Text>
                </TouchableOpacity>
              </ScrollView>

              <TouchableOpacity
                style={styles.settingsCloseButton}
                onPress={() => setShowSettingsPanel(false)}
              >
                <Text style={styles.settingsCloseButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Modal
          visible={showResources}
          animationType="slide"
          transparent
          onRequestClose={() => setShowResources(false)}
        >
          <View style={styles.commandsModalOverlay}>
            <View style={styles.commandsModalCard}>
              <Text style={styles.commandsModalTitle}>Helpful resources</Text>
              <Text style={styles.commandsModalSubtitle}>
                Based on your recent stress level and emotions, here are some
                guides, videos, and quick tips you can view or save for later.
              </Text>

              <ScrollView style={styles.commandsList}>
                {(resourcesMeta || lastStatusMeta) && (
                  <HelpfulResourcesSection
                    emotion={(resourcesMeta || lastStatusMeta).emotion}
                    stressLevel={(resourcesMeta || lastStatusMeta).stressLevel}
                    overallStatus={
                      (resourcesMeta || lastStatusMeta).overallStatus
                    }
                  />
                )}
              </ScrollView>

              <TouchableOpacity
                style={styles.commandsCloseButton}
                onPress={() => setShowResources(false)}
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
                        criticalAlert?.condition || "critical",
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
          {simplifiedMode && (
            <View style={styles.instructionsCard}>
              <Text style={styles.instructionsTitle}>
                How to talk to MindPlus
              </Text>
              <Text style={styles.instructionsText}>
                Use short, simple sentences like "I feel stressed about exams"
                and I’ll respond with step-by-step support.
              </Text>
            </View>
          )}

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
              onPressHelpfulResources={handleOpenResources}
              compactMode={compactMessages}
              showTimestamps={showTimestamps}
              largeText={largeText}
              hideLabels={hideLabels}
            />
          </View>

          <PromptChips onSelectPrompt={setInput} />

          <TechniqueDetailCard
            technique={selectedTechnique}
            emergencyContact={emergencyContact}
            emergencyName={emergencyName}
            onClose={() => setSelectedTechnique(null)}
            onStart={
              selectedTechnique
                ? () =>
                    navigation.navigate("TechniquePracticeScreen", {
                      technique: selectedTechnique,
                    })
                : undefined
            }
          />

          <ChatInputBar
            input={input}
            onChangeInput={setInput}
            onTyping={undefined}
            onSend={handleSend}
            sending={sending}
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
