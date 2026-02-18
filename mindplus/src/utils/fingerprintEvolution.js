import { computeWeeklyAverages } from "./aggregationUtils";
import { processEmotionCheckin } from "./emotionFingerprintUtils";

export const evolveFingerprint = (baseline, weeklyCheckins) => {

  const averages = computeWeeklyAverages(weeklyCheckins);

  let totalNegative = 0;
  let dominantEmotionTracker = {};

  weeklyCheckins.forEach(day => {
    if (day.answers) {
      const emotionData = processEmotionCheckin(day.answers);

      totalNegative += emotionData.negative_emotion_count;

      dominantEmotionTracker[emotionData.dominant_emotion] =
        (dominantEmotionTracker[emotionData.dominant_emotion] || 0) + 1;
    }
  });

  const dominantEmotion =
    Object.keys(dominantEmotionTracker).reduce((a, b) =>
      dominantEmotionTracker[a] > dominantEmotionTracker[b] ? a : b
    , "neutral");

  // Drift Score (Core Evolution Logic)
  const baselineStress = baseline.stress;

  const stressDrift = averages.avg_stress - baselineStress;

  const burnoutRiskScore =
    (averages.avg_stress * 0.4) +
    (totalNegative * 0.3) +
    ((10 - averages.avg_sleep) * 0.3);

  return {
    dynamic_metrics: {
      ...averages,
      dominant_emotion: dominantEmotion,
      negative_emotion_days: totalNegative,
      burnout_risk_score: burnoutRiskScore
    },
    evolution_score: stressDrift
  };
};
