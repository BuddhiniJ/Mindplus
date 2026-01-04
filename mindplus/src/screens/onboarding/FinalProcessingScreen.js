import { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, Animated } from "react-native";
import { auth, db } from "../../firebase/firebaseConfig";
import { doc, setDoc } from "firebase/firestore";

// Example ML API URL (replace with your real endpoint)
const ML_API_URL = "http://192.168.1.100:8000/predict";

export default function FinalProcessingScreen({ route, navigation }) {
  const { allAnswers, scores } = route.params;
  const [currentStep, setCurrentStep] = useState(1);
  const [progress] = useState(new Animated.Value(0));

  useEffect(() => {
    processResults();
    animateProgress();
  }, []);

  const animateProgress = () => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 3000,
      useNativeDriver: false,
    }).start();
  };

  const processResults = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        alert("User not logged in");
        navigation.navigate("Login");
        return;
      }

      const uid = user.uid;

      // --------------------------
      // 1️⃣ SAVE RAW DATA TO FIRESTORE
      // --------------------------
      setCurrentStep(1);
      await setDoc(doc(db, "users", uid, "assessments", "dass21"), {
        timestamp: new Date().toISOString(),
        responses: allAnswers,
        scores: scores,
        version: 1
      });

      console.log("DASS-21 data saved successfully.");

      // --------------------------
      // 2️⃣ SEND SCORES TO ML API FOR CLUSTERING
      // --------------------------
      setCurrentStep(2);

      // Only call API if URL is provided
      let fingerprintData = {
        clusterId: 0,
        label: "processing",
        confidence: 0
      };

      if (ML_API_URL && ML_API_URL.trim() !== "") {
        const response = await fetch(ML_API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            stress: scores.stress,
            anxiety: scores.anxiety,
            depression: scores.depression
          })
        });

        if (!response.ok) {
          throw new Error("ML API returned an error");
        }

        fingerprintData = await response.json();
        console.log("ML fingerprint:", fingerprintData);
      } else {
        console.log("ML API URL not configured, using default fingerprint");
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // --------------------------
      // 3️⃣ SAVE FINGERPRINT TO FIRESTORE
      // --------------------------
      setCurrentStep(3);
      await setDoc(doc(db, "users", uid, "fingerprint", "current"), {
        ...fingerprintData,
        createdAt: new Date().toISOString()
      });

      console.log("Fingerprint saved to Firestore.");

      // --------------------------
      // 4️⃣ NAVIGATE TO DASHBOARD
      // --------------------------
      setCurrentStep(4);
      await new Promise(resolve => setTimeout(resolve, 800));
      navigation.replace("HomeDashboardScreen");

    } catch (error) {
      console.error("Processing error:", error);
      alert("Something went wrong while processing your data.");
    }
  };

  const steps = [
    { id: 1, label: "Saving your responses", icon: "💾" },
    { id: 2, label: "Analyzing patterns", icon: "🧠" },
    { id: 3, label: "Creating your profile", icon: "📊" },
    { id: 4, label: "Preparing dashboard", icon: "✨" }
  ];

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%']
  });

  return (
    <View style={styles.container}>
      {/* Animated Background Gradient Effect */}
      <View style={styles.backgroundGradient} />

      {/* Main Content */}
      <View style={styles.content}>
        {/* Main Icon */}
        <View style={styles.iconContainer}>
          <Text style={styles.mainIcon}>🔄</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>Processing Your Results</Text>
        <Text style={styles.subtitle}>This will only take a moment</Text>

        {/* Progress Bar */}
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBar}>
            <Animated.View
              style={[
                styles.progressBarFill,
                { width: progressWidth }
              ]}
            />
          </View>
        </View>

        {/* Steps */}
        <View style={styles.stepsContainer}>
          {steps.map((step) => (
            <View
              key={step.id}
              style={[
                styles.stepItem,
                currentStep === step.id && styles.stepItemActive,
                currentStep > step.id && styles.stepItemComplete
              ]}
            >
              <View style={[
                styles.stepIconContainer,
                currentStep === step.id && styles.stepIconContainerActive,
                currentStep > step.id && styles.stepIconContainerComplete
              ]}>
                {currentStep === step.id ? (
                  <ActivityIndicator size="small" color="#3B82F6" />
                ) : currentStep > step.id ? (
                  <Text style={styles.stepCheckmark}>✓</Text>
                ) : (
                  <Text style={styles.stepIcon}>{step.icon}</Text>
                )}
              </View>
              <View style={styles.stepTextContainer}>
                <Text style={[
                  styles.stepLabel,
                  currentStep >= step.id && styles.stepLabelActive
                ]}>
                  {step.label}
                </Text>
                {currentStep === step.id && (
                  <View style={styles.loadingDots}>
                    <Text style={styles.dotText}>●</Text>
                    <Text style={styles.dotText}>●</Text>
                    <Text style={styles.dotText}>●</Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Footer Message */}
        <View style={styles.footerCard}>
          <Text style={styles.footerText}>
            We're creating a personalized experience based on your responses
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  backgroundGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 300,
    backgroundColor: "#EEF2FF",
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  content: {
    flex: 1,
    paddingTop: 100,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  mainIcon: {
    fontSize: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    marginBottom: 32,
    textAlign: "center",
  },
  progressBarContainer: {
    width: "100%",
    marginBottom: 40,
  },
  progressBar: {
    height: 8,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#3B82F6",
    borderRadius: 4,
  },
  stepsContainer: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    opacity: 0.4,
  },
  stepItemActive: {
    opacity: 1,
  },
  stepItemComplete: {
    opacity: 0.7,
  },
  stepIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  stepIconContainerActive: {
    backgroundColor: "#EEF2FF",
  },
  stepIconContainerComplete: {
    backgroundColor: "#D1FAE5",
  },
  stepIcon: {
    fontSize: 20,
  },
  stepCheckmark: {
    fontSize: 18,
    color: "#10B981",
    fontWeight: "bold",
  },
  stepTextContainer: {
    flex: 1,
  },
  stepLabel: {
    fontSize: 15,
    color: "#6B7280",
    fontWeight: "500",
  },
  stepLabelActive: {
    color: "#111827",
    fontWeight: "600",
  },
  loadingDots: {
    flexDirection: "row",
    marginTop: 4,
    gap: 4,
  },
  dotText: {
    fontSize: 8,
    color: "#3B82F6",
  },
  footerCard: {
    marginTop: 32,
    backgroundColor: "#FEF3C7",
    borderRadius: 12,
    padding: 16,
  },
  footerText: {
    fontSize: 14,
    color: "#92400E",
    textAlign: "center",
    lineHeight: 20,
  },
};