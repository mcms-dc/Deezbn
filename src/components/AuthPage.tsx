import React, { useState } from 'react';
import { useSignalStore } from '../store/useSignalStore';
import { authService } from '../lib/auth';

const DEVELOPER_PHONE = '1234567890'; // Replace with your actual WhatsApp number

export const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showWhatsapp, setShowWhatsapp] = useState(false);

  const { setAuthenticated, setUserEmail } = useSignalStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const user = await authService.login(email, code);
      if (user) {
        setUserEmail(email);
        setAuthenticated(true);
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await authService.signUp(email);
      setShowWhatsapp(true);
    } catch (err: any) {
      setError(err.message || 'Sign up failed');
    } finally {
      setIsLoading(false);
    }
  };

  const openWhatsapp = () => {
    const message = encodeURIComponent(
      `Hello Deezbn, I just signed up for the Signal Analyzer with email ${email}. Please provide my access code!`
    );
    window.open(`https://wa.me/${DEVELOPER_PHONE}?text=${message}`, '_blank');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-deriv-bg p-4">
      <div className="w-full max-w-md bg-deriv-card border border-gray-800 rounded-3xl p-8 shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <img
            src="/icons/icon-512.webp"
            alt="Logo"
            className="w-24 h-24 rounded-full mb-4 shadow-lg"
          />
          <h2 className="text-2xl font-black text-white text-center">
            {isLogin ? 'WELCOME BACK' : 'CREATE ACCOUNT'}
          </h2>
          <p className="text-deriv-muted text-sm text-center mt-2">
            {isLogin ? 'Enter your details to access signals' : 'Register to request access from developer'}
          </p>
        </div>

        <div className="flex mb-8 bg-black/30 p-1 rounded-xl">
          <button
            onClick={() => { setIsLogin(true); setShowWhatsapp(false); }}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${isLogin ? 'bg-deriv-accent text-white shadow-lg' : 'text-deriv-muted hover:text-white'}`}
          >
            Login
          </button>
          <button
            onClick={() => { setIsLogin(false); setShowWhatsapp(false); }}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${!isLogin ? 'bg-deriv-accent text-white shadow-lg' : 'text-deriv-muted hover:text-white'}`}
          >
            Sign Up
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/50 text-red-400 text-xs text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={isLogin ? handleLogin : handleSignUp} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-deriv-muted uppercase ml-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              className="bg-black/40 border border-gray-700 rounded-xl p-3 text-white focus:border-deriv-accent outline-none transition-all"
            />
          </div>

          {isLogin && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-deriv-muted uppercase ml-1">Access Code</label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Enter your secret code"
                className="bg-black/40 border border-gray-700 rounded-xl p-3 text-white focus:border-deriv-accent outline-none transition-all"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="bg-deriv-accent hover:bg-red-600 text-white font-black py-3 rounded-xl transition-all active:scale-95 disabled:opacity-50 shadow-lg uppercase tracking-widest text-sm"
          >
            {isLoading ? 'Processing...' : isLogin ? 'Unlock Dashboard' : 'Request Access'}
          </button>
        </form>

        {showWhatsapp && (
          <div className="mt-6 p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-center animate-in fade-in slide-in-from-bottom-4">
            <p className="text-green-400 text-xs font-medium mb-3">
              Account created! Now contact the developer to get your access code.
            </p>
            <button
              onClick={openWhatsapp}
              className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-2 rounded-lg text-xs transition-all flex items-center justify-center gap-2"
            >
              <span>Contact on WhatsApp</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
