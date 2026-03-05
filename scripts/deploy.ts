import { network } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  const { ethers } = await network.connect();
  const [deployer] = await ethers.getSigners();

  console.log("Deployer:", await deployer.getAddress());

  const Factory = await ethers.getContractFactory("ChahiaTraceability");
  const contract = await Factory.deploy();
  await contract.waitForDeployment();

  const addr = await contract.getAddress();
  console.log("ChahiaTraceability deployed to:", addr);

  const outDir = path.join(process.cwd(), "deployments");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

  // enregistre par network name
  const net = network.name;
  fs.writeFileSync(
    path.join(outDir, `${net}.json`),
    JSON.stringify({ ChahiaTraceability: addr }, null, 2)
  );
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
