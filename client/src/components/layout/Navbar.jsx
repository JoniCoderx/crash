import { Link, NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';

const linkClass = ({ isActive }) =>
  `rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
    isActive ? 'bg-terminal-800 text-neon-green' : 'text-ink-300 hover:text-ink-100'
  }`;

export default function Navbar() {
  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="sticky top-0 z-40 border-b border-terminal-700 bg-terminal-950/80 backdrop-blur"
    >
      <nav className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-md border border-neon-green/40 bg-terminal-800 font-mono text-sm font-bold text-neon-green">
            Q
          </span>
          <span className="font-mono text-sm font-semibold tracking-wide text-ink-100">
            QuantumCrash<span className="text-neon-blue">·Analytics</span>
          </span>
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">
          <NavLink to="/" className={linkClass} end>
            Home
          </NavLink>
          <NavLink to="/dashboard" className={linkClass}>
            Dashboard
          </NavLink>
          <span className="ml-2 hidden rounded-full border border-neon-amber/40 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-neon-amber sm:inline">
            Simulation
          </span>
        </div>
      </nav>
    </motion.header>
  );
}
