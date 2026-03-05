import mongoose from "mongoose";

const TelemetrySchema = new mongoose.Schema(
  {
    deviceId: { type: String, required: true, index: true },
    lotId: { type: String, required: true, index: true },

    temperature: { type: Number, required: true }, // °C
    humidity: { type: Number, required: true },    // %

    ts: { type: Number, required: true, index: true }, // unix seconds

    storage: {
      doorOpen: { type: Boolean, default: null },
      coolingOn: { type: Boolean, default: null },
      battery: { type: Number, default: null },
      rssi: { type: Number, default: null },
    },

    source: { type: String, enum: ["mqtt", "thingspeak", "api"], default: "mqtt" },
    dataHash: { type: String, default: null },
    txHash: { type: String, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("Telemetry", TelemetrySchema);