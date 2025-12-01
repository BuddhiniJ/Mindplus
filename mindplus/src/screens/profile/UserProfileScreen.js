import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, Image, ScrollView } from "react-native";
import { auth, db } from "../../firebase/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { avatars } from "../../utils/avatars";

export default function ProfileScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [fingerprint, setFingerprint] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      // Load profile
      const profileRef = doc(db, "users", user.uid, "profile", "basic");
      const profileSnap = await getDoc(profileRef);

      if (profileSnap.exists()) {
        setProfile(profileSnap.data());
      }

      // Load fingerprint
      const fpRef = doc(db, "users", user.uid, "fingerprint", "current");
      const fpSnap = await getDoc(fpRef);

      if (fpSnap.exists()) {
        setFingerprint(fpSnap.data());
      }

      setLoading(false);
    } catch (error) {
      console.error("Profile load error:", error);
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigation.replace("Login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const getClusterInfo = (label) => {
    const clusterMap = {
      anxiety_reactive: {
        emoji: "⏰",
        title: "Anxiety Reactive",
        color: "#F59E0B"
      },
      stress_dominant: {
        emoji: "👥",
        title: "Stress Dominant",
        color: "#8B5CF6"
      },
      depression_prone: {
        emoji: "🎯",
        title: "Depression Prone",
        color: "#3B82F6"
      },
      balanced_low_stress: {
        emoji: "🎯",
        title: "Balanced Low Stress",
        color: "#3B82F6"
      },
      processing: {
        emoji: "🔄",
        title: "Processing",
        color: "#6B7280"
      }
    };

    return clusterMap[label] || {
      emoji: "📊",
      title: label || "Unknown",
      color: "#6B7280"
    };
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading Profile...</Text>
      </View>
    );
  }

  const user = auth.currentUser;
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
        {/* Profile Header Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
              <Image
                source={avatars[profile?.avatar || "avatar1"]}
                style={styles.avatar}
              />
              <View style={styles.avatarBadge}>
                <Text style={styles.avatarBadgeText}>✓</Text>
              </View>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.nickname}>{profile?.nickname || "User"}</Text>
              <Text style={styles.email}>{user?.email ?? "N/A"}</Text>
            </View>
          </View>
        </View>

        {/* Stress Fingerprint Card */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Stress Fingerprint</Text>

          {fingerprint && clusterInfo ? (
            <>
              <View style={[styles.clusterBanner, { backgroundColor: clusterInfo.color + "20" }]}>
                <Text style={styles.clusterEmoji}>{clusterInfo.emoji}</Text>
                <View style={styles.clusterTextContainer}>
                  <Text style={styles.clusterTitle}>{clusterInfo.title}</Text>
                  <Text style={styles.clusterSubtitle}>Your stress pattern type</Text>
                </View>
              </View>

              <View style={styles.fingerprintDetails}>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Confidence Score</Text>
                  <View style={styles.confidenceContainer}>
                    <Text style={styles.detailValue}>
                      {(fingerprint.confidence * 100).toFixed(1)}%
                    </Text>
                    <View style={styles.confidenceBar}>
                      <View 
                        style={[
                          styles.confidenceBarFill,
                          { 
                            width: `${fingerprint.confidence * 100}%`,
                            backgroundColor: clusterInfo.color 
                          }
                        ]} 
                      />
                    </View>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Last Updated</Text>
                  <Text style={styles.detailValue}>
                    {new Date(fingerprint.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            </>
          ) : (
            <View style={styles.noFingerprintContainer}>
              <Text style={styles.noFingerprintIcon}>📊</Text>
              <Text style={styles.noFingerprintTitle}>No Fingerprint Available</Text>
              <Text style={styles.noFingerprintText}>
                Complete the DASS-21 assessment to generate your stress fingerprint.
              </Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryButton]}
            onPress={() => navigation.navigate("EditProfileScreen")}
            activeOpacity={0.8}
          >
            <View style={styles.buttonContent}>
              <Text style={styles.buttonIcon}>✏️</Text>
              <Text style={styles.buttonText}>Edit Profile</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={() => navigation.navigate("Dass21Screen1")}
            activeOpacity={0.8}
          >
            <View style={styles.buttonContent}>
              <Text style={styles.buttonIcon}>📝</Text>
              <Text style={styles.buttonText}>Retake Assessment</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.dangerButton]}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <View style={styles.buttonContent}>
              <Text style={styles.buttonIcon}>🚪</Text>
              <Text style={[styles.buttonText, styles.dangerButtonText]}>Logout</Text>
            </View>
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
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
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
    height: 180,
    backgroundColor: "#EEF2FF",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  profileCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    position: "relative",
    marginRight: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: "#3B82F6",
  },
  avatarBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#10B981",
    borderWidth: 3,
    borderColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  profileInfo: {
    flex: 1,
  },
  nickname: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: "#6B7280",
  },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  infoIcon: {
    fontSize: 20,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 4,
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 16,
    color: "#111827",
    fontWeight: "600",
  },
  smallAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#E5E7EB",
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 8,
  },
  clusterBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
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
    marginBottom: 2,
  },
  clusterSubtitle: {
    fontSize: 13,
    color: "#6B7280",
  },
  fingerprintDetails: {
    gap: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 15,
    color: "#111827",
    fontWeight: "600",
  },
  confidenceContainer: {
    alignItems: "flex-end",
    flex: 1,
    marginLeft: 16,
  },
  confidenceBar: {
    width: "100%",
    height: 6,
    backgroundColor: "#E5E7EB",
    borderRadius: 3,
    marginTop: 6,
    overflow: "hidden",
  },
  confidenceBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  noFingerprintContainer: {
    alignItems: "center",
    paddingVertical: 32,
  },
  noFingerprintIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  noFingerprintTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  noFingerprintText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
  },
  actionsSection: {
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  primaryButton: {
    backgroundColor: "#6366F1",
  },
  secondaryButton: {
    backgroundColor: "#3B82F6",
  },
  dangerButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#EF4444",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  dangerButtonText: {
    color: "#EF4444",
  },
  bottomSpacer: {
    height: 40,
  },
};