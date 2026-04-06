import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

const DEADLINE = new Date("2026-05-31T23:59:59").getTime();
// Project started ~April 6, used for progress bar
const PROJECT_START = new Date("2026-04-01T00:00:00").getTime();

function useCountdown() {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    // Sync to the next whole second boundary to prevent drift
    const msToNextSecond = 1000 - (Date.now() % 1000);
    const timeout = setTimeout(() => {
      setNow(Date.now());
      const interval = setInterval(() => setNow(Date.now()), 1000);
      return () => clearInterval(interval);
    }, msToNextSecond);

    // Also set immediately
    setNow(Date.now());

    return () => clearTimeout(timeout);
  }, []);

  // More robust: re-sync every tick
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

// Falling money particle
function MoneyParticle({ index, total }) {
  const symbols = ["💰", "💵", "💶", "🪙", "💎", "🏆"];
  const symbol = symbols[index % symbols.length];
  const x = (index / total) * 100;
  const delay = Math.random() * 3;
  const duration = 3 + Math.random() * 4;
  const size = 24 + Math.random() * 32;

  return (
    <motion.div
      className="fixed pointer-events-none"
      style={{ left: `${x}%`, fontSize: size, zIndex: 100 }}
      initial={{ top: -60, opacity: 1, rotate: 0 }}
      animate={{
        top: "110vh",
        opacity: [1, 1, 0.8, 0],
        rotate: [0, 180, 360],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: "linear",
      }}
    >
      {symbol}
    </motion.div>
  );
}

// Full-height thermometer nerve meter on the right side
// Nerves start HIGH (red, angry) and DECREASE (green, calm) as deadline approaches
// Needle has a jitter effect that increases in frequency as deadline approaches
function NerveMeter({ progress }) {
  const nerveLevel = 1 - progress;
  const nervePct = Math.round(nerveLevel * 100);

  const emoji =
    nerveLevel > 0.8
      ? "🤬"
      : nerveLevel > 0.6
      ? "😡"
      : nerveLevel > 0.4
      ? "😰"
      : nerveLevel > 0.2
      ? "😌"
      : "😎";

  const indicatorColor =
    nerveLevel > 0.6 ? "#d7434d" : nerveLevel > 0.3 ? "#ffb700" : "#3d9e35";

  return (
    <div className="absolute right-6 top-0 bottom-0 flex flex-col items-center py-10 z-10">
      <motion.div
        className="text-xs font-bold tracking-[0.2em] uppercase mb-3 text-primary/50"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        Nervo-metr
      </motion.div>

      <div className="relative w-7 flex-1 rounded-full overflow-visible">
        <div
          className="absolute inset-0 rounded-full border border-primary/10 shadow-inner"
          style={{
            background: "linear-gradient(to top, #3d9e35, #a3d935, #ffb700, #f06530, #d7434d)",
          }}
        />

        <div className="absolute inset-0 rounded-full overflow-hidden">
          <motion.div
            className="absolute left-0 right-0"
            style={{
              height: "200%",
              background:
                "linear-gradient(to top, transparent 0%, transparent 30%, rgba(255,255,255,0.35) 50%, transparent 70%, transparent 100%)",
            }}
            animate={{ y: ["100%", "-100%"] }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear", repeatDelay: 0 }}
          />
        </div>

        {[0, 25, 50, 75, 100].map((tick) => (
          <div
            key={tick}
            className="absolute left-0 right-0 h-px bg-white/30"
            style={{ bottom: `${tick}%` }}
          />
        ))}

        {/* Unified indicator: emoji + arrow + line — one block, moves only by nerve level */}
        <div
          className="absolute right-full flex items-center"
          style={{
            bottom: `${nervePct}%`,
            transform: "translateY(50%)",
          }}
        >
          <motion.div
            className="text-3xl mr-1"
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            {emoji}
          </motion.div>
          <div
            className="w-0 h-0"
            style={{
              borderTop: "10px solid transparent",
              borderBottom: "10px solid transparent",
              borderLeft: `10px solid ${indicatorColor}`,
            }}
          />
        </div>

        {/* Indicator line on the bar — same position, no jitter */}
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

      <div
        className="text-sm font-bold mt-2"
        style={{ color: indicatorColor }}
      >
        {nervePct}%
      </div>
    </div>
  );
}

// Countdown digit block with spring animation on change
function TimeBlock({ value, label }) {
  return (
    <div className="flex flex-col items-center">
      <div className="bg-white/95 backdrop-blur rounded-3xl shadow-xl border border-primary/10 w-[180px] h-[150px] flex items-center justify-center overflow-hidden">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={value}
            className="text-8xl font-extrabold text-primary tabular-nums tracking-tight leading-none text-center"
            style={{ fontVariantNumeric: "tabular-nums" }}
            initial={{ y: -30, scale: 1.2, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 30, scale: 0.8, opacity: 0 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 18,
              mass: 0.8,
            }}
          >
            {pad(value)}
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="text-base font-semibold text-primary/50 mt-3 uppercase tracking-widest">
        {label}
      </div>
    </div>
  );
}

// Realistic CSS banknote
function Banknote({ width = 40, height = 20, style = {}, className = "" }) {
  return (
    <div
      className={className}
      style={{
        width,
        height,
        borderRadius: 2,
        background: "linear-gradient(135deg, #85bb65 0%, #6a9e4f 30%, #4e8a3a 60%, #6a9e4f 100%)",
        border: "1px solid #3d7a2a",
        position: "relative",
        overflow: "hidden",
        boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
        ...style,
      }}
    >
      {/* Center circle */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: height * 0.6,
          height: height * 0.6,
          borderRadius: "50%",
          border: "1px solid rgba(255,255,255,0.25)",
          background: "rgba(255,255,255,0.08)",
        }}
      />
      {/* Border pattern */}
      <div
        style={{
          position: "absolute",
          inset: 2,
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 1,
        }}
      />
    </div>
  );
}

// Falling banknote — falls all the way to bottom, pile covers it
function FallingBanknote({ id }) {
  const startX = useMemo(() => 10 + Math.random() * 40, []);
  const fallDuration = useMemo(() => 2 + Math.random() * 1.5, []);
  const initialDelay = useMemo(() => Math.random() * 3, []);
  const repeatDelay = useMemo(() => 2 + Math.random() * 4, []);
  const totalDuration = fallDuration + repeatDelay;

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: `${startX}%`,
        top: -30,
        zIndex: 1,
        animation: `banknote-fall ${totalDuration}s ${initialDelay}s infinite ease-in`,
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

// Money pile on the left — realistic banknotes falling and piling up
function MoneyPile({ progress }) {
  const savedAmount = Math.round(progress * 1000000);
  const formatted = new Intl.NumberFormat("cs-CZ").format(savedAmount);
  const pileHeight = Math.round(progress * 100);

  const particleCount = Math.min(10, 3 + Math.floor(progress * 7));
  const particles = useMemo(
    () => Array.from({ length: particleCount }, (_, i) => i),
    [particleCount]
  );

  // Grid of banknote rows (3 per row) to fill the pile densely
  const pileRowCount = 50;
  const pileRows = useMemo(
    () =>
      Array.from({ length: pileRowCount }, (_, row) =>
        Array.from({ length: 3 }, (_, col) => ({
          id: row * 3 + col,
          col,
          offsetX: (col - 1) * 22 + (Math.random() - 0.5) * 6,
          rotate: (Math.random() - 0.5) * 20,
          shade: Math.random() * 12,
        }))
      ),
    []
  );

  return (
    <div className="absolute left-4 top-0 bottom-0 flex flex-col items-center py-10 z-10 w-20">
      <motion.div
        className="text-xs font-bold tracking-[0.2em] uppercase mb-3 text-primary/50"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        Úspory
      </motion.div>

      <div className="mb-2" />

      <div className="relative flex-1 w-full overflow-hidden rounded-2xl"
        style={{ background: "rgba(0,0,0,0.03)" }}
      >
        {/* Falling banknotes — each as direct sibling, behind the pile */}
        {particles.map((id) => (
          <FallingBanknote key={id} id={id} />
        ))}

        {/* The pile — tightly stacked banknotes, covers falling ones */}
        <motion.div
          className="absolute bottom-0 left-0 right-0"
          initial={{ height: 0 }}
          animate={{ height: `${pileHeight}%` }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          style={{ zIndex: 10, overflow: "hidden" }}
        >
          {/* Dense grid of banknotes — 3 per row, tightly packed */}
          <div className="absolute bottom-0 left-0 right-0 flex flex-col-reverse items-center"
            style={{ minHeight: "100%" }}
          >
            {pileRows.map((row, rowIdx) => (
              <div
                key={rowIdx}
                style={{
                  position: "relative",
                  width: "100%",
                  height: 10,
                  flexShrink: 0,
                  willChange: "auto",
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
                    <Banknote
                      width={30}
                      height={14}
                      style={{ filter: `brightness(${0.9 + note.shade / 100})` }}
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Shimmer overlay */}
        <div className="absolute inset-0 overflow-hidden rounded-2xl" style={{ zIndex: 4 }}>
          <motion.div
            className="absolute left-0 right-0"
            style={{
              height: "200%",
              background:
                "linear-gradient(to top, transparent 0%, transparent 30%, rgba(255,255,255,0.15) 50%, transparent 70%, transparent 100%)",
            }}
            animate={{ y: ["100%", "-100%"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />
        </div>

        {/* Glass border */}
        <div className="absolute inset-0 rounded-2xl border border-primary/10 shadow-inner" style={{ zIndex: 5 }} />
      </div>

      <motion.div
        className="text-xs font-bold mt-2 text-accent-orange whitespace-nowrap"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        {formatted} Kč
      </motion.div>
    </div>
  );
}

// Canvas-confetti celebration with banknote emoji shapes
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
      confetti.shapeFromText({ text: "🪙", scalar }),
    ];

    const defaults = {
      spread: 160,
      ticks: 200,
      gravity: 0.6,
      decay: 0.94,
      startVelocity: 40,
      shapes,
      scalar,
      zIndex: 200,
    };

    // Initial massive burst — 5 staggered explosions
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        confetti({
          ...defaults,
          particleCount: 60,
          origin: { x: 0.2 + Math.random() * 0.6, y: 0.3 + Math.random() * 0.3 },
        });
      }, i * 350);
    }

    // Continuous celebration every few seconds
    const interval = setInterval(() => {
      confetti({
        ...defaults,
        particleCount: 25,
        spread: 100,
        startVelocity: 30,
        origin: { x: Math.random(), y: -0.05 },
        gravity: 1,
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);
}

// Success state
function SuccessState() {
  const particles = useMemo(
    () => Array.from({ length: 40 }, (_, i) => i),
    []
  );

  useConfettiBurst();

  return (
    <div className="w-screen h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 30%, #0f3460 70%, #1a1a2e 100%)",
      }}
    >
      {particles.map((i) => (
        <MoneyParticle key={i} index={i} total={40} />
      ))}

      <motion.div
        className="text-center z-10"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", duration: 1, bounce: 0.5 }}
      >
        <motion.div
          className="text-8xl mb-6"
          animate={{ rotate: [0, -10, 10, -10, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          🚀
        </motion.div>

        <motion.h1
          className="text-7xl font-black mb-6"
          style={{
            background: "linear-gradient(135deg, #FFD700, #FFA500, #FFD700)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            filter: "drop-shadow(0 0 30px rgba(255,215,0,0.5))",
          }}
          animate={{ scale: [1, 1.03, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          MILIÓN JE DOMA!
        </motion.h1>

        <motion.p
          className="text-2xl text-gold-light font-semibold mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          350 000 Kč ušetřeno. Nervy za 650 000 Kč zachráněny.
        </motion.p>

        <motion.div
          className="mt-8 text-6xl"
          animate={{ y: [0, -15, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          🎉🥳🎊
        </motion.div>
      </motion.div>

      {/* Golden progress bar at full */}
      <div className="absolute bottom-12 left-0 right-0 px-12">
        <div className="w-full h-6 rounded-full overflow-hidden shadow-lg"
          style={{ background: "rgba(255,215,0,0.2)" }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{
              background: "linear-gradient(90deg, #FFD700, #FFA500, #FFD700)",
            }}
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 2, ease: "easeOut" }}
          />
        </div>
        <div className="text-center mt-2 text-gold-light font-bold text-lg">
          1 000 000 Kč — Mise splněna! ✅
        </div>
      </div>
    </div>
  );
}

// Slow-moving gradient mesh background to prevent burn-in
function AnimatedBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
      {/* Blob 1 */}
      <motion.div
        className="absolute rounded-full opacity-20 blur-3xl"
        style={{
          width: "60vw",
          height: "60vh",
          background: "radial-gradient(circle, #e8eaff 0%, transparent 70%)",
        }}
        animate={{
          x: ["-10vw", "20vw", "-5vw", "10vw", "-10vw"],
          y: ["-5vh", "15vh", "25vh", "-10vh", "-5vh"],
        }}
        transition={{ duration: 45, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Blob 2 */}
      <motion.div
        className="absolute rounded-full opacity-15 blur-3xl"
        style={{
          width: "50vw",
          height: "50vh",
          right: 0,
          bottom: 0,
          background: "radial-gradient(circle, #fff3d6 0%, transparent 70%)",
        }}
        animate={{
          x: ["10vw", "-15vw", "5vw", "-20vw", "10vw"],
          y: ["10vh", "-10vh", "-20vh", "5vh", "10vh"],
        }}
        transition={{ duration: 55, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Blob 3 */}
      <motion.div
        className="absolute rounded-full opacity-10 blur-3xl"
        style={{
          width: "40vw",
          height: "40vh",
          left: "30%",
          top: "20%",
          background: "radial-gradient(circle, #d6f5d6 0%, transparent 70%)",
        }}
        animate={{
          x: ["5vw", "-10vw", "15vw", "-5vw", "5vw"],
          y: ["-15vh", "10vh", "-5vh", "20vh", "-15vh"],
        }}
        transition={{ duration: 60, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

// Main countdown state
function CountdownState({ days, hours, minutes, seconds, progress }) {
  return (
    <div
      className="w-screen h-screen flex flex-col items-center justify-center px-24 relative"
      style={{
        background:
          "linear-gradient(160deg, #f2f3fd 0%, #ffffff 40%, #f2f3fd 100%)",
      }}
    >
      <AnimatedBackground />
      <MoneyPile progress={progress} />
      <NerveMeter progress={progress} />

      {/* Center — main countdown */}
      <div className="flex flex-col items-center gap-8">
        <motion.h1
          className="text-6xl font-extrabold text-primary leading-tight text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          Už jen{" "}
          <motion.span
            className="inline-block"
            style={{
              background: "linear-gradient(135deg, #21337b, #3b5bdb)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
            key={days}
            initial={{ scale: 1.15, opacity: 0.7 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            {days}
          </motion.span>{" "}
          dní k{" "}
          <motion.span
            className="inline-block relative"
            animate={{
              filter: [
                "drop-shadow(0 0 4px rgba(255,165,0,0.15))",
                "drop-shadow(0 0 8px rgba(255,165,0,0.25))",
                "drop-shadow(0 0 4px rgba(255,165,0,0.15))",
              ],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <span
              className="text-8xl uppercase font-black"
              style={{
                background: "linear-gradient(135deg, #FFD700, #FFA500, #FFD700)",
                backgroundSize: "200% 200%",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              MILIÓNU
            </span>
          </motion.span>
        </motion.h1>

        {/* Timer blocks */}
        <div className="flex items-center gap-6">
          <TimeBlock value={days} label="Dní" />
          <div className="text-6xl font-bold text-primary/30 mt-[-24px]">:</div>
          <TimeBlock value={hours} label="Hodin" />
          <div className="text-6xl font-bold text-primary/30 mt-[-24px]">:</div>
          <TimeBlock value={minutes} label="Minut" />
          <div className="text-6xl font-bold text-primary/30 mt-[-24px]">:</div>
          <TimeBlock value={seconds} label="Sekund" />
        </div>

        {/* Subtext */}
        <motion.p
          className="text-[1.7rem] text-primary/60 font-medium text-center mt-2 whitespace-nowrap"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Ušetříme{" "}
          <span className="font-bold text-primary">350 000 Kč</span> měsíčně a
          nervy v hodnotě{" "}
          <span className="font-bold text-accent-orange">650 000 Kč</span>.
        </motion.p>
      </div>

    </div>
  );
}

export default function App() {
  const countdown = useCountdown();

  return (
    <AnimatePresence mode="wait">
      {countdown.done ? (
        <motion.div
          key="success"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          <SuccessState />
        </motion.div>
      ) : (
        <motion.div
          key="countdown"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <CountdownState {...countdown} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
