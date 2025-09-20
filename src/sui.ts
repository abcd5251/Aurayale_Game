import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { Transaction } from '@mysten/sui/transactions';
import { fromB64 } from '@mysten/sui/utils';
import { generateNonce, generateRandomness } from '@mysten/sui/zklogin';
import { jwtDecode } from 'jwt-decode';

// Sui network configuration
export const SUI_NETWORK = 'testnet'; // Change to 'mainnet' for production
export const SUI_RPC_URL = getFullnodeUrl(SUI_NETWORK);

// SHINAMI configuration for gas sponsorship
export const SHINAMI_GAS_SPONSOR_URL = 'https://api.shinami.com/gas/v1';
export const SHINAMI_KEY = process.env.NEXT_PUBLIC_SHINAMI_KEY || '';

// Google OAuth configuration for zkLogin
export const GOOGLE_CLIENT_ID = '326148801733-i5skacoksa3b6cia2f5l8akp3kg1ua7b.apps.googleusercontent.com';
export const REDIRECT_URI = typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : '';

// zkLogin configuration
export const ZKLOGIN_CONFIG = {
  provider: 'Google' as const,
  clientId: GOOGLE_CLIENT_ID,
  redirectUri: REDIRECT_URI,
};

// Create Sui client instance
export const suiClient = new SuiClient({ url: SUI_RPC_URL });

// zkLogin utility functions
export function generateZkLoginUrl(nonce: string, state?: string): string {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'id_token',
    scope: 'openid email profile',
    nonce: nonce,
    ...(state && { state }),
  });
  
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

// Generate zkLogin nonce
export function generateZkLoginNonce(
  ephemeralKeyPair: Ed25519Keypair,
  maxEpoch: number,
  randomness: string
): string {
  return generateNonce(ephemeralKeyPair.getPublicKey(), maxEpoch, randomness);
}

export function generateZkLoginRandomness(): string {
  return generateRandomness();
}

// SHINAMI gas sponsorship functions
export async function sponsorTransaction(txBytes: Uint8Array, userAddress: string): Promise<string> {
  if (!SHINAMI_KEY) {
    throw new Error('SHINAMI_KEY is not configured');
  }

  const response = await fetch(SHINAMI_GAS_SPONSOR_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': SHINAMI_KEY,
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'gas_sponsorTransactionBlock',
      params: [
        {
          txBytes: Array.from(txBytes),
          sender: userAddress,
        },
      ],
    }),
  });

  const data = await response.json();
  
  if (data.error) {
    throw new Error(`SHINAMI sponsorship failed: ${data.error.message}`);
  }

  return data.result.txBytes;
}

// Utility function to create a sponsored transaction
export async function createSponsoredTransaction(
  userAddress: string,
  transaction: Transaction
): Promise<{ txBytes: string; sponsoredTxBytes: string }> {
  // Build the transaction
  const txBytes = await transaction.build({ client: suiClient });
  
  // Sponsor the transaction with SHINAMI
  const sponsoredTxBytes = await sponsorTransaction(txBytes, userAddress);
  
  return {
    txBytes: Array.from(txBytes).toString(),
    sponsoredTxBytes,
  };
}

// Helper function to get current epoch
export async function getCurrentEpoch(): Promise<number> {
  const systemState = await suiClient.getLatestSuiSystemState();
  return Number(systemState.epoch);
}

// Helper function to validate Sui address
export function isValidSuiAddress(address: string): boolean {
  try {
    // Sui addresses are 32 bytes (64 hex characters) with 0x prefix
    return /^0x[a-fA-F0-9]{64}$/.test(address);
  } catch {
    return false;
  }
}

// Export types for TypeScript
export interface ZkLoginState {
  ephemeralKeyPair: Ed25519Keypair | null;
  randomness: string | null;
  nonce: string | null;
  maxEpoch: number | null;
  jwtToken: string | null;
  userAddress: string | null;
  isAuthenticated: boolean;
}

export interface ZkLoginProof {
  proofPoints: {
    a: string[];
    b: string[][];
    c: string[];
  };
  issBase64Details: {
    value: string;
    indexMod4: number;
  };
  headerBase64: string;
}