import "dotenv/config";
import { JsonRpcProvider } from "ethers";

const url = process.env.RONIN_URL;

if (!url) {
  console.error("❌ RONIN_URL is missing in .env");
  process.exit(1);
}

const provider = new JsonRpcProvider(url);

const chainIdHex = await provider.send("eth_chainId", []);
const blockHex = await provider.send("eth_blockNumber", []);

console.log("✅ RPC OK");
console.log("Chain ID (hex):", chainIdHex);
console.log("Latest block (hex):", blockHex);
