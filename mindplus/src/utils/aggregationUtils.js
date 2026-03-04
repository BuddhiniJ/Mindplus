export const computeWeeklyAverages = (checkins) => {
  const total = checkins.length;

  const sum = checkins.reduce(
    (acc, item) => {
      acc.stress += item.stress_today;
      acc.sleep += item.sleep_hours;
      acc.energy += item.energy_level;
      acc.workload += item.workload_intensity;
      return acc;
    },
    { stress: 0, sleep: 0, energy: 0, workload: 0 }
  );

  return {
    avg_stress: sum.stress / total,
    avg_sleep: sum.sleep / total,
    avg_energy: sum.energy / total,
    avg_workload: sum.workload / total
  };
};
