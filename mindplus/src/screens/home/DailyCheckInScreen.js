import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import { useAuth } from '@/contexts/AuthContext';
import { detectEmotion, getDailyCheckInForDate, saveDailyCheckIn } from '@/services/api';

const QUESTION_BLUEPRINTS = [
  {
    id: 'Mood-Check',
    text: (name) => `Hi ${name}, If you could describe your mood today in one sentence, what would it be?`,
    placeholder: 'I feel...',
  },
  {
    id: 'Academic-Stress',
    text: () => 'How do you feel about your academic workload right now?',
    placeholder: 'Share any specific stressors or challenges.',
  },
  {
    id: 'Motivation',
    text: () => 'Did you feel productive today? Why or why not?',
    placeholder: 'Reflect on what influenced your motivation.',
  },
  {
    id: 'Sleep',
    text: () => 'How rested does your mind feel today?',
    placeholder: 'Consider your sleep quality and duration.',
  },
];

const formatDateKey = (date) => date.toISOString().slice(0, 10);

export default function DailyCheckInScreen() {
  const { user, userData, refreshDailyCheckInStatus } = useAuth();
  const router = useRouter();
  const [responses, setResponses] = useState({});
  const [existingRecord, setExistingRecord] = useState(null);
  const [loadingExisting, setLoadingExisting] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const todayKey = useMemo(() => formatDateKey(new Date()), []);
  const friendlyName = useMemo(
    () => (userData?.name ? userData.name.split(' ')[0] : 'friend'),
    [userData?.name],
  );

  const questions = useMemo(
    () =>
      QUESTION_BLUEPRINTS.map((item) => ({
        id: item.id,
        prompt: item.text(friendlyName),
        placeholder: item.placeholder,
      })),
    [friendlyName],
  );

  useEffect(() => {
    if (!user?.uid) {
      setExistingRecord(null);
      setLoadingExisting(false);
      return;
    }
    let mounted = true;
    setLoadingExisting(true);
    getDailyCheckInForDate(user.uid, todayKey)
      .then((record) => {
        if (!mounted) return;
        setExistingRecord(record);
      })
      .catch((error) => {
        console.error("Failed to fetch today's check-in", error);
        if (mounted) {
          Alert.alert('Daily Check-In', "Unable to load today's answers. Please try again.");
        }
      })
      .finally(() => {
        if (mounted) {
          setLoadingExisting(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, [user?.uid, todayKey]);

  const handleChange = useCallback((id, value) => {
    setResponses((prev) => ({ ...prev, [id]: value }));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!user?.uid) {
      Alert.alert('Daily Check-In', 'Please sign in again to save your answers.');
      return;
    }
    const unanswered = questions.filter((q) => !responses[q.id]?.trim());
    if (unanswered.length) {
      Alert.alert('Daily Check-In', 'Please answer all four questions before submitting.');
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
            console.warn('Emotion detection failed, storing as unknown', error);
            return {
              questionId: question.id,
              question: question.prompt,
              response: responseText,
              emotion: 'unknown',
              confidence: 0,
              keywords: [],
            };
          }
        }),
      );
      await saveDailyCheckIn(user.uid, todayKey, enrichedAnswers);
      await refreshDailyCheckInStatus();
      setResponses({});
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Unable to save daily check-in', error);
      Alert.alert('Daily Check-In', 'We could not save your answers. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [questions, responses, todayKey, user?.uid, refreshDailyCheckInStatus, router]);

  const hasCompletedToday = Boolean(existingRecord);

  if (!user) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.heading}>Daily Check-In</Text>
        <Text style={styles.bodyText}>Sign in to share how you feel today.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Personalized Daily Check-In</Text>
      <Text style={styles.bodyText}>Share how you feel so we can personalize your support journey.</Text>
      <Text style={styles.dateText}>Today • {todayKey}</Text>

      {loadingExisting ? (
        <View style={styles.loadingBlock}>
          <ActivityIndicator size="small" />
        </View>
      ) : hasCompletedToday ? (
        <View style={styles.completeBanner}>
          <Text style={styles.completeTitle}>You have already completed today's check-in.</Text>
          <Text style={styles.completeSubtitle}>Thanks for staying consistent, {friendlyName}.</Text>
        </View>
      ) : (
        <>
          {questions.map((question) => (
            <View key={question.id} style={styles.questionCard}>
              <Text style={styles.questionPrompt}>{question.prompt}</Text>
              <TextInput
                style={styles.input}
                multiline
                textAlignVertical="top"
                placeholder={question.placeholder}
                value={responses[question.id] ?? ''}
                onChangeText={(value) => handleChange(question.id, value)}
              />
            </View>
          ))}
          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.disabledButton]}
            disabled={submitting}
            onPress={handleSubmit}
          >
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Save answers</Text>}
          </TouchableOpacity>
        </>
      )}

      {existingRecord && (
        <View style={styles.resultsCard}>
          <Text style={styles.sectionTitle}>You're all set for today!</Text>
          <Text style={styles.summaryText}>
            Thanks for checking in, {friendlyName}. Head over to your dashboard to review today's insights.
          </Text>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.replace('/(tabs)')}
          >
            <Text style={styles.secondaryButtonText}>Go to dashboard</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    gap: 16,
    backgroundColor: '#f7f8fc',
  },
  centeredContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  bodyText: {
    fontSize: 15,
    color: '#4a4a4a',
  },
  dateText: {
    fontSize: 13,
    color: '#787878',
  },
  loadingBlock: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  completeBanner: {
    padding: 16,
    backgroundColor: '#e4f6ef',
    borderRadius: 12,
  },
  completeTitle: {
    fontWeight: '600',
    fontSize: 16,
  },
  completeSubtitle: {
    marginTop: 4,
    color: '#3c6b59',
  },
  questionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    gap: 8,
  },
  questionPrompt: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1c1c1c',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 12,
    minHeight: 90,
    fontSize: 15,
    backgroundColor: '#fafafa',
  },
  submitButton: {
    marginTop: 8,
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#3b82f6',
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  resultsCard: {
    marginTop: 8,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  summaryText: {
    fontSize: 15,
    color: '#444',
  },
  secondaryButton: {
    marginTop: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#111827',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
