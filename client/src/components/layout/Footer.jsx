export default function Footer() {
  return (
    <footer className="border-t border-terminal-700 bg-terminal-950">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <p className="text-center text-xs leading-relaxed text-ink-500">
          QuantumCrash Analytics is an educational <span className="text-ink-300">simulation</span>.
          All stakes and balances are virtual credits — no real money is ever involved and the app
          connects to no external gambling services. Crash rounds are independent random draws:{' '}
          <span className="text-ink-300">no algorithm can predict the next crash point</span>, here
          or anywhere else.
        </p>
      </div>
    </footer>
  );
}
