const BASE_URL = 'https://aura-server.zeabur.app/api';

export interface GemItem {
  id: number;
  quantity: number;
  metadata: {
    name: string;
    image: string;
    description: string;
  };
}

export async function loginWithPassword(username: string, password: string) {
  const response = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Login failed');
  return data;
}

export async function registerWithPassword(username: string, password: string) {
  const response = await fetch(`${BASE_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Register failed');
  return data;
}

export async function requestBindWallet(jwt: string, walletAddress: string) {
  const response = await fetch(`${BASE_URL}/bind-wallet/request`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify({ walletAddress }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Request bind wallet failed');
  return data; // { nonce }
}

export async function confirmBindWallet(
  jwt: string,
  walletAddress: string,
  signature: string
) {
  const response = await fetch(`${BASE_URL}/bind-wallet/confirm`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify({ walletAddress, signature }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Confirm bind wallet failed');
  return data;
}

export async function unbindWallet(jwt: string, walletAddress: string) {
  const response = await fetch(`${BASE_URL}/unbind-wallet`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify({ walletAddress }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Unbind wallet failed');
  return data;
}

export async function getUserGems(jwt: string): Promise<GemItem[]> {
  const response = await fetch(`${BASE_URL}/user/gems`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to get gems');
  return data;
}

export async function getUserDeck(jwt: string): Promise<number[]> {
  const response = await fetch(`${BASE_URL}/user/gem-deck`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to get gem deck');
  return data.deck;
}

export async function editGemDeck(
  jwt: string,
  deckArray: number[]
): Promise<number[]> {
  const response = await fetch(`${BASE_URL}/user/gem-deck`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify({ gems: deckArray }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to update gem deck');
  return data.deck;
}

export async function loginWithGoogle(idToken: string) {
  const response = await fetch(`${BASE_URL}/google-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Google login failed');
  return data;
}

// Sui zkLogin authentication functions
export async function loginWithSuiZkLogin(suiAddress: string, jwtToken: string, googleId: string, email?: string, name?: string) {
  const response = await fetch(`${BASE_URL}/sui-zklogin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      suiAddress, 
      jwtToken, 
      googleId,
      email,
      name
    }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Sui zkLogin failed');
  return data;
}

// Update user profile with Sui address
export async function updateUserSuiAddress(jwt: string, suiAddress: string) {
  const response = await fetch(`${BASE_URL}/user/sui-address`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify({ suiAddress }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to update Sui address');
  return data;
}

// Legacy wallet binding functions (kept for backward compatibility)
// These can be removed once the backend fully supports Sui zkLogin
export async function requestBindSuiWallet(jwt: string, suiAddress: string) {
  const response = await fetch(`${BASE_URL}/bind-sui-wallet/request`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify({ suiAddress }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Request bind Sui wallet failed');
  return data;
}

export async function confirmBindSuiWallet(
  jwt: string,
  suiAddress: string,
  zkProof: any
) {
  const response = await fetch(`${BASE_URL}/bind-sui-wallet/confirm`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify({ suiAddress, zkProof }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Confirm bind Sui wallet failed');
  return data;
}
