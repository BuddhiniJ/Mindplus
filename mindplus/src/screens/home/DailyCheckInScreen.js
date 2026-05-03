// Daily Check-In screen component - allows users to answer daily emotional wellness questions
// Stores responses with emotion detection and provides dashboard insights
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { auth, db } from "../../firebase/firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";

import { detectEmotion } from "../../services/api";
import { getDailyQuestionsForUserType } from "../../config/dailyCheckInQuestions";

// Convert date object to YYYY-MM-DD format for database keys
const formatDateKey = (date) => date.toISOString().slice(0, 10);

export default function DailyCheckInScreen() {
  const navigation = useNavigation();
  const route = useRoute();

  const { showWarning, missedDays } = route.params || {};
  const [showAlert, setShowAlert] = useState(showWarning || false);

  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [responses, setResponses] = useState({});
  const [existingRecord, setExistingRecord] = useState(null);
  const [loadingExisting, setLoadingExisting] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [skipRedirectAfterSave, setSkipRedirectAfterSave] = useState(false);
  const [questionLayouts, setQuestionLayouts] = useState({});
  const [answeredCount, setAnsweredCount] = useState(0);
  const [focusedQuestionId, setFocusedQuestionId] = useState(null);
  const todayKey = useMemo(() => formatDateKey(new Date()), []);
  // User's first name for personalization
  const friendlyName = useMemo(
    () => (userData?.nickname ? userData.nickname.split(" ")[0] : "friend"),
    [userData?.nickname]
  );

  useEffect(() => {
    const currentUser = auth.currentUser;
    setUser(currentUser);
    if (!currentUser) return;

    const loadUserData = async () => {
      try {
        const userRef = doc(db, "users", currentUser.uid, "profile", "basic");
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setUserData(userSnap.data());
        }
      } catch (error) {
        console.error("Failed to load user data:", error);
      }
    };

    loadUserData();
  }, []);

  // Prepare personalized questions with user's name
  const questions = useMemo(
    () => getDailyQuestionsForUserType(userData?.userType, friendlyName),
    [friendlyName, userData?.userType]
  );

  // Load existing check-in record if already completed today
  useEffect(() => {
    if (!user?.uid) {
      setExistingRecord(null);
      setLoadingExisting(false);
      return;
    }
    let mounted = true;
    setLoadingExisting(true);
    const loadCheckIn = async () => {
      try {
        const checkInRef = doc(
          db,
          "users",
          user.uid,
          "dailyCheckIns",
          todayKey
        );
        const checkInSnap = await getDoc(checkInRef);
        if (!mounted) return;
        if (checkInSnap.exists()) {
          setExistingRecord(checkInSnap.data());
        }
      } catch (error) {
        console.error("Failed to fetch today's check-in", error);
        if (mounted) {
          Alert.alert(
            "Daily Check-In",
            "Unable to load today's answers. Please try again."
          );
        }
      } finally {
        if (mounted) {
          setLoadingExisting(false);
        }
      }
    };
    loadCheckIn();
    return () => {
      mounted = false;
    };
  }, [user?.uid, todayKey]);

  // Auto-redirect to dashboard if check-in already completed today
  useEffect(() => {
    if (!loadingExisting && existingRecord && !skipRedirectAfterSave) {
      navigation.replace("HomeDashboardScreen");
    }
  }, [loadingExisting, existingRecord, navigation, skipRedirectAfterSave]);

  const handleChange = useCallback((id, value) => {
    setResponses((prev) => ({ ...prev, [id]: value }));
  }, []);

  useEffect(() => {
    const count = questions.filter((q) => responses[q.id]?.trim()).length;
    setAnsweredCount(count);
  }, [questions, responses]);

  const handleInputFocus = useCallback(
    (questionId) => {
      const targetY = questionLayouts[questionId] ?? 0;
      if (scrollRef.current) {
        scrollRef.current.scrollTo({
          y: Math.max(targetY - 140, 0),
          animated: true,
        });
      }
    },
    [questionLayouts]
  );

  const scrollRef = React.useRef(null);

  const handleSubmit = useCallback(async () => {
    if (!user?.uid) {
      Alert.alert(
        "Daily Check-In",
        "Please sign in again to save your answers."
      );
      return;
    }
    // Validate all questions have been answered
    const unanswered = questions.filter((q) => !responses[q.id]?.trim());
    if (unanswered.length) {
      Alert.alert(
        "Daily Check-In",
        "Please answer all four questions before submitting."
      );
      return;
    }
    setSubmitting(true);
    try {
      const enrichedAnswers = await Promise.all(
        questions.map(async (question) => {
          const responseText = responses[question.id].trim();
          try {
            const prediction = await detectEmotion(responseText);
            return {
              questionId: question.id,
              featureKey: question.featureKey,
              question: question.prompt,
              response: responseText,
              emotion: prediction.emotion,
              confidence: prediction.confidence,
              keywords: prediction.keywords,
            };
          } catch (error) {
            console.warn("Emotion detection failed, storing as unknown", error);
            return {
              questionId: question.id,
              featureKey: question.featureKey,
              question: question.prompt,
              response: responseText,
              emotion: "unknown",
              confidence: 0,
              keywords: [],
            };
          }
        })
      );
      // Save enriched responses to Firestore
      const checkInRef = doc(db, "users", user.uid, "dailyCheckIns", todayKey);
      await setDoc(checkInRef, {
        answers: enrichedAnswers,
        timestamp: new Date().toISOString(),
        date: todayKey,
      });
      setExistingRecord({
        answers: enrichedAnswers,
        timestamp: new Date().toISOString(),
        date: todayKey,
      });
      setSkipRedirectAfterSave(true);
      setResponses({});
    } catch (error) {
      console.error("Unable to save daily check-in", error);
      Alert.alert(
        "Daily Check-In",
        "We could not save your answers. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }, [questions, responses, todayKey, user?.uid, navigation]);

  const hasCompletedToday = Boolean(existingRecord);

  if (!user) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.heading}>Daily Check-In</Text>
        <Text style={styles.bodyText}>
          Sign in to share how you feel today.
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.fullContainer}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 20}
    >
      {/* Header background decoration */}
      <View style={styles.headerBackground} />
      <View pointerEvents="none" style={styles.headerOrnaments}>
        <View style={styles.orbOne} />
        <View style={styles.orbTwo} />
        <View style={styles.orbThree} />
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        {/* Header Section */}
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.heroTitleBlock}>
              <Text style={styles.heading}>Daily Check-In</Text>
              <Text style={styles.subheading}>Share how you feel today</Text>
            </View>
            <View style={styles.datePill}>
              <Text style={styles.datePillText}>📅 {todayKey}</Text>
            </View>
          </View>
          <Text style={styles.heroHint}>
            A few honest lines can reveal patterns over time.
          </Text>
        </View>

        {!loadingExisting && !hasCompletedToday && (
          <View style={styles.progressCard}>
            <View style={styles.progressHeaderRow}>
              <Text style={styles.progressTitle}>Today's Progress</Text>
              <Text style={styles.progressCount}>{answeredCount}/4</Text>
            </View>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${(answeredCount / questions.length) * 100}%` },
                ]}
              />
            </View>
          </View>
        )}

        {/* Description Card */}
        <View style={styles.descriptionCard}>
          <Text style={styles.descriptionText}>
            Your responses help us understand your emotional patterns and
            provide personalized support.
          </Text>
        </View>

        {loadingExisting ? (
          <View style={styles.loadingBlock}>
            <ActivityIndicator size="large" color="#4F46E5" />
            <Text style={styles.loadingText}>Loading today's check-in...</Text>
          </View>
        ) : !hasCompletedToday ? (
          <>
            {questions.map((question, index) => (
              // Each question is measured to support keyboard-safe scrolling.
              <View
                key={question.id}
                onLayout={(event) => {
                  const { y } = event.nativeEvent.layout;
                  setQuestionLayouts((prev) => ({ ...prev, [question.id]: y }));
                }}
              >
                {(() => {
                  const hasAnswer = Boolean(responses[question.id]?.trim());
                  const isFocused = focusedQuestionId === question.id;
                  return (
                    <View style={styles.questionCard}>
                      <View
                        style={[
                          styles.questionNumberBadge,
                          hasAnswer && styles.questionNumberBadgeDone,
                        ]}
                      >
                        <Text
                          style={[
                            styles.questionNumber,
                            hasAnswer && styles.questionNumberDone,
                          ]}
                        >
                          {hasAnswer ? "✓" : index + 1}
                        </Text>
                      </View>
                      <Text style={styles.questionPrompt}>
                        {question.prompt}
                      </Text>
                      <TextInput
                        style={[
                          styles.input,
                          isFocused && styles.inputFocused,
                          hasAnswer && !isFocused && styles.inputDone,
                        ]}
                        multiline
                        textAlignVertical="top"
                        placeholder={question.placeholder}
                        placeholderTextColor="#9CA3AF"
                        value={responses[question.id] ?? ""}
                        onChangeText={(value) =>
                          handleChange(question.id, value)
                        }
                        onFocus={() => {
                          setFocusedQuestionId(question.id);
                          handleInputFocus(question.id);
                        }}
                        onBlur={() => setFocusedQuestionId(null)}
                      />
                    </View>
                  );
                })()}
              </View>
            ))}
            <TouchableOpacity
              style={[styles.submitButton, submitting && styles.disabledButton]}
              disabled={submitting}
              onPress={handleSubmit}
              activeOpacity={0.8}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitText}>Save Today’s Check-In</Text>
              )}
            </TouchableOpacity>
            <View style={styles.bottomSpacer} />
          </>
        ) : (
          // Show completion message if already done today
          <View style={styles.completedBanner}>
            <View style={styles.completedGlowOne} />
            <View style={styles.completedGlowTwo} />

            <View style={styles.completedBadge}>
              <Text style={styles.completedBadgeText}>TODAY DONE ✨</Text>
            </View>

            <Text style={styles.completedEmoji}>✅</Text>
            <Text style={styles.completedTitle}>Check-In Completed</Text>
            <Text style={styles.completedText}>
              Great work showing up for yourself today. Come back tomorrow to
              continue building your emotional pattern.
            </Text>

            <View style={styles.completedDateChip}>
              <Text style={styles.completedDateText}>
                📅 Logged on {todayKey}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.dashboardButton}
              onPress={() => navigation.navigate("HomeDashboardScreen")}
              activeOpacity={0.8}
            >
              <Text style={styles.dashboardButtonText}>Go to Dashboard</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Warning Modal */}
      <Modal transparent visible={showAlert} animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.alertContainer}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>⚠️</Text>
            </View>
            <Text style={styles.title}>Action Required</Text>

            {missedDays === -1 ? (
              <Text style={styles.message}>
                You haven't completed any daily check-ins yet!{"\n\n"}
                Start tracking your emotions today to stay on top of your
                wellness journey.
              </Text>
            ) : (
              <Text style={styles.message}>
                You haven't checked in for{" "}
                <Text style={styles.highlightText}>{missedDays} days</Text>!
                {"\n\n"}
                Please log your emotions to ensure your daily pattern stays up
                to date.
              </Text>
            )}

            <TouchableOpacity
              style={styles.alertButton}
              onPress={() => setShowAlert(false)}
            >
              <Text style={styles.alertButtonText}>Check In Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fullContainer: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  headerBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 260,
    backgroundColor: "#E0E7FF",
  },
  headerOrnaments: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 260,
    overflow: "hidden",
  },
  orbOne: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(79, 70, 229, 0.14)",
    top: -70,
    right: -70,
  },
  orbTwo: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(99, 102, 241, 0.16)",
    bottom: -90,
    left: -70,
  },
  orbThree: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(255, 255, 255, 0.55)",
    top: 40,
    left: 24,
  },
  container: {
    flexGrow: 1,
    paddingTop: 72,
    paddingHorizontal: 20,
    paddingBottom: 36,
  },
  centeredContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  heroCard: {
    marginBottom: 14,
    borderRadius: 18,
    padding: 16,
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    borderWidth: 1,
    borderColor: "rgba(229, 231, 235, 0.9)",
    shadowColor: "#111827",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  heroTitleBlock: {
    flex: 1,
    paddingRight: 4,
  },
  heading: {
    fontSize: 30,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 4,
  },
  subheading: {
    fontSize: 16,
    color: "#6B7280",
    marginBottom: 12,
  },
  datePill: {
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "#EEF2FF",
    borderWidth: 1,
    borderColor: "#E0E7FF",
  },
  datePillText: {
    fontSize: 12,
    color: "#374151",
    fontWeight: "700",
  },
  heroHint: {
    marginTop: 8,
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 18,
    fontWeight: "500",
  },
  progressCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  progressHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#374151",
  },
  progressCount: {
    fontSize: 13,
    fontWeight: "700",
    color: "#4F46E5",
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: "#E5E7EB",
    overflow: "hidden",
  },
  progressFill: {
    height: 8,
    borderRadius: 999,
    backgroundColor: "#4F46E5",
  },
  descriptionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 18,
    borderLeftWidth: 4,
    borderLeftColor: "#4F46E5",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  descriptionText: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
    fontWeight: "500",
  },
  loadingBlock: {
    paddingVertical: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6B7280",
    fontWeight: "500",
  },
  completedBanner: {
    position: "relative",
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    marginTop: 24,
    borderWidth: 1.5,
    borderColor: "#C7D2FE",
    shadowColor: "#4338CA",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 6,
  },
  completedGlowOne: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(99, 102, 241, 0.12)",
    top: -80,
    right: -70,
  },
  completedGlowTwo: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(167, 139, 250, 0.16)",
    bottom: -40,
    left: -30,
  },
  completedBadge: {
    backgroundColor: "#EEF2FF",
    borderColor: "#C7D2FE",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 10,
  },
  completedBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.7,
    color: "#4338CA",
  },
  completedEmoji: {
    fontSize: 52,
    marginBottom: 10,
  },
  completedTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 8,
  },
  completedText: {
    fontSize: 14.5,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 21,
    maxWidth: 290,
  },
  completedDateChip: {
    marginTop: 14,
    marginBottom: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  completedDateText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4B5563",
  },
  dashboardButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: "#4F46E5",
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  dashboardButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
    letterSpacing: 0.3,
  },
  questionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#EEF2FF",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  questionNumberBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E0E7FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  questionNumber: {
    fontSize: 14,
    fontWeight: "700",
    color: "#4F46E5",
  },
  questionNumberBadgeDone: {
    backgroundColor: "rgba(79, 70, 229, 0.12)",
  },
  questionNumberDone: {
    color: "#4F46E5",
  },
  questionPrompt: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
    lineHeight: 22,
  },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    padding: 12,
    minHeight: 100,
    fontSize: 15,
    backgroundColor: "#F8FAFC",
    color: "#111827",
    fontFamily: "System",
  },
  inputFocused: {
    borderColor: "#4F46E5",
    backgroundColor: "#FFFFFF",
  },
  inputDone: {
    borderColor: "#C7D2FE",
  },
  submitButton: {
    marginTop: 14,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    backgroundColor: "#4F46E5",
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
    letterSpacing: 0.3,
  },
  bottomSpacer: {
    height: 36,
  },
  bodyText: {
    fontSize: 15,
    color: "#4a4a4a",
  },

  // Modal styles
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  alertContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 30,
    width: "100%",
    maxWidth: 340,
    alignItems: "center",
    shadowColor: "#EA580C",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 2,
    borderColor: "#FFEDD5",
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#FFEDD5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  icon: {
    fontSize: 36,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#9A3412",
    marginBottom: 12,
    textAlign: "center",
  },
  message: {
    fontSize: 15,
    color: "#4B5563",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 28,
  },
  highlightText: {
    color: "#EA580C",
    fontWeight: "bold",
    fontSize: 16,
  },
  alertButton: {
    backgroundColor: "#EA580C",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
    shadowColor: "#EA580C",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  alertButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});
