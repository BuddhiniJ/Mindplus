import { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, Animated, StyleSheet, Image } from "react-native";
import { auth, db } from "../../firebase/firebaseConfig";
import { doc, setDoc } from "firebase/firestore";
// Import the Gradient component
import { LinearGradient } from 'expo-linear-gradient';

const ML_API_URL = "http://192.168.1.2:8000/predict";

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
        navigation.navigate("Login");
        return;
      }
      const uid = user.uid;

      setCurrentStep(1);
      await setDoc(doc(db, "users", uid, "assessments", "dass21"), {
        timestamp: new Date().toISOString(),
        responses: allAnswers,
        scores: scores,
        version: 1
      });

      setCurrentStep(2);
      let fingerprintData = { clusterId: 0, label: "processing", confidence: 0 };

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
        if (response.ok) fingerprintData = await response.json();
      } else {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      setCurrentStep(3);
      await setDoc(doc(db, "users", uid, "fingerprint", "current"), {
        ...fingerprintData,
        createdAt: new Date().toISOString()
      });

      setCurrentStep(4);
      await new Promise(resolve => setTimeout(resolve, 800));
      navigation.replace("HomeDashboardScreen");

    } catch (error) {
      console.error("Processing error:", error);
    }
  };

  const steps = [
    { id: 1, label: "Saving your responses", icon: "💾" },
    { id: 2, label: "Analyzing patterns", icon: "🧠" },
    { id: 3, label: "Creating your profile", icon: "👤" },
    { id: 4, label: "Preparing dashboard", icon: "✨" }
  ];

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%']
  });

  return (
    <View style={styles.container}>
      {/* 🟢 Updated Header Section with LinearGradient */}
      <LinearGradient
        colors={['#8BD0BF', '#4895D0']} // Teal to Blue gradient
        style={styles.headerGradient}
      >
        <View style={styles.iconContainer}>
          <View style={styles.whiteCircle}>
             <Text style={styles.mainIcon}>🔄</Text>
          </View>
        </View>

        <Text style={styles.title}>Processing Your Results</Text>
        <Text style={styles.subtitle}>This will only take a moment</Text>

        {/* Progress Bar inside the gradient area */}
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBar}>
            <Animated.View style={[styles.progressBarFill, { width: progressWidth }]} />
          </View>
        </View>
      </LinearGradient>

      {/* Main Content (Steps) */}
      <View style={styles.content}>
        <View style={styles.stepsCard}>
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
                styles.stepIconCircle,
                currentStep === step.id && styles.circleActive,
                currentStep > step.id && styles.circleComplete
              ]}>
                {currentStep > step.id ? (
                  <Text style={styles.stepCheckmark}>✓</Text>
                ) : (
                  currentStep === step.id ? <ActivityIndicator size="small" color="#4895D0" /> : <Text style={styles.stepIcon}>{step.icon}</Text>
                )}
              </View>
              <View style={styles.stepTextContainer}>
                <Text style={[styles.stepLabel, currentStep >= step.id && styles.stepLabelActive]}>
                  {step.label}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  headerGradient: {
    height: 330,
    paddingTop: 60,
    alignItems: "center",
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    paddingHorizontal: 30,
  },
  iconContainer: {
    marginBottom: 20,
  },
  whiteCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.3)", // Glass effect
    justifyContent: "center",
    alignItems: "center",
  },
  mainIcon: { fontSize: 40, color: '#FFF' },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#FFFFFF",
    opacity: 0.9,
    marginBottom: 30,
  },
  progressBarContainer: {
    width: "100%",
  },
  progressBar: {
    height: 6,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#6366F1", // Indigo fill
  },
  content: {
    flex: 1,
    paddingHorizontal: 25,
    marginTop: 30, // Pulls the card up slightly
  },
  stepsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    opacity: 0.3,
  },
  stepItemActive: { opacity: 1 },
  stepItemComplete: { opacity: 0.8 },
  stepIconCircle: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  circleActive: { backgroundColor: "#EEF2FF" },
  circleComplete: { backgroundColor: "#D1FAE5" },
  stepCheckmark: { color: "#10B981", fontSize: 20, fontWeight: "bold" },
  stepLabel: { fontSize: 16, color: "#6B7280" },
  stepLabelActive: { color: "#111827", fontWeight: "600" },
});