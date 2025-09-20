import React, { useRef, useEffect, useState } from "react";
import { useUser } from '../context/UserContext';
import { useSui } from '../context/SuiContext';
import { useRouter } from 'next/router';

interface LoginComponentProps {
  errorMessage?: string;
  successMessage?: string;
}

const LoginComponent: React.FC<LoginComponentProps> = ({
  errorMessage,
  successMessage,
}) => {
  const [localError, setLocalError] = useState('');
  const [localSuccess, setLocalSuccess] = useState('');
  const { user, isAuthenticated } = useUser();
  const { zkLoginState, initializeZkLogin, loginWithGoogle, completeZkLogin, isLoading, error } = useSui();
  const router = useRouter();

  const videoRef = useRef<HTMLVideoElement | null>(null);

  // 嘗試在載入與首次互動時播放影片（行動裝置相容）
  useEffect(() => {
    const tryPlay = () => {
      const video = videoRef.current;
      if (!video) return;
      const playPromise = video.play();
      if (playPromise && typeof (playPromise as Promise<void>).then === 'function') {
        (playPromise as Promise<void>).catch(() => {
          // 某些瀏覽器仍需使用者互動才能播放，失敗時略過
        });
      }
    };

    // 進入頁面時先嘗試一次
    tryPlay();

    // 首次互動再嘗試一次
    const onFirstInteract = () => {
      tryPlay();
    };
    window.addEventListener('touchstart', onFirstInteract, { once: true });
    window.addEventListener('click', onFirstInteract, { once: true });

    return () => {
      window.removeEventListener('touchstart', onFirstInteract);
      window.removeEventListener('click', onFirstInteract);
    };
  }, []);

  // Handle OAuth callback from URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const jwtToken = urlParams.get('id_token');
    
    if (jwtToken && !zkLoginState.isAuthenticated) {
      completeZkLogin(jwtToken);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Redirect to deck page if authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      router.push('/deck');
    }
  }, [isAuthenticated, user, router]);

  // Initialize zkLogin on component mount
  useEffect(() => {
    if (!zkLoginState.nonce && !zkLoginState.isAuthenticated) {
      initializeZkLogin();
    }
  }, []);

  const handleGoogleLogin = async () => {
    try {
      setLocalError('');
      await loginWithGoogle();
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to login with Google');
    }
  };

  const displayError = error || localError || errorMessage;
  const displaySuccess = localSuccess || successMessage;



  return (
    <section className="Connect fixed w-full h-full bgImg z-2 flex flex-col ">
      <div className=" w-full h-full absolute -bottom-25"></div>
      <video ref={videoRef} className="video-container" autoPlay muted loop playsInline>
        <source src="/img/video.mp4" type="video/mp4" />
      </video>
      <div className="bgDark"></div>
      {/* Logo置頂 */}
      <div className="w-full flex flex-col items-center pt-45 z-10">
        <img src="/img/logo.png" alt="" width="256px" className="" />
      </div>
      {/* Error置中 */}
      {(displayError || displaySuccess) && (
        <div className="flex-1 flex items-center justify-center z-10">
          <div className={`text-sm bg-black/60 px-6 py-3 rounded-xl ${displayError ? "text-red-400" : "text-green-400"}`}>
            {displayError || displaySuccess}
          </div>
        </div>
      )}
      {/* ConnectButton置底 */}
      <div className="w-full flex flex-col items-center justify-end pb-16 z-10 mt-auto gap-4">
        {/* Sui zkLogin Authentication */}
        {zkLoginState.isAuthenticated ? (
          <div className="flex flex-col items-center gap-4 p-6 bg-black/60 rounded-xl">
            <h3 className="text-green-400 font-semibold text-lg">Connected to Sui</h3>
            <p className="text-white text-sm text-center">
              Address: {zkLoginState.userAddress?.slice(0, 8)}...{zkLoginState.userAddress?.slice(-6)}
            </p>
            <p className="text-green-300 text-xs text-center">Redirecting to your deck...</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4 items-center">
            {/* Google Sign-In with Sui zkLogin */}
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold mb-2 text-white">
                Sign in with Google to access Sui zkLogin
              </h3>
            </div>
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mr-2"></div>
              ) : (
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              {isLoading ? 'Connecting...' : 'Continue with Google'}
            </button>
            
            <div className="text-center text-sm text-gray-300">
              <p>Secure authentication powered by Sui zkLogin</p>
              <p className="text-xs mt-1">Gas fees sponsored by SHINAMI</p>
            </div>
          </div>
        )}
      </div>
    </section>

  );
};

export default LoginComponent;