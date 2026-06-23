// Orim operates in Asia/Amman (UTC+3). All timestamps are stored as ISO
// strings (UTC or with an offset); these helpers render / bucket them in the
// store's local timezone so reports line up with the business day in Amman.

const TZ = 'Asia/Amman'

const dayKeyFmt = new Intl.DateTimeFormat('en-CA', {
  timeZone: TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

const dateFmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: TZ,
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

const dateTimeFmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: TZ,
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

const weekdayFmt = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, weekday: 'short' })

/** "YYYY-MM-DD" in Asia/Amman — stable key for grouping by business day. */
export function ammanDayKey(iso: string): string {
  return dayKeyFmt.format(new Date(iso))
}

/** e.g. "17 Jun 2026". */
export function formatAmmanDate(iso: string): string {
  return dateFmt.format(new Date(iso))
}

/** e.g. "17 Jun, 14:35". */
export function formatAmmanDateTime(iso: string): string {
  return dateTimeFmt.format(new Date(iso))
}

/** Short weekday for a day key, e.g. "Wed". */
export function weekdayLabel(iso: string): string {
  return weekdayFmt.format(new Date(iso))
}

/**
 * The 7 day-keys ending at `endIso` (inclusive), oldest first.
 * Computed by walking back 24h at a time, then normalising to Amman day keys.
 */
export function last7DayKeys(endIso: string): string[] {
  const end = new Date(endIso)
  const keys: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(end.getTime() - i * 24 * 60 * 60 * 1000)
    keys.push(ammanDayKey(d.toISOString()))
  }
  return keys
}
