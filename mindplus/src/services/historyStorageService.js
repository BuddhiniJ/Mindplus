import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

const HISTORY_KEY = 'stress_analysis_history';
const AUDIO_DIR = `${FileSystem.documentDirectory}voice_recordings/`;

// ------------------- AUDIO STORAGE -------------------

export async function initializeStorage() {
  const dirInfo = await FileSystem.getInfoAsync(AUDIO_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(AUDIO_DIR, { intermediates: true });
  }
}

/**
 * Save audio file to permanent storage
 */
export async function saveAudioFile(tempUri, userId) {
  await initializeStorage();
  const timestamp = Date.now();
  const filename = `recording_${userId}_${timestamp}.amr`;
  const permanentUri = `${AUDIO_DIR}${filename}`;

  await FileSystem.copyAsync({ from: tempUri, to: permanentUri });

  return { uri: permanentUri, filename, timestamp };
}

/**
 * Delete an audio file
 */
export async function deleteAudioFile(uri) {
  try {
    const info = await FileSystem.getInfoAsync(uri);
    if (info.exists) {
      await FileSystem.deleteAsync(uri);
    }
  } catch (err) {
    console.error('Failed to delete audio file:', err);
  }
}

// ------------------- HISTORY STORAGE -------------------

/**
 * Save analysis locally for a user
 */
export async function saveAnalysisLocally(analysis, userId) {
  try {
    const history = await getLocalHistory(userId);

    const newEntry = {
      id: `${userId}_${analysis.timestamp}`,
      userId,
      text: analysis.text || '',
      localAudioPath: analysis.localAudioPath || null,
      stress_scores: analysis.stress_scores || {},
      stress_levels: analysis.stress_levels || {},
      stressType: analysis.stressType || 'Unknown',
      total_stress_score: analysis.total_stress_score || 0,
      overall_level: analysis.overall_level || 'Low',
      confidence: analysis.confidence || 0,
      timestamp: analysis.timestamp || Date.now(),
    };

    history.unshift(newEntry); // newest first
    const trimmedHistory = history.slice(0, 100);

    await AsyncStorage.setItem(
      `${HISTORY_KEY}_${userId}`,
      JSON.stringify(trimmedHistory)
    );

    return newEntry;
  } catch (err) {
    console.error('Failed to save analysis:', err);
    throw err;
  }
}

/**
 * Get local history for a user
 */
export async function getLocalHistory(userId) {
  try {
    const data = await AsyncStorage.getItem(`${HISTORY_KEY}_${userId}`);
    if (!data) return [];
    let history = JSON.parse(data);
    if (!Array.isArray(history)) history = [];
    // filter by provided userId (defensive)
    history = history.filter(item => item.userId === userId);
    // Ensure timestamp is a Date object
    return history.map(item => ({
      ...item,
      timestamp: new Date(item.timestamp),
    }));
  } catch (err) {
    console.error('Failed to get local history:', err);
    return [];
  }
}

/**
 * Delete an entry for a user
 */
export async function deleteLocalAnalysis(userId, entryId) {
  const history = await getLocalHistory(userId);
  const filtered = history.filter(item => item.id !== entryId);
  await AsyncStorage.setItem(`${HISTORY_KEY}_${userId}`, JSON.stringify(filtered));
}

/**
 * Get statistics
 */
export async function getHistoryStats(userId) {
  const history = await getLocalHistory(userId);
  const stressTypes = { Academic: 0, Financial: 0, Social: 0, Emotional: 0 };

  history.forEach(item => {
    if (item.stressType && stressTypes[item.stressType] !== undefined) {
      stressTypes[item.stressType]++;
    }
  });

  const mostCommonType = Object.entries(stressTypes).reduce((a, b) => (a[1] > b[1] ? a : b))[0] || null;

  return {
    totalRecordings: history.length,
    stressTypes,
    mostCommonType,
    lastRecording: history[0]?.timestamp || null,
  };
}
