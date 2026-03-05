import hre from "hardhat";

async function main() {
  const net = await hre.network.provider.send("eth_chainId", []);
  console.log("Chain ID (hex):", net);

  const blockNumber = await hre.network.provider.send("eth_blockNumber", []);
  console.log("Latest block (hex):", blockNumber);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
