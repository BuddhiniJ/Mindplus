export const calculateDerivedFlags = ({
  stress_today,
  sleep_hours,
  energy_level,
  workload_intensity
}) => {
  const high_stress_day = stress_today >= 8;
  const low_sleep = sleep_hours < 6;
  const low_energy = energy_level <= 2;
  const heavy_workload = workload_intensity >= 8;

  const burnout_risk =
    (high_stress_day && low_sleep) ||
    (low_energy && heavy_workload);

  return {
    high_stress_day,
    low_sleep,
    low_energy,
    heavy_workload,
    burnout_risk
  };
};
