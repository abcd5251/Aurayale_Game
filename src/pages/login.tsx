import { useState } from 'react';
import { useRouter } from 'next/router';
import LoginComponent from '../components/LoginComponent';
import { useUser } from '../context/UserContext';

const LoginPage = () => {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { isAuthenticated } = useUser();
  const router = useRouter();

  // Redirect if already authenticated
  if (isAuthenticated) {
    router.push('/deck');
    return null;
  }

  return (
    <LoginComponent
      errorMessage={error}
      successMessage={success}
    />
  );
};

export default LoginPage;
