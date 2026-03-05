import { defineConfig } from "hardhat/config";
import hardhatEthers from "@nomicfoundation/hardhat-ethers";
import * as dotenv from "dotenv";

dotenv.config();

export default defineConfig({
  solidity: "0.8.28",
  plugins: [hardhatEthers],
  networks: {
    hardhat: { type: "edr-simulated" },

    localhost: {
      type: "http",
      url: "http://127.0.0.1:8545",
    },

    saigon: {
      type: "http",
      url: process.env.RONIN_URL || "https://saigon-testnet.roninchain.com/rpc",
      chainId: 202601,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
});
