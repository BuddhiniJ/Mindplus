import * as FileSystem from 'expo-file-system/legacy';

const BASE_AUDIO_DIR = `${FileSystem.documentDirectory}voice_recordings/`;

// ------------------- HELPERS -------------------

/**
 * Returns the audio directory path scoped to a specific user.
 * Structure: voice_recordings/{userId}/
 */
function getUserAudioDir(userId) {
  if (!userId) throw new Error('userId is required to resolve audio directory');
  return `${BASE_AUDIO_DIR}${userId}/`;
}

// ------------------- INITIALIZATION -------------------

/**
 * Initialize the base audio directory (call on app start).
 */
export async function initializeStorage() {
  try {
    const dirInfo = await FileSystem.getInfoAsync(BASE_AUDIO_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(BASE_AUDIO_DIR, { intermediates: true });
      console.log('✅ Base audio directory created:', BASE_AUDIO_DIR);
    } else {
      console.log('✅ Base audio directory exists:', BASE_AUDIO_DIR);
    }
  } catch (error) {
    console.error('❌ Error initializing base storage:', error);
    throw error;
  }
}

/**
 * Initialize a per-user audio directory.
 * Must be called before saving any file for that user.
 */
async function initializeUserStorage(userId) {
  const userDir = getUserAudioDir(userId);
  try {
    const dirInfo = await FileSystem.getInfoAsync(userDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(userDir, { intermediates: true });
      console.log(`✅ User audio directory created for ${userId}:`, userDir);
    }
    return userDir;
  } catch (error) {
    console.error(`❌ Error initializing user storage for ${userId}:`, error);
    throw error;
  }
}

// ------------------- AUDIO FILE OPERATIONS -------------------

/**
 * Save a voice recording to the user's private directory.
 *
 * @param {string} tempUri  - Temporary URI returned by expo-av after recording
 * @param {string} userId   - Firebase Auth UID (from auth.currentUser.uid)
 * @returns {{ uri, filename, size, timestamp }}
 */
export async function saveAudioFile(tempUri, userId) {
  if (!userId) throw new Error('userId is required to save an audio file');
  if (!tempUri) throw new Error('tempUri is required to save an audio file');

  try {
    const userDir = await initializeUserStorage(userId);

    const timestamp = Date.now();
    const filename = `recording_${userId}_${timestamp}.amr`;
    const permanentUri = `${userDir}${filename}`;

    console.log(`📁 Saving audio for user ${userId}...`);
    console.log('  From:', tempUri);
    console.log('  To  :', permanentUri);

    await FileSystem.copyAsync({ from: tempUri, to: permanentUri });

    const fileInfo = await FileSystem.getInfoAsync(permanentUri);
    if (!fileInfo.exists) {
      throw new Error('File was not saved properly — destination does not exist after copy.');
    }

    console.log(`✅ Audio saved (${fileInfo.size} bytes)`);
    return {
      uri: permanentUri,
      filename,
      size: fileInfo.size,
      timestamp,
    };
  } catch (error) {
    console.error('❌ Error saving audio file:', error);
    throw new Error('Failed to save audio file: ' + error.message);
  }
}

/**
 * Check whether a saved audio file still exists on disk.
 *
 * @param {string} uri
 * @returns {boolean}
 */
export async function audioFileExists(uri) {
  try {
    const fileInfo = await FileSystem.getInfoAsync(uri);
    return fileInfo.exists;
  } catch {
    return false;
  }
}

/**
 * Delete a saved audio file.
 *
 * @param {string} uri
 */
export async function deleteAudioFile(uri) {
  try {
    if (await audioFileExists(uri)) {
      await FileSystem.deleteAsync(uri);
      console.log('🗑️ Audio file deleted:', uri);
    } else {
      console.warn('⚠️ Audio file does not exist, nothing to delete:', uri);
    }
  } catch (error) {
    console.error('❌ Error deleting audio file:', error);
  }
}

// ------------------- PER-USER LISTING & STATS -------------------

/**
 * Get all audio files stored for a specific user.
 *
 * @param {string} userId - Firebase Auth UID
 * @returns {Array<{ filename, uri, size, modificationTime }>}
 */
export async function getUserAudioFiles(userId) {
  if (!userId) return [];

  try {
    const userDir = await initializeUserStorage(userId);
    const files = await FileSystem.readDirectoryAsync(userDir);

    const fileList = await Promise.all(
      files.map(async (filename) => {
        const uri = `${userDir}${filename}`;
        const info = await FileSystem.getInfoAsync(uri);
        return {
          filename,
          uri,
          size: info.size ?? 0,
          modificationTime: info.modificationTime ?? null,
        };
      })
    );

    // Newest first
    return fileList.sort((a, b) => (b.modificationTime ?? 0) - (a.modificationTime ?? 0));
  } catch (error) {
    console.error(`❌ Error listing audio files for user ${userId}:`, error);
    return [];
  }
}

/**
 * Get storage usage statistics for a specific user.
 *
 * @param {string} userId - Firebase Auth UID
 * @returns {{ totalFiles, totalSize, totalSizeMB, directory }}
 */
export async function getUserStorageStats(userId) {
  try {
    const files = await getUserAudioFiles(userId);
    const totalSize = files.reduce((sum, f) => sum + (f.size ?? 0), 0);

    return {
      totalFiles: files.length,
      totalSize,
      totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
      directory: getUserAudioDir(userId),
    };
  } catch (error) {
    console.error('❌ Error getting storage stats:', error);
    return { totalFiles: 0, totalSize: 0, totalSizeMB: '0', directory: null };
  }
}

/**
 * Delete ALL audio files for a specific user (e.g. on account deletion / log-out wipe).
 *
 * @param {string} userId - Firebase Auth UID
 */
export async function deleteAllUserAudio(userId) {
  if (!userId) return;
  try {
    const userDir = getUserAudioDir(userId);
    const dirInfo = await FileSystem.getInfoAsync(userDir);
    if (dirInfo.exists) {
      await FileSystem.deleteAsync(userDir, { idempotent: true });
      console.log(`🗑️ Deleted all audio for user ${userId}`);
    }
  } catch (error) {
    console.error(`❌ Error deleting all audio for user ${userId}:`, error);
  }
}