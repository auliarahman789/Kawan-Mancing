import { useCallback, useEffect, useState } from "react";
import { Navigate, useParams } from "react-router";
import DefaultLayout from "../../layout/DefaultLayout";
import ProfileTabs from "../../components/ProfileTabs";
import { supabase } from "../../lib/supabase";
import { useMe } from "../../lib/useMe";
import { levelFromXp, titleFor, xpForLevel } from "../../lib/game";

export default function UserPage() {
  const { id } = useParams();
  const { me } = useMe();
  const [u, setU] = useState<{ nickname: string; avatar: string; xp: number } | null>(null);
  const [missing, setMissing] = useState(false);
  const [st, setSt] = useState({ n: 0, kg: 0, max: 0 });

  useEffect(() => {
    if (!id) return;
    supabase.from("profiles").select("nickname,avatar,xp").eq("id", id).maybeSingle().then(({ data }) => {
      if (data) setU(data as unknown as { nickname: string; avatar: string; xp: number });
      else setMissing(true);
    });
    supabase.from("catch_feed").select("weight_kg").eq("user_id", id).then(({ data }) => {
      const w = ((data ?? []) as unknown as { weight_kg: number }[]).map((r) => Number(r.weight_kg));
      setSt({ n: w.length, kg: w.reduce((a, b) => a + b, 0), max: Math.max(0, ...w) });
    });
  }, [id]);

  const [fol, setFol] = useState(false);
  const [cnt, setCnt] = useState({ er: 0, ing: 0 });
  const loadFollow = useCallback(async () => {
    if (!id || !me) return;
    const [a, b, c] = await Promise.all([
      supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", id),
      supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", id),
      supabase.from("follows").select("follower_id").eq("follower_id", me.id).eq("following_id", id).maybeSingle(),
    ]);
    setCnt({ er: a.count ?? 0, ing: b.count ?? 0 });
    setFol(!!c.data);
  }, [id, me]);
  useEffect(() => { loadFollow(); }, [loadFollow]);
  const toggleFollow = async () => {
    if (!me || !id) return;
    if (fol) await supabase.from("follows").delete().eq("follower_id", me.id).eq("following_id", id);
    else await supabase.from("follows").insert({ follower_id: me.id, following_id: id });
    loadFollow();
  };

  if (me && id === me.id) return <Navigate to="/profil" replace />;

  const lvl = levelFromXp(u?.xp ?? 0);
  const pct = u ? Math.min(100, ((u.xp - xpForLevel(lvl)) / (xpForLevel(lvl + 1) - xpForLevel(lvl))) * 100) : 0;

  return (
    <DefaultLayout>
      <div className="mx-auto max-w-xl space-y-5 p-4">
        {missing && <p className="text-lg text-red-300">Pemancing tidak ditemukan.</p>}
        <header className="rounded-3xl border-2 border-amber-400 bg-gradient-to-br from-cyan-700 to-teal-900 p-5 text-center">
          <p className="text-7xl">{u?.avatar ?? "🎣"}</p>
          <p className="font-game text-3xl">{u?.nickname ?? "Memuat..."}</p>
          <p className="text-lg">{cnt.er} pengikut · {cnt.ing} mengikuti</p>
          <button onClick={toggleFollow} className={`mt-2 rounded-2xl px-6 py-2 font-game text-xl ${fol ? "bg-slate-800 text-white" : "bg-amber-400 text-slate-900"}`}>
            {fol ? "✓ Mengikuti" : "+ Ikuti"}
          </button>
          <p className="mt-2 font-game text-4xl text-amber-300">LV {lvl} · {titleFor(lvl)}</p>
          <div className="mt-2 h-4 overflow-hidden rounded-full bg-black/40">
            <div className="h-full bg-gradient-to-r from-amber-300 to-orange-500" style={{ width: `${pct}%` }} />
          </div>
        </header>
        <div className="grid grid-cols-3 gap-2 text-center">
          {[["🐟", st.n, "Ikan"], ["⚖️", st.kg.toFixed(1), "Total kg"], ["🏅", st.max, "Terberat kg"]].map(([e, v, l]) => (
            <div key={String(l)} className="rounded-2xl bg-slate-800 p-3">
              <p className="text-3xl">{e}</p>
              <p className="font-game text-2xl text-amber-300">{v}</p>
              <p className="text-base text-slate-400">{l}</p>
            </div>
          ))}
        </div>
        {me && id && <ProfileTabs key={id} userId={id} meId={me.id} />}
      </div>
    </DefaultLayout>
  );
}
