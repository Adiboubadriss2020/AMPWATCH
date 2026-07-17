/**
 * Morocco factory schedule (Africa/Casablanca).
 * Outside these windows = hors production (usine censée fermée).
 */
const TZ = 'Africa/Casablanca';

/** Lun–Ven 08:00–18:00 · Sam 08:00–13:00 · Dim fermé */
const WEEKDAY_START = 8 * 60; // 08:00
const WEEKDAY_END = 18 * 60; // 18:00
const SAT_START = 8 * 60;
const SAT_END = 13 * 60; // 13:00

export type MoroccoClock = {
  /** Calendar date YYYY-MM-DD in Casablanca */
  dateKey: string;
  /** Minutes since midnight local */
  minutes: number;
  /** 0=Sun … 6=Sat */
  weekday: number;
  /** True when factory should be closed */
  isClosedHours: boolean;
  label: string;
};

function partsInCasablanca(ms: number): { dateKey: string; minutes: number; weekday: number } {
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    weekday: 'short',
  });
  const map: Record<string, string> = {};
  for (const p of fmt.formatToParts(new Date(ms))) {
    if (p.type !== 'literal') map[p.type] = p.value;
  }
  const hour = Number(map.hour === '24' ? '0' : map.hour);
  const minute = Number(map.minute);
  const weekdayName = map.weekday; // Mon, Tue, …
  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return {
    dateKey: `${map.year}-${map.month}-${map.day}`,
    minutes: hour * 60 + minute,
    weekday: weekdayMap[weekdayName] ?? new Date(ms).getUTCDay(),
  };
}

function isWithinShift(weekday: number, minutes: number): boolean {
  if (weekday === 0) return false; // Sunday closed
  if (weekday === 6) return minutes >= SAT_START && minutes < SAT_END;
  return minutes >= WEEKDAY_START && minutes < WEEKDAY_END; // Mon–Fri
}

export function getMoroccoClock(atMs: number = Date.now()): MoroccoClock {
  const { dateKey, minutes, weekday } = partsInCasablanca(atMs);
  const open = isWithinShift(weekday, minutes);
  return {
    dateKey,
    minutes,
    weekday,
    isClosedHours: !open,
    label: open ? 'Heures de production (MA)' : 'Hors production (MA)',
  };
}

/**
 * Machine considered "allumée" from API power only.
 * Idle / stopped: near-zero draw; running: meaningful kW.
 */
export function isMachinePoweredOn(kw: number, normalKw: number): boolean {
  if (!Number.isFinite(kw) || kw <= 0) return false;
  const idleCut = normalKw > 0 ? Math.max(2, normalKw * 0.08) : 2;
  return kw >= idleCut;
}

/**
 * Off-hours alert: usine fermée (Maroc) ET machine allumée.
 */
export function isOffHoursRunning(kw: number, normalKw: number, atMs?: number): boolean {
  const clock = getMoroccoClock(atMs);
  return clock.isClosedHours && isMachinePoweredOn(kw, normalKw);
}

/** Format accumulated ms as "2h 15m" / "45m" / "0h 00m" */
export function formatDurationHours(ms: number): string {
  const totalMin = Math.max(0, Math.floor(ms / 60_000));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h <= 0) return `${m}m`;
  return `${h}h ${String(m).padStart(2, '0')}m`;
}
