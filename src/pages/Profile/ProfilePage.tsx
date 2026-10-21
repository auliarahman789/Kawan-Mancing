import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import type { User } from "@supabase/supabase-js";
import DefaultLayout from "../../layout/DefaultLayout";
import { supabase } from "../../lib/supabase";
import ProfileTabs from "../../components/ProfileTabs";
import { useMe } from "../../lib/useMe";
import { BTN, INPUT, levelFromXp, titleFor, xpForLevel } from "../../lib/game";

const AVATARS = ["🎣", "🐟", "🐠", "🦈", "🐙", "🦀", "⚓", "🚤"];

export default function ProfilePage() {
  const nav = useNavigate();
  const { me, reload } = useMe();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState({ n: 0, kg: 0, max: 0 });
  const [nick, setNick] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [fc, setFc] = useState({ er: 0, ing: 0 });

  useEffect(() => { supabase.auth.getUser().then(({ data }) => setUser(data.user)); }, []);
  useEffect(() => {
    if (!me) return;
    setNick(me.nickname);
    supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", me.id).then(({ count }) => setFc((c) => ({ ...c, er: count ?? 0 })));
    supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", me.id).then(({ count }) => setFc((c) => ({ ...c, ing: count ?? 0 })));
    supabase.from("catches").select("weight_kg").eq("user_id", me.id).is("deleted_at", null).then(({ data }) => {
      const w = ((data ?? []) as unknown as { weight_kg: number }[]).map((r) => Number(r.weight_kg));
      setStats({ n: w.length, kg: w.reduce((a, b) => a + b, 0), max: Math.max(0, ...w) });
    });
  }, [me]);

  const save = async (patch: { nickname?: string; avatar?: string }) => {
    if (!me) return;
    const { error } = await supabase.from("profiles").update(patch).eq("id", me.id);
    setMsg(error ? error.message : "Tersimpan ✅");
    reload();
  };

  // tamu -> akun email (user id sama, jadi XP & riwayat ikut terbawa)
  const upgrade = async () => {
    if (!email.includes("@") || pw.length < 6) { setMsg("Email valid & password min. 6 karakter"); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ email: email.trim(), password: pw });
    setMsg(error ? error.message : "Cek email untuk konfirmasi. Level & data Anda tetap aman ✅");
    setBusy(false);
  };

  const logout = async () => {
    if (user?.is_anonymous && !confirm("Akun tamu akan hilang permanen jika keluar. Lanjut?")) return;
    await supabase.auth.signOut();
    nav("/masuk");
  };

  const lvl = levelFromXp(me?.xp ?? 0);
  const pct = me ? Math.min(100, ((me.xp - xpForLevel(lvl)) / (xpForLevel(lvl + 1) - xpForLevel(lvl))) * 100) : 0;

  return (
    <DefaultLayout>
      <div className="mx-auto max-w-xl space-y-5 p-4">
        <header className="rounded-3xl border-2 border-amber-400 bg-gradient-to-br from-cyan-700 to-teal-900 p-5 text-center">
          <p className="text-7xl">{me?.avatar ?? "🎣"}</p>
          <p className="font-game text-3xl">{me?.nickname ?? "Memuat..."}</p>
          <p className="text-lg text-cyan-100">{user?.is_anonymous ? "Akun tamu" : user?.email}</p>
          <p className="text-lg">{fc.er} pengikut · {fc.ing} mengikuti</p>
          <p className="mt-2 font-game text-4xl text-amber-300">LV {lvl} · {titleFor(lvl)}</p>
          <div className="mt-2 h-4 overflow-hidden rounded-full bg-black/40">
            <div className="h-full bg-gradient-to-r from-amber-300 to-orange-500" style={{ width: `${pct}%` }} />
          </div>
        </header>

        <div className="grid grid-cols-3 gap-2 text-center">
          {[["🐟", stats.n, "Ikan"], ["⚖️", stats.kg.toFixed(1), "Total kg"], ["🏅", stats.max, "Terberat kg"]].map(([e, v, l]) => (
            <div key={String(l)} className="rounded-2xl bg-slate-800 p-3">
              <p className="text-3xl">{e}</p>
              <p className="font-game text-2xl text-amber-300">{v}</p>
              <p className="text-base text-slate-400">{l}</p>
            </div>
          ))}
        </div>

        <section className="space-y-3 rounded-3xl bg-slate-900 p-4">
          <p className="font-game text-2xl text-amber-300">Ubah Profil</p>
          <div className="flex flex-wrap gap-2">
            {AVATARS.map((a) => (
              <button key={a} onClick={() => save({ avatar: a })}
                className={`rounded-2xl border-2 p-2 text-4xl ${me?.avatar === a ? "border-amber-400" : "border-slate-700"}`}>{a}</button>
            ))}
          </div>
          <input className={INPUT} maxLength={20} placeholder="Nama pemancing" value={nick} onChange={(e) => setNick(e.target.value)} />
          <button className={BTN} onClick={() => nick.trim() && save({ nickname: nick.trim() })}>💾 Simpan</button>
        </section>

        {user?.is_anonymous && (
          <section className="space-y-3 rounded-3xl border-2 border-cyan-700 bg-slate-900 p-4">
            <p className="font-game text-2xl text-amber-300">Amankan Akun</p>
            <p className="text-lg text-slate-300">Daftarkan email supaya level tidak hilang & bisa login di HP lain.</p>
            <input className={INPUT} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input className={INPUT} type="password" placeholder="Password (min. 6)" value={pw} onChange={(e) => setPw(e.target.value)} />
            <button className={BTN} disabled={busy} onClick={upgrade}>🔐 Daftarkan Email</button>
          </section>
        )}

        {msg && <p className="text-center text-lg text-emerald-300">{msg}</p>}
        <button className="w-full rounded-2xl border-2 border-red-800 p-4 text-lg text-red-300" onClick={logout}>Keluar</button>

        {me && <ProfileTabs userId={me.id} meId={me.id} />}
      </div>
    </DefaultLayout>
  );
}
