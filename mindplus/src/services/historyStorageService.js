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
    console.log('[saveAnalysisLocally] 💾 Saving analysis');
    console.log('[saveAnalysisLocally] 👤 User ID:', userId);
    console.log('[saveAnalysisLocally] ⏰ Timestamp:', analysis.timestamp);
    console.log('[saveAnalysisLocally] 🎯 Stress type:', analysis.stressType);
    
    const history = await getLocalHistory(userId);
    console.log('[saveAnalysisLocally] 📚 Current history length:', history.length);

    const newEntry = {
      id: `${userId}_${analysis.timestamp}`,
      userId,
      text: analysis.text || '',
      localAudioPath: analysis.localAudioPath || null,
      stress_scores: analysis.stress_scores || {},
      keyword_counts: analysis.keyword_counts || {},
      stressType: analysis.stressType || 'Unknown',
      dominant_score: analysis.dominant_score || 0,
      total_stress_score: analysis.total_stress_score || 0,
      overall_score: analysis.overall_score || 0,
      confidence: analysis.confidence || 0,
      timestamp: analysis.timestamp || Date.now(),
    };

    console.log('[saveAnalysisLocally] 📝 New entry created:', newEntry.id);
    
    history.unshift(newEntry); // newest first
    const trimmedHistory = history.slice(0, 100);

    const storageKey = `${HISTORY_KEY}_${userId}`;
    console.log('[saveAnalysisLocally] 🔑 Storage key:', storageKey);
    console.log('[saveAnalysisLocally] 📊 Will save:', trimmedHistory.length, 'records');
    
    const jsonString = JSON.stringify(trimmedHistory);
    console.log('[saveAnalysisLocally] 📦 Serialized size:', jsonString.length, 'bytes');
    
    await AsyncStorage.setItem(storageKey, jsonString);
    
    // Verify it was saved
    const verify = await AsyncStorage.getItem(storageKey);
    console.log('[saveAnalysisLocally] ✅ Save verified:', !!verify, 'bytes:', verify ? verify.length : 0);
    
    return newEntry;
  } catch (err) {
    console.error('[saveAnalysisLocally] ❌ Error:', err);
    throw err;
  }
}

/**
 * Get local history for a user
 */
export async function getLocalHistory(userId) {
  try {
    const storageKey = `${HISTORY_KEY}_${userId}`;
    console.log('[getLocalHistory] 🔑 Storage key:', storageKey);
    console.log('[getLocalHistory] 👤 UserId:', userId);
    
    const data = await AsyncStorage.getItem(storageKey);
    console.log('[getLocalHistory] 📦 Raw data exists:', !!data);
    console.log('[getLocalHistory] 📦 Raw data length:', data ? data.length : 0);
    
    if (!data) {
      console.log('[getLocalHistory] ✅ No data found for key:', storageKey);
      
      // Debug: Log all keys to help troubleshoot
      try {
        const allKeys = await AsyncStorage.getAllKeys();
        const relevantKeys = allKeys.filter(k => k.includes('stress_analysis') || k.includes(userId));
        console.log('[getLocalHistory] 🔍 Relevant keys:', relevantKeys);
      } catch (e) {
        console.log('[getLocalHistory] 🔍 Error listing keys:', e);
      }
      
      return [];
    }
    
    let history = JSON.parse(data);
    console.log('[getLocalHistory] 📊 Parsed history array length:', Array.isArray(history) ? history.length : 'not an array');
    
    if (!Array.isArray(history)) {
      console.log('[getLocalHistory] ⚠️ History is not an array, converting to empty');
      history = [];
    }
    
    // filter by provided userId (defensive)
    const beforeFilter = history.length;
    history = history.filter(item => item.userId === userId);
    console.log('[getLocalHistory] 🔄 After userId filter:', beforeFilter, '->', history.length);
    
    // Ensure timestamp is a Date object
    const processedHistory = history.map(item => ({
      ...item,
      timestamp: new Date(item.timestamp),
    }));
    
    console.log('[getLocalHistory] ✅ Final processed history:', processedHistory.length, 'items');
    return processedHistory;
  } catch (err) {
    console.error('[getLocalHistory] ❌ Error:', err);
    return [];
  }
}


/**
 * Migrate history from an old user ID to a new one. This is useful when
 * an anonymous Firebase sign-in generates a UID after the app has already
 * recorded entries under a temporary local ID. We merge any existing
 * entries and then delete the old key.
 */
export async function migrateHistory(oldUserId, newUserId) {
  if (!oldUserId || !newUserId || oldUserId === newUserId) return;

  try {
    const oldHistory = await getLocalHistory(oldUserId);
    if (oldHistory.length === 0) return;

    const newHistory = await getLocalHistory(newUserId);
    // combine and dedupe by entry id
    const combined = [...oldHistory, ...newHistory];
    const seen = new Set();
    const deduped = combined.filter(entry => {
      if (seen.has(entry.id)) return false;
      seen.add(entry.id);
      return true;
    });

    await AsyncStorage.setItem(
      `${HISTORY_KEY}_${newUserId}`,
      JSON.stringify(deduped)
    );
    // remove old key
    await AsyncStorage.removeItem(`${HISTORY_KEY}_${oldUserId}`);
    console.log(`✅ Migrated history from ${oldUserId} to ${newUserId}`);
  } catch (err) {
    console.error('History migration failed:', err);
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
