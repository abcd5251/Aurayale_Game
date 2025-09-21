import { decodeSuiPrivateKey } from "@mysten/sui/cryptography";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Logger } from "tslog";
import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";

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
    const tx = mergeNFT(
      "0xb256e472eab52a7ef377310d76351b44fb7c1f7a2fe16a3a3889be45e9187d8a",
      "0x3f3807099ee24706fadd7b765061567bd39726fa48108573315a8881d49f8075"
    );
    await suiClient.signAndExecuteTransaction({ transaction: tx, signer });

    // logger.info({ dryRunResponse });
  } catch (error) {
    logger.error("Subscription error:", error);
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
