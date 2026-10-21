import { useState } from "react";
import DefaultLayout from "../../layout/DefaultLayout";
import PostList from "../../components/PostList";
import BellLink from "../../components/BellLink";
import { useMe } from "../../lib/useMe";

const TABS = [["baru", "Terbaru"], ["populer", "Populer"], ["ikuti", "Mengikuti"]] as const;

export default function FeedPage() {
  const { me } = useMe();
  const [tab, setTab] = useState<"baru" | "populer" | "ikuti">("baru");
  return (
    <DefaultLayout>
      <div className="mx-auto max-w-xl space-y-4 p-4">
        <div className="flex items-center justify-between">
          <h1 className="font-game text-3xl text-amber-300">🔥 FYP Mancing</h1>
          <BellLink />
        </div>
        <div className="grid grid-cols-3 gap-2 rounded-2xl bg-slate-900 p-1">
          {TABS.map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} className={`rounded-xl p-3 font-game text-lg ${tab === k ? "bg-cyan-700" : "text-slate-400"}`}>{l}</button>
          ))}
        </div>
        {me && <PostList key={tab} meId={me.id} filter={{ sort: tab === "populer" ? "populer" : "baru", following: tab === "ikuti" }} />}
      </div>
    </DefaultLayout>
  );
}
