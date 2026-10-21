import { ReactNode } from "react";
import { NavLink } from "react-router";

const TABS = [
  { to: "/", icon: "🏠", label: "Beranda" },
  { to: "/feed", icon: "🔥", label: "FYP" },
  { to: "/peta", icon: "🗺️", label: "Peta" },
  { to: "/profil", icon: "👤", label: "Profil" },
];

export default function DefaultLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-slate-950 pb-20 text-white">
      {children}
      <nav className="fixed inset-x-0 bottom-0 z-[1200] grid h-20 grid-cols-4 border-t-2 border-cyan-800 bg-slate-900/95 backdrop-blur">
        {TABS.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end
            className={({ isActive }) =>
              `flex flex-col items-center justify-center text-lg font-game ${isActive ? "text-amber-300" : "text-slate-400"}`
            }
          >
            <span className="text-3xl">{t.icon}</span>
            {t.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
