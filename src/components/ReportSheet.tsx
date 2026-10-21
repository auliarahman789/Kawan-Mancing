import { useState } from "react";
import { supabase } from "../lib/supabase";

const REASONS = ["Spam / iklan", "Foto palsu / bukan hasil tangkapan", "Tidak pantas / kasar", "Lainnya"];

export default function ReportSheet({ target, onClose }: { target: { catchId?: string; commentId?: string }; onClose: () => void }) {
  const [msg, setMsg] = useState("");
  const send = async (reason: string) => {
    const { error } = await supabase.from("reports").insert({ catch_id: target.catchId ?? null, comment_id: target.commentId ?? null, reason });
    setMsg(error ? (error.code === "23505" ? "Kamu sudah melaporkan ini." : error.message) : "Terima kasih, laporan terkirim ✅");
  };
  return (
    <div className="fixed inset-0 z-[1400] flex items-end bg-black/70 p-3">
      <div className="w-full space-y-2 rounded-3xl border-2 border-amber-400 bg-slate-900 p-5">
        <p className="text-center font-game text-2xl text-amber-300">🚩 Laporkan</p>
        {msg ? <p className="py-3 text-center text-lg">{msg}</p> : REASONS.map((r) => (
          <button key={r} onClick={() => send(r)} className="w-full rounded-2xl border-2 border-slate-700 p-3 text-lg">{r}</button>
        ))}
        <button className="w-full p-2 text-lg text-slate-400" onClick={onClose}>{msg ? "Tutup" : "Batal"}</button>
      </div>
    </div>
  );
}
