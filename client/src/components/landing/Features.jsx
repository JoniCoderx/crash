import { motion } from 'framer-motion';

const FEATURES = [
  {
    accent: 'text-neon-green',
    ring: 'border-neon-green/30',
    icon: '📈',
    title: 'Live curve engine',
    body: 'A Socket.io feed streams a rising multiplier every 100 ms, crashing on a fair, house-edge-parameterized random distribution — the same math real crash games publish.',
  },
  {
    accent: 'text-neon-blue',
    ring: 'border-neon-blue/30',
    icon: '🤖',
    title: 'Autonomous demo bot',
    body: 'Set a simulated stake, an auto cash-out and a session stop-loss — or hand the exit decision to the AI-logic suggestion service and watch every decision land in the live log.',
  },
  {
    accent: 'text-neon-amber',
    ring: 'border-neon-amber/30',
    icon: '🔌',
    title: 'Pluggable analysis API',
    body: 'An authenticated POST /api/analyze route accepts the last 10 results and returns an exit suggestion — a clean seam for wiring in your own analysis service via API key.',
  },
];

export default function Features() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <div className="grid gap-6 md:grid-cols-3">
        {FEATURES.map((f, i) => (
          <motion.article
            key={f.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.55, delay: i * 0.12 }}
            className={`rounded-2xl border ${f.ring} bg-terminal-900/70 p-6 transition-transform hover:-translate-y-1`}
          >
            <div className="text-2xl" aria-hidden="true">
              {f.icon}
            </div>
            <h3 className={`mt-4 font-mono text-base font-semibold ${f.accent}`}>{f.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-300">{f.body}</p>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
