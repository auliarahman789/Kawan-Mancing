import { useEffect, useState } from "react";
import { Link } from "react-router";
import PostList from "./PostList";
import { supabase } from "../lib/supabase";
import { ago } from "../lib/game";

interface Row { id: string; body: string; created_at: string; catch_id: string }
interface Ctx { id: string; photo_url: string; nickname: string; spot_name: string }
const SIZE = 10;

function UserComments({ userId }: { userId: string }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [ctx, setCtx] = useState<Record<string, Ctx>>({});
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = async (from: number) => {
    setLoading(true);
    const { data } = await supabase.from("catch_comments").select("id,body,created_at,catch_id")
      .eq("user_id", userId).order("created_at", { ascending: false }).range(from, from + SIZE - 1);
    const r = (data ?? []) as unknown as Row[];
    if (r.length) {
      const { data: c } = await supabase.from("catch_feed").select("id,photo_url,nickname,spot_name").in("id", r.map((x) => x.catch_id));
      const m = Object.fromEntries(((c ?? []) as unknown as Ctx[]).map((x) => [x.id, x]));
      setCtx((p) => ({ ...p, ...m }));
    }
    setRows((p) => (from === 0 ? r : [...p, ...r]));
    if (r.length < SIZE) setDone(true);
    setLoading(false);
  };
  useEffect(() => { load(0); }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  const shown = rows.filter((r) => ctx[r.catch_id]);
  return (
    <div className="space-y-2">
      {shown.map((r) => {
        const c = ctx[r.catch_id];
        return (
          <Link key={r.id} to={`/post/${r.catch_id}`} className="flex gap-3 rounded-2xl bg-slate-800 p-3">
            <img src={c.photo_url} alt="" loading="lazy" className="h-16 w-16 shrink-0 rounded-xl object-cover" />
            <div className="min-w-0">
              <p className="text-base text-slate-400">di tangkapan {c.nickname} · 📍 {c.spot_name} · {ago(r.created_at)}</p>
              <p className="text-lg">{r.body}</p>
            </div>
          </Link>
        );
      })}
      {done && shown.length === 0 && <p className="py-8 text-center text-lg text-slate-400">Belum ada komentar.</p>}
      {!done && (
        <button className="w-full rounded-2xl border-2 border-cyan-700 p-3 text-lg text-cyan-300" disabled={loading} onClick={() => load(rows.length)}>
          {loading ? "Memuat..." : "Muat lebih banyak"}
        </button>
      )}
    </div>
  );
}

export default function ProfileTabs({ userId, meId }: { userId: string; meId: string }) {
  const [tab, setTab] = useState<"post" | "komen">("post");
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-900 p-1">
        {([["post", "📷 Postingan"], ["komen", "💬 Komentar"]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={`rounded-xl p-3 font-game text-xl ${tab === k ? "bg-cyan-700" : "text-slate-400"}`}>{l}</button>
        ))}
      </div>
      {tab === "post" ? <PostList key={userId} meId={meId} filter={{ userId }} grid /> : <UserComments key={userId} userId={userId} />}
    </div>
  );
}
