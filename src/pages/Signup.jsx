import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signUp, resendConfirmation } from '../lib/supabase';
import { CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { Navigate } from 'react-router-dom';

export default function Signup() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  if (user) {
    return <Navigate to="/" replace />;
  }

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const passwordLengthError = password.length > 0 && password.length < 8;
  const passwordMatchError = confirmPassword.length > 0 && password !== confirmPassword;
  
  const isFormValid = email.length > 0 && password.length >= 8 && password === confirmPassword;

  const handleSignUp = async () => {
    if (!isFormValid) return;
    setLoading(true);
    setError(null);
    try {
      await signUp(email, password);
      setSuccess(true);
    } catch (err) {
      if (err.message && err.message.toLowerCase().includes('already registered')) {
        setError("An account with this email already exists. Try signing in.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && isFormValid && !loading) {
      handleSignUp();
    }
  };

  const handleResend = async () => {
    try {
      await resendConfirmation(email);
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-surface flex flex-col justify-center items-center p-4">
        <div className="bg-card rounded-xl shadow-sm border border-border p-8 w-full max-w-md mx-auto">
          <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-4" />
          <h2 className="text-lg font-medium text-gray-900 text-center mb-2">Check your inbox</h2>
          <p className="text-sm text-text-muted text-center leading-relaxed">
            We've sent a confirmation link to {email}. Click the link to activate your account.
          </p>
          <div className="mt-6">
            <p className="text-sm text-text-muted text-center">
              Didn't receive it? Check your spam folder or{' '}
              <span onClick={handleResend} className="text-primary cursor-pointer hover:underline font-medium">
                resend the email
              </span>
            </p>
            {resendSuccess && (
              <p className="text-xs text-success text-center mt-2 animate-in fade-in transition-opacity">
                Email sent!
              </p>
            )}
          </div>
          <span onClick={() => navigate('/login')} className="text-sm text-primary text-center mt-6 cursor-pointer block hover:underline font-medium">
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
        <p className="text-sm text-text-muted text-center mb-8">Create your account</p>

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
            <label className="block text-xs font-medium uppercase tracking-wide text-text-muted mb-1">Password</label>
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
            <label className="block text-xs font-medium uppercase tracking-wide text-text-muted mb-1">Confirm Password</label>
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
            onClick={handleSignUp}
            disabled={loading || !isFormValid}
            className={`w-full bg-primary text-white rounded-lg py-2.5 text-sm font-medium mt-4 transition-colors ${loading || !isFormValid ? 'opacity-70 cursor-not-allowed' : 'hover:bg-primary/90'}`}
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>

          {error && (
            <div className="text-sm text-danger text-center mt-2 bg-red-50 rounded-lg px-3 py-2 border border-red-100">
              {error}
            </div>
          )}
        </div>

        <p className="text-sm text-center text-text-muted mt-6">
          Already have an account?{' '}
          <span onClick={() => navigate('/login')} className="text-primary cursor-pointer hover:underline font-medium">
            Sign in
          </span>
        </p>
      </div>
    </div>
  );
}
