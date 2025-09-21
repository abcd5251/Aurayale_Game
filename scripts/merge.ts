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
  
  // Read NFT object IDs from file
  let nft1 = "";
  let nft2 = "";
  
  try {
    const nftDataRaw = fs.readFileSync('nft-objects.json', 'utf8');
    const nftData = JSON.parse(nftDataRaw);
    nft1 = nftData.redGemId;
    nft2 = nftData.blueGemId;
    
    logger.info("Loaded NFT objects from nft-objects.json:");
    logger.info("Red gem ID:", nft1);
    logger.info("Blue gem ID:", nft2);
    logger.info("Minted at:", nftData.timestamp);
  } catch (error) {
    logger.error("Failed to read nft-objects.json. Please run mint.ts first.");
    return;
  }
  
  if (!nft1 || !nft2) {
    logger.error("Invalid NFT object IDs. Please run mint.ts first.");
    return;
  }
  
  try {
    // Step 1: Merge NFTs
    logger.info("Starting merge operation...");
    const mergeTx = mergeNFT(nft1, nft2);
    const mergeResult = await suiClient.signAndExecuteTransaction({ 
      transaction: mergeTx, 
      signer,
      options: {
        showEffects: true,
        showObjectChanges: true,
      },
    });
    
    // Extract the merged NFT object ID
    const mergedNFTObject = mergeResult.objectChanges?.find(
      (change) => change.type === 'created'
    );
    
    logger.info("Merge completed successfully:");
    logger.info("Merge transaction ID:", mergeResult.digest);
    
    let mergedNFTId = "";
    if (mergedNFTObject && 'objectId' in mergedNFTObject) {
      mergedNFTId = mergedNFTObject.objectId;
      logger.info("Merged NFT object ID:", mergedNFTId);
    }
    
    // Wait 1 second before burning
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Step 2: Burn the merged NFT
    logger.info("Starting burn operation...");
    const burnTx = burnNFT(mergedNFTId);
    const burnResult = await suiClient.signAndExecuteTransaction({ 
      transaction: burnTx, 
      signer,
      options: {
        showEffects: true,
        showObjectChanges: true,
      },
    });
    
    logger.info("Burn completed successfully:");
    logger.info("Burn transaction ID:", burnResult.digest);
    
    // Summary
    logger.info("=== Operation Summary ===");
    logger.info("Original NFT 1:", nft1);
    logger.info("Original NFT 2:", nft2);
    logger.info("Merged NFT ID:", mergedNFTId);
    logger.info("Merge Transaction ID:", mergeResult.digest);
    logger.info("Burn Transaction ID:", burnResult.digest);
    
  } catch (error) {
    logger.error("Operation error:", error);
  }
  return;
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