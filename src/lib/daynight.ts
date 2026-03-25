// Day/night cycle based on real UTC time, displayed in CET.

const DEG2RAD = Math.PI / 180

let _lastUpdate = 0
const _initHour = new Date().getUTCHours() + new Date().getUTCMinutes() / 60
let _sunLon = ((12 - _initHour) * 15 % 360 + 540) % 360 - 180

/** Call once per second to refresh the cached sun position */
export function updateSunPosition(): void {
  const now = Date.now()
  if (now - _lastUpdate < 900) return
  _lastUpdate = now
  const utcHour = new Date().getUTCHours() + new Date().getUTCMinutes() / 60 + new Date().getUTCSeconds() / 3600
  _sunLon = ((12 - utcHour) * 15 % 360 + 540) % 360 - 180
}

function getDayOfYear(): number {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 0)
  return Math.floor((now.getTime() - start.getTime()) / 86400000)
}

/** Sun declination in radians based on current day of year */
function getSunDeclination(): number {
  const day = getDayOfYear()
  return -23.45 * DEG2RAD * Math.cos((2 * Math.PI / 365) * (day + 10))
}

/**
 * Returns true if the given lat/lon is on the night side of Earth.
 * Accounts for the sun's declination (seasonal tilt).
 */
export function isNighttime(lat: number, lon: number): boolean {
  const decl = getSunDeclination()
  const hourAngle = (lon - _sunLon) * DEG2RAD
  const latRad = lat * DEG2RAD
  const sinElev = Math.sin(latRad) * Math.sin(decl) + Math.cos(latRad) * Math.cos(decl) * Math.cos(hourAngle)
  // Buffer zone: only awake when clearly in sunlight (elevation > ~7°)
  // Keeps a clean gap between the sleeping and awake regions, eliminates terminator flickering
  return sinElev < 0.12
}

/** Current sun longitude (cached) */
export function getSunLon(): number { return _sunLon }

/**
 * Returns the 3D position of the sun (unit vector × scale),
 * using the same coordinate system as latLonToVec3 (x-negated to match Three.js UV).
 */
export function getSunPosition3D(scale = 50): [number, number, number] {
  const decl = getSunDeclination()
  const latSun = decl * (180 / Math.PI)
  const phi = (90 - latSun) * DEG2RAD
  const theta = (_sunLon + 180) * DEG2RAD
  return [
    -scale * Math.sin(phi) * Math.cos(theta),
     scale * Math.cos(phi),
     scale * Math.sin(phi) * Math.sin(theta),
  ]
}

/**
 * Returns the current CET time (UTC+1 in winter, UTC+2 in summer DST).
 */
export function getCETTime(): { hours: number; minutes: number; seconds: number; isDST: boolean } {
  const now = new Date()
  const year = now.getUTCFullYear()
  const marchEnd = new Date(Date.UTC(year, 2, 31))
  const dstStart = new Date(Date.UTC(year, 2, 31 - marchEnd.getUTCDay()))
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
