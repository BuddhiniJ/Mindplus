import * as FileSystem from 'expo-file-system/legacy';

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
    } else {
      console.log('✅ Audio directory exists:', AUDIO_DIR);
    }
  } catch (error) {
    console.error('❌ Error initializing storage:', error);
  }
}

/**
 * Save audio file to permanent storage
 */
export async function saveAudioFile(tempUri, userId) {
  try {
    await initializeStorage();
    
    const timestamp = Date.now();
    const filename = `recording_${userId}_${timestamp}.amr`;
    const permanentUri = `${AUDIO_DIR}${filename}`;
    
    console.log('📁 Saving audio...');
    console.log('From:', tempUri);
    console.log('To:', permanentUri);
    
    // Copy from temp to permanent storage
    await FileSystem.copyAsync({
      from: tempUri,
      to: permanentUri,
    });
    
    // Verify file exists
    const fileInfo = await FileSystem.getInfoAsync(permanentUri);
    
    if (!fileInfo.exists) {
      throw new Error('File was not saved properly');
    }
    
    console.log('✅ Audio saved successfully');
    console.log('Size:', fileInfo.size, 'bytes');
    
    return {
      uri: permanentUri,
      filename: filename,
      size: fileInfo.size,
      timestamp: timestamp,
    };
    
  } catch (error) {
    console.error('❌ Error saving audio file:', error);
    throw new Error('Failed to save audio file: ' + error.message);
  }
}

/**
 * Check if audio file exists
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
 */
export async function deleteAudioFile(uri) {
  try {
    const exists = await audioFileExists(uri);
    if (exists) {
      await FileSystem.deleteAsync(uri);
      console.log('🗑️ Audio file deleted:', uri);
    } else {
      console.log('⚠️ Audio file does not exist:', uri);
    }
  } catch (error) {
    console.error('❌ Error deleting audio file:', error);
  }
}

/**
 * Get all stored audio files
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
          modificationTime: info.modificationTime,
        };
      })
    );
    
    return fileList;
  } catch (error) {
    console.error('❌ Error getting audio files:', error);
    return [];
  }
}

/**
 * Get storage usage statistics
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
      directory: AUDIO_DIR,
    };
  } catch (error) {
    console.error('❌ Error getting storage stats:', error);
    return { totalFiles: 0, totalSize: 0, totalSizeMB: '0' };
  }
}