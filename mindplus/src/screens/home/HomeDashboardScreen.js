import { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { auth, db } from "../../firebase/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { avatars } from "../../utils/avatars";
import { LinearGradient } from "expo-linear-gradient";

export default function HomeDashboardScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [fingerprint, setFingerprint] = useState(null);

  useEffect(() => {
    loadDashboardData();
    // updateUserFingerprint(user.uid);
  }, []);

  const loadDashboardData = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      // Load profile
      const profileRef = doc(db, "users", user.uid, "profile", "basic");
      const profileSnap = await getDoc(profileRef);
      if (profileSnap.exists()) setProfile(profileSnap.data());

      // Load fingerprint
      const fpRef = doc(db, "users", user.uid, "fingerprint", "current");
      const fpSnap = await getDoc(fpRef);
      if (fpSnap.exists()) setFingerprint(fpSnap.data());

      setLoading(false);
    } catch (err) {
      console.log("Dashboard load error:", err);
      setLoading(false);
    }
  };

  const handleViewTodayEmotion = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const todayKey = new Date().toISOString().slice(0, 10);
      const checkInRef = doc(db, "users", user.uid, "dailyCheckIns", todayKey);
      const checkInSnap = await getDoc(checkInRef);

      if (checkInSnap.exists() && checkInSnap.data().answers) {
        navigation.navigate("OverallEmotionScreen", {
          answers: checkInSnap.data().answers,
        });
      } else {
        alert(
          "No check-in data found for today. Please complete the daily check-in first."
        );
      }
    } catch (error) {
      console.error("Error fetching check-in data:", error);
      alert("Unable to load emotion data. Please try again.");
    }
  };

  const handleCopingStrategy = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const todayKey = new Date().toISOString().slice(0, 10);
      const checkInRef = doc(db, "users", user.uid, "dailyCheckIns", todayKey);
      const checkInSnap = await getDoc(checkInRef);

      if (checkInSnap.exists() && checkInSnap.data().answers) {
        const answers = checkInSnap.data().answers;

        const emotionScores = {};
        let totalConfidence = 0;

        answers.forEach((answer) => {
          const emotion = answer.emotion?.toLowerCase() || "unknown";
          const confidence = answer.confidence || 0;

          if (!emotionScores[emotion]) {
            emotionScores[emotion] = { count: 0, totalConfidence: 0 };
          }
          emotionScores[emotion].count += 1;
          emotionScores[emotion].totalConfidence += confidence;
          totalConfidence += confidence;
        });

        let dominantEmotion = "unknown";
        let maxCount = 0;

        Object.entries(emotionScores).forEach(([emotion, scores]) => {
          if (scores.count > maxCount) {
            maxCount = scores.count;
            dominantEmotion = emotion;
          }
        });

        const overallConfidence =
          totalConfidence > 0 ? totalConfidence / answers.length : 0;

        navigation.navigate("CopingStrategyScreen", {
          emotion: dominantEmotion,
          confidence: overallConfidence,
        });
      } else {
        alert(
          "No check-in data found for today. Please complete the daily check-in first."
        );
      }
    } catch (error) {
      console.error("Error fetching coping strategy:", error);
      alert("Unable to load coping strategy. Please try again.");
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading Dashboard...</Text>
        </View>
      </View>
    );
  }

  const nickname = profile?.nickname || "User";
  const avatarKey = profile?.avatar || "avatar1";
  const quickActions = [
    {
      key: "emotion",
      title: "Today's Emotion",
      subtitle: "See your emotional snapshot",
      icon: "💭",
      color: "#FCE7F3",
      onPress: handleViewTodayEmotion,
    },
    {
      key: "coping",
      title: "Coping Plan",
      subtitle: "Get your personalized support",
      icon: "💡",
      color: "#DDD6FE",
      onPress: handleCopingStrategy,
    },
    {
      key: "story",
      title: "Tell Your Story",
      subtitle: "Let your voice carry the weight",
      icon: "🎙️",
      color: "#DBF4D6",
      onPress: () => navigation.navigate("VoiceRecorderScreen"),
    },
    {
      key: "heatmap",
      title: "Calendar Heatmap",
      subtitle: "See how your stress shifts",
      icon: "📅",
      color: "#EEF2FF",
      onPress: () => navigation.navigate("HeatmapScreen"),
    },
    {
      key: "chatbot",
      title: "Chatbot",
      subtitle: "Talk with your AI companion",
      icon: "💬",
      color: "#FEF3C7",
      onPress: () => navigation.navigate("ChatbotScreen"),
    },
    {
      key: "soundscape",
      title: "Soundscape",
      subtitle: "Step into calming sound layers",
      icon: "🎧",
      color: "#E0F2FE",
      onPress: () => navigation.navigate("SoundscapeScreen"),
    },
  ];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#E9EAEB", "#D4E4F7", "#FFFFFF", "#E1F5FE"]}
        style={styles.gradientBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.backgroundOrbOne} />
          <View style={styles.backgroundOrbTwo} />

          <View style={styles.header}>
            <View style={styles.titleWrap}>
              <Text style={styles.headerPill}>MindPlus Home</Text>
            </View>
            <View style={styles.profileSection}>
              <View style={styles.avatarContainer}>
                <TouchableOpacity
                  onPress={() => navigation.navigate("UserProfileScreen")}
                  activeOpacity={0.8}
                >
                  <Image source={avatars[avatarKey]} style={styles.avatar} />
                  <View style={styles.avatarBadge}>
                    <Text style={styles.avatarBadgeText}>✓</Text>
                  </View>
                </TouchableOpacity>
              </View>
              <View style={styles.greetingContainer}>
                <Text style={styles.greeting}>Hi, {nickname}</Text>
                <Text style={styles.subGreeting}>
                  You are safe here. Pick what feels right now.
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.actionsSection}>
            <Text style={styles.sectionTitle}>Choose Your Calm Path</Text>
            <Text style={styles.sectionSubtitle}>
              One tap begins a small reset. Pick what feels right in this
              moment.
            </Text>

            <View style={styles.actionsGrid}>
              {quickActions.map((action) => (
                <TouchableOpacity
                  key={action.key}
                  style={styles.actionCard}
                  onPress={action.onPress}
                  activeOpacity={0.86}
                >
                  <View
                    style={[
                      styles.actionIconContainer,
                      { backgroundColor: action.color },
                    ]}
                  >
                    <Text style={styles.actionIcon}>{action.icon}</Text>
                  </View>

                  <Text style={styles.actionTitle}>{action.title}</Text>
                  <Text style={styles.actionDescription}>
                    {action.subtitle}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = {
  gradientBackground: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContent: {
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6B7280",
    fontWeight: "500",
  },
  headerBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1000,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  backgroundOrbOne: {
    position: "absolute",
    top: 15,
    right: 5,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  backgroundOrbTwo: {
    position: "absolute",
    top: 110,
    left: -26,
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(180, 215, 255, 0.28)",
  },
  header: {
    marginBottom: 18,
  },
  titleWrap: {
    marginBottom: 14,
  },
  headerPill: {
    alignSelf: "flex-start",
    fontSize: 12,
    color: "#33587A",
    fontWeight: "700",
    letterSpacing: 1.1,
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    position: "relative",
    marginRight: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  avatarBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#10B981",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "bold",
  },
  greetingContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 29,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  subGreeting: {
    fontSize: 15,
    color: "#46566A",
    lineHeight: 22,
  },
  calmCard: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.75)",
    shadowColor: "#5C86B0",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 3,
  },
  calmLabel: {
    fontSize: 11,
    letterSpacing: 1.1,
    color: "#5D7490",
    fontWeight: "800",
    marginBottom: 4,
  },
  calmTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#102940",
    marginBottom: 8,
  },
  calmSubtitle: {
    fontSize: 14,
    color: "#4C6073",
    lineHeight: 20,
    marginBottom: 14,
  },
  calmActionsRow: {
    flexDirection: "row",
    gap: 10,
  },
  calmPrimaryButton: {
    flex: 1,
    backgroundColor: "#2A5F8D",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
  },
  calmPrimaryText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  calmSecondaryButton: {
    flex: 1,
    backgroundColor: "#E5F2FF",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#CFE3F9",
  },
  calmSecondaryText: {
    color: "#2A5F8D",
    fontSize: 13,
    fontWeight: "700",
  },
  mainCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  confidenceBadge: {
    backgroundColor: "#EEF2FF",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#3B82F6",
  },
  profileContent: {
    gap: 16,
  },
  clusterCard: {
    flexDirection: "row",
    backgroundColor: "#F9FAFB",
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    alignItems: "center",
  },
  clusterEmoji: {
    fontSize: 40,
    marginRight: 16,
  },
  clusterTextContainer: {
    flex: 1,
  },
  clusterTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  clusterDescription: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },
  statsGrid: {
    flexDirection: "row",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 16,
  },
  statLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
    fontWeight: "500",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  updateInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  updateIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  updateText: {
    fontSize: 13,
    color: "#6B7280",
  },
  noDataContainer: {
    alignItems: "center",
    paddingVertical: 24,
  },
  noDataIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  noDataTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  noDataText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
  },
  actionsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: "#55687C",
    marginBottom: 14,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
  },
  actionCard: {
    width: "48.2%",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5EEF7",
    minHeight: 168,
    shadowColor: "#4F6B89",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  actionIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  actionIcon: {
    fontSize: 25,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 6,
    lineHeight: 20,
  },
  actionDescription: {
    fontSize: 12,
    color: "#6A7888",
    lineHeight: 18,
    marginBottom: 14,
  },
  actionFooterPill: {
    alignSelf: "flex-start",
    backgroundColor: "#EEF7FF",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  actionFooterText: {
    color: "#2D5D88",
    fontSize: 11,
    fontWeight: "600",
  },
  bottomSpacer: {
    height: 22,
  },
};
