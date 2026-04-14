import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signIn } from '../lib/supabase';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { Navigate } from 'react-router-dom';

export default function Login() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  if (user) {
    return <Navigate to="/" replace />;
  }

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSignIn = async () => {
    if (!email || !password) return;
    setLoading(true);
    setError(null);
    try {
      await signIn(email, password);
      navigate('/');
    } catch (err) {
      setError("Incorrect email or password");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSignIn();
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-center items-center p-4">
      <div className="bg-card rounded-xl shadow-sm border border-border p-8 w-full max-w-md mx-auto">
        
        <h1 className="text-2xl font-semibold text-primary text-center mb-1">Klaro</h1>
        <p className="text-sm text-text-muted text-center mb-8">Your medical timeline</p>

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

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-medium uppercase tracking-wide text-text-muted">Password</label>
              <span 
                onClick={() => navigate('/forgot-password')}
                className="text-xs text-primary cursor-pointer hover:underline"
              >
                Forgot password?
              </span>
            </div>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full rounded-lg border border-border px-3 py-2.5 pr-10 text-sm focus:border-focus focus:ring-1 focus:ring-primary focus:outline-none bg-white"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-gray-900"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            onClick={handleSignIn}
            disabled={loading || !email || !password}
            className={`w-full bg-primary text-white rounded-lg py-2.5 text-sm font-medium mt-4 transition-colors ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-primary/90'}`}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          {error && (
            <div className="text-sm text-danger text-center mt-2 bg-red-50 rounded-lg px-3 py-2 border border-red-100">
              {error}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 border-t border-border"></div>
          <span className="text-xs text-text-muted">or</span>
          <div className="flex-1 border-t border-border"></div>
        </div>

        <p className="text-sm text-center text-text-muted">
          Don't have an account?{' '}
          <span onClick={() => navigate('/signup')} className="text-primary cursor-pointer hover:underline font-medium">
            Create one
          </span>
        </p>
      </div>
    </div>
  );
}
