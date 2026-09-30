import React, { useState } from 'react';
import { CreditCard, ScanLine } from 'lucide-react';
import astemoLogo from '../assets/astemo_logo.png';
import Toast from '../components/Toast';
import { INITIAL_USERS } from '../data/mockData';

export default function LoginPage({ onLoginSuccess }) {
  const [cardId, setCardId] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isInvalid, setIsInvalid] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState(null);

  const authenticateUser = (identifier) => {
    setIsInvalid(false);
    setErrorMsg('');

    const trimmed = identifier.trim().toLowerCase();
    if (!trimmed) {
      setIsInvalid(true);
      setErrorMsg('Silakan scan atau masukkan nomor ID Card.');
      return;
    }

    // Match by ID Card or username
    const matched = INITIAL_USERS.find(
      (u) =>
        u.idCard.toLowerCase() === trimmed ||
        u.username.toLowerCase() === trimmed ||
        (trimmed === 'kevin' && u.username === 'kevin_astemo') ||
        (trimmed === 'suep' && u.username === 'suep_astemo')
    );

    if (!matched) {
      setIsInvalid(true);
      setErrorMsg('ID Card tidak terdaftar. Gunakan kartu Kevin (Superadmin) atau Suep (Operator).');
      return;
    }

    setLoggedInUser(matched);
    setShowSuccessToast(true);

    setTimeout(() => {
      onLoginSuccess(matched);
    }, 1000);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    authenticateUser(cardId);
  };

  const handleQuickTap = (user) => {
    setCardId(user.idCard);
    authenticateUser(user.idCard);
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
      {showSuccessToast && loggedInUser && (
        <Toast
          type="success"
          title="Login Berhasil"
          message={`Selamat datang, ${loggedInUser.name} (${loggedInUser.role})`}
          onClose={() => setShowSuccessToast(false)}
          duration={2500}
        />
      )}

      <div className="flex-1 flex items-center justify-center p-6 z-10">
        <div className="w-full max-w-[480px] bg-white rounded-2xl shadow-xl border border-gray-100 p-8 xl:p-10 flex flex-col items-center text-center">
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
              Tap or scan your Employee ID Card to authenticate
            </p>
          </div>

          {/* Form Tap / Scan ID Card */}
          <form onSubmit={handleSubmit} className="w-full text-left space-y-4">
            {/* ID Card Reader Box */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center justify-between">
                <span>Scan / Nomor ID Card</span>
                <span className="text-[11px] font-normal text-gray-400 flex items-center gap-1">
                  <ScanLine className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                  RFID Ready
                </span>
              </label>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-600">
                  <CreditCard className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  autoFocus
                  value={cardId}
                  onChange={(e) => {
                    setCardId(e.target.value);
                    if (isInvalid) setIsInvalid(false);
                  }}
                  placeholder="Tap ID Card atau ketik AST-SA-001..."
                  className={`w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm transition-colors focus:outline-none ${
                    isInvalid
                      ? 'border-red-500 focus:border-red-500 bg-red-50/20'
                      : 'border-gray-200 focus:border-emerald-500 bg-[#FAFAFA]'
                  }`}
                />
              </div>
            </div>

            {/* Error Message */}
            <div className="min-h-[18px]">
              {isInvalid && errorMsg ? (
                <p className="text-xs text-red-500 font-medium">{errorMsg}</p>
              ) : null}
            </div>

            {/* Tap ID Card Button */}
            <button
              type="submit"
              className="w-full py-3 bg-[#00A854] hover:bg-[#008C45] text-white font-semibold rounded-lg text-sm transition-all shadow-sm active:scale-[0.99] flex items-center justify-center gap-2"
            >
              <CreditCard className="w-4 h-4" />
              <span>TAP / SCAN ID CARD</span>
            </button>
          </form>

          {/* Quick Tap Simulation Badges */}
          <div className="w-full mt-6 pt-5 border-t border-gray-100 text-left">
            <p className="text-xs font-semibold text-gray-700 mb-2.5 flex items-center justify-between">
              <span>Simulasi Tap ID Card:</span>
              <span className="text-[10px] text-gray-400 font-normal">Klik untuk langsung login</span>
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Kevin - Superadmin Card */}
              <button
                type="button"
                onClick={() => handleQuickTap(INITIAL_USERS[0])}
                className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50 hover:border-emerald-300 transition-all text-left group shadow-xs active:scale-[0.98]"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-gray-900 group-hover:text-emerald-700 truncate">
                    Kevin
                  </p>
                  <span className="text-[9px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                    Superadmin
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 font-mono mt-0.5">
                  AST-SA-001
                </p>
                <p className="text-[10px] text-gray-400">Full Access</p>
              </button>

              {/* Suep - Operator Card */}
              <button
                type="button"
                onClick={() => handleQuickTap(INITIAL_USERS[1])}
                className="p-3 rounded-xl border border-blue-200 bg-blue-50/40 hover:bg-blue-50 hover:border-blue-300 transition-all text-left group shadow-xs active:scale-[0.98]"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-gray-900 group-hover:text-blue-700 truncate">
                    Suep
                  </p>
                  <span className="text-[9px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                    Operator
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 font-mono mt-0.5">
                  AST-OP-002
                </p>
                <p className="text-[10px] text-gray-400">Testing Only</p>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full py-4 text-center text-xs text-gray-400 z-10">
        Copyright © 2026 PT. Electrindo Inti Dinamika
      </footer>
    </div>
  );
}
