export function calculateProgress(startDate, endDate) {
  const now = new Date();

  const totalDuration = endDate - startDate;
  const elapsedDuration = now - startDate;

  const totalWeeks = Math.ceil(totalDuration / (7 * 24 * 60 * 60 * 1000));
  const currentWeek = Math.ceil(elapsedDuration / (7 * 24 * 60 * 60 * 1000));

  let progress = (elapsedDuration / totalDuration) * 100;

  progress = Math.max(0, Math.min(100, progress));

  const safeCurrentWeek = Math.max(0, Math.min(totalWeeks, currentWeek));

  return {
    currentWeek: safeCurrentWeek,
    totalWeeks,
    progress: Math.round(progress)
  };
}