import { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, Animated, StyleSheet } from "react-native";
import { auth, db } from "../../firebase/firebaseConfig";
import { doc, setDoc } from "firebase/firestore";
import { LinearGradient } from "expo-linear-gradient";

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
      duration: 2500,
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

      // STEP 1 — Save baseline DASS-21
      setCurrentStep(1);
      await setDoc(doc(db, "users", uid, "baseline", "dass21"), {
        questionnaire: "DASS-21",
        scoringMethod: "DASS-21 × 2",
        timestamp: new Date().toISOString(),
        responses: allAnswers,
        scores: {
          depression: scores.depression,
          anxiety: scores.anxiety,
          stress: scores.stress,
          severity: {
            depression: scores.severity?.depression,
            anxiety: scores.severity?.anxiety,
            stress: scores.severity?.stress,
          }
        },
        version: 1
      });

      // STEP 2 — UX pause (finalizing baseline)
      setCurrentStep(2);
      await new Promise(resolve => setTimeout(resolve, 800));

      // STEP 3 — Prepare dashboard
      setCurrentStep(3);
      await new Promise(resolve => setTimeout(resolve, 800));

      navigation.replace("HomeDashboardScreen");

    } catch (error) {
      console.error("Final processing error:", error);
    }
  };

  const steps = [
    { id: 1, label: "Saving your responses", icon: "💾" },
    { id: 2, label: "Finalizing baseline", icon: "📊" },
    { id: 3, label: "Preparing dashboard", icon: "✨" }
  ];

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"]
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#b3c6ddff", "#4895D0"]}
        style={styles.headerGradient}
      >
        <View style={styles.whiteCircle}>
          <Text style={styles.mainIcon}>🔄</Text>
        </View>

        <Text style={styles.title}>Setting Things Up</Text>
        <Text style={styles.subtitle}>Just a moment…</Text>

        <View style={styles.progressBar}>
          <Animated.View
            style={[styles.progressBarFill, { width: progressWidth }]}
          />
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.stepsCard}>
          {steps.map(step => (
            <View
              key={step.id}
              style={[
                styles.stepItem,
                currentStep === step.id && styles.stepActive,
                currentStep > step.id && styles.stepComplete
              ]}
            >
              <View style={styles.stepIconCircle}>
                {currentStep > step.id ? (
                  <Text style={styles.checkmark}>✓</Text>
                ) : currentStep === step.id ? (
                  <ActivityIndicator size="small" color="#4895D0" />
                ) : (
                  <Text style={styles.stepIcon}>{step.icon}</Text>
                )}
              </View>
              <Text style={styles.stepLabel}>{step.label}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },

  headerGradient: {
    height: 320,
    paddingTop: 60,
    alignItems: "center",
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    paddingHorizontal: 30,
  },

  whiteCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },

  mainIcon: { fontSize: 38, color: "#FFF" },

  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 6,
  },

  subtitle: {
    fontSize: 16,
    color: "#FFFFFF",
    opacity: 0.9,
    marginBottom: 25,
  },

  progressBar: {
    width: "100%",
    height: 6,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 3,
    overflow: "hidden",
  },

  progressBarFill: {
    height: "100%",
    backgroundColor: "#6366F1",
  },

  content: {
    flex: 1,
    padding: 25,
    marginTop: 30,
  },

  stepsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    elevation: 4,
  },

  stepItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    opacity: 0.4,
  },

  stepActive: { opacity: 1 },
  stepComplete: { opacity: 0.8 },

  stepIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },

  stepIcon: { fontSize: 18 },
  checkmark: { fontSize: 20, color: "#10B981", fontWeight: "bold" },

  stepLabel: {
    fontSize: 16,
    color: "#374151",
    fontWeight: "500",
  },
});
