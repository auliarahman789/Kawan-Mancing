import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import PostCard, { type Post } from "./PostCard";

const PAGE = 5; // jumlah foto per muat; berikutnya dimuat saat user scroll ke bawah

export interface PostFilter { spotId?: string; userId?: string; sort?: "baru" | "populer"; following?: boolean }

/** Daftar foto dengan infinite scroll. Beri `key` baru jika filter berubah. */
export default function PostList({ meId, filter, grid = false }: { meId: string; filter: PostFilter; grid?: boolean }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState<Post | null>(null);
  const busy = useRef(false);
  const offset = useRef(0);
  const sentinel = useRef<HTMLDivElement>(null);
  const { spotId, userId, sort, following } = filter;

  const loadMore = useCallback(async () => {
    if (busy.current) return;
    busy.current = true; setLoading(true);
    let ids: string[] | null = null;
    if (following) {
      const { data: fl } = await supabase.from("follows").select("following_id").eq("follower_id", meId);
      ids = ((fl ?? []) as unknown as { following_id: string }[]).map((x) => x.following_id);
      if (!ids.length) { setDone(true); busy.current = false; setLoading(false); return; }
    }
    const base = supabase.from("catch_feed").select("*");
    const f1 = spotId ? base.eq("spot_id", spotId) : base;
    const f1b = userId ? f1.eq("user_id", userId) : f1;
    const f2 = ids ? f1b.in("user_id", ids) : f1b;
    const ordered = sort === "populer"
      ? f2.order("like_count", { ascending: false }).order("caught_at", { ascending: false })
      : f2.order("caught_at", { ascending: false });
    const from = offset.current;
    const { data } = await ordered.range(from, from + PAGE - 1);
    const rows = (data ?? []) as unknown as Post[];
    offset.current += rows.length;
    if (rows.length) {
      const { data: l } = await supabase.from("catch_likes").select("catch_id").eq("user_id", meId).in("catch_id", rows.map((r) => r.id));
      const ids = ((l ?? []) as unknown as { catch_id: string }[]).map((x) => x.catch_id);
      setLiked((prev) => new Set([...prev, ...ids]));
    }
    setPosts((prev) => {
      const seen = new Set(prev.map((p) => p.id));
      return [...prev, ...rows.filter((r) => !seen.has(r.id))];
    });
    if (rows.length < PAGE) setDone(true);
    busy.current = false; setLoading(false);
  }, [spotId, userId, sort, following, meId]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el || done) return;
    const io = new IntersectionObserver((e) => { if (e[0].isIntersecting) loadMore(); }, { rootMargin: "150px" });
    io.observe(el);
    return () => io.disconnect();
  }, [loadMore, done, posts.length]);

  const gone = (id: string) => { setPosts((p) => p.filter((x) => x.id !== id)); setOpen(null); };

  return (
    <>
      <div className={grid ? "grid grid-cols-3 gap-1" : "space-y-4"}>
        {posts.map((p) =>
          grid ? (
            <button key={p.id} onClick={() => setOpen(p)} className="relative aspect-square overflow-hidden bg-slate-800">
              <img src={p.photo_url} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
              <span className="absolute bottom-1 right-1 rounded-full bg-black/60 px-2 text-sm">❤️ {p.like_count}</span>
            </button>
          ) : (
            <PostCard key={p.id} post={p} meId={meId} liked={liked.has(p.id)} onDeleted={gone} />
          )
        )}
      </div>
      {!done && <div ref={sentinel} className="py-6 text-center text-lg text-slate-400">{loading ? "Memuat..." : "⬇️ scroll untuk lainnya"}</div>}
      {done && posts.length === 0 && <p className="py-8 text-center text-lg text-slate-400">{following ? "Belum ada postingan dari pemancing yang kamu ikuti. Ikuti pemancing lain dari papan peringkat!" : "Belum ada foto tangkapan."}</p>}
      {done && posts.length > 0 && <p className="py-4 text-center text-slate-500">Sudah sampai akhir 🎣</p>}
      {open && (
        <div className="fixed inset-0 z-[1300] overflow-y-auto bg-black/85 p-3">
          <div className="mx-auto max-w-xl pb-8">
            <button className="mb-2 w-full p-3 text-xl text-white" onClick={() => setOpen(null)}>✖ Tutup</button>
            <PostCard post={open} meId={meId} liked={liked.has(open.id)} onDeleted={gone} />
          </div>
        </div>
      )}
    </>
  );
}
