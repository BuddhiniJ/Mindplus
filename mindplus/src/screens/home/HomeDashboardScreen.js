import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Image, ActivityIndicator, ScrollView } from "react-native";
import { auth, db } from "../../firebase/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { avatars } from "../../utils/avatars";

export default function HomeDashboardScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [fingerprint, setFingerprint] = useState(null);

  useEffect(() => {
    loadDashboardData();
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

  const getClusterInfo = (label) => {
    const clusterMap = {
      stress_dominant: {
        emoji: "⏰",
        title: "Stress Dominant",
        description: "You respond strongly to time pressures",
        color: "#F59E0B"
      },
      anxiety_reactive: {
        emoji: "👥",
        title: "Anxiety Reactive",
        description: "You're sensitive to social interactions",
        color: "#8B5CF6"
      },
      depression_prone: {
        emoji: "🎯",
        title: "Depression Prone",
        description: "You set high standards for yourself",
        color: "#3B82F6"
      },
      balanced_low_stress: {
        emoji: "🎯",
        title: "Balanced Low Stress",
        description: "You set high standards for yourself",
        color: "#3B82F6"
      },
      processing: {
        emoji: "🔄",
        title: "Processing",
        description: "Your profile is being analyzed",
        color: "#6B7280"
      }
    };

    return clusterMap[label] || {
      emoji: "📊",
      title: label || "Unknown",
      description: "Your unique stress profile",
      color: "#6B7280"
    };
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
  const clusterInfo = fingerprint ? getClusterInfo(fingerprint.label) : null;

  return (
    <View style={styles.container}>
      {/* Header Background */}
      <View style={styles.headerBackground} />

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              <Image
                source={avatars[avatarKey]}
                style={styles.avatar}
              />
              <View style={styles.avatarBadge}>
                <Text style={styles.avatarBadgeText}>✓</Text>
              </View>
            </View>
            <View style={styles.greetingContainer}>
              <Text style={styles.greeting}>Hi, {nickname}! 👋</Text>
              <Text style={styles.subGreeting}>Welcome back to your dashboard</Text>
            </View>
          </View>
        </View>

        {/* Stress Profile Card */}
        <View style={styles.mainCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Your Stress Profile</Text>
            {fingerprint && (
              <View style={styles.confidenceBadge}>
                <Text style={styles.confidenceText}>
                  {(fingerprint.confidence * 100).toFixed(0)}% Match
                </Text>
              </View>
            )}
          </View>

          {fingerprint && clusterInfo ? (
            <View style={styles.profileContent}>
              {/* Cluster Info */}
              <View style={[styles.clusterCard, { borderLeftColor: clusterInfo.color }]}>
                <Text style={styles.clusterEmoji}>{clusterInfo.emoji}</Text>
                <View style={styles.clusterTextContainer}>
                  <Text style={styles.clusterTitle}>{clusterInfo.title}</Text>
                  <Text style={styles.clusterDescription}>{clusterInfo.description}</Text>
                </View>
              </View>

              {/* Last Updated */}
              <View style={styles.updateInfo}>
                <Text style={styles.updateIcon}>🕐</Text>
                <Text style={styles.updateText}>
                  Last Updated {new Date(fingerprint.createdAt).toLocaleDateString()}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataIcon}>📊</Text>
              <Text style={styles.noDataTitle}>No Stress Profile Yet</Text>
              <Text style={styles.noDataText}>
                Complete the DASS-21 assessment to generate your personalized stress profile.
              </Text>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate("HeatmapScreen")}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIconContainer, { backgroundColor: "#EEF2FF" }]}>
              <Text style={styles.actionIcon}>🗺️</Text>
            </View>
            <View style={styles.actionTextContainer}>
              <Text style={styles.actionTitle}>View Heatmap</Text>
              <Text style={styles.actionDescription}>Explore your stress patterns</Text>
            </View>
            <Text style={styles.actionArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate("UserProfileScreen")}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIconContainer, { backgroundColor: "#D1FAE5" }]}>
              <Text style={styles.actionIcon}>👤</Text>
            </View>
            <View style={styles.actionTextContainer}>
              <Text style={styles.actionTitle}>View Profile</Text>
              <Text style={styles.actionDescription}>Manage your account settings</Text>
            </View>
            <Text style={styles.actionArrow}>→</Text>
          </TouchableOpacity>

        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
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
    height: 200,
    backgroundColor: "#EEF2FF",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  header: {
    marginBottom: 24,
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
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  subGreeting: {
    fontSize: 14,
    color: "#6B7280",
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
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  actionIcon: {
    fontSize: 24,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  actionDescription: {
    fontSize: 13,
    color: "#6B7280",
  },
  actionArrow: {
    fontSize: 20,
    color: "#9CA3AF",
    fontWeight: "600",
  },
  bottomSpacer: {
    height: 40,
  },
};