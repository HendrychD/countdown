import { useState, useEffect, useMemo, useRef, memo } from "react";
import confetti from "canvas-confetti";

const DEADLINE = new Date("2026-05-31T23:59:59").getTime();
const PROJECT_START = new Date("2026-04-01T00:00:00").getTime();

function useCountdown() {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const diff = Math.max(0, DEADLINE - now);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  const done = diff === 0;

  const totalDuration = DEADLINE - PROJECT_START;
  const elapsed = now - PROJECT_START;
  const progress = Math.min(1, Math.max(0, elapsed / totalDuration));

  return { days, hours, minutes, seconds, done, progress };
}

function pad(n) {
  return String(n).padStart(2, "0");
}

// NerveMeter — all animations via CSS
const NerveMeter = memo(function NerveMeter({ progress }) {
  const nerveLevel = 1 - progress;
  const nervePct = Math.round(nerveLevel * 100);

  const emoji =
    nerveLevel > 0.8 ? "🤬"
    : nerveLevel > 0.6 ? "😡"
    : nerveLevel > 0.4 ? "😰"
    : nerveLevel > 0.2 ? "😌"
    : "😎";

  const indicatorColor =
    nerveLevel > 0.6 ? "#d7434d" : nerveLevel > 0.3 ? "#ffb700" : "#3d9e35";

  return (
    <div className="absolute right-6 top-0 bottom-0 flex flex-col items-center py-10 z-10">
      <div className="text-xs font-bold tracking-[0.2em] uppercase mb-3 text-primary-50 css-pulse">
        Nervo-metr
      </div>

      <div className="relative w-7 flex-1 rounded-full overflow-visible">
        <div
          className="absolute inset-0 rounded-full border border-primary-10 shadow-inner"
          style={{
            background: "linear-gradient(to top, #3d9e35, #a3d935, #ffb700, #f06530, #d7434d)",
          }}
        />

        {[0, 25, 50, 75, 100].map((tick) => (
          <div
            key={tick}
            className="absolute left-0 right-0 h-px bg-white-30"
            style={{ bottom: `${tick}%` }}
          />
        ))}

        <div
          className="absolute right-full flex items-center"
          style={{
            bottom: `${nervePct}%`,
            transform: "translateY(50%)",
          }}
        >
          <div className="text-3xl mr-1 css-breathe">{emoji}</div>
          <div
            className="w-0 h-0"
            style={{
              borderTop: "10px solid transparent",
              borderBottom: "10px solid transparent",
              borderLeft: `10px solid ${indicatorColor}`,
            }}
          />
        </div>

        <div
          className="absolute left-[-4px] right-[-4px] h-[3px] rounded-full"
          style={{
            bottom: `${nervePct}%`,
            transform: "translateY(50%)",
            background: indicatorColor,
            boxShadow: `0 0 10px ${indicatorColor}`,
          }}
        />
      </div>

      <div className="text-sm font-bold mt-2" style={{ color: indicatorColor }}>
        {nervePct}%
      </div>
    </div>
  );
});

// Simple countdown digit — no framer-motion, just CSS transition
const TimeBlock = memo(function TimeBlock({ value, label }) {
  return (
    <div className="flex flex-col items-center">
      <div className="bg-white-95 rounded-2xl lg:rounded-3xl shadow-xl border border-primary-10 w-[72px] h-[62px] sm:w-[90px] sm:h-[75px] md:w-[110px] md:h-[90px] lg:w-[180px] lg:h-[150px] ls:w-[80px] ls:h-[52px] flex items-center justify-center">
        <div
          className="text-3xl sm:text-4xl md:text-5xl lg:text-8xl ls:text-2xl font-extrabold text-primary tabular-nums tracking-tight leading-none text-center"
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {pad(value)}
        </div>
      </div>
      <div className="text-[10px] sm:text-xs md:text-xs lg:text-base ls:text-[8px] font-semibold text-primary-50 mt-1 lg:mt-3 ls:mt-0.5 uppercase tracking-widest">
        {label}
      </div>
    </div>
  );
});

// Simple CSS banknote — no child elements for performance
function Banknote({ width = 40, height = 20, style = {} }) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: 2,
        background: "linear-gradient(135deg, #85bb65 0%, #6a9e4f 30%, #4e8a3a 60%, #6a9e4f 100%)",
        border: "1px solid #3d7a2a",
        boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
        ...style,
      }}
    />
  );
}

// Falling banknote — pure CSS animation
function FallingBanknote({ id }) {
  const startX = useMemo(() => 10 + Math.random() * 40, []);
  const fallDuration = useMemo(() => 3 + Math.random() * 2, []);
  const initialDelay = useMemo(() => Math.random() * 4, []);
  const repeatDelay = useMemo(() => 3 + Math.random() * 5, []);
  const totalDuration = fallDuration + repeatDelay;

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: `${startX}%`,
        top: -30,
        zIndex: 1,
        animation: `banknote-fall ${totalDuration}s ${initialDelay}s infinite ease-in`,
        willChange: "transform",
      }}
    >
      <div style={{
        animation: `banknote-spin ${fallDuration}s ${initialDelay}s infinite linear`,
      }}>
        <Banknote width={30} height={14} />
      </div>
    </div>
  );
}

// Money pile — reduced DOM: 15 rows × 2 notes = 30 elements (was 150)
const MoneyPile = memo(function MoneyPile({ progress }) {
  const savedAmount = Math.round(progress * 1000000);
  const formatted = new Intl.NumberFormat("cs-CZ").format(savedAmount);
  const pileHeight = Math.round(progress * 100);

  const particles = useMemo(
    () => Array.from({ length: 3 }, (_, i) => i),
    []
  );

  const pileRows = useMemo(
    () =>
      Array.from({ length: 15 }, (_, row) =>
        Array.from({ length: 2 }, (_, col) => ({
          id: row * 2 + col,
          offsetX: (col - 0.5) * 20 + (Math.random() - 0.5) * 6,
          rotate: (Math.random() - 0.5) * 20,
        }))
      ),
    []
  );

  return (
    <div className="absolute left-4 top-0 bottom-0 flex flex-col items-center py-10 z-10 w-20">
      <div className="text-xs font-bold tracking-[0.2em] uppercase mb-3 text-primary-50 css-pulse">
        Úspory
      </div>

      <div className="mb-2" />

      <div className="relative flex-1 w-full overflow-hidden rounded-2xl"
        style={{ background: "rgba(0,0,0,0.03)" }}
      >
        {particles.map((id) => (
          <FallingBanknote key={id} id={id} />
        ))}

        <div
          className="absolute bottom-0 left-0 right-0"
          style={{ height: `${pileHeight}%`, zIndex: 10, overflow: "hidden", transition: "height 2s ease-out" }}
        >
          <div className="absolute bottom-0 left-0 right-0 flex flex-col-reverse items-center"
            style={{ minHeight: "100%" }}
          >
            {pileRows.map((row, rowIdx) => (
              <div
                key={rowIdx}
                style={{
                  position: "relative",
                  width: "100%",
                  height: 12,
                  flexShrink: 0,
                }}
              >
                {row.map((note) => (
                  <div
                    key={note.id}
                    style={{
                      position: "absolute",
                      left: "50%",
                      top: 0,
                      transform: `translateX(calc(-50% + ${note.offsetX}px)) rotate(${note.rotate}deg)`,
                    }}
                  >
                    <Banknote width={30} height={14} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="absolute inset-0 rounded-2xl border border-primary-10 shadow-inner" style={{ zIndex: 5 }} />
      </div>

      <div className="text-xs font-bold mt-2 text-accent-orange whitespace-nowrap css-breathe">
        {formatted} Kč
      </div>
    </div>
  );
});

// Canvas-confetti celebration
function useConfettiBurst() {
  const hasFired = useRef(false);

  useEffect(() => {
    if (hasFired.current) return;
    hasFired.current = true;

    const scalar = 3;
    const shapes = [
      confetti.shapeFromText({ text: "💸", scalar }),
      confetti.shapeFromText({ text: "💵", scalar }),
      confetti.shapeFromText({ text: "💰", scalar }),
    ];

    const defaults = {
      spread: 160,
      ticks: 150,
      gravity: 0.6,
      decay: 0.94,
      startVelocity: 40,
      shapes,
      scalar,
      zIndex: 200,
    };

    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        confetti({
          ...defaults,
          particleCount: 40,
          origin: { x: 0.2 + Math.random() * 0.6, y: 0.3 + Math.random() * 0.3 },
        });
      }, i * 500);
    }

    const interval = setInterval(() => {
      confetti({
        ...defaults,
        particleCount: 15,
        spread: 100,
        startVelocity: 30,
        origin: { x: Math.random(), y: -0.05 },
        gravity: 1,
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);
}

// Success state — CSS animations only
function SuccessState() {
  useConfettiBurst();

  return (
    <div className="w-screen h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 30%, #0f3460 70%, #1a1a2e 100%)",
      }}
    >
      <div className="text-center z-10">
        <div className="text-5xl md:text-8xl ls:text-3xl mb-4 md:mb-6 ls:mb-2 css-wiggle">
          🚀
        </div>

        <h1
          className="text-4xl sm:text-5xl md:text-7xl ls:text-2xl font-black mb-4 md:mb-6 ls:mb-2 css-breathe"
          style={{
            background: "linear-gradient(135deg, #FFD700, #FFA500, #FFD700)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            filter: "drop-shadow(0 0 30px rgba(255,215,0,0.5))",
          }}
        >
          MILIÓN JE DOMA!
        </h1>

        <p className="text-base sm:text-xl md:text-2xl ls:text-sm text-gold-light font-semibold mb-4 ls:mb-2 px-4">
          350 000 Kč ušetřeno. Nervy za 650 000 Kč zachráněny.
        </p>

        <div className="mt-6 md:mt-8 ls:mt-2 text-4xl md:text-6xl ls:text-2xl css-bounce">
          🎉🥳🎊
        </div>
      </div>

      <div className="absolute bottom-8 md:bottom-12 ls:bottom-3 left-0 right-0 px-6 md:px-12">
        <div className="w-full h-6 rounded-full overflow-hidden shadow-lg"
          style={{ background: "rgba(255,215,0,0.2)" }}
        >
          <div
            className="h-full rounded-full css-fill-bar"
            style={{
              background: "linear-gradient(90deg, #FFD700, #FFA500, #FFD700)",
            }}
          />
        </div>
        <div className="text-center mt-2 ls:mt-1 text-gold-light font-bold text-lg ls:text-sm">
          1 000 000 Kč — Mise splněna! ✅
        </div>
      </div>
    </div>
  );
}

// Background — pure CSS, no blur, no framer-motion
function AnimatedBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
      <div
        className="absolute rounded-full opacity-20 css-float-1"
        style={{
          width: "60vw",
          height: "60vh",
          background: "radial-gradient(circle, #e8eaff 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute rounded-full opacity-15 css-float-2"
        style={{
          width: "50vw",
          height: "50vh",
          right: 0,
          bottom: 0,
          background: "radial-gradient(circle, #fff3d6 0%, transparent 70%)",
        }}
      />
    </div>
  );
}

// Main countdown — no framer-motion
function CountdownState({ days, hours, minutes, seconds, progress }) {
  return (
    <div
      className="w-screen h-screen flex flex-col items-center justify-center px-4 sm:px-8 md:px-12 lg:px-24 relative"
      style={{
        background: "linear-gradient(160deg, #f2f3fd 0%, #ffffff 40%, #f2f3fd 100%)",
      }}
    >
      <AnimatedBackground />
      <div className="hidden lg:block">
        <MoneyPile progress={progress} />
      </div>
      <div className="hidden lg:block">
        <NerveMeter progress={progress} />
      </div>

      <div className="flex flex-col items-center gap-4 sm:gap-5 md:gap-6 lg:gap-8 ls:gap-2">
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl ls:text-xl font-extrabold text-primary leading-tight text-center">
          Už jen{" "}
          <span
            className="inline-block"
            style={{
              background: "linear-gradient(135deg, #21337b, #3b5bdb)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {days}
          </span>{" "}
          dní k{" "}
          <span className="inline-block relative css-glow">
            <span
              className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl ls:text-3xl uppercase font-black"
              style={{
                background: "linear-gradient(135deg, #FFD700, #FFA500, #FFD700)",
                backgroundSize: "200% 200%",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              MILIÓNU
            </span>
          </span>
        </h1>

        <div className="flex items-center gap-2 sm:gap-3 md:gap-4 lg:gap-6 ls:gap-1.5">
          <TimeBlock value={days} label="Dní" />
          <div className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl ls:text-xl font-bold text-primary-30 mt-[-12px] lg:mt-[-24px] ls:mt-[-8px]">:</div>
          <TimeBlock value={hours} label="Hodin" />
          <div className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl ls:text-xl font-bold text-primary-30 mt-[-12px] lg:mt-[-24px] ls:mt-[-8px]">:</div>
          <TimeBlock value={minutes} label="Minut" />
          <div className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl ls:text-xl font-bold text-primary-30 mt-[-12px] lg:mt-[-24px] ls:mt-[-8px]">:</div>
          <TimeBlock value={seconds} label="Sekund" />
        </div>

        <p className="text-sm sm:text-base md:text-lg lg:text-[1.7rem] ls:text-xs text-primary-60 font-medium text-center mt-2 ls:mt-1">
          Ušetříme{" "}
          <span className="font-bold text-primary">350 000 Kč</span> měsíčně a
          nervy v hodnotě{" "}
          <span className="font-bold text-accent-orange">650 000 Kč</span>.
        </p>
      </div>
    </div>
  );
}

export default function App() {
  const countdown = useCountdown();

  return countdown.done ? (
    <SuccessState />
  ) : (
    <CountdownState {...countdown} />
  );
}
