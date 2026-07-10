import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const STEPS = [
  {
    n: '01',
    title: 'A crash point is drawn',
    body: 'Each round the server samples a crash point from a fair distribution — P(crash ≥ m) = (1−edge)/m. Every draw is independent: past rounds tell you nothing about the next one.',
  },
  {
    n: '02',
    title: 'The curve climbs live',
    body: 'The multiplier grows exponentially and streams to your browser over WebSockets. It ends the instant it reaches the hidden crash point.',
  },
  {
    n: '03',
    title: 'The bot plays its strategy',
    body: 'The bot stakes virtual credits, exits at its target (manual or AI-suggested), and logs every decision — so you can compare strategies against pure randomness.',
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="border-t border-terminal-700 bg-terminal-900/40">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center font-mono text-2xl font-bold sm:text-3xl"
        >
          How the simulation works
        </motion.h2>

        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.55, delay: i * 0.15 }}
              className="relative pl-6"
            >
              <span className="absolute top-0 left-0 font-mono text-sm text-neon-blue">{s.n}</span>
              <div className="border-l border-terminal-600 pl-6">
                <h3 className="font-semibold text-ink-100">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-300">{s.body}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-14 text-center"
        >
          <Link
            to="/dashboard"
            className="inline-block rounded-lg border border-neon-green/50 bg-terminal-900 px-8 py-3 font-mono text-sm font-semibold text-neon-green transition hover:bg-terminal-800"
          >
            Open the dashboard →
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
