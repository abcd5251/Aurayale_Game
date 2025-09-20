import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { 
  ZkLoginState, 
  generateZkLoginRandomness, 
  generateZkLoginNonce, 
  generateZkLoginUrl,
  getCurrentEpoch,
  isValidSuiAddress
} from '../sui';
import { loginWithSuiZkLogin, updateUserSuiAddress } from '../api/auraServer';

interface SuiContextType {
  zkLoginState: ZkLoginState;
  initializeZkLogin: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  completeZkLogin: (jwtToken: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
}

const SuiContext = createContext<SuiContextType | undefined>(undefined);

export const SuiProvider = ({ children }: { children: ReactNode }) => {
  const [zkLoginState, setZkLoginState] = useState<ZkLoginState>({
    ephemeralKeyPair: null,
    randomness: null,
    nonce: null,
    maxEpoch: null,
    jwtToken: null,
    userAddress: null,
    isAuthenticated: false,
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load saved state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('sui-zklogin-state');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        // Restore ephemeral keypair from saved private key
        if (parsed.ephemeralPrivateKey) {
          const keypair = Ed25519Keypair.fromSecretKey(parsed.ephemeralPrivateKey);
          setZkLoginState({
            ...parsed,
            ephemeralKeyPair: keypair,
            isAuthenticated: !!parsed.userAddress && !!parsed.jwtToken,
          });
        }
      } catch (err) {
        console.error('Failed to restore zkLogin state:', err);
        localStorage.removeItem('sui-zklogin-state');
      }
    }
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (zkLoginState.ephemeralKeyPair) {
      const stateToSave = {
        ...zkLoginState,
        ephemeralPrivateKey: zkLoginState.ephemeralKeyPair.getSecretKey(),
        ephemeralKeyPair: undefined, // Don't serialize the keypair object
      };
      localStorage.setItem('sui-zklogin-state', JSON.stringify(stateToSave));
    }
  }, [zkLoginState]);

  const initializeZkLogin = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      // Generate ephemeral keypair
      const ephemeralKeyPair = new Ed25519Keypair();
      
      // Generate randomness
      const randomness = generateZkLoginRandomness();
      
      // Get current epoch and set max epoch (current + 10 for safety)
      const currentEpoch = await getCurrentEpoch();
      const maxEpoch = currentEpoch + 10;
      
      // Generate nonce
      const nonce = generateZkLoginNonce(ephemeralKeyPair, maxEpoch, randomness);
      
      setZkLoginState(prev => ({
        ...prev,
        ephemeralKeyPair,
        randomness,
        nonce,
        maxEpoch,
      }));
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize zkLogin');
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      if (!zkLoginState.nonce) {
        await initializeZkLogin();
      }

      if (!zkLoginState.nonce) {
        throw new Error('Failed to generate nonce');
      }

      // Generate Google OAuth URL
      const authUrl = generateZkLoginUrl(zkLoginState.nonce);
      
      // Redirect to Google OAuth
      window.location.href = authUrl;
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initiate Google login');
      setIsLoading(false);
    }
  };

  const completeZkLogin = async (jwtToken: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      if (!zkLoginState.ephemeralKeyPair || !zkLoginState.randomness) {
        throw new Error('zkLogin not properly initialized');
      }

      // Parse JWT to get user info
      const jwtPayload = JSON.parse(atob(jwtToken.split('.')[1]));
      const userSub = jwtPayload.sub;
      const email = jwtPayload.email;
      const name = jwtPayload.name;
      
      // For now, we'll use a simplified address derivation
      // In a real implementation, you'd need to generate the zkLogin proof
      // and derive the actual Sui address from it
      const userAddress = `0x${userSub.replace(/[^a-f0-9]/gi, '').padStart(64, '0').slice(0, 64)}`;
      
      if (!isValidSuiAddress(userAddress)) {
        throw new Error('Failed to generate valid Sui address');
      }

      // Authenticate with the backend using Sui zkLogin
      try {
        const authResult = await loginWithSuiZkLogin(
          userAddress,
          jwtToken,
          userSub,
          email,
          name
        );
        
        // Store the backend JWT token for API calls
        localStorage.setItem('backend-jwt', authResult.token);
      } catch (apiError) {
        console.warn('Backend authentication failed, continuing with local auth:', apiError);
        // Continue with local authentication even if backend fails
      }

      setZkLoginState(prev => ({
        ...prev,
        jwtToken,
        userAddress,
        isAuthenticated: true,
      }));
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete zkLogin');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = (): void => {
    setZkLoginState({
      ephemeralKeyPair: null,
      randomness: null,
      nonce: null,
      maxEpoch: null,
      jwtToken: null,
      userAddress: null,
      isAuthenticated: false,
    });
    localStorage.removeItem('sui-zklogin-state');
    localStorage.removeItem('backend-jwt');
  };

  const value: SuiContextType = {
    zkLoginState,
    initializeZkLogin,
    loginWithGoogle,
    completeZkLogin,
    logout,
    isLoading,
    error,
  };

  return (
    <SuiContext.Provider value={value}>
      {children}
    </SuiContext.Provider>
  );
};

export const useSui = (): SuiContextType => {
  const context = useContext(SuiContext);
  if (!context) {
    throw new Error('useSui must be used within a SuiProvider');
  }
  return context;
};