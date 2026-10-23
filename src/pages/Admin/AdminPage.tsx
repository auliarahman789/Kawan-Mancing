import { useEffect, useState } from "react";
import { Link } from "react-router";
import DefaultLayout from "../../layout/DefaultLayout";
import { supabase } from "../../lib/supabase";

interface Item {
  kind: "catch" | "comment"; id: string; photo_url: string | null; text: string; owner: string;
  hidden: boolean; count: number; reasons: string[]; catch_id?: string;
}
type Act = "hide" | "unhide" | "dismiss" | "delete";

export default function AdminPage() {
  const [items, setItems] = useState<Item[] | null>(null);
  const [err, setErr] = useState("");

  const load = async () => {
    const { data, error } = await supabase.rpc("admin_reports");
    if (error) { setErr(error.message.includes("Bukan admin") ? "Akses ditolak: akun ini bukan admin." : error.message); return; }
    setItems((data ?? []) as unknown as Item[]);
  };
  useEffect(() => { load(); }, []);

  const act = async (it: Item, a: Act) => {
    if (a === "delete" && !confirm("Hapus permanen item ini?")) return;
    const { error } = await supabase.rpc("admin_action", { kind: it.kind, item: it.id, act: a });
    if (error) { setErr(error.message); return; }
    if (a === "delete" && it.kind === "catch" && it.photo_url) {
      const path = it.photo_url.split("/catches/")[1];
      if (path) await supabase.storage.from("catches").remove([decodeURIComponent(path)]);
    }
    load();
  };

  const btn = "rounded-xl border-2 border-slate-600 px-3 py-2 text-base";
  return (
    <DefaultLayout>
      <div className="mx-auto max-w-xl space-y-3 p-4">
        <Link to="/profil" className="text-lg text-cyan-300">← Profil</Link>
        <h1 className="font-game text-3xl text-amber-300">🛡️ Moderasi Laporan</h1>
        {err && <p className="text-lg text-red-300">{err}</p>}
        {items?.length === 0 && <p className="py-8 text-center text-lg text-slate-400">Tidak ada laporan 🎉</p>}
        {items?.map((it) => (
          <div key={it.kind + it.id} className="space-y-2 rounded-2xl bg-slate-900 p-3">
            <div className="flex gap-3">
              {it.photo_url && <img src={it.photo_url} alt="" loading="lazy" className="h-24 w-24 shrink-0 rounded-xl object-cover" />}
              <div className="min-w-0 text-lg">
                <p className="text-base text-slate-400">{it.kind === "catch" ? "📷 Postingan" : "💬 Komentar"} · {it.owner}{it.hidden ? " · 🙈 disembunyikan" : ""}</p>
                <p>{it.text}</p>
                <p className="text-base text-amber-300">🚩 {it.count} laporan: {it.reasons.join(", ")}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button className={btn} onClick={() => act(it, "dismiss")}>✅ Abaikan</button>
              <button className={btn} onClick={() => act(it, it.hidden ? "unhide" : "hide")}>{it.hidden ? "👁️ Tampilkan" : "🙈 Sembunyikan"}</button>
              <button className={`${btn} border-red-800 text-red-300`} onClick={() => act(it, "delete")}>🗑️ Hapus</button>
              <Link to={`/post/${it.kind === "catch" ? it.id : it.catch_id}`} className={btn}>Lihat</Link>
            </div>
          </div>
        ))}
      </div>
    </DefaultLayout>
  );
}
