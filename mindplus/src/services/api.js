import { addDoc, collection, getDocs, limit, query, serverTimestamp, where } from 'firebase/firestore';
import { Platform } from 'react-native';

import { db } from '../firebase/firebaseConfig';

const DAILY_CHECK_INS_COLLECTION = 'dailyCheckIns';

// Replace with your backend base URL; use LAN IP for devices/emulators
const RAW_EMOTION_SERVICE_URL = 'http://192.168.56.1:8001';

function normalizeEmotionServiceUrl(url) {
  if (!url) return '';
  const trimmed = url.replace(/\/$/, '');
  if (Platform.OS !== 'android') {
    return trimmed;
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.hostname === '127.0.0.1' || parsed.hostname === 'localhost') {
      parsed.hostname = '10.0.2.2';
      return parsed.toString().replace(/\/$/, '');
    }
  } catch {
    return trimmed
      .replace('127.0.0.1', '10.0.2.2')
      .replace('localhost', '10.0.2.2');
  }
  return trimmed;
}

const EMOTION_SERVICE_URL = normalizeEmotionServiceUrl(RAW_EMOTION_SERVICE_URL);

function ensureEmotionServiceUrl() {
  if (!EMOTION_SERVICE_URL) {
    throw new Error('Emotion service URL is not configured. Set EXPO_PUBLIC_EMOTION_SERVICE_URL.');
  }
  return EMOTION_SERVICE_URL;
}

function sanitizeAnswers(answers) {
  return answers.map((answer) => ({
    ...answer,
    emotion: answer.emotion || 'unknown',
    confidence: Number.isFinite(answer.confidence) ? answer.confidence : 0,
    keywords: Array.isArray(answer.keywords) ? answer.keywords : [],
  }));
}

function deriveSummaryStats(answers) {
  const tally = new Map();
  answers.forEach((answer) => {
    const emotion = answer.emotion || 'unknown';
    const confidence = Number.isFinite(answer.confidence) ? answer.confidence : 0;
    const existing = tally.get(emotion) ?? { score: 0, contributions: [] };
    existing.score += confidence;
    existing.contributions.push(confidence);
    tally.set(emotion, existing);
  });
  if (!tally.size) {
    return { emotion: 'unknown', confidence: 0 };
  }
  let winner = 'unknown';
  let bestScore = -1;
  tally.forEach((value, emotion) => {
    if (value.score > bestScore) {
      winner = emotion;
      bestScore = value.score;
    }
  });
  const winnerStats = tally.get(winner);
  const averageConfidence = winnerStats && winnerStats.contributions.length
    ? winnerStats.score / winnerStats.contributions.length
    : 0;
  return { emotion: winner, confidence: averageConfidence };
}

export async function detectEmotion(text) {
  const baseUrl = ensureEmotionServiceUrl();
  const payload = { text };
  const response = await fetch(`${baseUrl}/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`Emotion service error: ${response.status}`);
  }
  const data = await response.json();
  return {
    emotion: data.emotion ?? 'unknown',
    confidence: data.confidence ?? 0,
    keywords: data.keywords ?? [],
    model: data.model,
  };
}

export async function fetchCopingStrategy(emotion, confidence) {
  const baseUrl = ensureEmotionServiceUrl();
  const payload = { emotion, confidence };
  const response = await fetch(`${baseUrl}/coping-strategy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`Coping strategy service error: ${response.status}`);
  }
  const data = await response.json();
  return {
    emotion: data.emotion ?? emotion,
    confidence: Number.isFinite(data.confidence) ? data.confidence : confidence,
    severity: data.severity ?? 'low',
    strategy: data.strategy ?? null,
  };
}

export async function saveDailyCheckIn(userId, dateKey, answers) {
  const normalizedAnswers = sanitizeAnswers(answers);
  const summary = deriveSummaryStats(normalizedAnswers);
  const payload = {
    userId,
    dateKey,
    answers: normalizedAnswers,
    summaryEmotion: summary.emotion,
    summaryConfidence: summary.confidence,
    submittedAt: serverTimestamp(),
  };
  const ref = await addDoc(collection(db, DAILY_CHECK_INS_COLLECTION), payload);
  return ref.id;
}

export async function getDailyCheckInForDate(userId, dateKey) {
  const ref = collection(db, DAILY_CHECK_INS_COLLECTION);
  const checkInQuery = query(ref, where('userId', '==', userId), where('dateKey', '==', dateKey), limit(1));
  const snapshot = await getDocs(checkInQuery);
  if (snapshot.empty) {
    return null;
  }
  const doc = snapshot.docs[0];
  const data = doc.data();
  const submittedAt = data.submittedAt?.toDate ? data.submittedAt.toDate() : null;
  return {
    id: doc.id,
    userId: data.userId,
    dateKey: data.dateKey,
    answers: sanitizeAnswers(data.answers ?? []),
    summaryEmotion: data.summaryEmotion ?? 'unknown',
    summaryConfidence: Number.isFinite(data.summaryConfidence) ? data.summaryConfidence : 0,
    submittedAt,
  };
}
