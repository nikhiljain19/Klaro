import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { CheckCircle2, Eye, EyeOff } from 'lucide-react';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isValidLink, setIsValidLink] = useState(false);
  const [checkingLink, setCheckingLink] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
          setIsValidLink(true);
          setCheckingLink(false);
        }
      }
    );

    const timer = setTimeout(() => {
      setCheckingLink(false);
    }, 2000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  const passwordLengthError = password.length > 0 && password.length < 8;
  const passwordMatchError = confirmPassword.length > 0 && password !== confirmPassword;
  const isFormValid = password.length >= 8 && password === confirmPassword;

  const handleReset = async () => {
    if (!isFormValid) return;
    setLoading(true);
    setError(null);
    try {
      const { error: resetErr } = await supabase.auth.updateUser({ password: password });
      if (resetErr) throw resetErr;
      setSuccess(true);
    } catch (err) {
      setError(err.message || "Failed to update password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleReset();
    }
  };

  if (checkingLink) {
    return (
      <div className="min-h-screen bg-surface flex flex-col justify-center items-center p-4">
        <div className="text-primary font-medium animate-pulse">Verifying reset link...</div>
      </div>
    );
  }

  if (!isValidLink && !success) {
    return (
      <div className="min-h-screen bg-surface flex flex-col justify-center items-center p-4">
        <div className="bg-card rounded-xl shadow-sm border border-border p-8 w-full max-w-md mx-auto text-center">
          <h2 className="text-lg font-medium text-gray-900 mb-2">Invalid Link</h2>
          <p className="text-sm text-text-muted mb-6">
            This reset link is invalid or has expired. Please request a new one.
          </p>
          <button
            onClick={() => navigate('/forgot-password')}
            className="w-full bg-primary text-white rounded-lg py-2.5 text-sm font-medium transition-colors hover:bg-primary/90"
          >
            Request New Link
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-surface flex flex-col justify-center items-center p-4">
        <div className="bg-card rounded-xl shadow-sm border border-border p-8 w-full max-w-md mx-auto">
          <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-4" />
          <h2 className="text-lg font-medium text-center mb-2 text-gray-900">Password updated!</h2>
          <p className="text-sm text-text-muted text-center mb-6">
            You can now sign in with your new password.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-primary text-white rounded-lg py-2.5 text-sm font-medium transition-colors hover:bg-primary/90"
          >
            Sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-center items-center p-4">
      <div className="bg-card rounded-xl shadow-sm border border-border p-8 w-full max-w-md mx-auto">
        <h1 className="text-2xl font-semibold text-primary text-center mb-1">Klaro</h1>
        <p className="text-sm text-text-muted text-center mb-8">Set a new password</p>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-text-muted mb-1">New Password</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                className={`w-full rounded-lg border ${passwordLengthError ? 'border-danger focus:border-danger focus:ring-danger' : 'border-border focus:border-focus focus:ring-primary'} px-3 py-2.5 pr-10 text-sm focus:ring-1 focus:outline-none bg-white`}
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-gray-900"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {passwordLengthError && <p className="text-xs text-danger mt-1">Password must be at least 8 characters</p>}
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-text-muted mb-1">Confirm New Password</label>
            <div className="relative">
              <input 
                type={showConfirmPassword ? "text" : "password"} 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                className={`w-full rounded-lg border ${passwordMatchError ? 'border-danger focus:border-danger focus:ring-danger' : 'border-border focus:border-focus focus:ring-primary'} px-3 py-2.5 pr-10 text-sm focus:ring-1 focus:outline-none bg-white`}
              />
              <button 
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-gray-900"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {passwordMatchError && <p className="text-xs text-danger mt-1">Passwords don't match</p>}
          </div>

          <button
            onClick={handleReset}
            disabled={loading || !isFormValid}
            className={`w-full bg-primary text-white rounded-lg py-2.5 text-sm font-medium mt-4 transition-colors ${loading || !isFormValid ? 'opacity-70 cursor-not-allowed' : 'hover:bg-primary/90'}`}
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>

          {error && (
            <div className="text-sm text-danger text-center mt-2 bg-red-50 rounded-lg px-3 py-2 border border-red-100">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
