export function todayIsoDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatDisplayDate(
  value: string,
  options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  },
) {
  return new Intl.DateTimeFormat(undefined, options).format(
    new Date(`${value}T00:00:00`),
  );
}

export function weekdayFromIsoDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  return (date.getDay() + 6) % 7;
}
