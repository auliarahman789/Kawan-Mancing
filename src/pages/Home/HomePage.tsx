import { useEffect, useState } from "react";
import { Link } from "react-router";
import DefaultLayout from "../../layout/DefaultLayout";
import { supabase } from "../../lib/supabase";
import { useMe } from "../../lib/useMe";
import { BTN, levelFromXp, titleFor, xpForCatch, xpForLevel } from "../../lib/game";

// CONTOH konten — nanti ganti dengan tabel `news` di Supabase / RSS
const NEWS = [
  { e: "🌅", t: "Waktu emas: pagi & sore biasanya strike paling sering" },
  { e: "🌦️", t: "Cek cuaca dan pasang surut sebelum ke laut" },
  { e: "♻️", t: "Catch & release: lepas ikan kecil demi kelestarian" },
];
const TREN = [
  { e: "🔥", t: "Casting ultralight" },
  { e: "🌙", t: "Mancing malam" },
  { e: "🦐", t: "Umpan udang hidup" },
];

interface CatchRow { id: string; weight_kg: number; species: string | null; caught_at: string }
interface Top { id: string; nickname: string; xp: number }

export default function HomePage() {
  const { me, error, reload } = useMe();
  const [active, setActive] = useState<{ id: string; name: string } | null>(null);
  const [recent, setRecent] = useState<CatchRow[]>([]);
  const [top, setTop] = useState<Top[]>([]);

  useEffect(() => {
    if (!me) return;
    supabase.from("sessions").select("id, spots(name)").eq("user_id", me.id).eq("status", "active").limit(1).maybeSingle()
      .then(({ data }) => {
        const r = data as unknown as { id: string; spots: { name: string } | null } | null;
        setActive(r ? { id: r.id, name: r.spots?.name ?? "Spot" } : null);
      });
    supabase.from("catches").select("id,weight_kg,species,caught_at").eq("user_id", me.id)
      .order("caught_at", { ascending: false }).limit(5)
      .then(({ data }) => setRecent((data ?? []) as unknown as CatchRow[]));
    supabase.from("profiles").select("id,nickname,xp").order("xp", { ascending: false }).limit(5)
      .then(({ data }) => setTop((data ?? []) as unknown as Top[]));
  }, [me]);

  const rename = async () => {
    if (!me) return;
    const n = prompt("Nama pemancing:", me.nickname)?.trim();
    if (!n) return;
    await supabase.from("profiles").update({ nickname: n.slice(0, 20) }).eq("id", me.id);
    reload();
  };

  const lvl = levelFromXp(me?.xp ?? 0);
  const base = xpForLevel(lvl);
  const next = xpForLevel(lvl + 1);
  const pct = me ? Math.min(100, ((me.xp - base) / (next - base)) * 100) : 0;

  return (
    <DefaultLayout>
      <div className="mx-auto max-w-xl space-y-5 p-4">
        <header className="rounded-3xl border-2 border-amber-400 bg-gradient-to-br from-cyan-700 to-teal-900 p-5 shadow-lg">
          <button onClick={rename} className="text-left">
            <p className="font-game text-3xl">{me ? `${me.avatar} ${me.nickname}` : "Memuat..."} ✏️</p>
          </button>
          <p className="text-lg text-cyan-100">{titleFor(lvl)}</p>
          <div className="mt-3 flex items-end justify-between">
            <span className="font-game text-5xl text-amber-300">LV {lvl}</span>
            <span className="text-lg">{me?.xp ?? 0} / {next} XP</span>
          </div>
          <div className="mt-2 h-5 overflow-hidden rounded-full bg-black/40">
            <div className="h-full bg-gradient-to-r from-amber-300 to-orange-500 transition-all" style={{ width: `${pct}%` }} />
          </div>
        </header>

        {error && <p className="text-lg text-red-300">⚠️ {error} — cek .env dan aktifkan Anonymous sign-ins di Supabase</p>}

        <Link to={active ? `/sesi/${active.id}` : "/peta"} className={BTN}>
          {active ? `🎣 Lanjut mancing di ${active.name}` : "🗺️ Cari spot & mulai mancing"}
        </Link>

        <section>
          <h2 className="mb-2 font-game text-2xl text-amber-300">📰 Berita Mancing</h2>
          <div className="space-y-2">
            {NEWS.map((n) => (
              <div key={n.t} className="flex items-center gap-3 rounded-2xl bg-slate-800 p-4 text-lg">
                <span className="text-3xl">{n.e}</span>{n.t}
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-2 font-game text-2xl text-amber-300">📈 Tren Mancing</h2>
          <div className="flex flex-wrap gap-2">
            {TREN.map((t) => (
              <span key={t.t} className="rounded-full border-2 border-cyan-700 bg-slate-900 px-4 py-2 text-lg">{t.e} {t.t}</span>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-2 font-game text-2xl text-amber-300">🏆 Papan Peringkat</h2>
          <div className="space-y-2">
            {top.map((p, i) => (
              <div key={p.id} className={`flex items-center justify-between rounded-2xl p-4 text-lg ${p.id === me?.id ? "bg-amber-500/20" : "bg-slate-800"}`}>
                <span>{["🥇", "🥈", "🥉"][i] ?? `#${i + 1}`} {p.nickname}</span>
                <span className="font-game text-cyan-300">LV {levelFromXp(p.xp)} · {p.xp} XP</span>
              </div>
            ))}
          </div>
        </section>

        {recent.length > 0 && (
          <section>
            <h2 className="mb-2 font-game text-2xl text-amber-300">🐟 Tangkapan Terakhir</h2>
            <div className="space-y-2">
              {recent.map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-2xl bg-slate-800 p-4 text-lg">
                  <span>{c.species || "Ikan"} · {c.weight_kg} kg</span>
                  <span className="font-game text-amber-300">+{xpForCatch(c.weight_kg)} XP</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </DefaultLayout>
  );
}
