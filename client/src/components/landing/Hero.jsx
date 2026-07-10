import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.21, 0.65, 0.32, 1] } },
};

/** Decorative curve echoing the live chart, drawn in on entrance. */
function CurveGraphic() {
  return (
    <svg viewBox="0 0 480 200" fill="none" className="w-full" aria-hidden="true">
      <defs>
        <linearGradient id="hero-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#25d377" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#25d377" stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.path
        d="M8 192 C120 188, 240 170, 330 120 S 448 30, 460 12"
        stroke="#25d377"
        strokeWidth="2.5"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.6, ease: 'easeInOut', delay: 0.5 }}
      />
      <motion.path
        d="M8 192 C120 188, 240 170, 330 120 S 448 30, 460 12 L460 192 Z"
        fill="url(#hero-fill)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.4 }}
      />
      <motion.circle
        cx="460"
        cy="12"
        r="5"
        fill="#25d377"
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1.4, 1] }}
        transition={{ duration: 0.5, delay: 2 }}
      />
    </svg>
  );
}

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Neon backdrop: soft radial glows + faint terminal grid */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-neon-green/10 blur-3xl" />
        <div className="absolute top-24 right-1/5 h-80 w-80 rounded-full bg-neon-blue/10 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              'linear-gradient(#1c2836 1px, transparent 1px), linear-gradient(90deg, #1c2836 1px, transparent 1px)',
            backgroundSize: '48px 48px',
            maskImage: 'radial-gradient(ellipse 80% 60% at 50% 35%, black, transparent)',
          }}
        />
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 pt-20 pb-16 sm:px-6 lg:grid-cols-2 lg:pt-28 lg:pb-24"
      >
        <div>
          <motion.p
            variants={item}
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-terminal-600 bg-terminal-900/70 px-3 py-1 font-mono text-xs tracking-widest text-neon-blue uppercase"
          >
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-neon-green" />
            Simulated market feed · live
          </motion.p>

          <motion.h1
            variants={item}
            className="text-4xl leading-tight font-bold tracking-tight sm:text-5xl lg:text-6xl"
          >
            The <span className="glow-green text-neon-green">QuantumCrash</span>
            <br />
            Algorithm, visualized.
          </motion.h1>

          <motion.p variants={item} className="mt-6 max-w-xl text-base leading-relaxed text-ink-300 sm:text-lg">
            A trading-terminal playground for crash-style curves. Watch a simulated multiplier
            climb, let the automated bot pick its exits, and study how strategies behave against a
            provably random feed — with virtual credits, in your browser.
          </motion.p>

          <motion.div variants={item} className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              to="/dashboard"
              className="rounded-lg bg-neon-green px-6 py-3 text-sm font-semibold text-terminal-950 shadow-[0_0_28px_rgba(37,211,119,0.35)] transition hover:brightness-110"
            >
              Launch Terminal →
            </Link>
            <a
              href="#how-it-works"
              className="rounded-lg border border-terminal-600 px-6 py-3 text-sm font-semibold text-ink-100 transition hover:border-neon-blue/60 hover:text-neon-blue"
            >
              How it works
            </a>
          </motion.div>

          <motion.p variants={item} className="mt-6 font-mono text-xs text-ink-500">
            100% simulation · virtual credits only · rounds are independent random draws
          </motion.p>
        </div>

        <motion.div
          variants={item}
          className="rounded-2xl border border-terminal-700 bg-terminal-900/80 p-6 shadow-2xl backdrop-blur"
        >
          <div className="mb-4 flex items-center justify-between font-mono text-xs text-ink-500">
            <span>SIM-FEED / ROUND #4821</span>
            <span className="text-neon-green">▲ 2.47×</span>
          </div>
          <CurveGraphic />
          <div className="mt-4 grid grid-cols-3 gap-3 font-mono text-center text-xs">
            {[
              ['Growth', 'e^0.12t'],
              ['Median crash', '~1.98×'],
              ['Tick rate', '100 ms'],
            ].map(([k, v]) => (
              <div key={k} className="rounded-lg border border-terminal-700 bg-terminal-800/60 px-2 py-2.5">
                <div className="text-ink-500">{k}</div>
                <div className="tabular mt-1 text-ink-100">{v}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
