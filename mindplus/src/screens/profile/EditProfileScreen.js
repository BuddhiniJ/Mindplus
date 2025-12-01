import { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView, Modal, ActivityIndicator } from "react-native";
import { auth, db } from "../../firebase/firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { avatars } from "../../utils/avatars";

// Custom Alert Component
const CustomAlert = ({ visible, title, message, type = "info", onClose, onConfirm }) => {
  const getIconColor = () => {
    switch (type) {
      case "success": return "#10B981";
      case "error": return "#EF4444";
      case "warning": return "#F59E0B";
      default: return "#3B82F6";
    }
  };

  const getIcon = () => {
    switch (type) {
      case "success": return "✓";
      case "error": return "✕";
      case "warning": return "!";
      default: return "i";
    }
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={alertStyles.overlay}>
        <View style={alertStyles.container}>
          <View style={[alertStyles.iconContainer, { backgroundColor: getIconColor() + "20" }]}>
            <Text style={[alertStyles.icon, { color: getIconColor() }]}>
              {getIcon()}
            </Text>
          </View>

          <Text style={alertStyles.title}>{title}</Text>
          <Text style={alertStyles.message}>{message}</Text>

          <View style={alertStyles.buttonContainer}>
            {onConfirm ? (
              <>
                <TouchableOpacity
                  style={[alertStyles.button, alertStyles.confirmButton, { backgroundColor: getIconColor() }]}
                  onPress={onConfirm}
                  activeOpacity={0.8}
                >
                  <Text style={alertStyles.confirmButtonText}>Continue</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={[alertStyles.button, alertStyles.singleButton, { backgroundColor: getIconColor() }]}
                onPress={onClose}
                activeOpacity={0.8}
              >
                <Text style={alertStyles.confirmButtonText}>OK</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default function EditProfileScreen({ navigation }) {
  const [nickname, setNickname] = useState("");
  const [avatar, setAvatar] = useState("avatar1");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Alert state
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: "",
    message: "",
    type: "info",
    onConfirm: null,
  });

  const showAlert = (title, message, type = "info", onConfirm = null) => {
    setAlertConfig({
      visible: true,
      title,
      message,
      type,
      onConfirm,
    });
  };

  const hideAlert = () => {
    setAlertConfig({ ...alertConfig, visible: false });
  };

  useEffect(() => {
    loadExistingProfile();
  }, []);

  const loadExistingProfile = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const ref = doc(db, "users", user.uid, "profile", "basic");
      const snap = await getDoc(ref);

      if (snap.exists()) {
        const data = snap.data();
        setNickname(data.nickname || "");
        setAvatar(data.avatar || "avatar1");
      }
      setLoading(false);
    } catch (error) {
      console.error("Load profile error:", error);
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    if (!nickname.trim()) {
      showAlert("Nickname Required", "Please enter a nickname before saving.", "warning");
      return;
    }

    if (nickname.length < 2) {
      showAlert("Nickname Too Short", "Nickname must be at least 2 characters long.", "warning");
      return;
    }

    setSaving(true);
    try {
      const user = auth.currentUser;

      await setDoc(doc(db, "users", user.uid, "profile", "basic"), {
        nickname,
        avatar,
        updatedAt: new Date().toISOString(),
      });

      showAlert(
        "Success",
        "Your profile has been updated successfully!",
        "success",
        () => {
          hideAlert();
          navigation.replace("UserProfileScreen");
        }
      );
    } catch (error) {
      showAlert("Error", "Failed to update profile. Please try again.", "error");
      console.error("Save profile error:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Preview Card */}
        <View style={styles.previewCard}>
          <Text style={styles.previewLabel}>Preview</Text>
          <View style={styles.previewContent}>
            <View style={styles.previewAvatarContainer}>
              <Image
                source={avatars[avatar]}
                style={styles.previewAvatar}
              />
            </View>
            <View style={styles.previewInfo}>
              <Text style={styles.previewNickname}>
                {nickname || "Your Nickname"}
              </Text>
              <Text style={styles.previewSubtext}>This is how you'll appear</Text>
            </View>
          </View>
        </View>

        {/* Nickname Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nickname</Text>
          <View style={styles.inputContainer}>
            <TextInput
              value={nickname}
              onChangeText={setNickname}
              placeholder="Enter a nickname"
              placeholderTextColor="#9CA3AF"
              style={styles.input}
              maxLength={20}
            />
            <Text style={styles.characterCount}>{nickname.length}/20</Text>
          </View>
          <Text style={styles.hint}>Choose a friendly name others will see</Text>
        </View>

        {/* Avatar Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choose Your Avatar</Text>
          <Text style={styles.sectionSubtitle}>Select an avatar that represents you</Text>
          
          <View style={styles.avatarGrid}>
            {Object.keys(avatars).map((key) => (
              <TouchableOpacity
                key={key}
                onPress={() => setAvatar(key)}
                style={[
                  styles.avatarOption,
                  avatar === key && styles.avatarOptionSelected
                ]}
                activeOpacity={0.7}
              >
                <Image
                  source={avatars[key]}
                  style={styles.avatarImage}
                />
                {avatar === key && (
                  <View style={styles.selectedBadge}>
                    <Text style={styles.selectedBadgeText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={saveProfile}
          disabled={saving}
          activeOpacity={0.8}
        >
          <Text style={styles.saveButtonText}>
            {saving ? "Saving..." : "Save Changes"}
          </Text>
          {!saving && <Text style={styles.saveButtonIcon}>✓</Text>}
        </TouchableOpacity>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Custom Alert */}
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={hideAlert}
        onConfirm={alertConfig.onConfirm}
      />
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    width: 60,
  },
  backButtonText: {
    fontSize: 16,
    color: "#3B82F6",
    fontWeight: "600",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  previewCard: {
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
  previewLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 16,
  },
  previewContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  previewAvatarContainer: {
    marginRight: 16,
  },
  previewAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: "#3B82F6",
  },
  previewInfo: {
    flex: 1,
  },
  previewNickname: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  previewSubtext: {
    fontSize: 14,
    color: "#6B7280",
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 16,
  },
  inputContainer: {
    position: "relative",
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#111827",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  characterCount: {
    position: "absolute",
    right: 16,
    top: 16,
    fontSize: 12,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  hint: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 8,
  },
  avatarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  avatarOption: {
    position: "relative",
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    padding: 8,
    backgroundColor: "#FFFFFF",
  },
  avatarOptionSelected: {
    borderColor: "#3B82F6",
    backgroundColor: "#EEF2FF",
  },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  selectedBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#3B82F6",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  selectedBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#10B981",
    padding: 18,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "600",
    marginRight: 8,
  },
  saveButtonIcon: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "600",
  },
  bottomSpacer: {
    height: 40,
  },
};

const alertStyles = {
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 340,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  icon: {
    fontSize: 32,
    fontWeight: "bold",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 8,
    textAlign: "center",
  },
  message: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: "row",
    width: "100%",
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  singleButton: {
    width: "100%",
  },
  confirmButton: {
    backgroundColor: "#3B82F6",
  },
  confirmButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  cancelButton: {
    backgroundColor: "#F3F4F6",
  },
  cancelButtonText: {
    color: "#374151",
    fontSize: 15,
    fontWeight: "600",
  },
};