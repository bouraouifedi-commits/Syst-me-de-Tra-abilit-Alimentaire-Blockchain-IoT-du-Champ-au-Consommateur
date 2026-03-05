import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import axios from "axios";
import FormData from "form-data";
import Web3 from "web3";
import mongoose from "mongoose";

import Telemetry from "./src/models/Telemetry.js";
import { startMqttIngest, startThingSpeakPolling, telemetryBus } from "./src/telemetry.js";
import { IsolationForest } from "./src/isoforest.js";
import { buildLotFeatures } from "./src/features.js";

dotenv.config();

const app = express();
app.use(express.json({ limit: "1mb" }));

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:5173";
app.use(cors({ origin: FRONTEND_ORIGIN }));

// ---------- Mongo ----------
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/chahia";
await mongoose.connect(MONGO_URI);
console.log("Mongo connected:", MONGO_URI);

// ---------- Start ingests ----------
startMqttIngest();
startThingSpeakPolling();

// ---------- Config ----------
const PORT = Number(process.env.PORT || 5050);
const RPC_URL = process.env.RONIN_URL;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const PINATA_JWT = process.env.PINATA_JWT;
const PINATA_GATEWAY = process.env.PINATA_GATEWAY || "https://gateway.pinata.cloud/ipfs/";

if (!RPC_URL) throw new Error("Missing RONIN_URL in .env");
if (!CONTRACT_ADDRESS) throw new Error("Missing CONTRACT_ADDRESS in .env");
if (!PINATA_JWT) throw new Error("Missing PINATA_JWT in .env");

// ---------- Upload ----------
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// ---------- Contract ABI (your existing minimal ABI) ----------
const ABI = [
  {
    inputs: [{ internalType: "string", name: "lotId", type: "string" }],
    name: "getLot",
    outputs: [
      { internalType: "string", name: "", type: "string" },
      { internalType: "string", name: "", type: "string" },
      { internalType: "address", name: "", type: "address" },
      { internalType: "uint8", name: "", type: "uint8" },
      { internalType: "uint256", name: "", type: "uint256" },
      { internalType: "uint256", name: "", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "string", name: "lotId", type: "string" },
      { internalType: "uint256", name: "index", type: "uint256" }
    ],
    name: "getHistoryEvent",
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" },
      { internalType: "address", name: "", type: "address" },
      { internalType: "uint8", name: "", type: "uint8" },
      { internalType: "string", name: "", type: "string" },
      { internalType: "string", name: "", type: "string" }
    ],
    stateMutability: "view",
    type: "function",
  }
];

const web3 = new Web3(RPC_URL);
const contract = new web3.eth.Contract(ABI, CONTRACT_ADDRESS);

// ---------- IA model (in-memory) ----------
const model = new IsolationForest({ nTrees: 120, sampleSize: 64 });
let modelReady = false;

function levelFromScore01(s) {
  if (s >= 0.70) return "HIGH";
  if (s >= 0.45) return "MEDIUM";
  return "LOW";
}

async function fetchLotData(lotId) {
  const lot = await contract.methods.getLot(lotId).call();
  const historyLen = Number(lot[5]);

  const statusSeq = [];
  const timeSeq = [];
  const actorSet = new Set();

  for (let i = 0; i < historyLen; i++) {
    const e = await contract.methods.getHistoryEvent(lotId, i).call();
    const ts = Number(e[0]);
    const actor = String(e[1]);
    const st = Number(e[2]);
    timeSeq.push(ts);
    statusSeq.push(st);
    actorSet.add(actor.toLowerCase());
  }

  return {
    lotId,
    documentsLen: Number(lot[4]),
    historyLen,
    statusSeq,
    timeSeq,
    actorCount: actorSet.size,
  };
}

// ---------- Health ----------
app.get("/health", (_, res) => res.json({ ok: true }));

// ============================================================
// ✅ TELEMETRY API (FINAL, compatible avec ton App.jsx)
// - GET /telemetry/latest?lotId=...
// - GET /telemetry/history?lotId=...&limit=40
// - GET /telemetry/stream (SSE)
// Retourne toujours: { data: ... }
// ============================================================

function toFrontend(doc) {
  if (!doc) return null;
  return {
    deviceId: doc.deviceId,
    lotId: doc.lotId,
    ts: doc.ts, // seconds (le front convertira en ms si besoin)
    temperature: doc.temperature,
    humidity: doc.humidity,
    storage: doc.storage || {},
    dataHash: doc.dataHash || null,
    txHash: doc.txHash || null,
    source: doc.source || null,
  };
}

app.get("/telemetry/latest", async (req, res) => {
  try {
    const lotId = req.query.lotId;
    const q = lotId ? { lotId } : {};
    const latest = await Telemetry.findOne(q).sort({ ts: -1 }).lean();
    return res.json({ data: toFrontend(latest) });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "telemetry_latest_failed", details: e.message });
  }
});

app.get("/telemetry/history", async (req, res) => {
  try {
    const lotId = req.query.lotId;
    const limit = Math.min(Number(req.query.limit || 40), 500);
    const q = lotId ? { lotId } : {};
    const items = await Telemetry.find(q).sort({ ts: -1 }).limit(limit).lean();
    return res.json({ data: items.reverse().map(toFrontend) });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "telemetry_history_failed", details: e.message });
  }
});

app.get("/telemetry/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const onData = (doc) => {
    res.write(`data: ${JSON.stringify(toFrontend(doc))}\n\n`);
  };

  telemetryBus.on("telemetry", onData);
  req.on("close", () => telemetryBus.off("telemetry", onData));
});

// ---------- IPFS (Pinata) ----------
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "file required" });

    const fd = new FormData();
    fd.append("file", req.file.buffer, {
      filename: req.file.originalname || "file",
      contentType: req.file.mimetype || "application/octet-stream",
    });

    const pin = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", fd, {
      maxBodyLength: Infinity,
      headers: {
        ...fd.getHeaders(),
        Authorization: `Bearer ${PINATA_JWT}`,
      },
    });

    const cid = pin?.data?.IpfsHash;
    if (!cid) return res.status(500).json({ error: "Pinata upload failed" });

    return res.json({
      cid,
      url: `${PINATA_GATEWAY}${cid}`,
      name: req.file.originalname,
      size: req.file.size,
      type: req.file.mimetype,
    });
  } catch (e) {
    return res.status(500).json({ error: e?.response?.data?.error || e.message || "upload error" });
  }
});

// ---------- IA (Isolation Forest) ----------
app.post("/train", async (req, res) => {
  try {
    const { lotIds } = req.body;
    if (!Array.isArray(lotIds) || lotIds.length < 5) {
      return res.status(400).json({ error: "lotIds[] required (>=5)" });
    }

    const X = [];
    for (const id of lotIds) {
      const d = await fetchLotData(id);
      X.push(buildLotFeatures({
        statusSeq: d.statusSeq,
        timeSeq: d.timeSeq,
        docCount: d.documentsLen,
        actorCount: d.actorCount,
      }));
    }

    model.fit(X);
    modelReady = true;
    return res.json({ ok: true, trainedOn: X.length });
  } catch (e) {
    return res.status(500).json({ error: e.message || "train failed" });
  }
});

app.get("/risk-score", async (req, res) => {
  try {
    const deviceId = req.query.deviceId || "ESP32";

    const points = await Telemetry
      .find({ deviceId })
      .sort({ ts: -1 })
      .limit(30)
      .lean();

    if (points.length < 5) {
      return res.json({
        level: "LOW",
        score: 5,
        reasons: ["not_enough_data"]
      });
    }

    const temps = points.map(p => Number(p.temperature)).filter(Number.isFinite);
    const hums = points.map(p => Number(p.humidity)).filter(Number.isFinite);

    const tMin = Math.min(...temps);
    const tMax = Math.max(...temps);
    const hMin = Math.min(...hums);
    const hMax = Math.max(...hums);

    let score = 0;
    const reasons = [];

    if (tMax > 8) {
      score += 35;
      reasons.push("temperature_above_safe_range");
    }

    if (tMax > 12) {
      score += 25;
      reasons.push("critical_temperature");
    }

    if (tMax - tMin > 5) {
      score += 15;
      reasons.push("temperature_instability");
    }

    if (hMax > 90) {
      score += 10;
      reasons.push("humidity_high");
    }

    if (hMin < 30) {
      score += 10;
      reasons.push("humidity_low");
    }

    score = Math.min(100, score);

    const level =
      score >= 70 ? "HIGH" :
      score >= 40 ? "MEDIUM" :
      "LOW";

    res.json({
      deviceId,
      score,
      level,
      reasons,
      stats: {
        tempRange: [tMin, tMax],
        humidityRange: [hMin, hMax],
        samples: points.length
      }
    });

  } catch (e) {
    res.status(500).json({
      error: "risk_analysis_failed",
      message: e.message
    });
  }
});

app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));