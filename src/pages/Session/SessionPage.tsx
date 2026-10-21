import { useCallback, useEffect, useState, type ChangeEvent } from "react";
import { useNavigate, useParams } from "react-router";
import DefaultLayout from "../../layout/DefaultLayout";
import { supabase } from "../../lib/supabase";
import { useMe } from "../../lib/useMe";
import { BTN, INPUT, levelFromXp, xpForCatch, type Water } from "../../lib/game";
import FishingScene, { type Weather } from "../../components/FishingScene";
import { compress, dhash, getPosition, sha256 } from "../../lib/photo";

interface Info { spot_id: string; name: string; started_at: string; status: string; water_type: Water; lat: number; lng: number }
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
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [levelUp, setLevelUp] = useState(0);
  const [catchKey, setCatchKey] = useState(0);
  const [wx, setWx] = useState<{ w: Weather; temp: number; wind: number } | null>(null);
  const [rating, setRating] = useState(false);
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");

  const load = useCallback(async () => {
    if (!id) return;
    const { data: s } = await supabase.from("sessions").select("spot_id, started_at, status, spots(name,water_type,lat,lng)").eq("id", id).single();
    const r = s as unknown as { spot_id: string; started_at: string; status: string; spots: { name: string; water_type: Water; lat: number; lng: number } | null } | null;
    if (r) setInfo({ spot_id: r.spot_id, started_at: r.started_at, status: r.status, name: r.spots?.name ?? "Spot", water_type: r.spots?.water_type ?? "sungai", lat: r.spots?.lat ?? 0, lng: r.spots?.lng ?? 0 });
    const { data: c } = await supabase.from("catches").select("id,weight_kg,species,photo_url,caught_at")
      .eq("session_id", id).is("deleted_at", null).order("caught_at", { ascending: false });
    setCatches((c ?? []) as unknown as CatchRow[]);
  }, [id]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (preview) URL.revokeObjectURL(preview);
    setFile(f); setPreview(URL.createObjectURL(f)); setErr("");
  };

  const lat = info?.lat ?? 0;
  const lng = info?.lng ?? 0;
  useEffect(() => {
    if (!lat && !lng) return;
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code,wind_speed_10m`)
      .then((r) => r.json())
      .then((j) => {
        const c = j.current as { temperature_2m: number; weather_code: number; wind_speed_10m: number };
        const k = c.weather_code;
        const w: Weather = k >= 95 ? "badai" : (k >= 51 && k <= 67) || (k >= 80 && k <= 82) ? "hujan" : k === 3 || k === 45 || k === 48 ? "mendung" : "cerah";
        setWx({ w, temp: Math.round(c.temperature_2m), wind: Math.round(c.wind_speed_10m) });
      })
      .catch(() => {});
  }, [lat, lng]);

  // tips uji: tambahkan ?jam=22&cuaca=badai pada URL untuk melihat scene lain
  const sp = new URLSearchParams(window.location.search);
  const hour = sp.has("jam") ? Number(sp.get("jam")) : new Date(now).getHours();
  const weather = (sp.get("cuaca") as Weather | null) ?? wx?.w ?? "cerah";

  const addCatch = async () => {
    const w = parseFloat(kg.replace(",", "."));
    if (!(w > 0) || w > 500) { setErr("Isi berat ikan (kg)"); return; }
    if (!file) { setErr("Ambil foto ikan dulu 📸"); return; }
    if (Date.now() - file.lastModified > 10 * 60 * 1000) { setErr("Foto harus diambil sekarang, bukan dari galeri"); return; }
    if (!me || !info || !id) return;
    setBusy(true); setErr("");
    let path = "";
    let saved = false;
    try {
      const blob = await compress(file);
      const pos = await getPosition();
      const [hash, ph] = await Promise.all([sha256(blob), dhash(blob)]);
      path = `${me.id}/${id}/${crypto.randomUUID()}.jpg`;
      const up = await supabase.storage.from("catches").upload(path, blob, { contentType: "image/jpeg" });
      if (up.error) throw up.error;
      const url = supabase.storage.from("catches").getPublicUrl(path).data.publicUrl;
      // caught_at diisi server (now()); trigger check_catch menolak duplikat / terlalu jauh dari spot
      const { error } = await supabase.from("catches").insert({
        session_id: id, user_id: me.id, spot_id: info.spot_id, weight_kg: w, species: species.trim() || null,
        photo_url: url, photo_path: path, sha256: hash, phash: ph, lat: pos.coords.latitude, lng: pos.coords.longitude,
      });
      if (error) throw error;
      saved = true;
    } catch (e) {
      if (path && !saved) await supabase.storage.from("catches").remove([path]);
      setErr((e as Error).message);
    }
    setBusy(false);
    if (!saved) return;
    const { data: p } = await supabase.from("profiles").select("xp").eq("id", me.id).single();
    const nl = levelFromXp((p as unknown as { xp: number } | null)?.xp ?? 0);
    if (nl > levelFromXp(me.xp)) setLevelUp(nl);
    if (preview) URL.revokeObjectURL(preview);
    setKg(""); setSpecies(""); setFile(null); setPreview(""); setCatchKey((k) => k + 1);
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
        <FishingScene type={info?.water_type ?? "sungai"} hour={hour} weather={weather} catchKey={catchKey}>
          <p className="font-game text-5xl text-amber-300">{info ? fmt(now - new Date(info.started_at).getTime()) : "--:--:--"}</p>
          <p className="font-game text-xl">{info?.name ?? "..."}</p>
          <p className="text-lg">🐟 {catches.length} ikan · +{totalXp} XP sesi ini</p>
          {wx && (
            <p className="text-base text-slate-300">
              {{ cerah: "☀️", mendung: "☁️", hujan: "🌧️", badai: "⛈️" }[wx.w]} {wx.temp}°C · angin {wx.wind} km/j ·{" "}
              <a href="https://open-meteo.com" target="_blank" rel="noreferrer" className="underline">Open-Meteo.com</a>
            </p>
          )}
        </FishingScene>

        {live && (
          <section className="space-y-3 rounded-3xl bg-slate-900 p-4">
            <p className="font-game text-2xl text-amber-300">📸 Tambah Tangkapan</p>
            <input className={INPUT} inputMode="decimal" placeholder="Berat (kg), cth 1.5" value={kg} onChange={(e) => setKg(e.target.value)} />
            <input className={INPUT} placeholder="Jenis ikan (opsional)" value={species} onChange={(e) => setSpecies(e.target.value)} />
            <label className={`${BTN} cursor-pointer`}>
              {file ? "🔄 Ganti Foto" : "📸 Ambil Foto Ikan"}
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={onFile} />
            </label>
            {preview && <img src={preview} alt="Foto ikan" className="max-h-60 w-full rounded-2xl object-cover" />}
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
