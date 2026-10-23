import { useState } from "react";
import { Link } from "react-router";
import { supabase } from "../lib/supabase";
import { ago } from "../lib/game";
import ReportSheet from "./ReportSheet";

export interface Post {
  id: string; user_id: string; spot_id: string; weight_kg: number; species: string | null;
  photo_url: string; caught_at: string; like_count: number; comment_count: number;
  nickname: string; avatar: string; spot_name: string;
}
interface Comment { id: string; user_id: string; body: string; created_at: string; profiles: { nickname: string; avatar: string } | null }

const CSEL = "id,user_id,body,created_at,profiles(nickname,avatar)";

export default function PostCard({ post, meId, liked: liked0, onDeleted }: { post: Post; meId: string; liked: boolean; onDeleted?: (id: string) => void }) {
  const [liked, setLiked] = useState(liked0);
  const [likes, setLikes] = useState(post.like_count);
  const [count, setCount] = useState(post.comment_count);
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [guest, setGuest] = useState(false);
  const [rep, setRep] = useState<{ catchId?: string; commentId?: string } | null>(null);
  const mine = post.user_id === meId;

  const toggleLike = async () => {
    const was = liked;
    setLiked(!was); setLikes((n) => n + (was ? -1 : 1));
    const { error } = was
      ? await supabase.from("catch_likes").delete().eq("catch_id", post.id).eq("user_id", meId)
      : await supabase.from("catch_likes").insert({ catch_id: post.id, user_id: meId });
    if (error) { setLiked(was); setLikes((n) => n + (was ? 1 : -1)); }
  };

  const toggleComments = async () => {
    const next = !open;
    setOpen(next);
    if (!next) return;
    const { data } = await supabase.from("catch_comments").select(CSEL).eq("catch_id", post.id).order("created_at");
    setComments((data ?? []) as unknown as Comment[]);
    const { data: s } = await supabase.auth.getSession();
    setGuest(!!s.session?.user.is_anonymous);
  };

  const send = async () => {
    const body = text.trim();
    if (!body) return;
    setBusy(true); setErr("");
    const { data, error } = await supabase.from("catch_comments").insert({ catch_id: post.id, user_id: meId, body }).select(CSEL).single();
    setBusy(false);
    if (error) { setErr(error.message); return; }
    setComments((c) => [...c, data as unknown as Comment]);
    setCount((n) => n + 1); setText("");
  };

  const delComment = async (id: string) => {
    const { error } = await supabase.from("catch_comments").delete().eq("id", id);
    if (!error) { setComments((c) => c.filter((x) => x.id !== id)); setCount((n) => n - 1); }
  };

  // soft delete: baris tetap ada (hash anti-duplikat), foto dihapus dari Storage. XP yang sudah didapat tidak ditarik.
  const removePost = async () => {
    if (!confirm("Hapus postingan ini? Foto akan dihapus permanen.")) return;
    const { error } = await supabase.from("catches").update({ deleted_at: new Date().toISOString() }).eq("id", post.id);
    if (error) { alert(error.message); return; }
    const path = post.photo_url.split("/catches/")[1];
    if (path) await supabase.storage.from("catches").remove([decodeURIComponent(path)]);
    onDeleted?.(post.id);
  };

  return (
    <article className="overflow-hidden rounded-3xl bg-slate-900">
      <div className="flex items-center gap-3 p-3">
        <Link to={`/pemancing/${post.user_id}`} className="flex items-center gap-2 text-lg font-semibold">
          <span className="text-3xl">{post.avatar}</span>{post.nickname}
        </Link>
        <Link to={`/spot/${post.spot_id}`} className="ml-auto truncate text-base text-cyan-300">📍 {post.spot_name}</Link>
        {mine
          ? <button onClick={removePost} className="text-xl" aria-label="Hapus postingan">🗑️</button>
          : <button onClick={() => setRep({ catchId: post.id })} className="text-xl" aria-label="Laporkan">🚩</button>}
      </div>
      <img src={post.photo_url} alt={post.species ?? "Tangkapan"} loading="lazy" decoding="async" className="aspect-square w-full bg-slate-800 object-cover" />
      <div className="space-y-2 p-3">
        <p className="text-xl">🐟 <b>{post.species || "Ikan"}</b> · {post.weight_kg} kg</p>
        <div className="flex items-center gap-5 text-2xl">
          <button onClick={toggleLike}>{liked ? "❤️" : "🤍"} <span className="text-lg">{likes}</span></button>
          <button onClick={toggleComments}>💬 <span className="text-lg">{count}</span></button>
          <span className="ml-auto text-base text-slate-400">{ago(post.caught_at)}</span>
        </div>
        {open && (
          <div className="space-y-2 border-t border-slate-800 pt-2">
            {comments.map((c) => (
              <div key={c.id} className="flex gap-2 text-lg">
                <span>{c.profiles?.avatar ?? "🎣"}</span>
                <p className="flex-1">
                  <Link to={`/pemancing/${c.user_id}`} className="font-semibold">{c.profiles?.nickname ?? "Pemancing"}</Link> {c.body}
                </p>
                {c.user_id === meId
                  ? <button onClick={() => delComment(c.id)} className="text-slate-500" aria-label="Hapus komentar">🗑️</button>
                  : <button onClick={() => setRep({ commentId: c.id })} className="text-slate-500" aria-label="Laporkan komentar">🚩</button>}
              </div>
            ))}
            {guest ? (
              <Link to="/profil" className="block rounded-2xl border-2 border-cyan-700 p-3 text-center text-lg text-cyan-300">
                🔐 Daftarkan email di Profil untuk ikut berkomentar
              </Link>
            ) : (
            <div className="flex gap-2">
              <input className="min-w-0 flex-1 rounded-2xl border-2 border-cyan-700 bg-slate-800 p-3 text-lg text-white placeholder:text-slate-500"
                maxLength={300} placeholder="Tulis komentar..." value={text} onChange={(e) => setText(e.target.value)} />
              <button className="rounded-2xl bg-amber-400 px-4 text-xl text-slate-900 disabled:opacity-50" disabled={busy} onClick={send}>➤</button>
            </div>
            )}
            {err && <p className="text-base text-red-300">{err}</p>}
          </div>
        )}
      </div>
      {rep && <ReportSheet target={rep} onClose={() => setRep(null)} />}
    </article>
  );
}
