export const getDaysInMonth = (year, month) => {
  return new Date(year, month + 1, 0).getDate();
};

export const STRESS_COLORS = {
  low: "#DCFCE7",
  medium: "#FEF3C7",
  high: "#FEE2E2",
};

export const generateMockPredictions = (year, month) => {
  const today = new Date();
  const predictions = {};

  for (let i = 0; i <= 5; i++) {
    const future = new Date();
    future.setDate(today.getDate() + i);

    if (
      future.getFullYear() === year &&
      future.getMonth() === month
    ) {
      const key = `${year}-${month + 1}-${future.getDate()}`;

      predictions[key] = {
        baseStress: Math.floor(Math.random() * 3) + 1, // 1–3
      };
    }
  }

  return predictions;
};

export const calculateStressLevel = (base, events = 0) => {
  const score = base + events;

  if (score <= 2) return "low";
  if (score <= 4) return "medium";
  return "high";
};

export const getStressMessage = (level, events) => {
  if (level === "low")
    return "Your academic load looks manageable for this day.";

  if (level === "medium")
    return events > 0
      ? "You have upcoming academic tasks. Consider planning ahead."
      : "Moderate stress predicted. Maintain balanced study sessions.";

  return "High stress predicted. Take breaks and prioritize essential tasks.";
};

export const getTodayMessage = (stressLevel, eventCount) => {
  if (stressLevel === "low") {
    return "You seem to be managing well today. Keep up the good balance 🌱";
  }

  if (stressLevel === "medium") {
    return eventCount > 1
      ? "You have a moderately busy day. Try to take short breaks when possible ⚖️"
      : "Your stress level is moderate today. Stay mindful of your workload 💛";
  }

  return eventCount > 2
    ? "Today looks quite demanding. Consider prioritizing tasks and resting when needed ❤️"
    : "Your stress level is high today. Don’t hesitate to slow down and seek support 💙";
};

export const getStressLevel = (baseStress, eventsCount = 0) => {
  const score = baseStress + eventsCount;

  if (score <= 2) return "low";
  if (score <= 4) return "medium";
  return "high";
};
