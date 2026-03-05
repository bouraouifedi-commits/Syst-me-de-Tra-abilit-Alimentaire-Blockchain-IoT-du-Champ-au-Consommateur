import mqtt from "mqtt";
import { EventEmitter } from "events";
import Telemetry from "./models/Telemetry.js";

export const telemetryBus = new EventEmitter();

export function startMqttIngest() {
  const enabled = (process.env.MQTT_ENABLED ?? "true").toLowerCase() === "true";
  if (!enabled) {
    console.log("MQTT disabled (MQTT_ENABLED=false).");
    return;
  }

  const MQTT_URL = process.env.MQTT_URL || "mqtt://127.0.0.1:1883";
  const MQTT_TOPIC = process.env.MQTT_TOPIC || "chahia/telemetry";

  const client = mqtt.connect(MQTT_URL);

  client.on("connect", () => {
    console.log("MQTT connected:", MQTT_URL);
    client.subscribe(MQTT_TOPIC, (err) => {
      if (err) console.error("MQTT subscribe error:", err);
      else console.log("MQTT subscribed:", MQTT_TOPIC);
    });
  });

  client.on("error", (e) => console.error("MQTT error:", e?.message || e));

  client.on("message", async (_topic, message) => {
    try {
      const data = JSON.parse(message.toString());
      const doc = await Telemetry.create(normalizeTelemetry(data, "mqtt"));
      telemetryBus.emit("telemetry", doc);
    } catch (err) {
      console.error("MQTT message error:", err?.message || err);
    }
  });
}

export function startThingSpeakPolling() {
  const channelId = process.env.THINGSPEAK_CHANNEL_ID;
  const readKey = process.env.THINGSPEAK_READ_API_KEY;

  if (!channelId || !readKey) {
    console.log("ThingSpeak polling disabled (missing THINGSPEAK_CHANNEL_ID / THINGSPEAK_READ_API_KEY).");
    return;
  }

  const intervalMs = Math.max(parseInt(process.env.THINGSPEAK_POLL_MS || "15000", 10), 5000);

  const fieldTemp = process.env.THINGSPEAK_FIELD_TEMP || "field1";
  const fieldHum = process.env.THINGSPEAK_FIELD_HUM || "field2";
  const fieldDoor = process.env.THINGSPEAK_FIELD_DOOR || "field3";
  const fieldCooling = process.env.THINGSPEAK_FIELD_COOLING || "field4";
  const fieldBattery = process.env.THINGSPEAK_FIELD_BATTERY || "field5";
  const fieldRssi = process.env.THINGSPEAK_FIELD_RSSI || "field6";

  console.log("ThingSpeak polling enabled:", { channelId, intervalMs });

  async function poll() {
    try {
      const url =
        `https://api.thingspeak.com/channels/${encodeURIComponent(channelId)}/feeds/last.json?api_key=${encodeURIComponent(readKey)}`;

      const r = await fetch(url);
      if (!r.ok) throw new Error(`ThingSpeak HTTP ${r.status}`);
      const feed = await r.json();

      const temperature = toNum(feed[fieldTemp]);
      const humidity = toNum(feed[fieldHum]);
      if (typeof temperature !== "number" || typeof humidity !== "number") return;

      const doc = await Telemetry.create(
        normalizeTelemetry(
          {
            deviceId: process.env.THINGSPEAK_DEVICE_ID || "ThingSpeak",
            lotId: process.env.THINGSPEAK_LOT_ID || "LOT-001",
            temperature,
            humidity,
            ts: feed.created_at ? Math.floor(Date.parse(feed.created_at) / 1000) : Math.floor(Date.now() / 1000),
            storage: {
              doorOpen: toBool01(feed[fieldDoor]),
              coolingOn: toBool01(feed[fieldCooling]),
              battery: toNum(feed[fieldBattery]),
              rssi: toNum(feed[fieldRssi]),
            },
          },
          "thingspeak"
        )
      );

      telemetryBus.emit("telemetry", doc);
    } catch (e) {
      console.error("ThingSpeak poll error:", e?.message || e);
    }
  }

  poll();
  setInterval(poll, intervalMs);
}

// ---------------- Helpers ----------------
function normalizeTelemetry(data, source) {
  const temperature = data.temperature ?? data.temp;
  const humidity = data.humidity ?? data.hum;

  return {
    deviceId: data.deviceId || "ESP32",
    lotId: data.lotId || "LOT-001",
    temperature: Number(temperature),
    humidity: Number(humidity),
    ts: typeof data.ts === "number" ? data.ts : Math.floor(Date.now() / 1000),
    storage: {
      doorOpen: data.storage?.doorOpen ?? null,
      coolingOn: data.storage?.coolingOn ?? null,
      battery: data.storage?.battery ?? null,
      rssi: data.storage?.rssi ?? null,
    },
    source,
  };
}

function toNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function toBool01(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return n === 1;
}