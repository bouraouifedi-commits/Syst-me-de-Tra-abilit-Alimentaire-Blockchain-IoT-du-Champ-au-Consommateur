import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, User, LogIn, UserPlus } from "lucide-react";
import RobotCheck from "../components/RobotCheck.jsx";
import { useAuth } from "../auth/AuthContext.jsx";

function cx(...xs) {
  return xs.filter(Boolean).join(" ");
}

export default function AuthPage() {
  const nav = useNavigate();
  const { signIn, signUp } = useAuth();

  const [mode, setMode] = useState("signin"); // signin | signup
  const [robotOk, setRobotOk] = useState(false);
  const [remember, setRemember] = useState(true);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [toast, setToast] = useState({ type: "", title: "", text: "" });
  const [busy, setBusy] = useState(false);

  function show(type, title, text) {
    setToast({ type, title, text });
    window.clearTimeout(show._t);
    show._t = window.setTimeout(() => setToast({ type: "", title: "", text: "" }), 5200);
  }

  const bgUrl = useMemo(() => `/chahia_pic.png`, []);

  async function onSubmit(e) {
    e.preventDefault();
    if (!robotOk) {
      show("warn", "Robot check", "Please complete the robot verification.");
      return;
    }

    setBusy(true);
    try {
      if (mode === "signup") {
        await signUp({ name: form.name, email: form.email, password: form.password });
        show("success", "Account created", "You can sign in now.");
        setMode("signin");
      } else {
        await signIn({ email: form.email, password: form.password, remember });
        show("success", "Signed in", "Welcome back!");
        nav("/"); // go to dashboard
      }
    } catch (err) {
      show("error", "Auth", err?.message || "Error");
    } finally {
      setBusy(false);
    }
  }

  const ring =
    toast.type === "success"
      ? "ring-emerald-400/30 bg-emerald-500/10"
      : toast.type === "warn"
      ? "ring-amber-400/30 bg-amber-500/10"
      : toast.type === "error"
      ? "ring-rose-400/30 bg-rose-500/10"
      : "ring-white/10 bg-white/[0.04]";

  return (
    <div className="min-h-screen text-white/90 relative overflow-hidden">
      {/* Background image */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${bgUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(0px)",
        }}
      />
      <div className="absolute inset-0 bg-black/60" />
      <div className="absolute inset-0 opacity-80 bg-[radial-gradient(850px_520px_at_65%_18%,rgba(255,193,7,.18),transparent)]" />
      <div className="absolute inset-0 opacity-80 bg-[radial-gradient(950px_560px_at_25%_75%,rgba(244,63,94,.22),transparent)]" />

      {/* Toast */}
      <AnimatePresence>
        {toast?.text ? (
          <motion.div
            initial={{ y: -12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -12, opacity: 0 }}
            className={cx(
              "fixed left-1/2 top-5 z-50 w-[92%] max-w-xl -translate-x-1/2 rounded-2xl",
              "ring-1 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,.45)] border border-white/10",
              ring
            )}
          >
            <div className="p-4">
              <div className="text-sm font-black text-white/95">{toast.title}</div>
              <div className="text-sm text-white/80 mt-0.5">{toast.text}</div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Card */}
      <div className="relative z-10 mx-auto max-w-6xl px-5 py-10">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr] items-center">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 text-white/70">
              <span className="text-xs">Chahia • Traceability • IoT</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">
              Welcome to <span className="text-white/70">Chahia</span>
            </h1>
            <p className="text-sm text-white/60 max-w-xl">
              Sign in to access the telemetry dashboard and anomaly monitoring.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.06] shadow-[0_18px_55px_rgba(0,0,0,.40)] overflow-hidden">
            <div className="p-5 border-b border-white/10 bg-gradient-to-b from-white/[0.06] to-transparent">
              <div className="flex items-center gap-2">
                {mode === "signin" ? (
                  <LogIn className="h-5 w-5 text-white/80" />
                ) : (
                  <UserPlus className="h-5 w-5 text-white/80" />
                )}
                <div className="text-base font-black text-white/95">
                  {mode === "signin" ? "Sign in" : "Create account"}
                </div>
              </div>

              <div className="mt-3 inline-flex rounded-2xl border border-white/10 bg-white/[0.03] p-1">
                <button
                  type="button"
                  onClick={() => setMode("signin")}
                  className={cx(
                    "rounded-2xl px-4 py-2 text-sm font-black transition",
                    mode === "signin" ? "bg-white/10" : "hover:bg-white/5 text-white/70"
                  )}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className={cx(
                    "rounded-2xl px-4 py-2 text-sm font-black transition",
                    mode === "signup" ? "bg-white/10" : "hover:bg-white/5 text-white/70"
                  )}
                >
                  Sign up
                </button>
              </div>
            </div>

            <form onSubmit={onSubmit} className="p-5 space-y-4">
              {mode === "signup" ? (
                <div>
                  <label className="text-xs text-white/60">Name</label>
                  <div className="mt-1 flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-3 py-2">
                    <User className="h-4 w-4 text-white/60" />
                    <input
                      value={form.name}
                      onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                      className="w-full bg-transparent outline-none text-sm"
                      placeholder="Fedi"
                      autoComplete="name"
                    />
                  </div>
                </div>
              ) : null}

              <div>
                <label className="text-xs text-white/60">Email</label>
                <div className="mt-1 flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-3 py-2">
                  <Mail className="h-4 w-4 text-white/60" />
                  <input
                    value={form.email}
                    onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
                    className="w-full bg-transparent outline-none text-sm"
                    placeholder="you@mail.com"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-white/60">Password</label>
                <div className="mt-1 flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-3 py-2">
                  <Lock className="h-4 w-4 text-white/60" />
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
                    className="w-full bg-transparent outline-none text-sm"
                    placeholder="••••••••"
                    autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  />
                </div>
                <div className="text-[11px] text-white/50 mt-1">
                  Minimum 6 characters.
                </div>
              </div>

              {mode === "signin" ? (
                <label className="inline-flex items-center gap-2 text-sm text-white/75">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-4 w-4 accent-amber-300"
                  />
                  Remember me
                </label>
              ) : null}

              <RobotCheck onVerified={setRobotOk} />

              <button
                disabled={busy}
                className="w-full rounded-2xl px-4 py-3 font-black border border-white/10 bg-gradient-to-b from-rose-500 to-amber-400 text-black/90 hover:brightness-110 active:brightness-95 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Sign up"}
              </button>

              <div className="text-xs text-white/55">
                Demo authentication (local). For production, move to backend + JWT.
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}