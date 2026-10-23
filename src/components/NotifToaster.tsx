import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { supabase } from "../lib/supabase";

interface Toast { avatar: string; text: string; to: string }
const TEXT = { like: "menyukai tangkapanmu ❤️", comment: "mengomentari tangkapanmu 💬", follow: "mulai mengikutimu 👤" } as const;

/** Satu langganan realtime untuk seluruh aplikasi: munculkan toast + kabari BellLink/NotifPage. */
export default function NotifToaster() {
  const nav = useNavigate();
  const [toast, setToast] = useState<Toast | null>(null);

  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let ch: ReturnType<typeof supabase.channel> | null = null;
    supabase.auth.getSession().then(({ data }) => {
      const uid = data.session?.user.id;
      if (!uid || !alive) return;
      ch = supabase
        .channel(`notif-${uid}`)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${uid}` }, async (p) => {
          const n = p.new as unknown as { type: keyof typeof TEXT; actor_id: string; catch_id: string | null };
          window.dispatchEvent(new CustomEvent("notif:new"));
          const { data: a } = await supabase.from("profiles").select("nickname,avatar").eq("id", n.actor_id).maybeSingle();
          const who = a as unknown as { nickname: string; avatar: string } | null;
          setToast({
            avatar: who?.avatar ?? "🎣",
            text: `${who?.nickname ?? "Seseorang"} ${TEXT[n.type]}`,
            to: n.catch_id ? `/post/${n.catch_id}` : `/pemancing/${n.actor_id}`,
          });
          clearTimeout(timer);
          timer = setTimeout(() => setToast(null), 4500);
        })
        .subscribe();
    });
    return () => { alive = false; clearTimeout(timer); if (ch) supabase.removeChannel(ch); };
  }, []);

  if (!toast) return null;
  return (
    <button onClick={() => { nav(toast.to); setToast(null); }}
      className="fixed inset-x-3 top-3 z-[1500] flex items-center gap-3 rounded-2xl border-2 border-amber-400 bg-slate-900 p-4 text-left text-lg text-white shadow-2xl">
      <span className="text-3xl">{toast.avatar}</span>{toast.text}
    </button>
  );
}
