import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Modal, Image, StyleSheet } from "react-native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../firebase/firebaseConfig";
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

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
              <>
                <TouchableOpacity style={[alertStyles.button, alertStyles.cancelButton]} onPress={onClose}>
                  <Text style={alertStyles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[alertStyles.button, alertStyles.confirmButton, { backgroundColor: getIconColor() }]} onPress={onConfirm}>
                  <Text style={alertStyles.confirmButtonText}>Continue</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity style={[alertStyles.button, alertStyles.singleButton, { backgroundColor: getIconColor() }]} onPress={onClose}>
                <Text style={alertStyles.confirmButtonText}>OK</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false); // Toggle visibility state

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

  const loginUser = async () => {
    if (!email.trim() || !password) {
      showAlert("Required", "Please fill in all details.", "warning");
      return;
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigation.navigate("AuthCheckScreen");
    } catch (error) {
      showAlert("Login Failed", error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled" bounces={false}>

        {/* Header with Gradient */}
        <LinearGradient
          colors={['#b3c6ddff', '#4895D0']}
          style={styles.topSection}
        >
          <View style={styles.logoCircle}>
            <Image
              source={require('../../../assets/Logo2.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
        </LinearGradient>

        {/* White Card Section */}
        <View style={styles.formCard}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Enter your details below</Text>

          <View style={styles.form}>
            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Password Input with Toggle Icon */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordWrapper}>
                <TextInput
                  style={styles.passwordInput}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!isPasswordVisible}
                />
                <TouchableOpacity
                  onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                  style={styles.eyeIcon}>
                  <Ionicons
                    name={isPasswordVisible ? "eye-outline" : "eye-off-outline"}
                    size={20}
                    color="#D1D5DB"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Sign In Button */}
            <TouchableOpacity
              style={[styles.button, styles.primaryButton, loading && styles.buttonDisabled]}
              onPress={loginUser}
              disabled={loading}
            >
              <Text
                style={styles.primaryButtonText}
              >
                {loading ? "Signing in..." : "Sign In"}
              </Text>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account ? </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Register")}>
                <Text style={styles.signUpLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={hideAlert}
      />
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
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  logoImage: {
    width: 180,
    height: 180,
    marginTop: -5
  },
  formCard: {
    flex: 1,
    backgroundColor: "#FFF",
    marginTop: -50,
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    paddingHorizontal: 35,
    paddingTop: 40,
    alignItems: 'center'
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#000"
  },
  subtitle: {
    fontSize: 16,
    color: "#9CA3AF",
    marginTop: 8,
    marginBottom: 30
  },
  form: {
    width: "100%"
  },
  inputContainer: {
    marginBottom: 20
  },
  label: {
    fontSize: 13,
    color: "#000000ff",
    marginBottom: 8
  },
  input: {
    borderWidth: 1,
    borderColor: "#F3F4F6",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: "#F3F4F6",
    borderRadius: 12,
  },
  passwordInput: {
    flex: 1,
    padding: 16,
    fontSize: 16
  },
  eyeIcon: {
    paddingRight: 15
  },
  button: {
    borderRadius: 12,
    paddingVertical: 18,
    marginTop: 10
  },
  primaryButton: {
    backgroundColor: "#5FA1D5"
  },
  primaryButtonText: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "700",
    textAlign: 'center'
  },
  buttonDisabled: {
    opacity: 0.7
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 25
  },
  footerText: {
    color: "#9CA3AF"
  },
  signUpLink: {
    color: "#9CA3AF"
  },
});

// alert styles
const alertStyles = StyleSheet.create({
  overlay: { 
    flex: 1, 
    backgroundColor: "rgba(0,0,0,0.5)", 
    justifyContent: "center", 
    alignItems: "center" 
  },
  container: { 
    backgroundColor: "#FFF", 
    borderRadius: 20, 
    padding: 24, 
    width: "85%", 
    alignItems: "center" 
  },
  iconContainer: { 
    width: 64, 
    height: 64, 
    borderRadius: 32, 
    justifyContent: "center", 
    alignItems: "center", 
    marginBottom: 16 
  },
  icon: { 
    fontSize: 32, 
    fontWeight: "bold" 
  },
  title: { 
    fontSize: 20, 
    fontWeight: "bold", 
    marginBottom: 8 
  },
  message: { 
    fontSize: 15, 
    color: "#6B7280", 
    textAlign: "center", 
    marginBottom: 24 
  },
  buttonContainer: { 
    width: "100%" 
  },
  button: { 
    paddingVertical: 12, 
    borderRadius: 10, 
    alignItems: "center" 
  },
  singleButton: { 
    width: "100%" 
  },
  confirmButtonText: { 
    color: "#FFF", 
    fontWeight: "600" 
  },
});