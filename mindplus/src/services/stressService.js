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

    // Normalize response: backend now returns raw scores without levels
    return {
      stress_scores: data.stress_scores || {},
      keyword_counts: data.keyword_counts || {},
      dominant_type: data.dominant_type || 'Emotional',
      dominant_score: data.dominant_score || 0,
      total_stress_score: data.total_stress_score || 0,
      overall_score: data.overall_score || 0,
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

  // Find dominant type
  const dominant_type = Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);
  const total_stress_score = Object.values(scores).reduce((a, b) => a + b, 0);
  const overall_score = total_stress_score / 4;

  // Mock keyword counts for local fallback
  const keyword_counts = {
    Academic: academicCount,
    Financial: financialCount,
    Social: socialCount,
    Emotional: emotionalCount,
  };

  return {
    stress_scores: scores,
    keyword_counts: keyword_counts,
    dominant_type: dominant_type,
    dominant_score: scores[dominant_type],
    total_stress_score: total_stress_score,
    overall_score: overall_score,
    confidence: scores[dominant_type],
  };
}