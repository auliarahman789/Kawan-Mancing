import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import DefaultLayout from "../../layout/DefaultLayout";
import PostList from "../../components/PostList";
import { supabase } from "../../lib/supabase";
import { useMe } from "../../lib/useMe";
import { Spot, WATER } from "../../lib/game";

export default function SpotPage() {
  const { id } = useParams();
  const { me } = useMe();
  const [spot, setSpot] = useState<Spot | null>(null);
  useEffect(() => {
    if (!id) return;
    supabase.from("spots").select("*").eq("id", id).maybeSingle().then(({ data }) => setSpot(data as unknown as Spot | null));
  }, [id]);

  return (
    <DefaultLayout>
      <div className="mx-auto max-w-xl space-y-4 p-4">
        <Link to="/peta" className="text-lg text-cyan-300">← Kembali ke peta</Link>
        <header className="rounded-3xl border-2 border-amber-400 bg-gradient-to-br from-cyan-700 to-teal-900 p-5">
          <p className="font-game text-3xl">{spot?.name ?? "Memuat..."}</p>
          {spot && <p className="text-lg">{WATER[spot.water_type]} · ⭐ {spot.rating_count ? Number(spot.rating_avg).toFixed(1) : "-"} ({spot.rating_count})</p>}
        </header>
        <h2 className="font-game text-2xl text-amber-300">🖼️ Galeri Tangkapan</h2>
        {me && id && <PostList key={id} meId={me.id} filter={{ spotId: id }} grid />}
      </div>
    </DefaultLayout>
  );
}
