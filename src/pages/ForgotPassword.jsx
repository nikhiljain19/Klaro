import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleReset = async () => {
    if (!email) return;
    setLoading(true);
    setError(null);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset-password'
      });
      if (resetError) throw resetError;
      setSuccess(true);
    } catch (err) {
      setError("Couldn't send reset email. Please check the address and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && email && !loading) {
      handleReset();
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-surface flex flex-col justify-center items-center p-4">
        <div className="bg-card rounded-xl shadow-sm border border-border p-8 w-full max-w-md mx-auto">
          <h2 className="text-lg font-medium text-gray-900 text-center mb-2">Check your email</h2>
          <p className="text-sm text-text-muted text-center mb-8">
            We've sent a password reset link to {email}.
          </p>
          <span 
            onClick={() => navigate('/login')} 
            className="text-sm text-primary text-center cursor-pointer block hover:underline font-medium"
          >
            Back to sign in
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-center items-center p-4">
      <div className="bg-card rounded-xl shadow-sm border border-border p-8 w-full max-w-md mx-auto">
        <h1 className="text-2xl font-semibold text-primary text-center mb-1">Klaro</h1>
        <p className="text-sm text-text-muted text-center mb-8">Reset your password</p>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-text-muted mb-1">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:border-focus focus:ring-1 focus:ring-primary focus:outline-none bg-white"
            />
          </div>

          <button
            onClick={handleReset}
            disabled={loading || !email}
            className={`w-full bg-primary text-white rounded-lg py-2.5 text-sm font-medium transition-colors mt-2 ${loading || !email ? 'opacity-70 cursor-not-allowed' : 'hover:bg-primary/90'}`}
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>

          {error && (
            <div className="text-sm text-danger text-center mt-2 bg-red-50 rounded-lg px-3 py-2 border border-red-100">
              {error}
            </div>
          )}
        </div>

        <div className="mt-8">
          <span 
            onClick={() => navigate('/login')} 
            className="text-sm text-primary text-center cursor-pointer block hover:underline font-medium"
          >
            Back to sign in
          </span>
        </div>

      </div>
    </div>
  );
}
