const nzDay = new Intl.DateTimeFormat('en-CA', { timeZone: 'Pacific/Auckland', year: 'numeric', month: '2-digit', day: '2-digit' });

// Search for the next NZ calendar-day boundary, including 23/25-hour DST days.
export function nextTrialAt(now: number): number {
  const today = nzDay.format(new Date(now));
  let low = now;
  let high = now + 27 * 60 * 60 * 1000;
  while (high - low > 1) {
    const mid = Math.floor((low + high) / 2);
    if (nzDay.format(new Date(mid)) === today) low = mid;
    else high = mid;
  }
  return high;
}

export function countdownText(milliseconds: number): string {
  const seconds = Math.max(0, Math.ceil(milliseconds / 1000));
  return [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60]
    .map(value => String(value).padStart(2, '0')).join(':');
}
