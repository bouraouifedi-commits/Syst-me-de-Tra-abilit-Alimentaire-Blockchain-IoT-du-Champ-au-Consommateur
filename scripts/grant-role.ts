import { network } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  const { ethers } = await network.connect();
  const [admin] = await ethers.getSigners();

  const file = path.join(process.cwd(), "deployments", `${network.name}.json`);
  const { ChahiaTraceability: addr } = JSON.parse(fs.readFileSync(file, "utf8"));

  const Factory = await ethers.getContractFactory("ChahiaTraceability");
  const contract = Factory.attach(addr).connect(admin);

  // ⚠️ Remplace par tes adresses Metamask (2e compte, 3e compte...)
  const processor = "0xb581f9843d3e677B6BAeD55A3Ffa71cC6038b1B7";
  const transporter = "0x5E9D681247FCA8A924189C8D1367A6ab555A3219";
  const distributor = "0xdCE1494CAb348CA56b6530356813f978Dfc38518";

  console.log("Granting roles...");

  // Role enum: NONE=0, PRODUCER=1, PROCESSOR=2, TRANSPORTER=3, DISTRIBUTOR=4
  await (await contract.grantRole(processor, 2)).wait();
  await (await contract.grantRole(transporter, 3)).wait();
  await (await contract.grantRole(distributor, 4)).wait();

  console.log("Done ✅");
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
