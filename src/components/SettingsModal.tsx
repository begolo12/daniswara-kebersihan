import React, { useState } from 'react';
import {
  X,
  Database,
  Check,
  ArrowLeft
} from 'lucide-react';
import { DEFAULT_AREAS, DEFAULT_STAFF } from '../data/presetData';
import { firebaseConfig } from '../firebase/config';
import { useHardwareBack } from '../hooks/useHardwareBack';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataRefresh?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'firebase' | 'areas' | 'staff'>('firebase');

  // Trap back button so pressing back closes the modal and does not exit the app
  useHardwareBack(isOpen, onClose, 'settings_modal');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden text-slate-800 flex flex-col max-h-[85vh]">
        {/* Header with explicit back button */}
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="p-1 -ml-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 flex items-center gap-1 text-xs transition active:scale-95"
              title="Kembali ke menu sebelumnya"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="font-semibold">Kembali</span>
            </button>
            <div className="h-4 w-px bg-slate-700 mx-1" />
            <div className="flex items-center gap-1.5">
              <Database className="w-4 h-4 text-blue-400" />
              <h3 className="text-xs font-bold">Data Master &amp; Sistem</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
            title="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-100 bg-slate-50 px-4 pt-2 gap-2 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('firebase')}
            className={`pb-2.5 px-2 border-b-2 transition ${
              activeTab === 'firebase'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Firebase
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('areas')}
            className={`pb-2.5 px-2 border-b-2 transition ${
              activeTab === 'areas'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Area &amp; SOP
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('staff')}
            className={`pb-2.5 px-2 border-b-2 transition ${
              activeTab === 'staff'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Petugas
          </button>
        </div>

        {/* Tab content */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1 text-xs">
          {activeTab === 'firebase' && (
            <div className="space-y-3">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-emerald-900 flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-emerald-800">Firebase Terhubung</span>
                  <p className="text-[11px] text-emerald-700 leading-relaxed">
                    Database Firestore aktif dengan offline persistent caching. Siap di-deploy ke Vercel dan GitHub.
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-[11px] text-slate-600">
                Config via env Vercel. Project: <strong>{firebaseConfig.projectId || '(belum diisi)'}</strong>
              </div>
            </div>
          )}

          {activeTab === 'areas' && (
            <div className="space-y-2">
              <p className="text-[11px] text-slate-500">
                {DEFAULT_AREAS.length} Area Master dengan SOP checklist otomatis:
              </p>
              <div className="space-y-2">
                {DEFAULT_AREAS.map((a) => (
                  <div key={a.id} className="bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                    <div className="flex items-center justify-between font-bold text-slate-800 text-xs">
                      <span>{a.name}</span>
                      <span className="text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                        {a.floor}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">
                      {a.defaultTasks.length} butir tugas pembersihan
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'staff' && (
            <div className="space-y-2">
              <p className="text-[11px] text-slate-500">Daftar petugas &amp; Supervisor:</p>
              <div className="divide-y divide-slate-100 bg-slate-50 border border-slate-200 rounded-xl p-2">
                {DEFAULT_STAFF.map((s) => (
                  <div key={s.id} className="py-2 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-slate-800">{s.name}</span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        s.role === 'SPV'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {s.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span>SiCheck OB &amp; SPV PWA</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 bg-slate-200 hover:bg-slate-300 font-semibold rounded-lg text-slate-700 transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
