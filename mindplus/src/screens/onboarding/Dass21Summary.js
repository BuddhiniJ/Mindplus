import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { useEffect, useState } from "react";

export default function Dass21Summary({ route, navigation }) {
  const { allAnswers } = route.params;
  const [scores, setScores] = useState(null);

  useEffect(() => {
    calculateScores();
  }, []);

  const calculateScores = () => {
    const depressionItems = [3, 5, 10, 13, 16, 17, 21];
    const anxietyItems = [2, 4, 7, 9, 15, 19, 20];
    const stressItems = [1, 6, 8, 11, 12, 14, 18];

    const sumFor = (items) => items.reduce((sum, id) => sum + allAnswers[id], 0);

    const depression = sumFor(depressionItems) * 2;
    const anxiety = sumFor(anxietyItems) * 2;
    const stress = sumFor(stressItems) * 2;

    setScores({ depression, anxiety, stress });
  };

  const getSeverityLevel = (score, type) => {
    const ranges = {
      depression: [
        { max: 9, label: "Normal", color: "#10B981" },
        { max: 13, label: "Mild", color: "#3B82F6" },
        { max: 20, label: "Moderate", color: "#F59E0B" },
        { max: 27, label: "Severe", color: "#F97316" },
        { max: Infinity, label: "Extremely Severe", color: "#EF4444" }
      ],
      anxiety: [
        { max: 7, label: "Normal", color: "#10B981" },
        { max: 9, label: "Mild", color: "#3B82F6" },
        { max: 14, label: "Moderate", color: "#F59E0B" },
        { max: 19, label: "Severe", color: "#F97316" },
        { max: Infinity, label: "Extremely Severe", color: "#EF4444" }
      ],
      stress: [
        { max: 14, label: "Normal", color: "#10B981" },
        { max: 18, label: "Mild", color: "#3B82F6" },
        { max: 25, label: "Moderate", color: "#F59E0B" },
        { max: 33, label: "Severe", color: "#F97316" },
        { max: Infinity, label: "Extremely Severe", color: "#EF4444" }
      ]
    };

    return ranges[type].find(range => score <= range.max);
  };

  const ScoreCard = ({ title, score, type, icon }) => {
    const severity = getSeverityLevel(score, type);
    
    return (
      <View style={styles.scoreCard}>
        <View style={styles.scoreCardHeader}>
          <Text style={styles.scoreIcon}>{icon}</Text>
          <Text style={styles.scoreTitle}>{title}</Text>
        </View>
        
        <View style={styles.scoreContent}>
          <Text style={styles.scoreNumber}>{score}</Text>
          <View style={[styles.severityBadge, { backgroundColor: severity.color + "20" }]}>
            <Text style={[styles.severityText, { color: severity.color }]}>
              {severity.label}
            </Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.scoreBarContainer}>
          <View style={styles.scoreBar}>
            <View 
              style={[
                styles.scoreBarFill, 
                { 
                  width: `${Math.min((score / 42) * 100, 100)}%`,
                  backgroundColor: severity.color 
                }
              ]} 
            />
          </View>
        </View>
      </View>
    );
  };

  if (!scores) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Calculating your results...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.completionBadge}>
          <Text style={styles.completionIcon}>✓</Text>
        </View>
        <Text style={styles.title}>Assessment Complete</Text>
        <Text style={styles.subtitle}>Your DASS-21 Results</Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Understanding Your Scores</Text>
          <Text style={styles.infoText}>
            The DASS-21 measures three dimensions of mental health. Your scores are categorized to help understand your current state.
          </Text>
        </View>

        {/* Score Cards */}
        {/* <ScoreCard 
          title="Depression" 
          score={scores.depression} 
          type="depression"
          icon="😔"
        />
        
        <ScoreCard 
          title="Anxiety" 
          score={scores.anxiety} 
          type="anxiety"
          icon="😰"
        />
        
        <ScoreCard 
          title="Stress" 
          score={scores.stress} 
          type="stress"
          icon="😫"
        /> */}

        {/* Disclaimer */}
        <View style={styles.disclaimerCard}>
          <Text style={styles.disclaimerIcon}>ℹ️</Text>
          <Text style={styles.disclaimerTitle}>Important Note</Text>
          <Text style={styles.disclaimerText}>
            These results are for informational purposes only and do not constitute a clinical diagnosis. Please consult with a qualified mental health professional for proper assessment and support.
          </Text>
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          style={styles.continueButton}
          onPress={() =>
            navigation.navigate("FinalProcessingScreen", { 
              allAnswers,
              scores 
            })
          }
          activeOpacity={0.8}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
          <Text style={styles.continueButtonArrow}>→</Text>
        </TouchableOpacity>

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
  header: {
    backgroundColor: "#FFFFFF",
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: "center",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  completionBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#D1FAE5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  completionIcon: {
    fontSize: 32,
    color: "#10B981",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    fontWeight: "500",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  infoCard: {
    backgroundColor: "#EEF2FF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E40AF",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
  },
  scoreCard: {
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
  scoreCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  scoreIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  scoreTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  scoreContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  scoreNumber: {
    fontSize: 48,
    fontWeight: "800",
    color: "#111827",
  },
  severityBadge: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  severityText: {
    fontSize: 14,
    fontWeight: "700",
  },
  scoreBarContainer: {
    marginTop: 8,
  },
  scoreBar: {
    height: 8,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    overflow: "hidden",
  },
  scoreBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  disclaimerCard: {
    backgroundColor: "#FEF3C7",
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    marginBottom: 24,
    alignItems: "center",
  },
  disclaimerIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  disclaimerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#92400E",
    marginBottom: 8,
  },
  disclaimerText: {
    fontSize: 13,
    color: "#78350F",
    lineHeight: 20,
    textAlign: "center",
  },
  continueButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3B82F6",
    padding: 18,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  continueButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "600",
    marginRight: 8,
  },
  continueButtonArrow: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "600",
  },
  bottomSpacer: {
    height: 40,
  },
};