'use client'
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import './styles.scss';
import posthog from 'posthog-js';  // Added PostHog import
import { verifyToken } from '@/utils/auth';  // Added verifyToken utility import

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('token', data.token);
        console.log('Token saved to localStorage:', data.token);
        
        // Identify user in PostHog after successful login
        try {
          const decodedToken = verifyToken(data.token);
          if (decodedToken && decodedToken.email) {
            // Identify the user in PostHog
            posthog.identify(decodedToken.email, {
              email: decodedToken.email,
              userId: decodedToken.userId
            });
            console.log('User identified in PostHog:', decodedToken.email);
          } else {
            console.warn('Could not decode token for PostHog identification');
          }
        } catch (posthogError) {
          // Log error but don't block login flow
          console.error('Error identifying user in PostHog:', posthogError);
        }
        
        router.push('/');
      } else {
        setError(data.message || 'Authentication failed');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <h1>Login</h1>
        {error && <div className="error-message">{error}</div>}
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
        />
        <button type="submit">Submit</button>
      </form>
    </div>
  );
}