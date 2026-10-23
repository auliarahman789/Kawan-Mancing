import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import NotifToaster from "./NotifToaster";

/** Halaman di dalamnya hanya bisa dibuka setelah login (akun atau tamu). */
export default function RequireAuth() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  if (session === undefined)
    return <div className="min-h-dvh bg-slate-950 p-10 text-center font-game text-2xl text-white">Memuat...</div>;
  return session ? <><NotifToaster /><Outlet /></> : <Navigate to="/masuk" replace />;
}
