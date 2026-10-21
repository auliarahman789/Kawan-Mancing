import { useEffect, useState } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { Link, useNavigate } from "react-router";
import DefaultLayout from "../../layout/DefaultLayout";
import { ensureUser, idOf, supabase } from "../../lib/supabase";
import { BTN, INPUT, Spot, WATER, Water } from "../../lib/game";

const pin = (emoji: string) =>
  L.divIcon({
    className: "",
    html: `<div style="font-size:36px;filter:drop-shadow(0 2px 3px #000)">${emoji}</div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 36],
  });

/** Lokasi user realtime (GPS watch) */
function Locate() {
  const map = useMap();
  const [pos, setPos] = useState<L.LatLng | null>(null);
  useEffect(() => {
    let first = true;
    const onFound = (e: L.LocationEvent) => {
      setPos(e.latlng);
      if (first) { first = false; map.flyTo(e.latlng, 14); }
    };
    map.on("locationfound", onFound);
    map.locate({ watch: true, enableHighAccuracy: true });
    return () => { map.off("locationfound", onFound); map.stopLocate(); };
  }, [map]);
  return pos ? <Marker position={pos} icon={pin("📍")} interactive={false} /> : null;
}

function Picker({ onPick }: { onPick: (p: { lat: number; lng: number }) => void }) {
  useMapEvents({ click: (e) => onPick({ lat: e.latlng.lat, lng: e.latlng.lng }) });
  return null;
}

export default function MapPage() {
  const nav = useNavigate();
  const [spots, setSpots] = useState<Spot[]>([]);
  const [draft, setDraft] = useState<{ lat: number; lng: number } | null>(null);
  const [sel, setSel] = useState<Spot | null>(null);
  const [name, setName] = useState("");
  const [water, setWater] = useState<Water>("sungai");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  // load + realtime: spot baru dari siapa pun langsung muncul
  useEffect(() => {
    supabase.from("spots").select("*").then(({ data }) => setSpots((data ?? []) as unknown as Spot[]));
    const ch = supabase
      .channel("spots-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "spots" }, (p) => {
        const row = (p.eventType === "DELETE" ? p.old : p.new) as unknown as Spot;
        setSpots((prev) => {
          const rest = prev.filter((s) => s.id !== row.id);
          return p.eventType === "DELETE" ? rest : [...rest, row];
        });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const saveSpot = async () => {
    if (!draft || !name.trim()) { setErr("Isi nama spot dulu ya"); return; }
    setBusy(true); setErr("");
    try {
      const uid = await ensureUser();
      const { data, error } = await supabase.from("spots")
        .insert({ name: name.trim(), lat: draft.lat, lng: draft.lng, water_type: water, created_by: uid })
        .select().single();
      if (error) throw error;
      const s = data as unknown as Spot;
      setSpots((p) => [...p.filter((x) => x.id !== s.id), s]);
      setSel(s); setDraft(null); setName("");
    } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  };

  const start = async () => {
    if (!sel) return;
    setBusy(true); setErr("");
    try {
      const uid = await ensureUser();
      const { data: act } = await supabase.from("sessions").select("id").eq("user_id", uid).eq("status", "active").limit(1).maybeSingle();
      if (act) { nav(`/sesi/${idOf(act)}`); return; }
      const { data, error } = await supabase.from("sessions").insert({ user_id: uid, spot_id: sel.id }).select("id").single();
      if (error) throw error;
      nav(`/sesi/${idOf(data)}`);
    } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  };

  return (
    <DefaultLayout>
      <div className="relative h-[calc(100dvh-5rem)]">
        <MapContainer center={[-2.5, 118]} zoom={5} zoomControl={false} className="h-full w-full">
          <TileLayer attribution="&copy; OpenStreetMap" url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Locate />
          <Picker onPick={(p) => { setDraft(p); setSel(null); setErr(""); }} />
          {spots.map((s) => (
            <Marker key={s.id} position={[s.lat, s.lng]} icon={pin("⚓")}
              eventHandlers={{ click: () => { setSel(s); setDraft(null); setErr(""); } }} />
          ))}
          {draft && <Marker position={[draft.lat, draft.lng]} icon={pin("✨")} />}
        </MapContainer>

        {!draft && !sel && (
          <div className="absolute inset-x-3 top-3 z-[1100] rounded-2xl bg-slate-900/90 p-3 text-center text-lg">
            👆 Ketuk peta untuk pasang pin spot baru, atau pilih ⚓
          </div>
        )}

        {(draft || sel) && (
          <div className="absolute inset-x-3 bottom-3 z-[1100] space-y-3 rounded-3xl border-2 border-amber-400 bg-slate-900 p-5 shadow-2xl">
            {draft && (
              <>
                <p className="font-game text-2xl text-amber-300">✨ Spot Baru</p>
                <p className="text-base text-slate-400">{draft.lat.toFixed(5)}, {draft.lng.toFixed(5)}</p>
                <input className={INPUT} placeholder="Nama spot" value={name} onChange={(e) => setName(e.target.value)} />
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(WATER) as Water[]).map((w) => (
                    <button key={w} onClick={() => setWater(w)}
                      className={`rounded-2xl border-2 p-3 text-lg ${water === w ? "border-amber-400 bg-amber-500/20" : "border-slate-700"}`}>
                      {WATER[w]}
                    </button>
                  ))}
                </div>
                <button className={BTN} disabled={busy} onClick={saveSpot}>📌 Simpan Spot</button>
              </>
            )}
            {sel && (
              <>
                <p className="font-game text-3xl text-amber-300">{sel.name}</p>
                <p className="text-lg">{WATER[sel.water_type]} · ⭐ {sel.rating_count ? Number(sel.rating_avg).toFixed(1) : "-"} ({sel.rating_count})</p>
                <Link to={`/spot/${sel.id}`} className="block rounded-2xl border-2 border-cyan-700 p-3 text-center text-lg text-cyan-300">🖼️ Lihat galeri tangkapan</Link>
                <button className={BTN} disabled={busy} onClick={start}>🎣 MULAI MANCING</button>
              </>
            )}
            {err && <p className="text-lg text-red-300">{err}</p>}
            <button className="w-full p-2 text-lg text-slate-400" onClick={() => { setDraft(null); setSel(null); }}>Tutup</button>
          </div>
        )}
      </div>
    </DefaultLayout>
  );
}
