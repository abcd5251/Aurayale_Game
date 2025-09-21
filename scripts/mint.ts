import dotenv from "dotenv";
import { decodeSuiPrivateKey } from "@mysten/sui/cryptography";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Logger } from "tslog";
import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import fs from "fs";

dotenv.config();

// suiAddress
const secret =
  "Your Sui Private Key" as string;
const { secretKey } = decodeSuiPrivateKey(secret);
export const signer = Ed25519Keypair.fromSecretKey(secretKey);
const logger = new Logger();

logger.info(`Signing Address: ${signer.toSuiAddress()}`);

const main = async () => {
  const suiClient = new SuiClient({ url: getFullnodeUrl("mainnet") });
  try {
    // Mint red gem
    const redGemTx = mintNFT("red", "gem_red_Brilliant");
    const redGemResult = await suiClient.signAndExecuteTransaction({ 
      transaction: redGemTx, 
      signer,
      options: {
        showEffects: true,
        showObjectChanges: true,
      },
    });
    
    // Extract the created object ID
    const redGemObject = redGemResult.objectChanges?.find(
      (change) => change.type === 'created'
    );
    logger.info("Red gem minted successfully:");
    logger.info("Transaction hash:", redGemResult.digest);
    if (redGemObject && 'objectId' in redGemObject) {
      logger.info("Red gem object ID:", redGemObject.objectId);
    }

    // Wait 1 second before minting the second gem
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mint blue gem
    const blueGemTx = mintNFT("blue", "gem_blue_Heart");
    const blueGemResult = await suiClient.signAndExecuteTransaction({ 
      transaction: blueGemTx, 
      signer,
      options: {
        showEffects: true,
        showObjectChanges: true,
      },
    });
    
    // Extract the created object ID
    const blueGemObject = blueGemResult.objectChanges?.find(
      (change) => change.type === 'created'
    );
    logger.info("Blue gem minted successfully:");
    logger.info("Transaction hash:", blueGemResult.digest);
    if (blueGemObject && 'objectId' in blueGemObject) {
      logger.info("Blue gem object ID:", blueGemObject.objectId);
    }

    // Save NFT object IDs to file for merge.ts to use
    const nftData = {
      redGemId: redGemObject && 'objectId' in redGemObject ? redGemObject.objectId : "",
      blueGemId: blueGemObject && 'objectId' in blueGemObject ? blueGemObject.objectId : "",
      timestamp: new Date().toISOString(),
      redGemTxHash: redGemResult.digest,
      blueGemTxHash: blueGemResult.digest
    };
    
    fs.writeFileSync('nft-objects.json', JSON.stringify(nftData, null, 2));
    logger.info("NFT object IDs saved to nft-objects.json");

  } catch (error) {
    logger.error("Minting error:", error);
  }
  return;
};

const mintNFT = (
  gemType: "green" | "red" | "blue" | "yellow",
  gemName: string
) => {
  const tx = new Transaction();

  const nft = tx.moveCall({
    target:
      "0x9500c58df467016bbb8600c9fe9ba837023bed8d9f3f469eac34462fbf68bd40::aurayale::admin_mint",
    arguments: [
      tx.object(
        "0xc68357273072960b8ad84f5db3e0c8a58a3d6ef8351c164bcd995cffdfd7bbfd"
      ),
      tx.object(
        "0x34096d33f1e3a32cd14174ebbe940eafbc44faa702f04dd5f0d20d5768ce1ada"
      ),
      tx.pure.string(gemType),
      tx.pure.string(gemName),
    ],
  });

  tx.setSender(signer.toSuiAddress());
  tx.transferObjects([nft], signer.toSuiAddress());
  return tx;
};

const mergeNFT = (mainNFTID: string, toBurnNFTID: string) => {
  const tx = new Transaction();

  const nft = tx.moveCall({
    target:
      "0x9500c58df467016bbb8600c9fe9ba837023bed8d9f3f469eac34462fbf68bd40::aurayale::merge_v1",
    arguments: [
      tx.object(
        "0xc68357273072960b8ad84f5db3e0c8a58a3d6ef8351c164bcd995cffdfd7bbfd"
      ),
      tx.sharedObjectRef({
        initialSharedVersion: 326168368,
        mutable: false,
        objectId: "0x08",
      }),
      tx.object(mainNFTID),
      tx.object(toBurnNFTID),
    ],
  });

  tx.setSender(signer.toSuiAddress());
  tx.transferObjects([nft], signer.toSuiAddress());

  return tx;
};

const burnNFT = (nftID: string) => {
  const tx = new Transaction();

  tx.moveCall({
    target:
      "0x9500c58df467016bbb8600c9fe9ba837023bed8d9f3f469eac34462fbf68bd40::aurayale::admin_burn",
    arguments: [
      tx.object(
        "0xc68357273072960b8ad84f5db3e0c8a58a3d6ef8351c164bcd995cffdfd7bbfd"
      ),
      tx.object(
        "0x34096d33f1e3a32cd14174ebbe940eafbc44faa702f04dd5f0d20d5768ce1ada"
      ),
      tx.object(nftID),
    ],
  });

  tx.setSender(signer.toSuiAddress());

  return tx;
};

// Entry
(async () => {
  try {
    await main();
  } catch (e) {
    logger.error(e);
  }
})();