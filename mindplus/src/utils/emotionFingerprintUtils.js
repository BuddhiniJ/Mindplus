const NEGATIVE_EMOTIONS = ["anger", "sadness", "fear", "disgust"];

export const processEmotionCheckin = (answers) => {
  let dominantEmotion = "neutral";
  let maxConfidence = 0;
  let negativeCount = 0;
  let totalConfidence = 0;

  answers.forEach((item) => {
    totalConfidence += item.confidence;

    if (item.confidence > maxConfidence) {
      maxConfidence = item.confidence;
      dominantEmotion = item.emotion;
    }

    if (NEGATIVE_EMOTIONS.includes(item.emotion)) {
      negativeCount++;
    }
  });

  const emotionalVolatility = totalConfidence / answers.length;

  return {
    dominant_emotion: dominantEmotion,
    negative_emotion_count: negativeCount,
    emotional_volatility: emotionalVolatility
  };
};
