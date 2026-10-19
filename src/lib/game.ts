export const WATER = {
  laut: "🌊 Laut",
  sungai: "🏞️ Sungai",
  danau: "🏝️ Danau",
  kolam: "🎣 Kolam",
} as const;
export type Water = keyof typeof WATER;

export interface Spot {
  id: string;
  name: string;
  lat: number;
  lng: number;
  water_type: Water;
  rating_avg: number;
  rating_count: number;
}

// XP harus sama dengan trigger add_xp() di supabase/schema.sql
export const xpForCatch = (kg: number) => Math.round(10 + kg * 20);
export const levelFromXp = (xp: number) => Math.floor(Math.sqrt(xp / 50)) + 1;
export const xpForLevel = (lvl: number) => 50 * (lvl - 1) ** 2;

const TITLES = ["Pemula", "Anak Kampung Joran", "Pemburu Umpan", "Jagoan Strike", "Raja Sungai", "Legenda Laut"];
export const titleFor = (lvl: number) => TITLES[Math.min(Math.floor((lvl - 1) / 3), TITLES.length - 1)];

// class UI besar untuk mobile
export const INPUT = "w-full rounded-2xl border-2 border-cyan-700 bg-slate-800 p-4 text-xl text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none";
export const BTN = "block w-full rounded-2xl border-b-4 border-orange-700 bg-gradient-to-b from-amber-300 to-orange-500 p-4 text-center font-game text-2xl text-slate-900 active:translate-y-1 active:border-b-0 disabled:opacity-50";
