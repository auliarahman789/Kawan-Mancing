import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL as string,
  import.meta.env.VITE_SUPABASE_ANON_KEY as string
);

/** Login anonim otomatis -> user langsung bisa main tanpa form daftar. */
export async function ensureUser(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  if (data.session) return data.session.user.id;
  const { data: d, error } = await supabase.auth.signInAnonymously();
  if (error || !d.user) throw error ?? new Error("Gagal masuk");
  return d.user.id;
}

export const idOf = (d: unknown) => (d as { id: string }).id;
