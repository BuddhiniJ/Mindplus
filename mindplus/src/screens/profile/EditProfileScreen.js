import { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView, Modal, ActivityIndicator, StyleSheet } from "react-native";
import { auth, db } from "../../firebase/firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { avatars } from "../../utils/avatars";
import { Ionicons } from '@expo/vector-icons'; // Assuming Expo environment

// Custom Alert Component (Retained as requested)
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
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={alertStyles.overlay}>
        <View style={alertStyles.container}>
          <View style={[alertStyles.iconContainer, { backgroundColor: getIconColor() + "20" }]}>
            <Text style={[alertStyles.icon, { color: getIconColor() }]}>{getIcon()}</Text>
          </View>
          <Text style={alertStyles.title}>{title}</Text>
          <Text style={alertStyles.message}>{message}</Text>
          <View style={alertStyles.buttonContainer}>
            {onConfirm ? (
              <TouchableOpacity
                style={[alertStyles.button, alertStyles.confirmButton, { backgroundColor: getIconColor() }]}
                onPress={onConfirm}
              >
                <Text style={alertStyles.confirmButtonText}>Continue</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[alertStyles.button, alertStyles.singleButton, { backgroundColor: getIconColor() }]}
                onPress={onClose}
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
  const [fullName, setFullName] = useState("");
  const [avatar, setAvatar] = useState("avatar1");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [emergencyRelation, setEmergencyRelation] = useState("");

  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: "",
    message: "",
    type: "info",
    onConfirm: null,
  });

  const showAlert = (title, message, type = "info", onConfirm = null) => {
    setAlertConfig({ visible: true, title, message, type, onConfirm });
  };

  const hideAlert = () => setAlertConfig({ ...alertConfig, visible: false });

  useEffect(() => { loadExistingProfile(); }, []);

  const loadExistingProfile = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      const ref = doc(db, "users", user.uid, "profile", "basic");
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        setNickname(data.nickname || "");
        setFullName(data.fullName || "");
        setAvatar(data.avatar || "avatar1");
        setEmergencyName(data.emergencyName || "");
        setEmergencyContact(data.emergencyContact || "");
        setEmergencyRelation(data.emergencyRelation || "");
      }
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    if (!nickname.trim()) { showAlert("Nickname Required", "Please enter a nickname.", "warning"); return; }
    if (!emergencyName.trim()) { showAlert("Required", "Emergency Name is required.", "warning"); return; }
    if (!/^\d{10}$/.test(emergencyContact)) { showAlert("Error", "Contact must be 10 digits.", "error"); return; }

    setSaving(true);
    try {
      const user = auth.currentUser;
      await setDoc(doc(db, "users", user.uid, "profile", "basic"), {
        nickname, fullName, avatar, emergencyName, emergencyContact, emergencyRelation,
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      showAlert("Success", "Profile updated!", "success", () => {
        hideAlert();
        navigation.navigate("UserProfileScreen")
      });
    } catch (error) {
      showAlert("Error", "Update failed.", "error");
    } finally { setSaving(false); }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5FA1D5" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButtonBox} onPress={() => navigation.navigate("UserProfileScreen")}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Preview Card */}
        <View style={styles.previewCard}>
          <Text style={styles.sectionLabel}>PREVIEW</Text>
          <View style={styles.previewContent}>
            <View style={styles.previewAvatarContainer}>
              <Image source={avatars[avatar]} style={styles.previewAvatar} />
            </View>
            <View style={styles.previewInfo}>
              <Text style={styles.previewNickname}>{nickname || "John D"}</Text>
              <Text style={styles.previewEmail}>{auth.currentUser?.email}</Text>
            </View>
          </View>
        </View>

        {/* Personal Details Section */}
        <View style={styles.sectionOutline}>
          <Text style={styles.floatingLabel}>Personal Details</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.fieldLabel}>Name</Text>
            <TextInput value={fullName} onChangeText={setFullName} style={styles.input} />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.fieldLabel}>Nickname</Text>
            <TextInput value={nickname} onChangeText={setNickname} style={styles.input} maxLength={20} />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.fieldLabel}>Email</Text>
            <TextInput value={auth.currentUser?.email} editable={false} style={[styles.input, styles.disabledInput]} />
          </View>
        </View>

        {/* Emergency Contact Section */}
        <View style={styles.sectionOutline}>
          <Text style={styles.floatingLabel}>Emergency Contact</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.fieldLabel}>Name</Text>
            <TextInput value={emergencyName} onChangeText={setEmergencyName} style={styles.input} />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.fieldLabel}>Contact No</Text>
            <TextInput value={emergencyContact} onChangeText={setEmergencyContact} keyboardType="numeric" maxLength={10} style={styles.input} />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.fieldLabel}>Relationship</Text>
            <TextInput value={emergencyRelation} onChangeText={setEmergencyRelation} style={styles.input} />
          </View>
        </View>

        {/* Avatar Selection */}
        <View style={styles.sectionOutline}>
          <Text style={styles.floatingLabel}>Avatar</Text>
          <View style={styles.avatarGrid}>
            {Object.keys(avatars).map((key) => (
              <TouchableOpacity key={key} onPress={() => setAvatar(key)} style={[styles.avatarOption, avatar === key && styles.avatarSelected]}>
                <Image source={avatars[key]} style={styles.avatarGridImage} />
                {avatar === key && <View style={styles.checkCircle}><Ionicons name="checkmark" size={12} color="white" /></View>}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity style={[styles.saveButton, saving && { opacity: 0.7 }]} onPress={saveProfile} disabled={saving}>
          <Text style={styles.saveButtonText}>{saving ? "Saving..." : "Save"}</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      <CustomAlert visible={alertConfig.visible} title={alertConfig.title} message={alertConfig.message} type={alertConfig.type} onClose={hideAlert} onConfirm={alertConfig.onConfirm} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20 },
  backButtonBox: { width: 40, height: 40, borderRadius: 8, backgroundColor: "#5FA1D5", justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#333" },
  scrollContent: { padding: 20 },
  previewCard: { borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 15, padding: 15, marginBottom: 30 },
  sectionLabel: { fontSize: 10, color: "#9CA3AF", marginBottom: 10, fontWeight: "700" },
  previewContent: { flexDirection: "row", alignItems: "center" },
  previewAvatarContainer: { width: 70, height: 70, borderRadius: 35, borderWidth: 2, borderColor: "#5FA1D5", justifyContent: "center", alignItems: "center", overflow: "hidden" },
  previewAvatar: { width: 55, height: 55 },
  previewInfo: { marginLeft: 15 },
  previewNickname: { fontSize: 18, fontWeight: "bold", color: "#333" },
  previewEmail: { fontSize: 12, color: "#777" },
  sectionOutline: { borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 15, padding: 15, marginBottom: 30, paddingTop: 20 },
  floatingLabel: { position: "absolute", top: -10, left: 15, backgroundColor: "white", paddingHorizontal: 5, fontSize: 12, color: "#9CA3AF" },
  inputGroup: { marginBottom: 15 },
  fieldLabel: { fontSize: 11, color: "#9CA3AF", marginBottom: 4 },
  input: { borderBottomWidth: 1, borderBottomColor: "#F3F4F6", fontSize: 14, color: "#333", paddingVertical: 4 },
  disabledInput: { backgroundColor: "#F3F4F6", borderRadius: 5, paddingHorizontal: 5, color: "#9CA3AF" },
  avatarGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  avatarOption: { width: "22%", aspectRatio: 1, borderRadius: 50, marginBottom: 10, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#E5E7EB" },
  avatarSelected: { borderColor: "#5FA1D5", backgroundColor: "#F0F9FF" },
  avatarGridImage: { width: "80%", height: "80%", borderRadius: 50 },
  checkCircle: { position: "absolute", top: 0, right: 0, backgroundColor: "#5FA1D5", borderRadius: 10, width: 16, height: 16, justifyContent: "center", alignItems: "center", borderWeight: 2, borderColor: "white" },
  saveButton: { backgroundColor: "#5FA1D5", borderRadius: 12, paddingVertical: 15, alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  saveButtonText: { color: "white", fontSize: 18, fontWeight: "bold" },
});

const alertStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  container: { backgroundColor: "white", borderRadius: 20, padding: 25, width: "80%", alignItems: "center" },
  iconContainer: { width: 60, height: 60, borderRadius: 30, justifyContent: "center", alignItems: "center", marginBottom: 15 },
  icon: { fontSize: 30, fontWeight: "bold" },
  title: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  message: { textAlign: "center", color: "#6B7280", marginBottom: 20 },
  buttonContainer: { width: "100%" },
  button: { paddingVertical: 12, borderRadius: 10, alignItems: "center" },
  confirmButtonText: { color: "white", fontWeight: "bold" },
  singleButton: { width: "100%" },
});