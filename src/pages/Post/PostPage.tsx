import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import DefaultLayout from "../../layout/DefaultLayout";
import PostCard, { type Post } from "../../components/PostCard";
import { supabase } from "../../lib/supabase";
import { useMe } from "../../lib/useMe";

export default function PostPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const { me } = useMe();
  const [post, setPost] = useState<Post | null>(null);
  const [liked, setLiked] = useState(false);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    if (!id || !me) return;
    Promise.all([
      supabase.from("catch_feed").select("*").eq("id", id).maybeSingle(),
      supabase.from("catch_likes").select("catch_id").eq("catch_id", id).eq("user_id", me.id).maybeSingle(),
    ]).then(([a, b]) => {
      if (a.data) { setPost(a.data as unknown as Post); setLiked(!!b.data); } else setMissing(true);
    });
  }, [id, me]);

  return (
    <DefaultLayout>
      <div className="mx-auto max-w-xl space-y-4 p-4">
        <Link to="/feed" className="text-lg text-cyan-300">← FYP</Link>
        {missing && <p className="text-lg text-slate-300">Postingan tidak ditemukan atau sudah dihapus.</p>}
        {post && me && <PostCard key={post.id} post={post} meId={me.id} liked={liked} onDeleted={() => nav("/feed")} />}
      </div>
    </DefaultLayout>
  );
}
