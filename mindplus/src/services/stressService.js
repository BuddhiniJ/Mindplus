import { API_BASE_URL } from "../config/api.js";


const BACKEND_URL =  `${API_BASE_URL}`; // Replace with your backend URL

/**
 * Analyze stress using backend API
 */
export async function analyzeStress(userId, text, audioUrl) {
  try {
    console.log('📡 Sending request to backend...');
    console.log('URL:', `${BACKEND_URL}/voice/analyze-stress`);
    
    const response = await fetch(`${BACKEND_URL}/voice/analyze-stress`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        text: text,
        audio_url: audioUrl,
      }),
      timeout: 10000, // 10 second timeout
    });

    if (!response.ok) {
      throw new Error(`Backend error: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Backend response:', data);

    // Normalize response: backend returns string levels, we need to ensure consistency
    const normalizedLevels = {};
    Object.keys(data.stress_levels || {}).forEach(type => {
      normalizedLevels[type] = data.stress_levels[type]; // Keep as string ("Low", "Moderate", "High")
    });

    return {
      stress_scores: data.stress_scores || {},
      stress_levels: normalizedLevels, // String levels from backend
      dominant_type: data.dominant_type || 'Emotional',
      total_stress_score: data.total_stress_score || 0,
      overall_level: data.overall_level || 'Low', // Backend returns string level
      confidence: data.confidence || 0.5,
    };

  } catch (error) {
    console.log('⚠️ Backend not reachable, using local analysis:', error.message);
    
    // Fallback to local keyword-based analysis
    return analyzeStressLocally(text);
  }
}

/**
 * Local fallback stress analysis (keyword-based)
 */
function analyzeStressLocally(text) {
  console.log('🔍 Running local stress analysis...');
  
  const textLower = text.toLowerCase();
  
  // Initialize scores
  const scores = {
    Academic: 0.0,
    Financial: 0.0,
    Social: 0.0,
    Emotional: 0.0,
  };

  // Academic keywords
  const academicKeywords = ['exam', 'test', 'study', 'studies', 'homework', 'grade', 'school', 'college', 'university', 'assignment', 'deadline', 'project', 'academic', 'class', 'course', 'learning'];
  const academicCount = academicKeywords.filter(word => textLower.includes(word)).length;
  scores.Academic = Math.min(1.0, academicCount * 0.20);

  // Financial keywords
  const financialKeywords = ['money', 'debt', 'bill', 'pay', 'payment', 'payments', 'cost', 'expensive', 'afford', 'budget', 'financial', 'financially', 'income', 'rent', 'loan', 'credit', 'broke', 'poor'];
  const financialCount = financialKeywords.filter(word => textLower.includes(word)).length;
  scores.Financial = Math.min(1.0, financialCount * 0.20);

  // Social keywords
  const socialKeywords = ['lonely', 'alone', 'friend', 'friends', 'relationship', 'relationships', 'social', 'isolated', 'isolation', 'people', 'family', 'talk', 'connect', 'rejected'];
  const socialCount = socialKeywords.filter(word => textLower.includes(word)).length;
  scores.Social = Math.min(1.0, socialCount * 0.20);

  // Emotional keywords
  const emotionalKeywords = ['sad', 'anxious', 'anxiety', 'worried', 'worry', 'depressed', 'depression', 'overwhelm', 'overwhelmed', 'cry', 'crying', 'feel', 'feeling', 'emotion', 'emotional', 'upset', 'hurt', 'pain', 'stress', 'stressed'];
  const emotionalCount = emotionalKeywords.filter(word => textLower.includes(word)).length;
  scores.Emotional = Math.min(1.0, emotionalCount * 0.20);

  // If no keywords found, set default moderate scores
  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  if (totalScore === 0) {
    scores.Academic = 0.3;
    scores.Financial = 0.2;
    scores.Social = 0.3;
    scores.Emotional = 0.5;
  } else {
    // Boost the highest scoring category
    const maxKey = Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);
    if (scores[maxKey] > 0) {
      scores[maxKey] = Math.min(1.0, scores[maxKey] + 0.15);
    }
  }

  console.log('📊 Local scores:', scores);

  // Calculate stress levels as STRINGS to match backend format
  const calculateLevel = (score) => {
    if (score < 0.33) return 'Low';
    if (score < 0.66) return 'Moderate';
    return 'High';
  };

  const stress_levels = {};
  Object.keys(scores).forEach(type => {
    stress_levels[type] = calculateLevel(scores[type]);
  });

  // Find dominant type
  const dominant_type = Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);
  const total_stress_score = Object.values(scores).reduce((a, b) => a + b, 0);
  const overall_level = calculateLevel(total_stress_score / 4); // String level

  return {
    stress_scores: scores,
    stress_levels: stress_levels,
    dominant_type: dominant_type,
    total_stress_score: total_stress_score,
    overall_level: overall_level,
    confidence: scores[dominant_type],
  };
}