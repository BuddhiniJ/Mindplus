import { db } from "../../firebase/firebaseConfig";
import { doc, setDoc } from "firebase/firestore";
import { avatars } from "../../utils/avatars";
import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Modal, Image, ScrollView, StyleSheet } from "react-native";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../firebase/firebaseConfig";
import { LinearGradient } from 'expo-linear-gradient'; // Ensure you have this installed

// Custom Alert Component (Kept as provided)
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

export default function RegisterScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [nickname, setNickname] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("avatar1");
  const [fullName, setFullName] = useState("");
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

  const registerUser = async () => {
    // ... logic stays exactly the same as your provided code ...
    if (!email.trim()) {
      showAlert("Email Required", "Please enter your email address.", "warning");
      return;
    }
    if (!password) {
      showAlert("Password Required", "Please enter your password.", "warning");
      return;
    }
    if (!confirmPassword) {
      showAlert("Confirm Password", "Please confirm your password.", "warning");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      showAlert("Invalid Email", "Please enter a valid email address.", "error");
      return;
    }

    if (password.length < 6) {
      showAlert("Weak Password", "Password must be at least 6 characters long.", "warning");
      return;
    }

    if (password !== confirmPassword) {
      showAlert("Passwords Don't Match", "Please make sure both passwords are identical.", "error");
      return;
    }

    if (!fullName.trim()) {
      showAlert("Full Name Required", "Please enter your full name.", "warning");
      return;
    }

    if (!emergencyName.trim()) {
      showAlert("Emergency Contact Name Required", "Please enter the emergency contact's name.", "warning");
      return;
    }

    if (!emergencyContact.trim()) {
      showAlert("Emergency Contact Number Required", "Please enter the emergency contact number.", "warning");
      return;
    }

    if (!/^\d{10}$/.test(emergencyContact)) {
      showAlert("Invalid Contact Number", "Emergency number must be 10 digits.", "error");
      return;
    }

    if (!emergencyRelation.trim()) {
      showAlert("Relationship Required", "Please enter the relationship.", "warning");
      return;
    }

    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      const user = auth.currentUser;
      await setDoc(doc(db, "users", user.uid, "profile", "basic"), {
        fullName, nickname, avatar: selectedAvatar, emergencyName, emergencyContact, emergencyRelation,
        createdAt: Date.now(), updatedAt: Date.now(),
      });
      showAlert("Success", "Account created successfully!", "success", () => {
        hideAlert(); navigation.navigate("Login");
      });
    } catch (error) {
      showAlert("Registration Failed", error.message, "error");
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled" bounces={false}>

        {/* Header Section */}
        <LinearGradient colors={['#b3c6ddff', '#4895D0']} style={styles.topSection}>
          <View style={styles.logoCircle}>
            <Image source={require('../../../assets/Logo2.png')} style={styles.logoImage} resizeMode="contain" />
          </View>
        </LinearGradient>

        {/* White Card Section */}
        <View style={styles.formCard}>
          <Text style={styles.mainTitle}>Get Started</Text>

          {/* Personal Details Section */}
          <View style={styles.sectionOutline}>
            <View style={styles.sectionLabelContainer}>
              <Text style={styles.sectionLabelText}>Personal Details</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.fieldLabel}>Name</Text>
              <TextInput style={styles.input} value={fullName} onChangeText={setFullName} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.fieldLabel}>Nickname</Text>
              <TextInput style={styles.input} value={nickname} onChangeText={setNickname} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.fieldLabel}>Email</Text>
              <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.fieldLabel}>Password</Text>
              <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.fieldLabel}>Confirm Password</Text>
              <TextInput style={styles.input} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
            </View>
          </View>

          {/* Emergency Contact Section */}
          <View style={styles.sectionOutline}>
            <View style={styles.sectionLabelContainer}>
              <Text style={styles.sectionLabelText}>Emergency Contact</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.fieldLabel}>Name</Text>
              <TextInput style={styles.input} value={emergencyName} onChangeText={setEmergencyName} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.fieldLabel}>Contact No</Text>
              <TextInput style={styles.input} value={emergencyContact} onChangeText={setEmergencyContact} keyboardType="numeric" maxLength={10} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.fieldLabel}>Relationship</Text>
              <TextInput style={styles.input} value={emergencyRelation} onChangeText={setEmergencyRelation} />
            </View>
          </View>

          {/* Avatar Selection Grid */}
          <View style={styles.sectionOutline}>
            <View style={styles.sectionLabelContainer}>
              <Text style={styles.sectionLabelText}>Choose an Avatar</Text>
            </View>
            <View style={styles.avatarGrid}>
              {Object.keys(avatars).map((key) => (
                <TouchableOpacity
                  key={key}
                  onPress={() => setSelectedAvatar(key)}
                  style={[styles.avatarWrapper, selectedAvatar === key && styles.selectedAvatar]}
                >
                  <Image source={avatars[key]} style={styles.avatarImg} />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Footer Buttons */}
          <TouchableOpacity style={[styles.submitBtn, loading && { opacity: 0.7 }]} onPress={registerUser} disabled={loading}>
            <Text style={styles.submitBtnText}>{loading ? "Signing Up..." : "Sign Up"}</Text>
          </TouchableOpacity>

          <View style={styles.footerLinkContainer}>
            <Text style={styles.footerText}>Already have an account ? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>

      <CustomAlert visible={alertConfig.visible} title={alertConfig.title} message={alertConfig.message} type={alertConfig.type} onClose={hideAlert} onConfirm={alertConfig.onConfirm} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF"
  },
  scrollContainer: {
    flexGrow: 1
  },
  topSection: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center'
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  logoImage: {
    width: 125,
    height: 125,
    marginTop: -5
  },
  formCard: {
    flex: 1,
    backgroundColor: "#FFF",
    marginTop: -40,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 40,
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: 'center',
    color: "#000",
    marginBottom: 25
  },
  sectionOutline: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 15,
    padding: 15,
    marginBottom: 25,
  },
  sectionLabelContainer: {
    position: 'absolute',
    top: -10,
    left: 15,
    backgroundColor: '#FFF',
    paddingHorizontal: 5,
  },
  sectionLabelText: {
    fontSize: 12,
    color: '#000000ff'
  },
  inputGroup: {
    marginBottom: 15
  },
  fieldLabel: {
    fontSize: 12,
    color: '#000000ff',
    marginBottom: 5,
    marginLeft: 5
  },
  input: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#F3F4F6",
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: "#111827",
    elevation: 1,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10
  },
  avatarWrapper: {
    padding: 5,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: 'transparent'
  },
  selectedAvatar: {
    borderColor: '#3B82F6'
  },
  avatarImg: {
    width: 55,
    height: 55,
    borderRadius: 27.5
  },
  submitBtn: {
    backgroundColor: "#63A1D6",
    borderRadius: 12,
    paddingVertical: 15,
    marginTop: 10,
    alignItems: 'center'
  },
  submitBtnText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "700"
  },
  footerLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 15
  },
  footerText: {
    color: "#9CA3AF",
    fontSize: 13
  },
  loginLink: {
    color: "#9CA3AF",
    fontWeight: "600",
    fontSize: 13
  },
});

// alert Styles
const alertStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center"
  },
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    width: "80%",
    alignItems: "center"
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15
  },
  icon: {
    fontSize: 28,
    fontWeight: "bold"
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 8
  },
  message: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 20
  },
  buttonContainer: {
    width: '100%'
  },
  button: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center"
  },
  confirmButtonText: {
    color: "#FFFFFF",
    fontWeight: "600"
  },
  singleButton: {
    width: '100%'
  },
});