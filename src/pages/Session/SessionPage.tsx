import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import DefaultLayout from "../../layout/DefaultLayout";
import { supabase } from "../../lib/supabase";
import { useMe } from "../../lib/useMe";
import { BTN, INPUT, levelFromXp, xpForCatch } from "../../lib/game";

interface Info { spot_id: string; name: string; started_at: string; status: string }
interface CatchRow { id: string; weight_kg: number; species: string | null; photo_url: string; caught_at: string }

const fmt = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return [Math.floor(s / 3600), Math.floor(s / 60) % 60, s % 60].map((n) => String(n).padStart(2, "0")).join(":");
};

export default function SessionPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const { me, reload } = useMe();
  const [info, setInfo] = useState<Info | null>(null);
  const [catches, setCatches] = useState<CatchRow[]>([]);
  const [now, setNow] = useState(Date.now());
  const [kg, setKg] = useState("");
  const [species, setSpecies] = useState("");
  const [photo, setPhoto] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [levelUp, setLevelUp] = useState(0);
  const [rating, setRating] = useState(false);
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");

  const load = useCallback(async () => {
    if (!id) return;
    const { data: s } = await supabase.from("sessions").select("spot_id, started_at, status, spots(name)").eq("id", id).single();
    const r = s as unknown as { spot_id: string; started_at: string; status: string; spots: { name: string } | null } | null;
    if (r) setInfo({ spot_id: r.spot_id, started_at: r.started_at, status: r.status, name: r.spots?.name ?? "Spot" });
    const { data: c } = await supabase.from("catches").select("id,weight_kg,species,photo_url,caught_at")
      .eq("session_id", id).order("caught_at", { ascending: false });
    setCatches((c ?? []) as unknown as CatchRow[]);
  }, [id]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const addCatch = async () => {
    const w = parseFloat(kg.replace(",", "."));
    if (!(w > 0) || w > 500) { setErr("Isi berat ikan (kg)"); return; }
    if (!/^https?:\/\//i.test(photo.trim())) { setErr("Tempel link foto (https://...)"); return; }
    if (!me || !info) return;
    setBusy(true); setErr("");
    // caught_at diisi otomatis oleh server (default now()) = timestamp
    const { error } = await supabase.from("catches").insert({
      session_id: id, user_id: me.id, spot_id: info.spot_id,
      weight_kg: w, species: species.trim() || null, photo_url: photo.trim(),
    });
    if (error) { setErr(error.message); setBusy(false); return; }
    const { data: p } = await supabase.from("profiles").select("xp").eq("id", me.id).single();
    const nl = levelFromXp((p as unknown as { xp: number } | null)?.xp ?? 0);
    if (nl > levelFromXp(me.xp)) setLevelUp(nl);
    setKg(""); setSpecies(""); setPhoto(""); setBusy(false);
    load(); reload();
  };

  const finish = async () => {
    if (!me || !info || !id) return;
    if (!stars) { setErr("Beri bintang dulu ya"); return; }
    setBusy(true); setErr("");
    const { error: e1 } = await supabase.from("spot_ratings")
      .insert({ session_id: id, spot_id: info.spot_id, user_id: me.id, stars, comment: comment.trim() || null });
    const { error: e2 } = await supabase.from("sessions")
      .update({ status: "ended", ended_at: new Date().toISOString() }).eq("id", id);
    const e = e1 ?? e2;
    if (e) { setErr(e.message); setBusy(false); return; }
    nav("/");
  };

  const live = info?.status === "active";
  const totalXp = catches.reduce((a, c) => a + xpForCatch(c.weight_kg), 0);

  return (
    <DefaultLayout>
      <div className="mx-auto max-w-xl space-y-4 p-4">
        <header className="rounded-3xl border-2 border-amber-400 bg-gradient-to-br from-cyan-700 to-teal-900 p-5 text-center">
          <p className="font-game text-3xl">{info?.name ?? "..."}</p>
          <p className="font-game text-6xl text-amber-300">{info ? fmt(now - new Date(info.started_at).getTime()) : "--:--:--"}</p>
          <p className="text-lg">🐟 {catches.length} ikan · +{totalXp} XP sesi ini</p>
        </header>

        {live && (
          <section className="space-y-3 rounded-3xl bg-slate-900 p-4">
            <p className="font-game text-2xl text-amber-300">📸 Tambah Tangkapan</p>
            <input className={INPUT} inputMode="decimal" placeholder="Berat (kg), cth 1.5" value={kg} onChange={(e) => setKg(e.target.value)} />
            <input className={INPUT} placeholder="Jenis ikan (opsional)" value={species} onChange={(e) => setSpecies(e.target.value)} />
            <input className={INPUT} inputMode="url" placeholder="Link foto https://..." value={photo} onChange={(e) => setPhoto(e.target.value)} />
            {err && !rating && <p className="text-lg text-red-300">{err}</p>}
            <button className={BTN} disabled={busy} onClick={addCatch}>🎣 Simpan Tangkapan</button>
          </section>
        )}

        <section className="space-y-2">
          {catches.map((c) => (
            <div key={c.id} className="rounded-2xl bg-slate-800 p-4 text-lg">
              <div className="flex justify-between">
                <span>🐟 {c.species || "Ikan"} · {c.weight_kg} kg</span>
                <span className="font-game text-amber-300">+{xpForCatch(c.weight_kg)} XP</span>
              </div>
              <div className="flex justify-between text-base text-slate-400">
                <span>🕒 {new Date(c.caught_at).toLocaleString("id-ID")}</span>
                <a href={c.photo_url} target="_blank" rel="noreferrer" className="text-cyan-300 underline">Foto</a>
              </div>
            </div>
          ))}
        </section>

        {live && <button className={BTN} onClick={() => { setErr(""); setRating(true); }}>🏁 SELESAI MANCING</button>}
      </div>

      {rating && (
        <div className="fixed inset-0 z-[1300] flex items-end bg-black/70 p-3">
          <div className="w-full space-y-4 rounded-3xl border-2 border-amber-400 bg-slate-900 p-5">
            <p className="text-center font-game text-3xl text-amber-300">Beri rating {info?.name}</p>
            <div className="flex justify-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} onClick={() => setStars(n)} className={`text-5xl ${n <= stars ? "" : "opacity-30 grayscale"}`}>⭐</button>
              ))}
            </div>
            <input className={INPUT} placeholder="Komentar (opsional)" value={comment} onChange={(e) => setComment(e.target.value)} />
            {err && <p className="text-lg text-red-300">{err}</p>}
            <button className={BTN} disabled={busy} onClick={finish}>✅ Kirim & Selesai</button>
            <button className="w-full p-2 text-lg text-slate-400" onClick={() => setRating(false)}>Kembali</button>
          </div>
        </div>
      )}

      {levelUp > 0 && (
        <div onClick={() => setLevelUp(0)} className="fixed inset-0 z-[1400] flex flex-col items-center justify-center gap-4 bg-black/85 text-center">
          <p className="text-8xl">🎉</p>
          <p className="font-game text-6xl text-amber-300">LEVEL UP!</p>
          <p className="font-game text-4xl">Level {levelUp}</p>
          <p className="text-lg text-slate-400">Ketuk untuk lanjut</p>
        </div>
      )}
    </DefaultLayout>
  );
}
