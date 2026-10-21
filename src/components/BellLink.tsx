import { useEffect, useState } from "react";
import { Link } from "react-router";
import { supabase } from "../lib/supabase";

export default function BellLink() {
  const [n, setN] = useState(0);
  useEffect(() => {
    supabase.from("notifications").select("id", { count: "exact", head: true }).eq("is_read", false).then(({ count }) => setN(count ?? 0));
  }, []);
  return (
    <Link to="/notifikasi" className="relative text-3xl" aria-label="Notifikasi">
      🔔{n > 0 && <span className="absolute -right-2 -top-1 rounded-full bg-red-500 px-1.5 text-sm text-white">{n > 9 ? "9+" : n}</span>}
    </Link>
  );
}
