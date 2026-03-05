import { useEffect, useMemo, useRef, useState } from "react";
import Web3 from "web3";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  Wallet,
  Network,
  Thermometer,
  Droplets,
  Warehouse,
  Copy,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  Sparkles,
  Shield,
  Radio,
  RefreshCcw,
  LogOut,
  User as UserIcon,
} from "lucide-react";

import { CONTRACT_ADDRESS, CONTRACT_ABI } from "./contract";
import { useAuth } from "./auth/AuthContext";

function shortAddr(a) {
  if (!a) return "";
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

function classNames(...xs) {
  return xs.filter(Boolean).join(" ");
}

function formatTs(ts) {
  try {
    const d = new Date(ts);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString();
  } catch {
    return "—";
  }
}

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function toneDot(tone) {
  return tone === "danger"
    ? "bg-rose-400"
    : tone === "warn"
    ? "bg-amber-300"
    : tone === "ok"
    ? "bg-emerald-400"
    : "bg-white/30";
}

/** =========================
 * UI COMPONENTS
 * ========================= */
function Toast({ toast, onClose }) {
  const icon =
    toast.type === "success" ? (
      <CheckCircle2 className="h-5 w-5" />
    ) : toast.type === "warn" ? (
      <AlertTriangle className="h-5 w-5" />
    ) : toast.type === "error" ? (
      <XCircle className="h-5 w-5" />
    ) : (
      <Sparkles className="h-5 w-5" />
    );

  const ring =
    toast.type === "success"
      ? "ring-emerald-400/30 bg-emerald-500/10"
      : toast.type === "warn"
      ? "ring-amber-400/30 bg-amber-500/10"
      : toast.type === "error"
      ? "ring-rose-400/30 bg-rose-500/10"
      : "ring-yellow-400/30 bg-yellow-500/10";

  return (
    <AnimatePresence>
      {toast?.text ? (
        <motion.div
          initial={{ y: -12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -12, opacity: 0 }}
          className={classNames(
            "fixed left-1/2 top-5 z-50 w-[92%] max-w-2xl -translate-x-1/2 rounded-2xl",
            "ring-1 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,.45)] border border-white/10",
            ring
          )}
        >
          <div className="flex items-start gap-3 p-4">
            <div className="mt-0.5 text-white/90">{icon}</div>

            <div className="flex-1">
              <div className="text-sm font-semibold text-white/95">
                {toast.title || "Info"}
              </div>
              <div className="text-sm text-white/80 mt-0.5 break-words">
                {toast.text}
              </div>

              {toast.href ? (
                <a
                  href={toast.href}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-2 text-xs text-white/80 hover:text-white"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open link
                </a>
              ) : null}
            </div>

            <button
              onClick={onClose}
              className="rounded-xl p-2 text-white/70 hover:text-white hover:bg-white/10 transition"
              aria-label="close"
            >
              ✕
            </button>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function Stat({ icon, label, value, sub, right, onClick }) {
  return (
    <button
      onClick={onClick}
      className={classNames(
        "text-left rounded-2xl border border-white/10 bg-white/[0.04] p-4",
        "shadow-[0_18px_45px_rgba(0,0,0,.35)]",
        onClick ? "hover:bg-white/[0.06] transition" : "cursor-default"
      )}
      disabled={!onClick}
    >
      <div className="flex items-center gap-3">
        <div className="rounded-xl border border-white/10 bg-white/[0.05] p-2">
          {icon}
        </div>

        <div className="flex-1">
          <div className="text-xs text-white/60">{label}</div>
          <div className="text-lg font-black tracking-tight text-white/95">
            {value}
          </div>
          {sub ? <div className="text-xs text-white/55 mt-0.5">{sub}</div> : null}
        </div>

        {right}
      </div>
    </button>
  );
}

function GlassCard({ title, desc, icon, right, children }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] shadow-[0_18px_55px_rgba(0,0,0,.40)] overflow-hidden">
      <div className="p-5 border-b border-white/10 bg-gradient-to-b from-white/[0.06] to-transparent">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-2">
            {icon}
          </div>

          <div className="flex-1">
            <div className="text-base font-black text-white/95">{title}</div>
            <div className="text-sm text-white/60 mt-0.5">{desc}</div>
          </div>

          {right}
        </div>
      </div>

      <div className="p-5">{children}</div>
    </div>
  );
}

function RiskBadge({ risk, loading }) {
  const level = risk?.level || "—";
  const score = typeof risk?.score === "number" ? risk.score : null;

  const tone =
    level === "HIGH"
      ? "border-rose-400/30 bg-rose-500/10 text-rose-100"
      : level === "MEDIUM"
      ? "border-amber-300/30 bg-amber-500/10 text-amber-100"
      : level === "LOW"
      ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-100"
      : "border-white/10 bg-white/[0.03] text-white/80";

  return (
    <div className={classNames("rounded-2xl border px-4 py-3", tone)}>
      <div className="flex items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2">
          <Shield className="h-4 w-4" />
          <span className="text-xs opacity-90">Anomaly Risk (IA)</span>
        </div>
        <div className="text-xs opacity-90">
          {loading ? "Analyzing…" : score !== null ? `${score}/100` : "—"}
        </div>
      </div>

      <div className="mt-1 text-sm font-black">{level}</div>
      <div className="mt-1 text-xs opacity-80 break-words">
        {(risk?.reasons || []).join(", ") || "normal"}
      </div>
    </div>
  );
}

/** =========================
 * APP
 * ========================= */
export default function App() {
  const { signOut, user } = useAuth();

  // Ronin Saigon
  const SAIGON_CHAIN_ID_DEC = 202601;
  const SAIGON_CHAIN_ID_HEX = "0x" + SAIGON_CHAIN_ID_DEC.toString(16);

  // API
  const API_BASE = import.meta?.env?.VITE_API_BASE || "http://localhost:5050";
  const TELEMETRY_LATEST = `${API_BASE}/telemetry/latest`; // GET
  const TELEMETRY_HISTORY = `${API_BASE}/telemetry/history`; // GET ?limit=40
  const TELEMETRY_STREAM = `${API_BASE}/telemetry/stream`; // SSE (optional)
  const RISK_ENDPOINT = `${API_BASE}/risk-score`; // GET ?deviceId=...

  const explorerAddr = (a) => `https://saigon-explorer.roninchain.com/address/${a}`;

  // Blockchain
  const [account, setAccount] = useState("");
  const [chainId, setChainId] = useState("");
  const [contract, setContract] = useState(null);

  // Telemetry
  const [telemetry, setTelemetry] = useState(null);
  const [history, setHistory] = useState([]);
  const [risk, setRisk] = useState(null);

  // SSE
  const sseRef = useRef(null);

  // MetaMask listeners refs
  const onAccountsChangedRef = useRef(null);
  const onChainChangedRef = useRef(null);

  const [toast, setToast] = useState({
    type: "info",
    title: "Welcome",
    text: "Connect MetaMask + start ESP32 telemetry.",
    href: "",
  });

  const [loading, setLoading] = useState({
    connect: false,
    telemetry: false,
    risk: false,
    logout: false,
  });

  const isConnected = useMemo(() => !!account && !!contract, [account, contract]);
  const isSaigon = useMemo(
    () => chainId?.toLowerCase() === SAIGON_CHAIN_ID_HEX.toLowerCase(),
    [chainId, SAIGON_CHAIN_ID_HEX]
  );

  function show(type, title, text, href = "") {
    setToast({ type, title, text, href });
    window.clearTimeout(show._t);
    show._t = window.setTimeout(
      () => setToast({ type: "", title: "", text: "", href: "" }),
      5200
    );
  }

  async function copy(text) {
    try {
      await navigator.clipboard.writeText(text);
      show("success", "Copied", text);
    } catch {
      show("warn", "Copy", "Could not copy.");
    }
  }

  function cleanupMetaMaskListeners() {
    try {
      if (!window.ethereum?.removeListener) return;
      if (onAccountsChangedRef.current)
        window.ethereum.removeListener("accountsChanged", onAccountsChangedRef.current);
      if (onChainChangedRef.current)
        window.ethereum.removeListener("chainChanged", onChainChangedRef.current);
    } catch {
      // ignore
    } finally {
      onAccountsChangedRef.current = null;
      onChainChangedRef.current = null;
    }
  }

  /** -------- Logout -------- */
  async function handleLogout() {
    try {
      setLoading((s) => ({ ...s, logout: true }));
      cleanupMetaMaskListeners();
      try {
        sseRef.current?.close?.();
      } catch {
        // ignore
      }
      sseRef.current = null;

      // Reset local UI state (optional)
      setAccount("");
      setChainId("");
      setContract(null);

      await signOut?.();
      show("success", "Logged out", "You have been signed out.");
    } catch (e) {
      show("error", "Logout failed", e?.message || "Error");
    } finally {
      setLoading((s) => ({ ...s, logout: false }));
    }
  }

  /** -------- Blockchain connect -------- */
  async function connect() {
    try {
      setLoading((s) => ({ ...s, connect: true }));

      if (!window.ethereum) throw new Error("MetaMask is not installed or disabled.");

      await window.ethereum.request({ method: "eth_requestAccounts" });

      const currentChain = await window.ethereum.request({ method: "eth_chainId" });
      setChainId(currentChain);

      if (currentChain.toLowerCase() !== SAIGON_CHAIN_ID_HEX.toLowerCase()) {
        show(
          "warn",
          "Wrong network",
          `Switch to Ronin Saigon (chainId ${SAIGON_CHAIN_ID_DEC}).`
        );
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: SAIGON_CHAIN_ID_HEX }],
          });
          const after = await window.ethereum.request({ method: "eth_chainId" });
          setChainId(after);
        } catch {
          // user canceled or unsupported
        }
      }

      const web3 = new Web3(window.ethereum);
      const accounts = await web3.eth.getAccounts();
      const c = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);

      setAccount(accounts?.[0] || "");
      setContract(c);

      show("success", "Connected", `Wallet: ${shortAddr(accounts?.[0] || "")}`);

      // Replace listeners safely
      cleanupMetaMaskListeners();

      onAccountsChangedRef.current = (accs) => setAccount(accs?.[0] || "");
      onChainChangedRef.current = (x) => setChainId(x);

      window.ethereum.on?.("accountsChanged", onAccountsChangedRef.current);
      window.ethereum.on?.("chainChanged", onChainChangedRef.current);
    } catch (e) {
      show("error", "Connection failed", e?.message || "Error");
    } finally {
      setLoading((s) => ({ ...s, connect: false }));
    }
  }

  /** -------- Telemetry fetch + history -------- */
  async function loadTelemetry() {
    try {
      setLoading((s) => ({ ...s, telemetry: true }));

      const [latestRes, histRes] = await Promise.all([
        fetch(TELEMETRY_LATEST),
        fetch(`${TELEMETRY_HISTORY}?limit=40`),
      ]);

      const latestText = await latestRes.text();
      const histText = await histRes.text();

      let latest, hist;
      try {
        latest = JSON.parse(latestText);
      } catch {
        throw new Error(`Latest is not JSON. First chars: ${latestText.slice(0, 60)}`);
      }
      try {
        hist = JSON.parse(histText);
      } catch {
        throw new Error(`History is not JSON. First chars: ${histText.slice(0, 60)}`);
      }

      if (!latestRes.ok) throw new Error(latest?.error || "telemetry latest error");
      if (!histRes.ok) throw new Error(hist?.error || "telemetry history error");

      setTelemetry(latest?.data || latest);
      setHistory(hist?.data || hist || []);
    } catch (e) {
      show("error", "Telemetry", e?.message || "Error");
    } finally {
      setLoading((s) => ({ ...s, telemetry: false }));
    }
  }

  /** Optional SSE stream */
  function startSSE() {
    try {
      // close previous
      try {
        sseRef.current?.close?.();
      } catch {
        // ignore
      }

      const es = new EventSource(TELEMETRY_STREAM);
      sseRef.current = es;

      es.onmessage = (ev) => {
        try {
          const j = JSON.parse(ev.data);
          const payload = j?.data || j;
          if (!payload) return;

          setTelemetry(payload);
          setHistory((prev) => {
            const next = [...(prev || []), payload];
            return next.slice(-60);
          });
        } catch {
          // ignore invalid events
        }
      };

      es.onerror = () => {
        try {
          es.close();
        } catch {
          // ignore
        }
        sseRef.current = null;
      };
    } catch {
      sseRef.current = null;
    }
  }

  /** -------- Risk score (IA) -------- */
  async function loadRisk(deviceId) {
    try {
      setLoading((s) => ({ ...s, risk: true }));

      const id = deviceId || telemetry?.deviceId || "esp32-01";
      const r = await fetch(`${RISK_ENDPOINT}?deviceId=${encodeURIComponent(id)}`);

      let j = null;
      try {
        j = await r.json();
      } catch {
        j = null;
      }

      if (!r.ok) throw new Error(j?.error || "risk error");
      setRisk(j);
    } catch {
      // fallback heuristic if AI endpoint is offline
      const points = (history || []).slice(-25);
      if (points.length >= 6) {
        const temps = points
          .map((p) => Number(p?.temperature))
          .filter(Number.isFinite);
        const hums = points
          .map((p) => Number(p?.humidity))
          .filter(Number.isFinite);

        if (temps.length < 3 || hums.length < 3) {
          setRisk(null);
          return;
        }

        const tMin = Math.min(...temps);
        const tMax = Math.max(...temps);
        const hMin = Math.min(...hums);
        const hMax = Math.max(...hums);

        const tRisk = (tMax > 6 ? 40 : 0) + (tMax > 10 ? 35 : 0) + (tMin < -2 ? 15 : 0);
        const hRisk = (hMax > 85 ? 20 : 0) + (hMin < 35 ? 10 : 0);
        const drift = (tMax - tMin > 4 ? 15 : 0) + (hMax - hMin > 25 ? 10 : 0);

        const score = clamp(tRisk + hRisk + drift, 0, 100);
        const level = score >= 70 ? "HIGH" : score >= 40 ? "MEDIUM" : "LOW";

        setRisk({
          level,
          score,
          reasons: [
            "Fallback model (backend IA offline)",
            `Temp range ${tMin.toFixed(1)} → ${tMax.toFixed(1)}°C`,
            `Hum range ${hMin.toFixed(0)} → ${hMax.toFixed(0)}%`,
          ],
        });
      } else {
        setRisk(null);
      }
    } finally {
      setLoading((s) => ({ ...s, risk: false }));
    }
  }

  /** Boot */
  useEffect(() => {
    loadTelemetry();
    startSSE();

    const id = setInterval(() => {
      if (!sseRef.current) loadTelemetry();
    }, 4000);

    return () => {
      clearInterval(id);
      cleanupMetaMaskListeners();
      try {
        sseRef.current?.close?.();
      } catch {
        // ignore
      }
      sseRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!telemetry) return;
    if ((history?.length || 0) % 4 === 0) {
      loadRisk(telemetry?.deviceId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [telemetry?.ts, history?.length]);

  /** -------- Derived UI values -------- */
  const chainLabel = chainId
    ? isSaigon
      ? "Ronin Saigon"
      : `Chain ${parseInt(chainId, 16)}`
    : "No network";

  const t = Number(telemetry?.temperature);
  const h = Number(telemetry?.humidity);

  const tempTone = !Number.isFinite(t)
    ? "neutral"
    : t > 10
    ? "danger"
    : t > 6
    ? "warn"
    : t < -2
    ? "warn"
    : "ok";

  const humTone = !Number.isFinite(h)
    ? "neutral"
    : h > 85
    ? "warn"
    : h < 35
    ? "warn"
    : "ok";

  const deviceId = telemetry?.deviceId || "—";
  const lastSeen = telemetry?.ts ? formatTs(telemetry.ts) : "—";

  const storage = telemetry?.storage || {};
  const doorOpen = storage?.doorOpen;
  const coolingOn = storage?.coolingOn;
  const battery = storage?.battery;
  const rssi = storage?.rssi;

  const userLabel =
    user?.name ||
    user?.fullName ||
    user?.email ||
    user?.username ||
    (typeof user === "string" ? user : "");

  return (
    <div className="min-h-full text-white/90">
      <Toast toast={toast} onClose={() => setToast({ type: "", title: "", text: "", href: "" })} />

      {/* Background */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 opacity-80 bg-[radial-gradient(850px_520px_at_65%_18%,rgba(255,193,7,.18),transparent)]" />
        <div className="absolute inset-0 opacity-80 bg-[radial-gradient(950px_560px_at_25%_75%,rgba(244,63,94,.22),transparent)]" />
        <div className="absolute inset-0 opacity-70 bg-[radial-gradient(900px_520px_at_50%_110%,rgba(185,28,28,.25),transparent)]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-5 py-8">
        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-white/70">
              <Sparkles className="h-4 w-4" />
              <span className="text-xs">Chahia • Food Traceability (V2)</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">
              Telemetry <span className="text-white/70">Dashboard</span>
            </h1>
            <p className="text-sm text-white/60 max-w-2xl">
              ESP32 Temperature/Humidity + Stockage monitoring with{" "}
              <b>Blockchain verification</b> on <b>Ronin Saigon</b>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* User chip + Logout */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 shadow-[0_18px_45px_rgba(0,0,0,.35)]">
              <div className="flex items-center gap-2">
                <UserIcon className="h-4 w-4 text-white/70" />
                <div className="text-xs text-white/70">Session</div>
              </div>
              <div className="text-sm font-semibold">
                {userLabel ? shortAddr(userLabel) : "Signed in"}
              </div>
            </div>

            <button
              onClick={handleLogout}
              disabled={loading.logout}
              className={classNames(
                "rounded-2xl px-4 py-3 font-black shadow-[0_18px_45px_rgba(0,0,0,.35)] border border-white/10",
                "bg-white/[0.06] hover:bg-white/[0.10] transition",
                "disabled:opacity-60 disabled:cursor-not-allowed"
              )}
              title="Logout"
            >
              <span className="inline-flex items-center gap-2">
                {loading.logout ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <LogOut className="h-5 w-5" />
                )}
                Logout
              </span>
            </button>

            {/* Network */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 shadow-[0_18px_45px_rgba(0,0,0,.35)]">
              <div className="flex items-center gap-2">
                <Network className="h-4 w-4 text-white/70" />
                <div className="text-xs text-white/70">Network</div>
              </div>
              <div className="text-sm font-semibold">{chainLabel}</div>
            </div>

            {/* Wallet */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 shadow-[0_18px_45px_rgba(0,0,0,.35)]">
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-white/70" />
                <div className="text-xs text-white/70">Wallet</div>
              </div>
              <div className="text-sm font-semibold">
                {account ? shortAddr(account) : "Not connected"}
              </div>
            </div>

            {/* Connect */}
            <button
              onClick={connect}
              disabled={loading.connect}
              className={classNames(
                "rounded-2xl px-4 py-3 font-black shadow-[0_18px_45px_rgba(0,0,0,.35)] border border-white/10",
                "bg-gradient-to-b from-rose-500 to-amber-400",
                "hover:brightness-110 active:brightness-95 transition",
                "disabled:opacity-60 disabled:cursor-not-allowed text-black/90"
              )}
            >
              <span className="inline-flex items-center gap-2">
                {loading.connect ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <ShieldCheck className="h-5 w-5" />
                )}
                {account ? "Connected" : "Connect MetaMask"}
              </span>
            </button>
          </div>
        </div>

        {/* Top stats */}
        <div className="mt-6 grid gap-3 md:grid-cols-4">
          <Stat
            icon={<Radio className="h-5 w-5 text-white/80" />}
            label="Device"
            value={deviceId}
            sub={`Last seen: ${lastSeen}`}
          />
          <Stat
            icon={<Thermometer className="h-5 w-5 text-white/80" />}
            label="Temperature"
            value={Number.isFinite(t) ? `${t.toFixed(1)} °C` : "—"}
            sub="Live from ESP32"
            right={<span className={classNames("h-2.5 w-2.5 rounded-full", toneDot(tempTone))} />}
          />
          <Stat
            icon={<Droplets className="h-5 w-5 text-white/80" />}
            label="Humidity"
            value={Number.isFinite(h) ? `${h.toFixed(0)} %` : "—"}
            sub="Live from ESP32"
            right={<span className={classNames("h-2.5 w-2.5 rounded-full", toneDot(humTone))} />}
          />
          <Stat
            icon={<Shield className="h-5 w-5 text-white/80" />}
            label="Anomaly Risk"
            value={risk ? `${risk.level} • ${risk.score}/100` : "—"}
            sub={loading.risk ? "Analyzing…" : "From backend IA (fallback if offline)"}
            onClick={() => loadRisk(deviceId)}
          />
        </div>

        {/* Main grid */}
        <div className="mt-6 grid gap-4 lg:grid-cols-[340px_1fr]">
          {/* Left */}
          <div className="space-y-4">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] shadow-[0_18px_55px_rgba(0,0,0,.40)] p-5">
              <div className="flex items-center justify-between">
                <div className="text-sm font-black text-white/90">Blockchain layer</div>
                <div
                  className={classNames(
                    "text-xs px-2 py-1 rounded-full border border-white/10 bg-white/[0.03]",
                    isConnected ? "text-emerald-200" : "text-white/60"
                  )}
                >
                  {isConnected ? "Connected" : "Offline"}
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <button
                  onClick={() => window.open(explorerAddr(CONTRACT_ADDRESS), "_blank")}
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left hover:bg-white/[0.06] transition"
                >
                  <div className="flex items-center gap-2">
                    <ExternalLink className="h-4 w-4 text-white/70" />
                    <div className="text-sm font-semibold">Open contract on explorer</div>
                  </div>
                  <div className="text-xs text-white/60 mt-1 break-all">{CONTRACT_ADDRESS}</div>
                </button>

                <button
                  onClick={() => copy(CONTRACT_ADDRESS)}
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left hover:bg-white/[0.06] transition"
                >
                  <div className="flex items-center gap-2">
                    <Copy className="h-4 w-4 text-white/70" />
                    <div className="text-sm font-semibold">Copy contract address</div>
                  </div>
                  <div className="text-xs text-white/60 mt-1">Use for verification & audits</div>
                </button>
              </div>

              <div className="mt-4 text-xs text-white/55">
                Expected network: <b>Ronin Saigon</b> (chainId {SAIGON_CHAIN_ID_DEC})
              </div>
            </div>

            <RiskBadge risk={risk} loading={loading.risk} />

            <button
              onClick={loadTelemetry}
              disabled={loading.telemetry}
              className={classNames(
                "w-full rounded-2xl px-4 py-3 font-black border border-white/10",
                "bg-white/[0.06] hover:bg-white/[0.10] transition",
                "disabled:opacity-60 disabled:cursor-not-allowed"
              )}
            >
              <span className="inline-flex items-center justify-center gap-2">
                {loading.telemetry ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <RefreshCcw className="h-5 w-5" />
                )}
                Refresh telemetry
              </span>
            </button>
          </div>

          {/* Right */}
          <div className="space-y-4">
            <GlassCard
              title="Stockage (Storage) — Live Status"
              desc="Cold-chain monitoring: door, cooling, battery, signal."
              icon={<Warehouse className="h-5 w-5 text-white/80" />}
              right={
                <div className="text-xs rounded-full px-3 py-1 border border-white/10 bg-white/[0.03] text-white/70">
                  Live
                </div>
              }
            >
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="text-xs text-white/60">Door</div>
                  <div className="mt-1 text-lg font-black">
                    {doorOpen == null ? (
                      "—"
                    ) : doorOpen ? (
                      <span className="text-amber-200">OPEN</span>
                    ) : (
                      <span className="text-emerald-200">CLOSED</span>
                    )}
                  </div>
                  <div className="text-xs text-white/55 mt-1">Magnetic sensor</div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="text-xs text-white/60">Cooling</div>
                  <div className="mt-1 text-lg font-black">
                    {coolingOn == null ? (
                      "—"
                    ) : coolingOn ? (
                      <span className="text-emerald-200">ON</span>
                    ) : (
                      <span className="text-amber-200">OFF</span>
                    )}
                  </div>
                  <div className="text-xs text-white/55 mt-1">Relay / compressor</div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="text-xs text-white/60">Battery</div>
                  <div className="mt-1 text-lg font-black">
                    {Number.isFinite(Number(battery)) ? `${Number(battery).toFixed(0)}%` : "—"}
                  </div>
                  <div className="text-xs text-white/55 mt-1">Optional</div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="text-xs text-white/60">Wi-Fi Signal</div>
                  <div className="mt-1 text-lg font-black">
                    {Number.isFinite(Number(rssi)) ? `${Number(rssi).toFixed(0)} dBm` : "—"}
                  </div>
                  <div className="text-xs text-white/55 mt-1">RSSI</div>
                </div>
              </div>
            </GlassCard>

            <GlassCard
              title="Telemetry Feed"
              desc="Recent temperature & humidity samples (from backend storage)."
              icon={<Radio className="h-5 w-5 text-white/80" />}
              right={
                <div className="text-xs rounded-full px-3 py-1 border border-white/10 bg-white/[0.03] text-white/70">
                  Last {Math.min(history?.length || 0, 40)}
                </div>
              }
            >
              <div className="rounded-2xl border border-white/10 bg-black/20 overflow-hidden">
                <div className="grid grid-cols-3 gap-0 px-4 py-3 text-xs font-bold text-white/70 border-b border-white/10 bg-white/[0.03]">
                  <div>Time</div>
                  <div>Temp (°C)</div>
                  <div>Humidity (%)</div>
                </div>

                <div className="max-h-[320px] overflow-auto">
                  {(history || [])
                    .slice()
                    .reverse()
                    .slice(0, 40)
                    .map((row, i) => {
                      const rt = Number(row?.temperature);
                      const rh = Number(row?.humidity);
                      const key = row?.ts ? `${row.ts}-${i}` : `row-${i}`;

                      return (
                        <div
                          key={key}
                          className="grid grid-cols-3 gap-0 px-4 py-3 border-b border-white/5 text-sm hover:bg-white/[0.03] transition"
                        >
                          <div className="text-white/70 text-xs">{formatTs(row?.ts)}</div>
                          <div className="font-black">{Number.isFinite(rt) ? rt.toFixed(1) : "—"}</div>
                          <div className="font-black">{Number.isFinite(rh) ? rh.toFixed(0) : "—"}</div>
                        </div>
                      );
                    })}

                  {!history || history.length === 0 ? (
                    <div className="p-4 text-sm text-white/55">
                      No telemetry yet. Make sure ESP32 sends data to your backend.
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="mt-4 text-xs text-white/55">
                Tip: If SSE{" "}
                <code className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10">
                  /telemetry/stream
                </code>{" "}
                is enabled, the dashboard updates instantly (very smooth).
              </div>
            </GlassCard>
          </div>
        </div>

        <div className="mt-8 text-center text-xs text-white/40">
          Chahia Food-Traceability • V2 • ESP32 Telemetry • Blockchain • Anomaly Detection IA
        </div>
      </div>
    </div>
  );
}