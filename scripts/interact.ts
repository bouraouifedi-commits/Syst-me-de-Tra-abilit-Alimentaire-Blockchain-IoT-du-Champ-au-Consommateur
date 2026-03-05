import { network } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  const { ethers } = await network.connect();
  const [signer] = await ethers.getSigners();

  const file = path.join(process.cwd(), "deployments", `${network.name}.json`);
  const { ChahiaTraceability: addr } = JSON.parse(fs.readFileSync(file, "utf8"));

  // sécurité: vérifier que c'est bien un contrat
  const code = await ethers.provider.getCode(addr);
  if (code === "0x") throw new Error("Adresse sans contrat (redeploy).");

  const Factory = await ethers.getContractFactory("ChahiaTraceability");
  const contract = Factory.attach(addr).connect(signer);

  const lotId = "CHAHIA-POULET-2026-001";

  // 1) créer un lot (tu dois être PRODUCER = deployer)
  console.log("Creating lot...");
  let tx = await contract.createLot(lotId, "Poulet", "Création lot à l'élevage");
  await tx.wait();

  // 2) lecture
  const lot = await contract.getLot(lotId);
  console.log("Lot:", lot);

  // 3) ajouter un document CID (exemple)
  console.log("Adding document CID...");
  tx = await contract.addDocument(lotId, "bafybeigdyrfakecidexample123");
  await tx.wait();

  // 4) lire 1er document
  const doc0 = await contract.getDocument(lotId, 0);
  console.log("Doc0 CID:", doc0);

  console.log("Done ✅");
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
