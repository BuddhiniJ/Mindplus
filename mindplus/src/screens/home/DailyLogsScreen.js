import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal
} from "react-native";
import Slider from "@react-native-community/slider";
import { auth, db } from "../../firebase/firebaseConfig";
import { doc, setDoc, getDoc, collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { calculateDerivedFlags } from "../../utils/dailyCheckinUtils";
import { LinearGradient } from 'expo-linear-gradient';

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
                {/* <TouchableOpacity
                  style={[alertStyles.button, alertStyles.cancelButton]}
                  onPress={onClose}
                  activeOpacity={0.8}
                >
                  <Text style={alertStyles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity> */}
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

export default function DailyLogsScreen({ navigation }) {
  const [stress, setStress] = useState(5);
  const [energy, setEnergy] = useState(3);
  const [sleep, setSleep] = useState("7");
  const [workload, setWorkload] = useState(5);
  const [notes, setNotes] = useState("");

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

  const getStressEmoji = (value) => {
    if (value <= 2) return "😌";
    if (value <= 4) return "🙂";
    if (value <= 6) return "😐";
    if (value <= 8) return "😟";
    return "😰";
  };

  const getEnergyEmoji = (value) => {
    if (value === 1) return "😴";
    if (value === 2) return "😪";
    if (value === 3) return "😐";
    if (value === 4) return "😊";
    return "⚡";
  };

  const getWorkloadEmoji = (value) => {
    if (value <= 2) return "🏖️";
    if (value <= 4) return "📝";
    if (value <= 6) return "💼";
    if (value <= 8) return "📚";
    return "🔥";
  };

  const handleSubmit = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        showAlert("Error", "User not logged in", "error");
        return;
      }

      const sleepHours = parseFloat(sleep);

      if (isNaN(sleepHours) || sleepHours < 0 || sleepHours > 24) {
        showAlert("Invalid Input", "Please enter valid sleep hours (0-24)", "warning");
        return;
      }

      const uid = user.uid;
      const today = new Date().toISOString().split("T")[0];

      const derived_flags = calculateDerivedFlags({
        stress_today: stress,
        sleep_hours: sleepHours,
        energy_level: energy,
        workload_intensity: workload
      });

      // 1️⃣ Save today's log
      await setDoc(
        doc(db, "users", uid, "daily_logs", today),
        {
          date: today,
          timestamp: new Date().toISOString(),
          stress_today: stress,
          energy_level: energy,
          sleep_hours: sleepHours,
          workload_intensity: workload,
          derived_flags
        }
      );

      // 2️⃣ Fetch baseline
      const baselineSnap = await getDoc(
        doc(db, "users", uid, "baseline", "dass21")
      );
      const baselineData = baselineSnap.data();

      if (!baselineData) {
        showAlert("Error", "Baseline not found.", "error");
        return;
      }

      // 3️⃣ Fetch last 7 logs
      const logsQuery = query(
        collection(db, "users", uid, "daily_logs"),
        orderBy("timestamp", "desc"),
        limit(7)
      );

      const logsSnapshot = await getDocs(logsQuery);
      const recentLogs = logsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          stress_today: data.stress_today,
          energy_level: data.energy_level,
          sleep_hours: data.sleep_hours,
          workload_intensity: data.workload_intensity
        };
      });

      // 4️⃣ Fetch previous fingerprint (for true drift)
      const fingerprintSnap = await getDoc(
        doc(db, "users", uid, "fingerprint", "current")
      );

      let previousFingerprint = null;

      if (fingerprintSnap.exists()) {
        const fpData = fingerprintSnap.data();

        // Remove updatedAt before sending to backend
        const { updatedAt, ...cleanFingerprint } = fpData;
        previousFingerprint = cleanFingerprint;
      }

      // console.log("Sending to backend:", {
      //   baseline: baselineData,
      //   previous_fingerprint: previousFingerprint,
      //   recent_logs: recentLogs
      // });

      // 5️⃣ Send to backend
      const response = await fetch(
        "http://192.168.252.78:8000/api/fingerprint/evolve",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            baseline: baselineData,
            previous_fingerprint: previousFingerprint,
            recent_logs: recentLogs
          })
        }
      );


      // Read response as text once
      const responseText = await response.text();
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (jsonError) {
        console.error("Response not JSON:", responseText);
        showAlert("Error", "Unexpected server response. Please try again.", "error");
        return;
      }

      if (result.status === "success") {
        const fingerprintData = result.data;

        // 6️⃣ Save evolved fingerprint
        await setDoc(
          doc(db, "users", uid, "fingerprint", "current"),
          {
            ...fingerprintData,
            updatedAt: new Date().toISOString()
          }
        );

        // Save predictions separately
        await setDoc(
          doc(db, "users", uid, "predictions", "current"),
          {
            future_5_days: fingerprintData.future_5_days,
            generatedAt: new Date().toISOString()
          }
        );

        showAlert(
          "Success",
          "Your daily check-in has been saved!",
          "success",
          () => {
            hideAlert();
            navigation.replace("DailyCheckInScreen");
          }
        );
      } else {
        showAlert("Error", result.message || "Failed to save check-in.", "error");
      }

    } catch (error) {
      console.error(error);
      showAlert("Error", "Failed to save check-in. Please try again.", "error");
    }
  };


  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#b3c6ddff', '#4895D0']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Daily Check-In</Text>
          <Text style={styles.headerSubtitle}>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>💭</Text>
          <Text style={styles.infoText}>
            Take a moment to reflect on your day. Your responses help track patterns and support your wellbeing.
          </Text>
        </View>

        {/* Stress Level */}
        <View style={styles.questionCard}>
          <View style={styles.questionHeader}>
            <Text style={styles.questionEmoji}>{getStressEmoji(stress)}</Text>
            <View style={styles.questionTextContainer}>
              <Text style={styles.questionLabel}>Stress Level</Text>
              <Text style={styles.questionSubtext}>How stressed did you feel today?</Text>
            </View>
          </View>

          <View style={styles.sliderContainer}>
            <View style={styles.sliderHeader}>
              <Text style={styles.sliderValue}>{stress}</Text>
              <Text style={styles.sliderScale}>0-10</Text>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={10}
              step={1}
              value={stress}
              onValueChange={setStress}
              minimumTrackTintColor="#EF4444"
              maximumTrackTintColor="#E5E7EB"
              thumbTintColor="#EF4444"
            />
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabelText}>Low</Text>
              <Text style={styles.sliderLabelText}>High</Text>
            </View>
          </View>
        </View>

        {/* Energy Level */}
        <View style={styles.questionCard}>
          <View style={styles.questionHeader}>
            <Text style={styles.questionEmoji}>{getEnergyEmoji(energy)}</Text>
            <View style={styles.questionTextContainer}>
              <Text style={styles.questionLabel}>Energy Level</Text>
              <Text style={styles.questionSubtext}>How energetic did you feel?</Text>
            </View>
          </View>

          <View style={styles.sliderContainer}>
            <View style={styles.sliderHeader}>
              <Text style={styles.sliderValue}>{energy}</Text>
              <Text style={styles.sliderScale}>1-5</Text>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={5}
              step={1}
              value={energy}
              onValueChange={setEnergy}
              minimumTrackTintColor="#10B981"
              maximumTrackTintColor="#E5E7EB"
              thumbTintColor="#10B981"
            />
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabelText}>Exhausted</Text>
              <Text style={styles.sliderLabelText}>Energized</Text>
            </View>
          </View>
        </View>

        {/* Sleep Hours */}
        <View style={styles.questionCard}>
          <View style={styles.questionHeader}>
            <Text style={styles.questionEmoji}>😴</Text>
            <View style={styles.questionTextContainer}>
              <Text style={styles.questionLabel}>Sleep Duration</Text>
              <Text style={styles.questionSubtext}>How many hours did you sleep?</Text>
            </View>
          </View>

          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              keyboardType="decimal-pad"
              value={sleep}
              onChangeText={setSleep}
              placeholder="7.5"
              placeholderTextColor="#9CA3AF"
            />
            <Text style={styles.inputSuffix}>hours</Text>
          </View>
        </View>

        {/* Workload Intensity */}
        <View style={styles.questionCard}>
          <View style={styles.questionHeader}>
            <Text style={styles.questionEmoji}>{getWorkloadEmoji(workload)}</Text>
            <View style={styles.questionTextContainer}>
              <Text style={styles.questionLabel}>Workload Intensity</Text>
              <Text style={styles.questionSubtext}>How demanding was your day?</Text>
            </View>
          </View>

          <View style={styles.sliderContainer}>
            <View style={styles.sliderHeader}>
              <Text style={styles.sliderValue}>{workload}</Text>
              <Text style={styles.sliderScale}>0-10</Text>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={10}
              step={1}
              value={workload}
              onValueChange={setWorkload}
              minimumTrackTintColor="#F59E0B"
              maximumTrackTintColor="#E5E7EB"
              thumbTintColor="#F59E0B"
            />
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabelText}>Light</Text>
              <Text style={styles.sliderLabelText}>Heavy</Text>
            </View>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          activeOpacity={0.8}
        >
          <Text style={styles.submitButtonText}>Complete Check-In</Text>
          <Text style={styles.submitButtonIcon}>✓</Text>
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
  header: {
    backgroundColor: "#FFFFFF",
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#ffffffff",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#ffffffff",
    fontWeight: "500",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  infoCard: {
    flexDirection: "row",
    backgroundColor: "#EEF2FF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    alignItems: "center",
  },
  infoIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
  },
  questionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  questionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  questionEmoji: {
    fontSize: 36,
    marginRight: 16,
  },
  questionTextContainer: {
    flex: 1,
  },
  questionLabel: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 2,
  },
  questionSubtext: {
    fontSize: 14,
    color: "#6B7280",
  },
  sliderContainer: {
    paddingHorizontal: 4,
  },
  sliderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sliderValue: {
    fontSize: 32,
    fontWeight: "800",
    color: "#111827",
  },
  sliderScale: {
    fontSize: 14,
    color: "#9CA3AF",
    fontWeight: "600",
  },
  slider: {
    width: "100%",
    height: 40,
  },
  sliderLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  sliderLabelText: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 16,
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
  },
  inputSuffix: {
    position: "absolute",
    right: 16,
    fontSize: 16,
    color: "#6B7280",
    fontWeight: "600",
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3B82F6",
    padding: 18,
    borderRadius: 12,
    marginTop: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "600",
    marginRight: 8,
  },
  submitButtonIcon: {
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
  headerContent: {
    marginBottom: 16,
  },
};