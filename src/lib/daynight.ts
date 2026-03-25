// Day/night cycle based on real UTC time, displayed in CET.
// The sub-solar longitude at UTC hour H is: sunLon = (12 - H) * 15
// A location at longitude L is in daylight if |L - sunLon| < 90° (with wraparound).

let _sunLon = 0
let _lastUpdate = 0

/** Call once per second to refresh the cached sun position */
export function updateSunPosition(): void {
  const now = Date.now()
  if (now - _lastUpdate < 900) return
  _lastUpdate = now
  const utcHour = new Date().getUTCHours() + new Date().getUTCMinutes() / 60 + new Date().getUTCSeconds() / 3600
  // normalize to -180..180
  _sunLon = ((12 - utcHour) * 15 % 360 + 540) % 360 - 180
}

/** Returns true if the given longitude is on the night side */
export function isNighttime(lon: number): boolean {
  const diff = Math.abs(((lon - _sunLon + 540) % 360) - 180)
  return diff > 90
}

/** Current sun longitude (cached) */
export function getSunLon(): number { return _sunLon }

/**
 * Returns the current CET time (UTC+1 in winter, UTC+2 in summer DST).
 * DST: last Sunday of March 02:00 → last Sunday of October 03:00
 */
export function getCETTime(): { hours: number; minutes: number; seconds: number; isDST: boolean } {
  const now = new Date()
  const year = now.getUTCFullYear()
  // Last Sunday of March
  const marchEnd = new Date(Date.UTC(year, 2, 31))
  const dstStart = new Date(Date.UTC(year, 2, 31 - marchEnd.getUTCDay()))
  // Last Sunday of October
  const octEnd = new Date(Date.UTC(year, 9, 31))
  const dstEnd = new Date(Date.UTC(year, 9, 31 - octEnd.getUTCDay()))
  const isDST = now >= dstStart && now < dstEnd
  const offset = isDST ? 2 : 1

  const totalSec = (now.getUTCHours() * 3600 + now.getUTCMinutes() * 60 + now.getUTCSeconds() + offset * 3600 + 86400) % 86400
  return {
    hours: Math.floor(totalSec / 3600),
    minutes: Math.floor((totalSec % 3600) / 60),
    seconds: Math.floor(totalSec % 60),
    isDST,
  }
}
