export const getStressLevel = (baseStress, eventsCount = 0) => {
  const score = baseStress + eventsCount;

  if (score <= 2) return "low";
  if (score <= 4) return "medium";
  return "high";
};

export const getDaysInMonth = (year, month) => {
  return new Date(year, month + 1, 0).getDate();
};

export const STRESS_COLORS = {
  low: "#DCFCE7",     // light green
  medium: "#FEF3C7",  // yellow
  high: "#FEE2E2",    // light red
};
