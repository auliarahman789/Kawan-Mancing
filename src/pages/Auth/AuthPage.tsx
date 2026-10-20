import { useState } from "react";
import { useNavigate } from "react-router";
import { ensureUser, supabase } from "../../lib/supabase";
import { BTN, INPUT } from "../../lib/game";

export default function AuthPage() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"masuk" | "daftar">("masuk");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setErr(""); setInfo("");
    if (!email.includes("@") || pw.length < 6) { setErr("Email valid & password min. 6 karakter"); return; }
    setBusy(true);
    try {
      if (mode === "masuk") {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: pw });
        if (error) throw error;
        nav("/");
      } else {
        const { data, error } = await supabase.auth.signUp({ email: email.trim(), password: pw });
        if (error) throw error;
        if (data.session) nav("/");
        else setInfo("Cek email Anda untuk konfirmasi, lalu masuk.");
      }
    } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  };

  const guest = async () => {
    setBusy(true); setErr("");
    try { await ensureUser(); nav("/"); }
    catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  };

  return (
    <div className="flex min-h-dvh flex-col justify-center gap-4 bg-slate-950 p-6 text-white">
      <div className="mx-auto w-full max-w-md space-y-4">
        <div className="text-center">
          <p className="text-7xl">🎣</p>
          <h1 className="font-game text-5xl text-amber-300">Kawan Mancing</h1>
          <p className="text-lg text-cyan-200">Pasang pin, tangkap ikan, naik level!</p>
        </div>

        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-900 p-1">
          {(["masuk", "daftar"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)}
              className={`rounded-xl p-3 font-game text-xl capitalize ${mode === m ? "bg-cyan-700" : "text-slate-400"}`}>
              {m}
            </button>
          ))}
        </div>

        <input className={INPUT} type="email" inputMode="email" autoComplete="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className={INPUT} type="password" autoComplete={mode === "masuk" ? "current-password" : "new-password"} placeholder="Password (min. 6)" value={pw} onChange={(e) => setPw(e.target.value)} />
        {err && <p className="text-lg text-red-300">{err}</p>}
        {info && <p className="text-lg text-emerald-300">{info}</p>}
        <button className={BTN} disabled={busy} onClick={submit}>{mode === "masuk" ? "MASUK" : "DAFTAR"}</button>

        <button className="w-full rounded-2xl border-2 border-slate-700 p-4 text-lg text-slate-300" disabled={busy} onClick={guest}>
          Coba dulu sebagai tamu
        </button>
        <p className="text-center text-base text-slate-500">Akun tamu bisa di-upgrade ke email di menu Profil tanpa kehilangan level.</p>
      </div>
    </div>
  );
}
