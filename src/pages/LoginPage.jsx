import React, { useState } from 'react';
import { User, Lock, Eye, EyeOff } from 'lucide-react';
import astemoLogo from '../assets/astemo_logo.png';
import Toast from '../components/Toast';

export default function LoginPage({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isInvalid, setIsInvalid] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsInvalid(false);
    setErrorMsg('');

    if (!username.trim() || !password.trim()) {
      setIsInvalid(true);
      setErrorMsg('Please enter both username and password.');
      return;
    }

    // Default users from brief:
    // 1. kevin_astemo : kevin12345
    // 2. suep_astemo : suep12345
    const valid =
      (username === 'kevin_astemo' && password === 'kevin12345') ||
      (username === 'suep_astemo' && password === 'suep12345');

    if (!valid) {
      setIsInvalid(true);
      setErrorMsg('Invalid username or password. Default: kevin_astemo / kevin12345');
      return;
    }

    // Successful login: show toast and redirect
    setShowSuccessToast(true);
    setTimeout(() => {
      onLoginSuccess({ username });
    }, 1200);
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between bg-[#F0F2F5] overflow-hidden select-none">
      {/* Background Geometric Polygonal accents matching Figma */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-[600px] h-[600px] bg-white/40 rotate-45 transform skew-x-12" />
        <div className="absolute top-1/4 -right-40 w-[700px] h-[700px] bg-white/50 -rotate-12 transform skew-y-6" />
        <div className="absolute -bottom-40 left-1/3 w-[800px] h-[800px] bg-white/30 rotate-12" />
      </div>

      {/* Top right toast */}
      {showSuccessToast && (
        <Toast
          type="success"
          title="Success"
          message="Direct to Dashboard..."
          onClose={() => setShowSuccessToast(false)}
          duration={2500}
        />
      )}

      <div className="flex-1 flex items-center justify-center p-6 z-10">
        <div className="w-full max-w-[480px] bg-white rounded-2xl shadow-xl border border-gray-100 p-10 flex flex-col items-center text-center">
          {/* Astemo Brand */}
          <div className="mb-6 flex flex-col items-center">
            <img
              src={astemoLogo}
              alt="Astemo"
              className="h-10 object-contain mb-1"
            />
            <h2 className="text-sm font-bold tracking-wider text-gray-800 uppercase mt-2">
              ASTEMO QUALITY DEVELOPMENT
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Enter your username and password to continue.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="w-full text-left space-y-4">
            {/* Username Input */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (isInvalid) setIsInvalid(false);
                  }}
                  placeholder="Input username"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm transition-colors focus:outline-none ${
                    isInvalid
                      ? 'border-red-500 focus:border-red-500 bg-red-50/20'
                      : 'border-gray-200 focus:border-emerald-500 bg-[#FAFAFA]'
                  }`}
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (isInvalid) setIsInvalid(false);
                  }}
                  placeholder="Input Password"
                  className={`w-full pl-10 pr-10 py-2.5 rounded-lg border text-sm transition-colors focus:outline-none ${
                    isInvalid
                      ? 'border-red-500 focus:border-red-500 bg-red-50/20'
                      : 'border-gray-200 focus:border-emerald-500 bg-[#FAFAFA]'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message with fixed height to avoid layout shift */}
            <div className="min-h-[18px]">
              {isInvalid && errorMsg ? (
                <p className="text-xs text-red-500 font-medium">{errorMsg}</p>
              ) : null}
            </div>

            {/* Default credentials hint */}
            <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 text-[11px] text-gray-500 space-y-0.5">
              <span className="font-semibold text-gray-700">Akun Default:</span>
              <div className="flex justify-between">
                <span>kevin_astemo / kevin12345</span>
                <button
                  type="button"
                  onClick={() => {
                    setUsername('kevin_astemo');
                    setPassword('kevin12345');
                    setIsInvalid(false);
                  }}
                  className="text-[#00A854] font-medium hover:underline"
                >
                  Gunakan
                </button>
              </div>
              <div className="flex justify-between">
                <span>suep_astemo / suep12345</span>
                <button
                  type="button"
                  onClick={() => {
                    setUsername('suep_astemo');
                    setPassword('suep12345');
                    setIsInvalid(false);
                  }}
                  className="text-[#00A854] font-medium hover:underline"
                >
                  Gunakan
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full mt-2 py-3 bg-[#00A854] hover:bg-[#008C45] text-white font-semibold rounded-lg text-sm transition-all shadow-sm active:scale-[0.99]"
            >
              LOG IN
            </button>
          </form>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full py-4 text-center text-xs text-gray-400 z-10">
        Copyright © 2026 PT. Electrindo Inti Dinamika
      </footer>
    </div>
  );
}
