import * as FileSystem from 'expo-file-system/legacy';

// Directory for permanent audio storage
const AUDIO_DIR = `${FileSystem.documentDirectory}voice_recordings/`;

/**
 * Initialize audio storage directory
 */
export async function initializeStorage() {
  try {
    const dirInfo = await FileSystem.getInfoAsync(AUDIO_DIR);
    
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(AUDIO_DIR, { intermediates: true });
      console.log('✅ Audio directory created:', AUDIO_DIR);
    }
  } catch (error) {
    console.error('Error initializing storage:', error);
  }
}

/**
 * Save audio file to permanent storage
 * @param {string} tempUri - Temporary file URI from recording
 * @param {string} userId - User ID
 * @returns {Promise<object>} - File info with permanent path
 */
export async function saveAudioFile(tempUri, userId) {
  try {
    await initializeStorage();
    
    // Create filename with timestamp
    const timestamp = Date.now();
    const filename = `recording_${userId}_${timestamp}.amr`;
    const permanentUri = `${AUDIO_DIR}${filename}`;
    
    // Copy from temp to permanent storage
    await FileSystem.copyAsync({
      from: tempUri,
      to: permanentUri
    });
    
    // Get file info
    const fileInfo = await FileSystem.getInfoAsync(permanentUri);
    
    console.log('✅ Audio saved permanently:', permanentUri);
    console.log('📊 File size:', fileInfo.size, 'bytes');
    
    return {
      uri: permanentUri,
      filename: filename,
      size: fileInfo.size,
      timestamp: timestamp
    };
    
  } catch (error) {
    console.error('Error saving audio file:', error);
    throw new Error('Failed to save audio file');
  }
}

/**
 * Check if audio file exists
 * @param {string} uri - File URI
 * @returns {Promise<boolean>}
 */
export async function audioFileExists(uri) {
  try {
    const fileInfo = await FileSystem.getInfoAsync(uri);
    return fileInfo.exists;
  } catch (error) {
    return false;
  }
}

/**
 * Delete audio file
 * @param {string} uri - File URI
 */
export async function deleteAudioFile(uri) {
  try {
    const exists = await audioFileExists(uri);
    if (exists) {
      await FileSystem.deleteAsync(uri);
      console.log('🗑️ Audio file deleted:', uri);
    }
  } catch (error) {
    console.error('Error deleting audio file:', error);
  }
}

/**
 * Get all stored audio files
 * @returns {Promise<Array>} - List of audio files
 */
export async function getAllAudioFiles() {
  try {
    await initializeStorage();
    const files = await FileSystem.readDirectoryAsync(AUDIO_DIR);
    
    const fileList = await Promise.all(
      files.map(async (filename) => {
        const uri = `${AUDIO_DIR}${filename}`;
        const info = await FileSystem.getInfoAsync(uri);
        return {
          filename,
          uri,
          size: info.size,
          modificationTime: info.modificationTime
        };
      })
    );
    
    return fileList;
  } catch (error) {
    console.error('Error getting audio files:', error);
    return [];
  }
}

/**
 * Get storage usage statistics
 * @returns {Promise<object>}
 */
export async function getStorageStats() {
  try {
    const files = await getAllAudioFiles();
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    const totalCount = files.length;
    
    return {
      totalFiles: totalCount,
      totalSize: totalSize,
      totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
      directory: AUDIO_DIR
    };
  } catch (error) {
    console.error('Error getting storage stats:', error);
    return { totalFiles: 0, totalSize: 0, totalSizeMB: '0' };
  }
}

/**
 * Clear old audio files (keep last N files)
 * @param {number} keepCount - Number of recent files to keep
 */
export async function clearOldAudioFiles(keepCount = 20) {
  try {
    const files = await getAllAudioFiles();
    
    // Sort by modification time (newest first)
    files.sort((a, b) => b.modificationTime - a.modificationTime);
    
    // Delete files beyond keepCount
    const filesToDelete = files.slice(keepCount);
    
    for (const file of filesToDelete) {
      await deleteAudioFile(file.uri);
    }
    
    console.log(`🗑️ Deleted ${filesToDelete.length} old audio files`);
    return filesToDelete.length;
    
  } catch (error) {
    console.error('Error clearing old files:', error);
    return 0;
  }
}