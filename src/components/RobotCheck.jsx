import { useMemo, useState } from "react";
import { ShieldCheck, RefreshCcw } from "lucide-react";

function randInt(a, b) {
  return Math.floor(Math.random() * (b - a + 1)) + a;
}

export default function RobotCheck({ onVerified }) {
  const [checked, setChecked] = useState(false);
  const [answer, setAnswer] = useState("");
  const [verified, setVerified] = useState(false);

  const challenge = useMemo(() => {
    const x = randInt(2, 9);
    const y = randInt(2, 9);
    return { x, y, sum: x + y };
  }, []);

  function reset() {
    // easiest reset: reload component parent; here we just invalidate current state
    setChecked(false);
    setAnswer("");
    setVerified(false);
    onVerified(false);
  }

  function verify() {
    if (!checked) return;
    if (Number(answer) === challenge.sum) {
      setVerified(true);
      onVerified(true);
    } else {
      setVerified(false);
      onVerified(false);
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <div className="flex items-start gap-3">
        <div className="rounded-xl border border-white/10 bg-white/[0.05] p-2">
          <ShieldCheck className="h-5 w-5 text-white/80" />
        </div>

        <div className="flex-1">
          <div className="text-sm font-black text-white/90">Robot check</div>
          <div className="text-xs text-white/60 mt-0.5">
            Please verify to continue.
          </div>

          <div className="mt-3 flex items-center gap-3">
            <label className="inline-flex items-center gap-2 text-sm text-white/80">
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => {
                  setChecked(e.target.checked);
                  setVerified(false);
                  onVerified(false);
                }}
                className="h-4 w-4 accent-amber-300"
              />
              I’m not a robot
            </label>

            <button
              type="button"
              onClick={reset}
              className="ml-auto inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/70 hover:bg-white/[0.06] transition"
            >
              <RefreshCcw className="h-4 w-4" />
              Reset
            </button>
          </div>

          <div className="mt-3 grid grid-cols-[1fr_120px] gap-2">
            <div className="text-xs text-white/70 rounded-xl border border-white/10 bg-black/20 px-3 py-2">
              Solve: <b>{challenge.x} + {challenge.y}</b>
            </div>

            <input
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Answer"
              className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/90 outline-none focus:border-amber-300/60"
              inputMode="numeric"
            />
          </div>

          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={verify}
              disabled={!checked}
              className="rounded-xl px-4 py-2 text-sm font-black border border-white/10 bg-gradient-to-b from-rose-500 to-amber-400 text-black/90 hover:brightness-110 active:brightness-95 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Verify
            </button>

            <div className="text-xs text-white/70">
              {verified ? <span className="text-emerald-200">Verified ✓</span> : "Not verified"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}