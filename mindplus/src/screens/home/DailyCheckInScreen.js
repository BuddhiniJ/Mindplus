import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { auth, db } from "../../firebase/firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";

import { detectEmotion } from "../../services/api";

const QUESTION_BLUEPRINTS = [
  {
    id: "Mood-Check",
    text: (name) =>
      `Hi ${name}, If you could describe your mood today in one sentence, what would it be?`,
    placeholder: "I feel...",
  },
  {
    id: "Academic-Stress",
    text: () => "How do you feel about your academic workload right now?",
    placeholder: "Share any specific stressors or challenges.",
  },
  {
    id: "Motivation",
    text: () => "Did you feel productive today? Why or why not?",
    placeholder: "Reflect on what influenced your motivation.",
  },
  {
    id: "Sleep",
    text: () => "How rested does your mind feel today?",
    placeholder: "Consider your sleep quality and duration.",
  },
];

const formatDateKey = (date) => date.toISOString().slice(0, 10);

export default function DailyCheckInScreen() {
  const navigation = useNavigation();
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [responses, setResponses] = useState({});
  const [existingRecord, setExistingRecord] = useState(null);
  const [loadingExisting, setLoadingExisting] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const todayKey = useMemo(() => formatDateKey(new Date()), []);
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

  const questions = useMemo(
    () =>
      QUESTION_BLUEPRINTS.map((item) => ({
        id: item.id,
        prompt: item.text(friendlyName),
        placeholder: item.placeholder,
      })),
    [friendlyName]
  );

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

  useEffect(() => {
    if (!loadingExisting && existingRecord) {
      navigation.replace("HomeDashboardScreen");
    }
  }, [loadingExisting, existingRecord, navigation]);

  const handleChange = useCallback((id, value) => {
    setResponses((prev) => ({ ...prev, [id]: value }));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!user?.uid) {
      Alert.alert(
        "Daily Check-In",
        "Please sign in again to save your answers."
      );
      return;
    }
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
              question: question.prompt,
              response: responseText,
              emotion: "unknown",
              confidence: 0,
              keywords: [],
            };
          }
        })
      );
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
    <View style={styles.fullContainer}>
      {/* Header Background */}
      <View style={styles.headerBackground} />

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.headerSection}>
          <Text style={styles.heading}>Daily Check-In</Text>
          <Text style={styles.subheading}>Share how you feel today</Text>
          <Text style={styles.dateText}>📅 {todayKey}</Text>
        </View>

        {/* Description Card */}
        <View style={styles.descriptionCard}>
          <Text style={styles.descriptionText}>
            Your responses help us understand your emotional patterns and
            provide personalized support.
          </Text>
        </View>

        {loadingExisting ? (
          <View style={styles.loadingBlock}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>Loading today's check-in...</Text>
          </View>
        ) : !hasCompletedToday ? (
          <>
            {questions.map((question, index) => (
              <View key={question.id}>
                <View style={styles.questionCard}>
                  <View style={styles.questionNumberBadge}>
                    <Text style={styles.questionNumber}>{index + 1}</Text>
                  </View>
                  <Text style={styles.questionPrompt}>{question.prompt}</Text>
                  <TextInput
                    style={styles.input}
                    multiline
                    textAlignVertical="top"
                    placeholder={question.placeholder}
                    placeholderTextColor="#9CA3AF"
                    value={responses[question.id] ?? ""}
                    onChangeText={(value) => handleChange(question.id, value)}
                  />
                </View>
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
                <Text style={styles.submitText}>Save Answers</Text>
              )}
            </TouchableOpacity>
            <View style={styles.bottomSpacer} />
          </>
        ) : (
          <View style={styles.completedBanner}>
            <Text style={styles.completedEmoji}>✅</Text>
            <Text style={styles.completedTitle}>Already Completed</Text>
            <Text style={styles.completedText}>
              You've already completed today's check-in. Come back tomorrow to
              share again!
            </Text>
            <TouchableOpacity
              style={styles.dashboardButton}
              onPress={() => navigation.navigate("HomeDashboardScreen")}
              activeOpacity={0.8}
            >
              <Text style={styles.dashboardButtonText}>View Dashboard</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
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
    height: 220,
    backgroundColor: "#EEF2FF",
  },
  container: {
    flexGrow: 1,
    paddingTop: 80,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  centeredContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  headerSection: {
    marginBottom: 24,
    paddingBottom: 16,
  },
  heading: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  subheading: {
    fontSize: 16,
    color: "#6B7280",
    marginBottom: 12,
  },
  dateText: {
    fontSize: 14,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  descriptionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: "#3B82F6",
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
    paddingVertical: 60,
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
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginTop: 24,
    borderWidth: 1,
    borderColor: "#D1FAE5",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  completedEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  completedTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  completedText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
  },
  dashboardButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: "#3B82F6",
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#3B82F6",
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
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  questionNumberBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  questionNumber: {
    fontSize: 14,
    fontWeight: "700",
    color: "#3B82F6",
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
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 12,
    minHeight: 100,
    fontSize: 15,
    backgroundColor: "#F9FAFB",
    color: "#111827",
    fontFamily: "System",
  },
  submitButton: {
    marginTop: 24,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    backgroundColor: "#3B82F6",
    shadowColor: "#3B82F6",
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
    height: 20,
  },
  bodyText: {
    fontSize: 15,
    color: "#4a4a4a",
  },
  loadingBlock: {
    paddingVertical: 32,
    alignItems: "center",
  },
  completeBanner: {
    padding: 16,
    backgroundColor: "#e4f6ef",
    borderRadius: 12,
  },
  completeTitle: {
    fontWeight: "600",
    fontSize: 16,
  },
  completeSubtitle: {
    marginTop: 4,
    color: "#3c6b59",
  },
  resultsCard: {
    marginTop: 8,
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 16,
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  summaryText: {
    fontSize: 15,
    color: "#444",
  },
  secondaryButton: {
    marginTop: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#111827",
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
});
