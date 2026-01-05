import AsyncStorage from '@react-native-async-storage/async-storage';

const HISTORY_KEY = 'stress_analysis_history';

/**
 * Save analysis to local storage
 * @param {object} analysis - Analysis data
 * @param {string} userId - User ID
 */
export async function saveAnalysisLocally(analysis, userId) {
  try {
    // Get existing history
    const history = await getLocalHistory(userId);
    
    // Create new entry
    const newEntry = {
      id: `${userId}_${analysis.timestamp}`,
      userId: userId,
      text: analysis.text,
      localAudioPath: analysis.localAudioPath,
      stress_scores: analysis.stress_scores,
      stress_levels: analysis.stress_levels,
      dominant_type: analysis.dominant_type,
      total_stress_score: analysis.total_stress_score,
      overall_level: analysis.overall_level,
      confidence: analysis.confidence,
      timestamp: analysis.timestamp,
      recordedAt: analysis.timestamp,
      analyzedAt: Date.now(),
      createdAt: Date.now()
    };
    
    // Add to beginning of array (newest first)
    history.unshift(newEntry);
    
    // Keep only last 100 entries
    const trimmedHistory = history.slice(0, 100);
    
    // Save back to storage
    await AsyncStorage.setItem(
      `${HISTORY_KEY}_${userId}`,
      JSON.stringify(trimmedHistory)
    );
    
    console.log('✅ Analysis saved to local storage');
    return newEntry;
    
  } catch (error) {
    console.error('Error saving analysis locally:', error);
    throw error;
  }
}

/**
 * Get history from local storage
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - Array of analysis records
 */
export async function getLocalHistory(userId) {
  try {
    const data = await AsyncStorage.getItem(`${HISTORY_KEY}_${userId}`);
    
    if (!data) {
      return [];
    }
    
    const history = JSON.parse(data);
    
    // Convert timestamp strings back to Date objects
    return history.map(item => ({
      ...item,
      timestamp: new Date(item.timestamp),
      recordedAt: new Date(item.recordedAt),
      analyzedAt: new Date(item.analyzedAt),
      createdAt: new Date(item.createdAt)
    }));
    
  } catch (error) {
    console.error('Error getting local history:', error);
    return [];
  }
}

/**
 * Update a specific analysis entry
 * @param {string} userId - User ID
 * @param {string} entryId - Entry ID
 * @param {object} updates - Fields to update
 */
export async function updateLocalAnalysis(userId, entryId, updates) {
  try {
    const history = await getLocalHistory(userId);
    
    const index = history.findIndex(item => item.id === entryId);
    
    if (index !== -1) {
      history[index] = { ...history[index], ...updates };
      
      await AsyncStorage.setItem(
        `${HISTORY_KEY}_${userId}`,
        JSON.stringify(history)
      );
      
      console.log('✅ Analysis updated in local storage');
    }
    
  } catch (error) {
    console.error('Error updating local analysis:', error);
  }
}

/**
 * Delete a specific analysis entry
 * @param {string} userId - User ID
 * @param {string} entryId - Entry ID
 */
export async function deleteLocalAnalysis(userId, entryId) {
  try {
    const history = await getLocalHistory(userId);
    
    const filtered = history.filter(item => item.id !== entryId);
    
    await AsyncStorage.setItem(
      `${HISTORY_KEY}_${userId}`,
      JSON.stringify(filtered)
    );
    
    console.log('✅ Analysis deleted from local storage');
    return true;
    
  } catch (error) {
    console.error('Error deleting local analysis:', error);
    return false;
  }
}

/**
 * Clear all history for a user
 * @param {string} userId - User ID
 */
export async function clearLocalHistory(userId) {
  try {
    await AsyncStorage.removeItem(`${HISTORY_KEY}_${userId}`);
    console.log('✅ Local history cleared');
    return true;
  } catch (error) {
    console.error('Error clearing local history:', error);
    return false;
  }
}

/**
 * Get history statistics
 * @param {string} userId - User ID
 * @returns {Promise<object>} - Statistics
 */
export async function getHistoryStats(userId) {
  try {
    const history = await getLocalHistory(userId);
    
    if (history.length === 0) {
      return {
        totalRecordings: 0,
        stressTypes: { Academic: 0, Financial: 0, Social: 0, Emotional: 0 },
        mostCommonType: null,
        lastRecording: null
      };
    }
    
    const stressTypes = { Academic: 0, Financial: 0, Social: 0, Emotional: 0 };
    
    history.forEach(item => {
      if (item.stressType && stressTypes.hasOwnProperty(item.stressType)) {
        stressTypes[item.stressType]++;
      }
    });
    
    // Find most common stress type
    const mostCommonType = Object.entries(stressTypes)
      .reduce((a, b) => a[1] > b[1] ? a : b)[0];
    
    return {
      totalRecordings: history.length,
      stressTypes: stressTypes,
      mostCommonType: mostCommonType,
      lastRecording: history[0]?.timestamp || null
    };
    
  } catch (error) {
    console.error('Error getting history stats:', error);
    return null;
  }
}

/**
 * Export history as JSON
 * @param {string} userId - User ID
 * @returns {Promise<string>} - JSON string
 */
export async function exportHistory(userId) {
  try {
    const history = await getLocalHistory(userId);
    return JSON.stringify(history, null, 2);
  } catch (error) {
    console.error('Error exporting history:', error);
    return null;
  }
}

/**
 * Sync local history with Firestore (optional backup)
 * @param {string} userId - User ID
 * @param {Array} firestoreHistory - History from Firestore
 */
export async function syncWithFirestore(userId, firestoreHistory) {
  try {
    const localHistory = await getLocalHistory(userId);
    
    // Merge: Keep local entries and add any missing from Firestore
    const localIds = new Set(localHistory.map(item => item.id));
    
    const missingFromLocal = firestoreHistory.filter(
      item => !localIds.has(item.id)
    );
    
    if (missingFromLocal.length > 0) {
      const merged = [...localHistory, ...missingFromLocal];
      
      // Sort by timestamp (newest first)
      merged.sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
      );
      
      // Keep only last 100
      const trimmed = merged.slice(0, 100);
      
      await AsyncStorage.setItem(
        `${HISTORY_KEY}_${userId}`,
        JSON.stringify(trimmed)
      );
      
      console.log(`✅ Synced ${missingFromLocal.length} entries from Firestore`);
    }
    
    return localHistory.length;
    
  } catch (error) {
    console.error('Error syncing with Firestore:', error);
  }
}