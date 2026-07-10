import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { formatTime } from '../../lib/format.js';

/** Per-type prefix glyph + color. Meaning never rides on color alone. */
const TYPE_STYLE = {
  info: { glyph: '›', className: 'text-neon-blue' },
  ai: { glyph: '◆', className: 'text-neon-blue' },
  win: { glyph: '▲', className: 'text-neon-green' },
  loss: { glyph: '▼', className: 'text-neon-red' },
  system: { glyph: '●', className: 'text-neon-amber' },
};

/**
 * Streaming decision log. Follows the newest entry automatically, but
 * stops auto-scrolling the moment the user scrolls up to read history.
 */
export default function LiveLog({ entries }) {
  const scrollRef = useRef(null);
  const pinnedRef = useRef(true);

  useEffect(() => {
    const el = scrollRef.current;
    if (el && pinnedRef.current) el.scrollTop = el.scrollHeight;
  }, [entries]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    pinnedRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 24;
  };

  return (
    <section className="rounded-2xl border border-terminal-700 bg-terminal-900 p-4">
      <h2 className="mb-3 font-mono text-xs tracking-widest text-ink-500 uppercase">Live log</h2>
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="scroll-slim h-64 space-y-1.5 overflow-y-auto pr-1 font-mono text-xs leading-relaxed"
      >
        {entries.length === 0 && (
          <p className="text-ink-500">Bot idle. Engage it to see decisions stream in…</p>
        )}
        <AnimatePresence initial={false}>
          {entries.map((e) => {
            const style = TYPE_STYLE[e.type] ?? TYPE_STYLE.info;
            return (
              <motion.p
                key={e.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
              >
                <span className="tabular text-ink-500">{formatTime(e.at)}</span>{' '}
                <span className={style.className}>{style.glyph}</span>{' '}
                <span className="text-ink-300">{e.text}</span>
              </motion.p>
            );
          })}
        </AnimatePresence>
      </div>
    </section>
  );
}
