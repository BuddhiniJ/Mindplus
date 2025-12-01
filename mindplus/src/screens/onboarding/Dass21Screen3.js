import { useState } from "react";
import { ScrollView, View, Text, TouchableOpacity, Modal } from "react-native";
import { DASS21_QUESTIONS } from "../../utils/dass21Questions";
import QuestionCard from "../../components/QuestionCard";

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
                  style={[alertStyles.button, alertStyles.cancelButton]}
                  onPress={onClose}
                  activeOpacity={0.8}
                >
                  <Text style={alertStyles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
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

export default function Dass21Screen3({ route, navigation }) {
  const { answersPart1, answersPart2 } = route.params;
  const questions = DASS21_QUESTIONS.slice(14, 21); // Q15-Q21
  const [answers, setAnswers] = useState({});
  
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

  const handleNext = () => {
    const answeredCount = Object.keys(answers).length;
    const totalQuestions = questions.length;

    if (answeredCount < totalQuestions) {
      const unanswered = totalQuestions - answeredCount;
      showAlert(
        "Incomplete Survey",
        `Please answer all questions before continuing. You have ${unanswered} question${unanswered > 1 ? 's' : ''} remaining.`,
        "warning"
      );
      return;
    }

    const allAnswers = {
      ...answersPart1,
      ...answersPart2,
      ...answers
    };

    navigation.navigate("Dass21Summary", { allAnswers });
  };

  const calculateProgress = () => {
    const answeredCount = Object.keys(answers).length;
    const totalQuestions = questions.length;
    return (answeredCount / totalQuestions) * 100;
  };

  const calculateOverallProgress = () => {
    const totalAnswered = Object.keys(answersPart1).length + Object.keys(answersPart2).length + Object.keys(answers).length;
    const totalQuestions = 21; // DASS-21 total
    return Math.round((totalAnswered / totalQuestions) * 100);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>DASS-21 Assessment</Text>
          <Text style={styles.subtitle}>Part 3 of 3 - Final Section</Text>
        </View>
        
        {/* Overall Progress Badge */}
        <View style={styles.overallProgressBadge}>
          <Text style={styles.overallProgressText}>{calculateOverallProgress()}% Complete</Text>
        </View>
        
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${calculateProgress()}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {Object.keys(answers).length} of {questions.length} answered
          </Text>
        </View>
      </View>

      {/* Questions */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.finalCard}>
          <Text style={styles.finalCardEmoji}>🎯</Text>
          <Text style={styles.finalCardTitle}>Almost Done!</Text>
          <Text style={styles.finalCardText}>
            This is the final section. After completing these questions, you'll receive your personalized assessment results.
          </Text>
        </View>

        {questions.map((q) => (
          <QuestionCard
            key={q.id}
            question={q}
            value={answers[q.id]}
            onChange={(v) => setAnswers({ ...answers, [q.id]: v })}
          />
        ))}

        {/* Button Container */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Text style={styles.backButtonArrow}>←</Text>
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.completeButton,
              Object.keys(answers).length === questions.length && styles.completeButtonActive
            ]}
            onPress={handleNext}
            activeOpacity={0.8}
          >
            <Text style={styles.completeButtonText}>
              {Object.keys(answers).length === questions.length ? "View Results" : "Complete Survey"}
            </Text>
            <Text style={styles.completeButtonIcon}>
              {Object.keys(answers).length === questions.length ? "✓" : "→"}
            </Text>
          </TouchableOpacity>
        </View>

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
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  headerContent: {
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    fontWeight: "500",
  },
  overallProgressBadge: {
    backgroundColor: "#EEF2FF",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  overallProgressText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#3B82F6",
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#3B82F6",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 8,
    fontWeight: "500",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  finalCard: {
    backgroundColor: "#FEF3C7",
    borderLeftWidth: 4,
    borderLeftColor: "#F59E0B",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    alignItems: "center",
  },
  finalCardEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  finalCardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#92400E",
    marginBottom: 8,
  },
  finalCardText: {
    fontSize: 14,
    color: "#78350F",
    lineHeight: 20,
    fontWeight: "500",
    textAlign: "center",
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#E5E7EB",
    padding: 18,
    borderRadius: 12,
    flex: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  backButtonArrow: {
    color: "#6B7280",
    fontSize: 20,
    fontWeight: "600",
    marginRight: 8,
  },
  backButtonText: {
    color: "#374151",
    fontSize: 17,
    fontWeight: "600",
  },
  completeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#D1D5DB",
    padding: 18,
    borderRadius: 12,
    flex: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  completeButtonActive: {
    backgroundColor: "#10B981",
  },
  completeButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "600",
    marginRight: 8,
  },
  completeButtonIcon: {
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