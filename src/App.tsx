import React, { useState, useEffect } from 'react';
import { 
  ClipboardCheck, 
  ShieldCheck, 
  BarChart3, 
  Settings, 
  CheckCircle2, 
  LogOut, 
  User,
  PlusCircle,
  FileSpreadsheet,
  Check
} from 'lucide-react';
import { AuthUser, DailyChecklistReport } from './types';
import { LoginScreen } from './components/LoginScreen';
import { OBChecklistForm } from './components/OBChecklistForm';
import { SPVReviewDashboard } from './components/SPVReviewDashboard';
import { ReportsView } from './components/ReportsView';
import { SettingsModal } from './components/SettingsModal';
import { PWAInstallButton } from './components/PWAInstallButton';
import { OfflineIndicator } from './components/OfflineIndicator';
import { subscribeToChecklists } from './services/checklistService';

const AUTH_STORAGE_KEY = 'sicheck_auth_user';

export default function App() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState<'checklist' | 'reports'>('checklist');
  const [reports, setReports] = useState<DailyChecklistReport[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('Checklist Berhasil Dikirim!');

  // Subscribe to real-time Firebase Firestore checklist reports
  useEffect(() => {
    const unsubscribe = subscribeToChecklists((newReports) => {
      setReports(newReports);
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const handleLoginSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } catch (e) {
      console.error(e);
    }
    setActiveTab('checklist');
  };

  const handleLogout = () => {
    if (confirm('Apakah Anda yakin ingin keluar dari akun ini?')) {
      setCurrentUser(null);
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  };

  const handleOBSubmitSuccess = () => {
    setToastMessage('Checklist Berhasil Dikirim ke Supervisor!');
    setShowSuccessToast(true);
    setTimeout(() => {
      setShowSuccessToast(false);
    }, 4500);
  };

  // If user is not logged in, show simple direct Login Screen
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center">
        <OfflineIndicator />
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
      </div>
    );
  }

  const isOB = currentUser.role === 'OB';
  const isSPV = currentUser.role === 'SPV';
  const pendingCount = reports.filter((r) => r.inspectionStatus === 'pending_review').length;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center">
      {/* Offline Status Bar */}
      <OfflineIndicator />

      {/* Mobile App Container */}
      <div className="w-full max-w-md min-h-screen bg-slate-50 flex flex-col shadow-2xl relative border-x border-slate-200">
        {/* App Top Bar */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-2.5">
          <div className="flex items-center justify-between">
            {/* Brand Logo & Name */}
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-xs ${
                  isOB
                    ? 'bg-gradient-to-tr from-blue-700 to-blue-500'
                    : 'bg-gradient-to-tr from-indigo-900 to-indigo-700'
                }`}
              >
                {isOB ? <ClipboardCheck className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
              </div>
              <div>
                <h1 className="text-sm font-black text-slate-900 tracking-tight leading-tight flex items-center gap-1.5">
                  SiCheck <span className={isOB ? 'text-blue-600' : 'text-indigo-800'}>OB &amp; SPV</span>
                </h1>
                <p className="text-[10px] text-slate-400 font-medium">
                  {isOB ? 'Panel Petugas OB' : 'Panel Pengawas (SPV)'}
                </p>
              </div>
            </div>

            {/* Top Action Buttons */}
            <div className="flex items-center gap-1.5">
              <PWAInstallButton />
              
              <button
                type="button"
                onClick={() => setIsSettingsOpen(true)}
                className="w-8 h-8 rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-100 flex items-center justify-center transition active:scale-95"
                title="Pengaturan & Master Data"
              >
                <Settings className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="w-8 h-8 rounded-full text-red-500 hover:bg-red-50 flex items-center justify-center transition active:scale-95"
                title="Keluar / Ganti Akun"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* User Profile Banner Bar */}
          <div className="mt-2.5 flex items-center justify-between bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200/60">
            <div className="flex items-center gap-2">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold ${
                  isOB ? 'bg-blue-600' : 'bg-indigo-900'
                }`}
              >
                {currentUser.name.charAt(0)}
              </div>
              <div className="text-left">
                <span className="text-xs font-bold text-slate-800 leading-none block">
                  {currentUser.name}
                </span>
                <span className="text-[9px] text-slate-400">
                  {isOB ? 'Petugas Kebersihan' : 'Supervisor Pengawas'}
                </span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="text-[10px] font-semibold text-slate-500 hover:text-red-600 bg-white border border-slate-200 px-2 py-0.5 rounded-lg active:scale-95 transition"
            >
              Ganti Akun
            </button>
          </div>
        </header>

        {/* Success Toast */}
        {showSuccessToast && (
          <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-sm bg-emerald-600 text-white p-3 rounded-2xl shadow-xl flex items-center justify-between animate-in slide-in-from-top duration-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <div>
                <p className="text-xs font-bold">{toastMessage}</p>
                <p className="text-[11px] text-emerald-100">
                  Data langsung tercatat di sistem cloud &amp; supervisor.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowSuccessToast(false)}
              className="text-white/80 hover:text-white text-xs font-bold px-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 p-3.5 overflow-y-auto">
          {/* OB User View: Focused exclusively on Filling Checklist Tasks */}
          {isOB && (
            <OBChecklistForm 
              currentUser={currentUser} 
              onSuccess={handleOBSubmitSuccess} 
            />
          )}

          {/* SPV User View: Has tabs for Review Checklist & Reports */}
          {isSPV && (
            <>
              {activeTab === 'checklist' ? (
                <SPVReviewDashboard 
                  currentUser={currentUser} 
                  reports={reports} 
                />
              ) : (
                <ReportsView reports={reports} />
              )}
            </>
          )}
        </main>

        {/* Bottom Navigation: Shown for SPV to toggle between Checklist Review & Rekap Laporan */}
        {isSPV && (
          <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white/95 backdrop-blur-md border-t border-slate-200 z-30 px-8 py-2 flex items-center justify-around shadow-lg">
            <button
              type="button"
              onClick={() => setActiveTab('checklist')}
              className={`flex flex-col items-center gap-1 transition active:scale-95 ${
                activeTab === 'checklist'
                  ? 'text-indigo-900 font-bold'
                  : 'text-slate-400 hover:text-slate-600 font-medium'
              }`}
            >
              <div className="relative">
                <ShieldCheck className="w-5 h-5" />
                {pendingCount > 0 && (
                  <span className="absolute -top-1 -right-2 w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] font-extrabold flex items-center justify-center animate-pulse">
                    {pendingCount}
                  </span>
                )}
              </div>
              <span className="text-[10px]">Cek Hasil OB</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('reports')}
              className={`flex flex-col items-center gap-1 transition active:scale-95 ${
                activeTab === 'reports'
                  ? 'text-indigo-900 font-bold'
                  : 'text-slate-400 hover:text-slate-600 font-medium'
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              <span className="text-[10px]">Rekap &amp; Laporan</span>
            </button>
          </nav>
        )}

        {/* Master Data / Firebase Settings Modal */}
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
        />
      </div>
    </div>
  );
}
