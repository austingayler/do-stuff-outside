export function roundToNearest10Minutes(selectedTime) {
  const currentTime = new Date(selectedTime);
  const minutes = currentTime.getMinutes();
  const remainder = minutes % 10;

  // Round the minutes to the nearest 10
  if (remainder < 5) {
    currentTime.setMinutes(minutes - remainder);
  } else {
    currentTime.setMinutes(minutes + (10 - remainder));
  }
  currentTime.setSeconds(0);
  currentTime.setMilliseconds(0);

  return currentTime;
}
