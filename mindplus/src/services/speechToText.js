import * as FileSystem from 'expo-file-system/legacy';
import axios from 'axios';

const GOOGLE_API_KEY = "AIzaSyAINIJxQsumJQw5ZxSO1P8_c9niNqc8-gY"; // ⚠️ Replace with your real Google Cloud API key

export async function speechToText(audioUri) {
  try {
    console.log('Reading audio file from:', audioUri);
    
    // Read audio file as base64
    const audioBase64 = await FileSystem.readAsStringAsync(audioUri, {
      encoding: 'base64',
    });

    console.log('Audio base64 length:', audioBase64.length);

    // Warn if audio is too short
    if (audioBase64.length < 10000) {
      console.warn('Audio file seems very small - recording might be too short');
    }

    // Send to Google Speech-to-Text API
    // HIGH_QUALITY preset uses AMR_WB encoding
    const response = await axios.post(
      `https://speech.googleapis.com/v1/speech:recognize?key=${GOOGLE_API_KEY}`,
      {
        config: {
          encoding: "AMR_WB", // For HIGH_QUALITY preset (M4A files)
          sampleRateHertz: 16000,
          languageCode: "en-US",
          enableAutomaticPunctuation: true,
          model: "default",
          useEnhanced: true, // Better accuracy
        },
        audio: {
          content: audioBase64,
        },
      },
      {
        timeout: 30000, // 30 second timeout
      }
    );

    console.log('API Response:', JSON.stringify(response.data, null, 2));

    // Check if any speech was detected
    if (!response.data.results || response.data.results.length === 0) {
      console.log('No speech detected in audio');
      return "No speech detected. Please speak louder and record for at least 3 seconds.";
    }

    // Extract transcript from all results
    const transcript = response.data.results
      .map(result => {
        const alternative = result.alternatives?.[0];
        if (alternative?.transcript) {
          console.log('Confidence:', alternative.confidence || 'N/A');
          return alternative.transcript;
        }
        return "";
      })
      .filter(Boolean)
      .join(" ")
      .trim();

    if (!transcript) {
      return "No speech detected. Please try again.";
    }

    return transcript;

  } catch (error) {
    console.error('Speech-to-text error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });

    // Handle specific error cases
    if (error.response?.status === 400) {
      throw new Error('Invalid audio format. Please try recording again.');
    } else if (error.response?.status === 403) {
      throw new Error('API key is invalid or Speech-to-Text API is not enabled.');
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('Request timed out. Please try again.');
    }

    throw new Error(
      error.response?.data?.error?.message || 
      'Speech recognition failed. Please try again.'
    );
  }
}