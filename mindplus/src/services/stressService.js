import axios from 'axios';

const API_BASE_URL = 'http://192.168.1.2:8000';

/**
 * Analyze stress from transcribed voice text
 */
export async function analyzeStress(userId, text, audioUrl = null) {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/voice/analyze-stress`,
      {
        user_id: userId,
        text,
        audio_url: audioUrl
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000
      }
    );

    return response.data;

  } catch (error) {
    console.error('Stress analysis error:', error);

    if (error.response) {
      throw new Error(error.response.data?.detail || 'Analysis failed');
    } else if (error.request) {
      throw new Error('Backend not reachable');
    } else {
      throw new Error(error.message);
    }
  }
}

/**
 * Fetch stress history
 */
export async function getStressHistory(userId) {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/voice/stress-history/${userId}`,
      { timeout: 10000 }
    );

    return response.data.analyses || [];
  } catch (error) {
    console.error('History fetch failed:', error);
    return [];
  }
}

/**
 * Health check
 */
export async function checkBackendHealth() {
  try {
    const res = await axios.get(
      `${API_BASE_URL}/voice/health`,
      { timeout: 5000 }
    );
    return res.data.status === 'healthy';
  } catch {
    return false;
  }
}