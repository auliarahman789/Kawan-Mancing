import type { ReactNode } from "react";
import type { Water } from "../lib/game";

const H = 160; // garis cakrawala / permukaan air
const wave = (y: number, a: number, p: number) =>
  `M0 ${y} ` + Array.from({ length: Math.ceil(560 / p) + 1 }, () => `q${p / 4} ${-a} ${p / 2} 0 t${p / 2} 0`).join(" ");

const SKY: Record<Water, [string, string]> = {
  sungai: ["#38bdf8", "#bbf7d0"],
  laut: ["#38bdf8", "#e0f2fe"],
  danau: ["#60a5fa", "#e0f2fe"],
  kolam: ["#6ee7b7", "#fef9c3"],
};
export type Weather = "cerah" | "mendung" | "hujan" | "badai";
type Period = "pagi" | "siang" | "sore" | "malam";
const periodOf = (h: number): Period => (h >= 5 && h < 9 ? "pagi" : h >= 9 && h < 15 ? "siang" : h >= 15 && h < 18 ? "sore" : "malam");
const SKY_T: Record<Exclude<Period, "siang">, [string, string]> = {
  pagi: ["#c4b5fd", "#fed7aa"], sore: ["#fb923c", "#fde68a"], malam: ["#0f172a", "#1e3a8a"],
};
const GREY: Record<Exclude<Weather, "cerah">, [string, string]> = {
  mendung: ["#94a3b8", "#cbd5e1"], hujan: ["#64748b", "#94a3b8"], badai: ["#334155", "#64748b"],
};
const WATER: Record<Water, string> = { sungai: "#0ea5e9", laut: "#0369a1", danau: "#2563eb", kolam: "#166534" };

const CSS = `
.sway{transform-box:fill-box;transform-origin:50% 100%;animation:sway 4s ease-in-out infinite}
@keyframes sway{0%,100%{transform:rotate(-3deg)}50%{transform:rotate(3deg)}}
.flow{animation:flow 3s linear infinite}.f2{animation-duration:4.5s}.f3{animation-duration:6s}
@keyframes flow{to{transform:translateX(-80px)}}
.drift{animation:drift 50s linear infinite}
@keyframes drift{from{transform:translateX(-60px)}to{transform:translateX(460px)}}
.bobY{animation:bobY 3s ease-in-out infinite}
@keyframes bobY{50%{transform:translateY(4px)}}
.bite{animation:bite 6s ease-in-out infinite}
@keyframes bite{0%,80%,100%{transform:translateY(0)}84%{transform:translateY(7px)}88%{transform:translateY(1px)}92%{transform:translateY(6px)}}
.pulse{transform-box:fill-box;transform-origin:center;animation:pulse 4s ease-in-out infinite}
@keyframes pulse{50%{transform:scale(1.12)}}
.ripple{transform-box:fill-box;transform-origin:center;animation:ripple 3s ease-out infinite}
@keyframes ripple{from{transform:scale(.3);opacity:.8}to{transform:scale(1.8);opacity:0}}
.jump{animation:jump 6s linear infinite}
@keyframes jump{0%,72%,100%{opacity:0;transform:translate(0,0) rotate(0)}76%{opacity:1;transform:translate(10px,-24px) rotate(-35deg)}82%{opacity:1;transform:translate(22px,0) rotate(35deg)}84%{opacity:0}}
.twinkle{animation:twinkle 2.5s ease-in-out infinite}
@keyframes twinkle{50%{opacity:.2}}
.rain{animation:rain .8s linear infinite}
@keyframes rain{to{transform:translate(-30px,350px)}}
.flash{opacity:0;animation:flash 7s infinite}
@keyframes flash{0%,89%,100%{opacity:0}90%{opacity:.8}91%{opacity:.1}92%{opacity:.6}94%{opacity:0}}
.reel{opacity:0;animation:reel 1.8s ease-out 1 forwards}
@keyframes reel{0%{opacity:0;transform:translateY(0) scale(.4)}35%{opacity:1;transform:translateY(-70px) scale(1.4) rotate(-15deg)}70%{opacity:1;transform:translateY(-50px) scale(1.3) rotate(15deg)}100%{opacity:0;transform:translateY(-10px) scale(.6)}}
.splash{transform-box:fill-box;transform-origin:center;animation:splash 1s ease-out 1 forwards}
@keyframes splash{from{transform:scale(.3);opacity:1}to{transform:scale(2.2);opacity:0}}
.driftL{animation:driftL 12s linear infinite}
@keyframes driftL{from{transform:translateX(460px)}to{transform:translateX(-60px)}}
.rise{animation:rise 4s ease-in infinite}
@keyframes rise{from{transform:translateY(0);opacity:.7}to{transform:translateY(-110px);opacity:0}}
.flap{transform-box:fill-box;transform-origin:center;animation:flap .6s ease-in-out infinite}
@keyframes flap{50%{transform:scaleY(.35)}}
.wag{transform-box:fill-box;transform-origin:center;animation:wag .6s ease-in-out infinite}
@keyframes wag{50%{transform:rotate(5deg)}}
.dolphin{opacity:0;animation:dolphin 9s ease-in-out infinite}
@keyframes dolphin{0%,68%,100%{opacity:0;transform:translate(-30px,10px) rotate(-30deg)}74%{opacity:1;transform:translate(0,-45px) rotate(-10deg)}82%{opacity:1;transform:translate(35px,-10px) rotate(40deg)}86%{opacity:0;transform:translate(50px,15px) rotate(60deg)}}
.firefly{animation:twinkle 2s ease-in-out infinite,float 5s ease-in-out infinite}
@keyframes float{50%{transform:translate(8px,-10px)}}
@media (prefers-reduced-motion:reduce){.scene *{animation:none!important}}
`;

const Tree = ({ x, s = 1 }: { x: number; s?: number }) => (
  <g transform={`translate(${x} ${H}) scale(${s})`}>
    <g className="sway">
      <rect x="-4" y="-40" width="8" height="40" fill="#78350f" />
      <circle cx="0" cy="-56" r="24" fill="#15803d" />
      <circle cx="-14" cy="-42" r="16" fill="#16a34a" />
      <circle cx="14" cy="-42" r="16" fill="#22c55e" />
    </g>
  </g>
);

const Pine = ({ x, s = 1 }: { x: number; s?: number }) => (
  <g transform={`translate(${x} ${H}) scale(${s})`}>
    <g className="sway">
      <rect x="-3" y="-14" width="6" height="14" fill="#78350f" />
      <path d="M0 -72 L-18 -30 H18Z" fill="#166534" />
      <path d="M0 -50 L-22 -12 H22Z" fill="#15803d" />
    </g>
  </g>
);

const Reed = ({ x, h }: { x: number; h: number }) => (
  <g transform={`translate(${x} ${H + 4})`}>
    <g className="sway">
      <line x1="0" y1="0" x2="0" y2={-h} stroke="#65a30d" strokeWidth="3" />
      <rect x="-3" y={-h - 6} width="6" height="16" rx="3" fill="#92400e" />
    </g>
  </g>
);

const Cloud = ({ y, dur, delay, c }: { y: number; dur: number; delay: number; c: string }) => (
  <g className="drift" style={{ animationDuration: `${dur}s`, animationDelay: `${delay}s` }}>
    <ellipse cx="0" cy={y} rx="26" ry="10" fill={c} opacity=".85" />
    <ellipse cx="14" cy={y - 6} rx="16" ry="9" fill={c} opacity=".85" />
  </g>
);

const Waves = () => (
  <g fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity=".4">
    <path className="flow" d={wave(H + 16, 4, 80)} />
    <g transform="translate(-30 0)"><path className="flow f2" d={wave(H + 36, 5, 80)} /></g>
    <g transform="translate(-55 0)"><path className="flow f3" d={wave(H + 58, 4, 80)} /></g>
  </g>
);

const FISH: Record<Water, string> = { sungai: "#e2e8f0", laut: "#fde68a", danau: "#fdba74", kolam: "#fb923c" };

const Fish = ({ c, s = 1 }: { c: string; s?: number }) => (
  <g transform={`scale(${s})`} opacity=".85">
    <g className="wag">
      <ellipse rx="22" ry="10" fill={c} />
      <path d="M-20 0 L-36 -10 V10Z" fill={c} />
    </g>
    <circle cx="12" cy="-2" r="2.2" fill="#0f172a" />
  </g>
);

const Bird = () => (
  <g className="flap">
    <path d="M-10 0 q5 -8 10 0 q5 -8 10 0" fill="none" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
  </g>
);

/** Pemancing + joran + pelampung yang sesekali tersentak (strike!) */
function Fisher({ x, y, bx, by }: { x: number; y: number; bx: number; by: number }) {
  return (
    <g>
      <g transform={`translate(${x} ${y})`}>
        <rect x="-9" y="-24" width="18" height="24" rx="5" fill="#ea580c" />
        <circle cx="0" cy="-31" r="7" fill="#fbbf24" />
        <path d="M-11 -34 h22 l-4 -7 h-14z" fill="#92400e" />
        <path d="M5 -16 L40 -48" stroke="#78350f" strokeWidth="2.5" strokeLinecap="round" />
      </g>
      <line x1={x + 40} y1={y - 48} x2={bx} y2={by} stroke="#fff" strokeWidth="1" opacity=".85" />
      <ellipse className="ripple" cx={bx} cy={by + 4} rx="12" ry="4" fill="none" stroke="#fff" strokeWidth="1.5" />
      <g transform={`translate(${bx} ${by})`}>
        <circle className="bite" r="4.5" fill="#ef4444" stroke="#fff" strokeWidth="1.5" />
      </g>
    </g>
  );
}

const Mound = () => <path d={`M0 330 V${H + 22} Q50 ${H} 110 ${H + 22} V330Z`} fill="#16a34a" />;

interface SceneProps { type: Water; timer?: ReactNode; children?: ReactNode; hour?: number; weather?: Weather; catchKey?: number }

export default function FishingScene({ type, timer, children, hour = 12, weather = "cerah", catchKey = 0 }: SceneProps) {
  const period = periodOf(hour);
  const [top, bottom] = weather !== "cerah" && period !== "malam" ? GREY[weather] : period === "siang" ? SKY[type] : SKY_T[period];
  const cloudC = weather === "cerah" ? "#fff" : weather === "mendung" ? "#cbd5e1" : "#64748b";
  const birdsOk = period !== "malam" && (weather === "cerah" || weather === "mendung");
  const [bx, by] = type === "laut" ? [205, 218] : [150, 200];
  const gid = `sky-${type}`;
  return (
    <div className="scene overflow-hidden rounded-3xl border-2 border-amber-400">
      <div className="relative h-80">
      <style>{CSS}</style>
      <svg viewBox="0 0 400 330" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={top} />
            <stop offset="1" stopColor={bottom} />
          </linearGradient>
        <linearGradient id="depth" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#000" stopOpacity="0" />
            <stop offset="1" stopColor="#000" stopOpacity=".35" />
          </linearGradient>
        </defs>
        <rect width="400" height="330" fill={`url(#${gid})`} />

        {period === "malam" && [[40, 30], [90, 55], [150, 25], [210, 60], [260, 30], [370, 75], [20, 85]].map(([x, y], i) => (
          <circle key={i} className="twinkle" style={{ animationDelay: `${-i * 0.5}s` }} cx={x} cy={y} r="1.6" fill="#fff" />
        ))}
        {(weather === "cerah" || weather === "mendung") &&
          (period === "malam" ? (
            <>
              <circle className="pulse" cx="330" cy="42" r="16" fill="#f8fafc" />
              <circle cx="338" cy="37" r="14" fill={top} />
            </>
          ) : period === "siang" ? (
            <circle className="pulse" cx="335" cy="42" r="20" fill="#fde047" opacity={weather === "mendung" ? 0.5 : 1} />
          ) : period === "pagi" ? (
            <circle className="pulse" cx="75" cy="125" r="22" fill="#fde68a" />
          ) : (
            <>
              <circle cx="300" cy="140" r="38" fill="#fdba74" opacity=".5" />
              <circle className="pulse" cx="300" cy="140" r="24" fill="#fb923c" />
            </>
          ))}
        <Cloud y={40} dur={50} delay={0} c={cloudC} />
        <Cloud y={72} dur={70} delay={-30} c={cloudC} />
        {birdsOk && [[46, 22, 0], [60, 26, -9], [52, 30, -16]].map(([y, d, dl], i) => (
          <g key={i} className="drift" style={{ animationDuration: `${d}s`, animationDelay: `${dl}s` }}>
            <g transform={`translate(0 ${y})`}><Bird /></g>
          </g>
        ))}

        {type === "sungai" && (
          <>
            <path d={`M0 ${H} Q80 105 170 140 T340 130 T400 145 V${H}Z`} fill="#4ade80" opacity=".55" />
            <rect y={H - 10} width="400" height="12" fill="#15803d" />
            <Tree x={20} s={1.2} /><Tree x={300} s={1.1} /><Tree x={348} s={0.85} /><Tree x={388} s={1} />
          </>
        )}
        {type === "danau" && (
          <>
            <path d={`M0 ${H} L70 95 L130 140 L200 80 L290 150 L340 110 L400 ${H}Z`} fill="#64748b" opacity=".6" />
            <Pine x={305} s={0.9} /><Pine x={350} s={1.2} /><Pine x={388} s={0.8} />
          </>
        )}
        {type === "kolam" && (
          <>
            <rect y={H - 8} width="400" height="10" fill="#4d7c0f" />
            <Reed x={300} h={46} /><Reed x={318} h={60} /><Reed x={352} h={50} /><Reed x={376} h={64} />
          </>
        )}

        <rect y={H} width="400" height={330 - H} fill={WATER[type]} />
        <Waves />
        <rect y={H} width="400" height={330 - H} fill="url(#depth)" />
        <g transform="translate(0 255)">
          <g className="drift" style={{ animationDuration: "18s" }}><Fish c={FISH[type]} s={1.5} /></g>
        </g>
        {[0, 1, 2].map((i) => (
          <g key={i} transform={`translate(0 ${286 + i * 9})`}>
            <g className="driftL" style={{ animationDuration: "12s", animationDelay: `${-i * 0.9}s` }}>
              <g transform="scale(-1 1)"><Fish c={FISH[type]} s={0.55} /></g>
            </g>
          </g>
        ))}
        {[150, 205, 265, 330, 372].map((x, i) => (
          <circle key={x} className="rise" style={{ animationDelay: `${-i * 1.1}s`, animationDuration: `${3 + i * 0.5}s` }}
            cx={x} cy={325} r={2 + (i % 3)} fill="none" stroke="#fff" strokeWidth="1" />
        ))}

        {type === "sungai" && (
          <g>
            {[0, -17, -34].map((d, i) => (
              <g key={i} className="drift" style={{ animationDuration: `${14 + i * 4}s`, animationDelay: `${d}s` }}>
                <ellipse cx="0" cy={186 + i * 14} rx="7" ry="3" fill="#a3e635" transform="rotate(-20)" />
              </g>
            ))}
          </g>
        )}
        {type === "danau" && (
          <>
            <ellipse className="ripple" cx="260" cy="205" rx="26" ry="6" fill="none" stroke="#fff" strokeWidth="1.5" />
            <ellipse className="ripple" style={{ animationDelay: "-1.5s" }} cx="320" cy="222" rx="30" ry="7" fill="none" stroke="#fff" strokeWidth="1.5" />
          </>
        )}
        {type === "kolam" && (
          <>
            <ellipse cx="225" cy="206" rx="20" ry="6" fill="#4ade80" />
            <circle cx="230" cy="202" r="4" fill="#f472b6" />
            <ellipse cx="300" cy="224" rx="22" ry="6" fill="#22c55e" />
            <g transform="translate(250 206)">
              <g className="jump"><ellipse rx="8" ry="4" fill="#fb923c" /><path d="M-8 0 l-6 -4 v8z" fill="#fb923c" /></g>
            </g>
          </>
        )}
        {type === "laut" && (
          <g transform="translate(270 190)">
            <text className="dolphin" fontSize="34" textAnchor="middle">🐬</text>
          </g>
        )}

        {type === "laut" ? (
          <g className="bobY">
            <path d="M80 196 h120 l-18 22 h-84z" fill="#92400e" />
            <path d="M80 196 h120" stroke="#fde68a" strokeWidth="3" />
            <Fisher x={115} y={196} bx={205} by={218} />
          </g>
        ) : (
          <>
            <Mound />
            <Fisher x={55} y={H + 11} bx={150} by={200} />
          </>
        )}
        {period === "malam" && <rect width="400" height="330" fill="#0b1226" opacity=".45" />}
        {period === "malam" && type !== "laut" && [[200, 140], [240, 120], [285, 150], [335, 130], [120, 115], [365, 110]].map(([x, y], i) => (
          <circle key={i} className="firefly" style={{ animationDelay: `${-i * 0.9}s` }} cx={x} cy={y} r="2.4" fill="#fde047" />
        ))}
        {period === "sore" && <rect width="400" height="330" fill="#f97316" opacity=".08" />}
        {(weather === "hujan" || weather === "badai") && (
          <g stroke="#bfdbfe" strokeWidth="1.2" opacity=".6">
            {Array.from({ length: 26 }, (_, i) => (
              <line key={i} className="rain" style={{ animationDelay: `${-(i % 7) * 0.15}s`, animationDuration: `${0.7 + (i % 4) * 0.1}s` }}
                x1={i * 16 + (i % 3) * 5} y1="-20" x2={i * 16 - 6 + (i % 3) * 5} y2="-6" />
            ))}
          </g>
        )}
        {weather === "badai" && <rect className="flash" width="400" height="330" fill="#fff" />}
        {catchKey > 0 && (
          <g key={catchKey} transform={`translate(${bx} ${by})`}>
            <ellipse className="splash" rx="14" ry="5" fill="none" stroke="#fff" strokeWidth="2" />
            <text className="reel" textAnchor="middle" fontSize="30">🐟</text>
          </g>
        )}
      </svg>

      {timer && <div className="absolute inset-x-0 top-2 flex justify-center">{timer}</div>}
      </div>
      {children && <div className="bg-slate-900/95 px-4 py-3 text-center text-white">{children}</div>}
    </div>
  );
}
