import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSui } from '../../context/SuiContext';

const AuthCallback = () => {
  const router = useRouter();
  const { completeZkLogin } = useSui();

  useEffect(() => {
    // Extract JWT token from URL fragment (Google OAuth returns it as #id_token=...)
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.substring(1));
    const idToken = params.get('id_token');
    
    if (idToken) {
      // Complete zkLogin with the JWT token
      completeZkLogin(idToken)
        .then(() => {
          // Redirect to deck page on success
          router.push('/deck');
        })
        .catch((error) => {
          console.error('zkLogin completion failed:', error);
          // Redirect to login page with error
          router.push('/login?error=auth_failed');
        });
    } else {
      // No token found, redirect to login
      router.push('/login?error=no_token');
    }
  }, [router, completeZkLogin]);

  return (
    <div className="min-h-screen bgImg flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-white text-lg">Processing authentication...</p>
        <p className="text-gray-300 text-sm mt-2">Please wait while we complete your login.</p>
      </div>
    </div>
  );
};

export default AuthCallback;