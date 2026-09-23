import React, { useState } from 'react';
import { 
  ClipboardCheck, 
  ShieldCheck, 
  Lock, 
  User, 
  KeyRound, 
  ArrowRight, 
  Sparkles,
  Info
} from 'lucide-react';
import { UserRole, AuthUser } from '../types';
import { DEFAULT_STAFF } from '../data/presetData';

interface LoginScreenProps {
  onLoginSuccess: (user: AuthUser) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('OB');
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [pin, setPin] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const staffList = DEFAULT_STAFF.filter((s) => s.role === selectedRole && s.active);

  // Auto select first staff when role changes
  React.useEffect(() => {
    if (staffList.length > 0) {
      setSelectedStaffId(staffList[0].id);
      setPin('');
      setErrorMessage('');
    }
  }, [selectedRole]);

  const handleRoleChange = (role: UserRole) => {
    setSelectedRole(role);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const staff = DEFAULT_STAFF.find((s) => s.id === selectedStaffId);
    if (!staff) {
      setErrorMessage('Silakan pilih nama pengguna!');
      return;
    }

    if (!pin) {
      setErrorMessage('Silakan masukkan PIN masuk!');
      return;
    }

    if (staff.pin !== pin) {
      // ponytail: PIN plaintext demo. Upgrade: Firebase Auth / hash + lockout server-side.
      setErrorMessage('PIN salah. Coba lagi.');
      return;
    }

    onLoginSuccess({
      id: staff.id,
      name: staff.name,
      role: staff.role,
    });
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 text-slate-800 animate-in fade-in zoom-in-95 duration-200">
        {/* App Logo & Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 mb-3">
            <ClipboardCheck className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            SiCheck <span className="text-blue-600">OB &amp; SPV</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Sistem Checklist &amp; Inspeksi Kebersihan
          </p>
        </div>

        {/* Role Tab Switcher */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-2xl mb-5">
          <button
            type="button"
            onClick={() => handleRoleChange('OB')}
            className={`py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 active:scale-95 ${
              selectedRole === 'OB'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ClipboardCheck className="w-4 h-4" />
            <span>Petugas OB</span>
          </button>

          <button
            type="button"
            onClick={() => handleRoleChange('SPV')}
            className={`py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 active:scale-95 ${
              selectedRole === 'SPV'
                ? 'bg-indigo-900 text-white shadow-md shadow-indigo-900/20'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Supervisor (SPV)</span>
          </button>
        </div>

        {/* Role Description Card */}
        <div
          className={`p-3 rounded-xl border text-xs mb-4 ${
            selectedRole === 'OB'
              ? 'bg-blue-50 border-blue-200 text-blue-900'
              : 'bg-indigo-50 border-indigo-200 text-indigo-950'
          }`}
        >
          <p className="font-semibold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
            {selectedRole === 'OB'
              ? 'Mode Petugas: Khusus mengisi checklist & tugas harian.'
              : 'Mode Supervisor: Memeriksa hasil OB, approval & rekap laporan.'}
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-600" />
              Pilih Nama {selectedRole === 'OB' ? 'Petugas OB' : 'Supervisor'}
            </label>
            <select
              value={selectedStaffId}
              onChange={(e) => {
                setSelectedStaffId(e.target.value);
                setPin('');
                setErrorMessage('');
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition cursor-pointer"
            >
              {staffList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              <span className="flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                PIN Keamanan
              </span>
            </label>
            <input
              type="password"
              maxLength={6}
              inputMode="numeric"
              autoComplete="off"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              placeholder="Ketik PIN..."
              className="w-full tracking-widest text-center text-sm font-mono bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            />
          </div>

          {errorMessage && (
            <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200 font-medium">
              {errorMessage}
            </p>
          )}

          <button
            type="submit"
            className={`w-full py-3 rounded-xl text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-md active:scale-98 cursor-pointer ${
              selectedRole === 'OB'
                ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/25'
                : 'bg-indigo-900 hover:bg-indigo-950 shadow-indigo-900/25'
            }`}
          >
            <span>Masuk ke Aplikasi</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
