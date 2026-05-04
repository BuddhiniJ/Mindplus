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

  // Academic keywords - Education, learning, performance, exams, assignments
  const academicKeywords = [
    'exam', 'exams', 'test', 'tests', 'quiz', 'quizzes', 'study', 'studying',
    'homework', 'assignment', 'assignments', 'essay', 'essays', 'project', 'projects',
    'presentation', 'presentations', 'research', 'thesis', 'dissertation',
    'school', 'college', 'university', 'uni', 'academic', 'education',
    'class', 'classes', 'course', 'courses', 'lecture', 'lectures',
    'seminar', 'tutorial', 'workshop', 'certification', 'degree',
    'learning', 'midterm', 'final', 'grade', 'grades', 'gpa', 'mark',
    'performance', 'coursework', 'qualification', 'student', 'pupils'
  ];
  const academicCount = academicKeywords.filter(word => textLower.includes(word)).length;
  scores.Academic = Math.min(1.0, academicCount * 0.15);

  // Financial keywords - Money, bills, expenses, income, debt, spending
  const financialKeywords = [
    'money', 'dollar', 'dollars', 'cash', 'fund', 'funds',
    'bill', 'bills', 'pay', 'payment', 'payments', 'paying', 'paid',
    'fee', 'fees', 'charge', 'charges', 'rate', 'rates',
    'cost', 'costs', 'costly', 'expensive', 'expense', 'expenses',
    'spending', 'spent', 'price', 'prices', 'afford', 'budget',
    'income', 'salary', 'wage', 'wages', 'earning', 'earn',
    'unemployment', 'unemployed', 'jobless',
    'debt', 'debts', 'loan', 'loans', 'credit', 'overdraft',
    'mortgage', 'liability', 'broke', 'bankrupt', 'bankruptcy',
    'poor', 'poverty', 'shortage', 'struggling', 'struggle',
    'savings', 'save', 'invest', 'investment', 'financial'
  ];
  const financialCount = financialKeywords.filter(word => textLower.includes(word)).length;
  scores.Financial = Math.min(1.0, financialCount * 0.15);

  // Social keywords - Relationships, family, friends, connections, loneliness
  const socialKeywords = [
    'lonely', 'loneliness', 'alone', 'solitude', 'isolated', 'isolation',
    'friend', 'friends', 'friendship', 'relationship', 'relationships',
    'partner', 'girlfriend', 'boyfriend', 'spouse', 'companion',
    'family', 'families', 'parent', 'parents', 'sibling', 'siblings',
    'mother', 'father', 'brother', 'sister', 'relative',
    'social', 'connect', 'connected', 'connection', 'community',
    'talk', 'talking', 'conversation', 'communicate', 'communication',
    'rejection', 'rejected', 'bullying', 'bullied', 'bully',
    'gossip', 'betrayal', 'betrayed', 'conflict', 'argument',
    'dispute', 'misunderstanding', 'divorce', 'breakup', 'separation',
    'abandoned', 'abandonment', 'neglected', 'neglect', 'ostracize',
    'people', 'person', 'someone', 'crowd'
  ];
  const socialCount = socialKeywords.filter(word => textLower.includes(word)).length;
  scores.Social = Math.min(1.0, socialCount * 0.15);

  // Emotional keywords - Feelings, moods, mental health, psychological states
  const emotionalKeywords = [
    'sad', 'sadness', 'depressed', 'depression', 'gloomy', 'melancholy',
    'down', 'downhearted', 'disheartened',
    'anxious', 'anxiety', 'worried', 'worry', 'worrying', 'concerned',
    'nervous', 'tension', 'tense', 'apprehensive', 'uneasy',
    'afraid', 'scared', 'panic', 'panicked', 'terror', 'terrified',
    'fear', 'frightened', 'phobia',
    'angry', 'anger', 'rage', 'furious', 'mad', 'irritated', 'irritable',
    'frustrated', 'frustration', 'annoyed', 'resentment', 'resentful',
    'stress', 'stressed', 'stressful', 'pressure', 'pressured',
    'overwhelm', 'overwhelmed',
    'hurt', 'pain', 'ache', 'heartache', 'suffering',
    'hopeless', 'hopelessness', 'helpless', 'helplessness',
    'vulnerable', 'insecure', 'doubt', 'uncertain',
    'confused', 'confusion', 'exhausted', 'exhaustion',
    'embarrassed', 'embarrassment', 'shame', 'ashamed',
    'guilt', 'guilty', 'regret',
    'feel', 'feeling', 'feels', 'emotion', 'emotions', 'emotional',
    'upset', 'cry', 'crying', 'tears', 'weeping'
  ];
  const emotionalCount = emotionalKeywords.filter(word => textLower.includes(word)).length;
  scores.Emotional = Math.min(1.0, emotionalCount * 0.15);

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