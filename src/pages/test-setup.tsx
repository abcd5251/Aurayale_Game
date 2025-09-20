import { useState } from 'react';
import { loginWithPassword, registerWithPassword, getUserGems, getUserDeck } from '../api/auraServer';

export default function TestSetup() {
  const [username, setUsername] = useState('testuser');
  const [password, setPassword] = useState('testpass123');
  const [token, setToken] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    try {
      setLoading(true);
      const result = await registerWithPassword(username, password);
      setResult(`Registration successful: ${JSON.stringify(result)}`);
    } catch (error: any) {
      setResult(`Registration error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      setLoading(true);
      const result = await loginWithPassword(username, password);
      setToken(result.token);
      setResult(`Login successful: ${JSON.stringify(result)}`);
    } catch (error: any) {
      setResult(`Login error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGetGems = async () => {
    if (!token) {
      setResult('Please login first');
      return;
    }
    try {
      setLoading(true);
      const gems = await getUserGems(token);
      setResult(`Gems: ${JSON.stringify(gems)}`);
    } catch (error: any) {
      setResult(`Get gems error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGetDeck = async () => {
    if (!token) {
      setResult('Please login first');
      return;
    }
    try {
      setLoading(true);
      const deck = await getUserDeck(token);
      setResult(`Deck: ${JSON.stringify(deck)}`);
    } catch (error: any) {
      setResult(`Get deck error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-2xl mb-8">API Test Setup</h1>
      
      <div className="space-y-4 max-w-md">
        <div>
          <label className="block mb-2">Username:</label>
          <input 
            type="text" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-2 bg-gray-800 rounded"
          />
        </div>
        
        <div>
          <label className="block mb-2">Password:</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 bg-gray-800 rounded"
          />
        </div>
        
        <div className="space-x-2">
          <button 
            onClick={handleRegister} 
            disabled={loading}
            className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Register
          </button>
          
          <button 
            onClick={handleLogin} 
            disabled={loading}
            className="px-4 py-2 bg-green-600 rounded hover:bg-green-700 disabled:opacity-50"
          >
            Login
          </button>
        </div>
        
        {token && (
          <div className="space-x-2">
            <button 
              onClick={handleGetGems} 
              disabled={loading}
              className="px-4 py-2 bg-purple-600 rounded hover:bg-purple-700 disabled:opacity-50"
            >
              Get Gems
            </button>
            
            <button 
              onClick={handleGetDeck} 
              disabled={loading}
              className="px-4 py-2 bg-orange-600 rounded hover:bg-orange-700 disabled:opacity-50"
            >
              Get Deck
            </button>
          </div>
        )}
        
        {token && (
          <div>
            <label className="block mb-2">Token:</label>
            <textarea 
              value={token} 
              readOnly
              className="w-full p-2 bg-gray-800 rounded h-20"
            />
          </div>
        )}
        
        <div>
          <label className="block mb-2">Result:</label>
          <textarea 
            value={result} 
            readOnly
            className="w-full p-2 bg-gray-800 rounded h-32"
          />
        </div>
      </div>
    </div>
  );
}