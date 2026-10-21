import { useEffect, useState } from "react";
import { Link } from "react-router";
import DefaultLayout from "../../layout/DefaultLayout";
import { supabase } from "../../lib/supabase";
import { ago } from "../../lib/game";

interface N {
  id: string; type: "like" | "comment" | "follow"; catch_id: string | null; actor_id: string;
  info: string | null; is_read: boolean; created_at: string; profiles: { nickname: string; avatar: string } | null;
}

export default function NotifPage() {
  const [items, setItems] = useState<N[] | null>(null);

  useEffect(() => {
    supabase.from("notifications")
      .select("id,type,catch_id,actor_id,info,is_read,created_at,profiles!actor_id(nickname,avatar)")
      .order("created_at", { ascending: false }).limit(30)
      .then(({ data }) => {
        const r = (data ?? []) as unknown as N[];
        setItems(r);
        if (r.some((x) => !x.is_read)) supabase.from("notifications").update({ is_read: true }).eq("is_read", false).then(() => {});
      });
  }, []);

  const text = (n: N) =>
    n.type === "like" ? "menyukai tangkapanmu ❤️" : n.type === "comment" ? `mengomentari: “${n.info ?? ""}”` : "mulai mengikutimu 👤";

  return (
    <DefaultLayout>
      <div className="mx-auto max-w-xl space-y-3 p-4">
        <h1 className="font-game text-3xl text-amber-300">🔔 Notifikasi</h1>
        {items?.length === 0 && <p className="py-8 text-center text-lg text-slate-400">Belum ada notifikasi.</p>}
        {items?.map((n) => (
          <Link key={n.id} to={n.catch_id ? `/post/${n.catch_id}` : `/pemancing/${n.actor_id}`}
            className={`flex items-center gap-3 rounded-2xl p-4 text-lg ${n.is_read ? "bg-slate-800" : "bg-amber-500/20"}`}>
            <span className="text-4xl">{n.profiles?.avatar ?? "🎣"}</span>
            <p className="flex-1"><b>{n.profiles?.nickname ?? "Pemancing"}</b> {text(n)}
              <span className="block text-base text-slate-400">{ago(n.created_at)}</span></p>
          </Link>
        ))}
      </div>
    </DefaultLayout>
  );
}
