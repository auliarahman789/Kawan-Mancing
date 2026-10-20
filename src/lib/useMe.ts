import { useCallback, useEffect, useState } from "react";
import { ensureUser, supabase } from "./supabase";

export interface Me { id: string; xp: number; nickname: string; avatar: string }

export function useMe() {
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    try {
      const id = await ensureUser();
      await supabase.from("profiles").upsert({ id }, { onConflict: "id", ignoreDuplicates: true });
      const { data } = await supabase.from("profiles").select("xp,nickname,avatar").eq("id", id).maybeSingle();
      const p = data as { xp: number; nickname: string; avatar: string } | null;
      setMe({ id, xp: p?.xp ?? 0, nickname: p?.nickname ?? "Pemancing", avatar: p?.avatar ?? "🎣" });
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);
  return { me, error, reload };
}
