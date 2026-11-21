// Live weather in Phnom Penh (Open-Meteo: free, no API key), shown on the Persona calendar corner
// and played out across the page (rain, storms, clouds; fog only shows on the calendar). Visitors can override it from the
// command palette or the terminal; the override lasts for the browser session.

export type WeatherKind = "clear" | "cloudy" | "fog" | "rain" | "storm";

export interface Weather {
  kind: WeatherKind;
  label: string;
  temp: number | null; // °C
  isDay: boolean;
  live: boolean; // false when the visitor picked it
}

export const WEATHER_KINDS: { id: WeatherKind; label: string }[] = [
  { id: "clear", label: "Clear skies" },
  { id: "rain", label: "Rain" },
  { id: "storm", label: "Thunderstorm" },
];

const URL =
  "https://api.open-meteo.com/v1/forecast?latitude=11.5564&longitude=104.9282" +
  "&current=temperature_2m,weather_code,is_day&timezone=Asia%2FPhnom_Penh";
const CACHE_KEY = "portfolio-weather-live";
const OVERRIDE_KEY = "portfolio-weather";
const MAX_AGE = 15 * 60_000;
const SKY_KEY = "portfolio-sky";

// WMO weather codes → our five looks
function fromCode(code: number): { kind: WeatherKind; label: string } {
  if (code === 0) return { kind: "clear", label: "Clear" };
  if (code === 1) return { kind: "clear", label: "Mostly clear" };
  if (code === 2) return { kind: "cloudy", label: "Partly cloudy" };
  if (code === 3) return { kind: "cloudy", label: "Overcast" };
  if (code === 45 || code === 48) return { kind: "fog", label: "Fog" };
  if (code >= 51 && code <= 57) return { kind: "rain", label: "Drizzle" };
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return { kind: "rain", label: code >= 80 ? "Showers" : "Rain" };
  if (code >= 95) return { kind: "storm", label: "Thunderstorm" };
  return { kind: "cloudy", label: "Cloudy" };
}

const phnomPenhHour = () =>
  Number(new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Phnom_Penh", hour: "numeric", hourCycle: "h23" }).format(new Date()));

const session = {
  get(key: string) {
    try {
      return sessionStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string | null) {
    try {
      if (value === null) sessionStorage.removeItem(key);
      else sessionStorage.setItem(key, value);
    } catch {
      // storage blocked: still works for this page view
    }
  },
};

type Live = { kind: WeatherKind; label: string; temp: number; isDay: boolean };

let live: Live | null = null;
const stored = session.get(OVERRIDE_KEY);
// Only weathers that can still be picked (an old "fog" pick from earlier in the session is dropped)
let override = (WEATHER_KINDS.some((k) => k.id === stored) ? stored : null) as WeatherKind | null;
let snapshot: Weather | null = null;
export type Sky = "day" | "night";
let skyOverride = (session.get(SKY_KEY) as Sky | null) ?? null;
let sky: Sky = "day";
let started = false;
const listeners = new Set<() => void>();

function rebuild() {
  const hour = phnomPenhHour();
  sky = skyOverride ?? ((live?.isDay ?? (hour >= 6 && hour < 18)) ? "day" : "night");
  document.documentElement.dataset.sky = sky; // lets the Persona theme warm up by day
  if (override) {
    snapshot = {
      kind: override,
      label: WEATHER_KINDS.find((k) => k.id === override)?.label ?? override,
      temp: live?.temp ?? null,
      isDay: sky === "day",
      live: false,
    };
  } else {
    snapshot = live ? { ...live, isDay: sky === "day", live: true } : null;
  }
  listeners.forEach((l) => l());
}

async function load() {
  try {
    const cached = JSON.parse(session.get(CACHE_KEY) ?? "null") as (Live & { at: number }) | null;
    if (cached && Date.now() - cached.at < MAX_AGE) {
      live = cached;
      rebuild();
      return;
    }
  } catch {
    // ignore a broken cache
  }
  // Open-Meteo first; some networks block it, so fall back to wttr.in.
  const result = (await fromOpenMeteo().catch(() => null)) ?? (await fromWttr().catch(() => null));
  if (!result) return; // offline or blocked: the site simply shows no weather
  live = result;
  session.set(CACHE_KEY, JSON.stringify({ ...live, at: Date.now() }));
  rebuild();
}

async function getJson<T>(url: string): Promise<T> {
  const ctrl = new AbortController();
  const timer = window.setTimeout(() => ctrl.abort(), 6000);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(String(res.status));
    return (await res.json()) as T;
  } finally {
    window.clearTimeout(timer);
  }
}

async function fromOpenMeteo(): Promise<Live | null> {
  const data = await getJson<{ current?: { temperature_2m: number; weather_code: number; is_day: number } }>(URL);
  if (!data.current) return null;
  return { ...fromCode(data.current.weather_code), temp: Math.round(data.current.temperature_2m), isDay: data.current.is_day === 1 };
}

// wttr.in uses WorldWeatherOnline condition codes.
function fromWwoCode(code: number): WeatherKind {
  if (code === 113) return "clear";
  if ([143, 248, 260].includes(code)) return "fog";
  if ([200, 386, 389, 392, 395].includes(code)) return "storm";
  if ([176, 263, 266, 281, 284, 293, 296, 299, 302, 305, 308, 311, 314, 353, 356, 359].includes(code)) return "rain";
  return "cloudy";
}

async function fromWttr(): Promise<Live | null> {
  const data = await getJson<{ current_condition?: { temp_C: string; weatherCode: string; weatherDesc: { value: string }[] }[] }>(
    "https://wttr.in/Phnom+Penh?format=j1",
  );
  const now = data.current_condition?.[0];
  if (!now) return null;
  const hour = phnomPenhHour();
  return {
    kind: fromWwoCode(Number(now.weatherCode)),
    label: now.weatherDesc?.[0]?.value?.trim() || "Cloudy",
    temp: Math.round(Number(now.temp_C)),
    isDay: hour >= 6 && hour < 18,
  };
}

export function subscribeWeather(listener: () => void) {
  listeners.add(listener);
  if (!started) {
    started = true;
    rebuild();
    void load();
    window.setInterval(() => void load(), MAX_AGE);
    window.setInterval(rebuild, 5 * 60_000); // day turns to night even without new weather
  }
  return () => {
    listeners.delete(listener);
  };
}

export const getWeather = () => snapshot;

/** Day or night in Phnom Penh (or the visitor's pick). */
export const getSky = () => sky;

/** What the visitor picked (null = following the live weather / the real time). */
export const getWeatherPick = () => override;
export const getSkyPick = () => skyOverride;

/** Force day or night, or pass null to follow the real time in Phnom Penh. */
export function setSky(next: Sky | null) {
  skyOverride = next;
  session.set(SKY_KEY, next);
  rebuild();
}

/** Pick the weather yourself, or pass null to go back to the live weather. */
export function setWeather(kind: WeatherKind | null) {
  override = kind;
  session.set(OVERRIDE_KEY, kind);
  rebuild();
}

export const describeWeather = (w: Weather | null) =>
  w ? `${w.label}${w.temp !== null ? `, ${w.temp}°C` : ""}${w.live ? " (live)" : " (picked by you)"}` : "unknown";
