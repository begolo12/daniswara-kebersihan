import React, { useState } from 'react';
import { 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Send, 
  User, 
  Clock, 
  Calendar, 
  MapPin, 
  ChevronRight,
  ChevronLeft,
  Layers,
  ArrowLeft,
  Check
} from 'lucide-react';
import { 
  DailyChecklistReport, 
  AreaReport, 
  ChecklistItem, 
  ItemStatus, 
  ShiftType,
  AuthUser
} from '../types';
import { DEFAULT_AREAS, DEFAULT_SHIFTS } from '../data/presetData';
import { PhotoCapture } from './PhotoCapture';
import { SignaturePad } from './SignaturePad';
import { saveChecklistReport } from '../services/checklistService';

interface OBChecklistFormProps {
  currentUser: AuthUser;
  onSuccess: (newReportId: string) => void;
  onBack?: () => void;
}

export const OBChecklistForm: React.FC<OBChecklistFormProps> = ({ 
  currentUser, 
  onSuccess,
  onBack 
}) => {
  const today = new Date().toISOString().split('T')[0];
  const currentTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  // View state: 'overview' (pilih area) or 'area_detail' (isi checklist area) or 'summary' (tanda tangan & kirim)
  const [viewStep, setViewStep] = useState<'overview' | 'area_detail' | 'summary'>('overview');
  const [activeAreaIndex, setActiveAreaIndex] = useState(0);

  // Form states
  const [date, setDate] = useState(today);
  const [time, setTime] = useState(currentTime);
  const [shift, setShift] = useState<ShiftType>('Pagi');
  const [obName, setObName] = useState(currentUser.name);
  const [obNotes, setObNotes] = useState('');
  const [obSignature, setObSignature] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize area reports from master data
  const [areaReports, setAreaReports] = useState<AreaReport[]>(() => {
    return DEFAULT_AREAS.map((area) => ({
      areaId: area.id,
      areaName: area.name,
      locationFloor: area.floor,
      isCompleted: false,
      notes: '',
      photos: [],
      items: area.defaultTasks.map((task, idx) => ({
        id: `${area.id}-item-${idx}`,
        name: task,
        status: 'done' as ItemStatus, // default to done for convenience
      })),
    }));
  });

  const currentArea = areaReports[activeAreaIndex];

  // Internal Navigation Handlers (Ensuring Back button goes to previous menu/step!)
  const handleBackStep = () => {
    if (viewStep === 'area_detail') {
      setViewStep('overview');
    } else if (viewStep === 'summary') {
      setViewStep('overview');
    } else if (viewStep === 'overview' && onBack) {
      onBack();
    }
  };

  // Toggle item status
  const handleItemStatusToggle = (itemId: string, newStatus: ItemStatus) => {
    setAreaReports((prev) =>
      prev.map((area, idx) => {
        if (idx !== activeAreaIndex) return area;
        return {
          ...area,
          items: area.items.map((it) => (it.id === itemId ? { ...it, status: newStatus } : it)),
        };
      })
    );
  };

  // Change item note
  const handleItemNoteChange = (itemId: string, noteText: string) => {
    setAreaReports((prev) =>
      prev.map((area, idx) => {
        if (idx !== activeAreaIndex) return area;
        return {
          ...area,
          items: area.items.map((it) => (it.id === itemId ? { ...it, note: noteText } : it)),
        };
      })
    );
  };

  // Mark all in current area as 'done'
  const handleMarkAllDone = () => {
    setAreaReports((prev) =>
      prev.map((area, idx) => {
        if (idx !== activeAreaIndex) return area;
        return {
          ...area,
          isCompleted: true,
          items: area.items.map((it) => ({ ...it, status: 'done' })),
        };
      })
    );
  };

  // Update current area photos
  const handleAreaPhotosChange = (photos: string[]) => {
    setAreaReports((prev) =>
      prev.map((area, idx) => (idx === activeAreaIndex ? { ...area, photos } : area))
    );
  };

  // Update current area notes
  const handleAreaNotesChange = (notes: string) => {
    setAreaReports((prev) =>
      prev.map((area, idx) => (idx === activeAreaIndex ? { ...area, notes } : area))
    );
  };

  // Calculate overall stats
  const totalTasks = areaReports.reduce((acc, a) => acc + a.items.length, 0);
  const doneTasks = areaReports.reduce(
    (acc, a) => acc + a.items.filter((i) => i.status === 'done').length,
    0
  );
  const issueTasks = areaReports.reduce(
    (acc, a) => acc + a.items.filter((i) => i.status === 'issue').length,
    0
  );
  const completionPercentage = Math.round((doneTasks / totalTasks) * 100);

  // Form submission
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!obSignature) {
      alert('Tanda tangan OB wajib diisi sebelum kirim.');
      setViewStep('summary');
      return;
    }

    const missingPhoto = areaReports.filter(
      (a) => a.items.some((i) => i.status !== 'na') && a.photos.length === 0
    );
    if (missingPhoto.length > 0) {
      alert(`Foto wajib: ${missingPhoto[0].areaName}. Minimal 1 foto per area kerja.`);
      setActiveAreaIndex(areaReports.indexOf(missingPhoto[0]));
      setViewStep('area_detail');
      return;
    }

    const issueNoNote = areaReports.flatMap((a) =>
      a.items.filter((i) => i.status === 'issue' && !i.note?.trim())
    );
    if (issueNoNote.length > 0) {
      alert('Item kendala wajib diisi catatan. Contoh: keran bocor, sabun habis.');
      return;
    }

    setIsSubmitting(true);
    try {
      const completedAreas = areaReports.map((a) => ({
        ...a,
        isCompleted: a.items.every((i) => i.status === 'done' || i.status === 'na'),
        completedAt: new Date().toISOString(),
      }));

      const reportPayload: Omit<DailyChecklistReport, 'id'> = {
        date,
        time,
        shift,
        obName: currentUser.name,
        obId: currentUser.id,
        obNotes: obNotes.trim(),
        obSignature,
        submittedAt: new Date().toISOString(),
        areas: completedAreas,
        inspectionStatus: 'pending_review',
      };

      const newId = await saveChecklistReport(reportPayload);
      onSuccess(newId);
    } catch (err: any) {
      alert('Gagal mengirim checklist: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pb-24 max-w-xl mx-auto animate-in fade-in duration-200">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white rounded-2xl p-4 shadow-md mb-4">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {viewStep !== 'overview' && (
              <button
                type="button"
                onClick={handleBackStep}
                className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30 active:scale-90 flex items-center justify-center text-white transition mr-1"
                title="Kembali ke menu sebelumnya"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div>
              <h2 className="text-base font-bold leading-tight">
                {viewStep === 'overview' && 'Checklist Tugas Harian'}
                {viewStep === 'area_detail' && currentArea.areaName.split('(')[0]}
                {viewStep === 'summary' && 'Kirim Laporan Checklist'}
              </h2>
              <p className="text-[11px] text-blue-100">
                Petugas: <strong className="text-white">{currentUser.name}</strong> • Shift {shift}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="inline-block px-2.5 py-1 rounded-full bg-emerald-500/90 text-white text-[10px] font-bold shadow-xs">
              {completionPercentage}% Selesai
            </span>
          </div>
        </div>

        {/* Shift & Tanggal Info Bar */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-white/10 backdrop-blur-xs rounded-xl p-2 border border-white/15">
            <label className="text-[10px] text-blue-100 flex items-center gap-1 mb-1">
              <Clock className="w-3 h-3" /> Shift Kerja
            </label>
            <select
              value={shift}
              onChange={(e) => setShift(e.target.value as ShiftType)}
              className="w-full bg-transparent text-white font-semibold outline-none cursor-pointer"
            >
              {DEFAULT_SHIFTS.map((s) => (
                <option key={s} value={s} className="text-slate-800">
                  Shift {s}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-white/10 backdrop-blur-xs rounded-xl p-2 border border-white/15">
            <label className="text-[10px] text-blue-100 flex items-center gap-1 mb-1">
              <Calendar className="w-3 h-3" /> Tanggal
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-transparent text-white font-semibold outline-none text-xs"
            />
          </div>
        </div>
      </div>

      {/* STEP 1: OVERVIEW - LIST OF AREAS */}
      {viewStep === 'overview' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-blue-600" />
              Pilih Area Untuk Diperiksa ({areaReports.length} Area)
            </span>
            <span className="text-[11px] text-slate-500">
              {doneTasks}/{totalTasks} Tugas
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {areaReports.map((area, idx) => {
              const allDone = area.items.every((i) => i.status === 'done');
              const hasIssue = area.items.some((i) => i.status === 'issue');
              const doneCount = area.items.filter((i) => i.status === 'done').length;

              return (
                <div
                  key={area.areaId}
                  onClick={() => {
                    setActiveAreaIndex(idx);
                    setViewStep('area_detail');
                  }}
                  className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-xs hover:border-blue-400 active:scale-98 transition cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${
                        allDone
                          ? 'bg-emerald-100 text-emerald-700'
                          : hasIssue
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-blue-50 text-blue-700'
                      }`}
                    >
                      {idx + 1}
                    </div>

                    <div>
                      <h3 className="text-xs font-bold text-slate-900 leading-tight">
                        {area.areaName}
                      </h3>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1">
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                          {area.locationFloor}
                        </span>
                        <span>•</span>
                        <span>{doneCount}/{area.items.length} tugas bersih</span>
                        {area.photos.length > 0 && (
                          <span className="text-blue-600 font-medium">📷 {area.photos.length} foto</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {allDone && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                        Bersih
                      </span>
                    )}
                    {hasIssue && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200">
                        Ada Kendala
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Next Button to Summary */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setViewStep('summary')}
              className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white text-xs font-bold shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <span>Lanjut ke Tanda Tangan &amp; Kirim</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: DETAIL CHECKLIST PER AREA */}
      {viewStep === 'area_detail' && (
        <div className="space-y-4">
          {/* Area Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
            {/* Header with Quick All-Done */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  {currentArea.areaName}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Lantai / Posisi: {currentArea.locationFloor}
                </p>
              </div>

              <button
                type="button"
                onClick={handleMarkAllDone}
                className="flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition active:scale-95 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Semua Bersih</span>
              </button>
            </div>

            {/* Checklist Items */}
            <div className="mt-3 space-y-2.5">
              {currentArea.items.map((item, idx) => {
                const isDone = item.status === 'done';
                const isIssue = item.status === 'issue';
                const isNa = item.status === 'na';

                return (
                  <div
                    key={item.id}
                    className={`p-2.5 rounded-xl border transition ${
                      isDone
                        ? 'bg-emerald-50/50 border-emerald-200/70'
                        : isIssue
                        ? 'bg-amber-50/60 border-amber-300'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 flex-1">
                        <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <p className={`text-xs font-medium leading-snug ${isDone ? 'text-slate-800' : 'text-slate-700'}`}>
                          {item.name}
                        </p>
                      </div>

                      {/* 3-State Toggle */}
                      <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200 shadow-2xs">
                        <button
                          type="button"
                          onClick={() => handleItemStatusToggle(item.id, 'done')}
                          className={`px-2 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 transition ${
                            isDone
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'text-slate-500 hover:bg-slate-100'
                          }`}
                        >
                          <Check className="w-3 h-3" />
                          <span>Bersih</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleItemStatusToggle(item.id, 'issue')}
                          className={`px-2 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 transition ${
                            isIssue
                              ? 'bg-amber-500 text-white shadow-xs'
                              : 'text-slate-500 hover:bg-slate-100'
                          }`}
                        >
                          <AlertCircle className="w-3 h-3" />
                          <span>Kendala</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleItemStatusToggle(item.id, 'na')}
                          className={`px-1.5 py-1 rounded-md text-[10px] font-medium transition ${
                            isNa
                              ? 'bg-slate-500 text-white shadow-xs'
                              : 'text-slate-400 hover:bg-slate-100'
                          }`}
                        >
                          -
                        </button>
                      </div>
                    </div>

                    {isIssue && (
                      <div className="mt-2 pt-2 border-t border-amber-200/60 animate-in fade-in">
                        <input
                          type="text"
                          placeholder="Jelaskan kendala (misal: Keran bocor, sabun habis, noda semen)..."
                          value={item.note || ''}
                          onChange={(e) => handleItemNoteChange(item.id, e.target.value)}
                          className="w-full text-xs bg-white border border-amber-300 rounded-lg px-2.5 py-1.5 text-slate-800 placeholder-amber-600/50 outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Photos & Notes */}
            <div className="mt-4 pt-3 border-t border-slate-100 space-y-3">
              <PhotoCapture
                photos={currentArea.photos}
                onChange={handleAreaPhotosChange}
                maxPhotos={3}
                label={`Foto Bukti ${currentArea.areaName.split('(')[0]}`}
              />

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Catatan Tambahan untuk Area Ini
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Pewangi ruangan baru diisi refill, hand dryer lancar..."
                  value={currentArea.notes || ''}
                  onChange={(e) => handleAreaNotesChange(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Navigation buttons: Kembali ke Daftar Area / Lanjut Area Selanjutnya */}
            <div className="mt-5 flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => setViewStep('overview')}
                className="flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold transition"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Daftar Area</span>
              </button>

              {activeAreaIndex < areaReports.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setActiveAreaIndex((prev) => prev + 1)}
                  className="flex items-center gap-1 px-3.5 py-2 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
                >
                  <span>Area Selanjutnya</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setViewStep('summary')}
                  className="flex items-center gap-1 px-3.5 py-2 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition shadow-sm"
                >
                  <span>Selesai &amp; Kirim</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: SUMMARY & SIGNATURE BEFORE SUBMIT */}
      {viewStep === 'summary' && (
        <div className="space-y-4">
          {/* Summary Checklist Completion */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">
              Ringkasan Pengerjaan Seluruh Area
            </h3>

            <div className="space-y-1.5 text-xs mb-3">
              {areaReports.map((area, i) => {
                const doneCount = area.items.filter((it) => it.status === 'done').length;
                const hasIssue = area.items.some((it) => it.status === 'issue');

                return (
                  <div key={area.areaId} className="flex items-center justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-700 font-medium">
                      {i + 1}. {area.areaName.split('(')[0]}
                    </span>
                    <span
                      className={`font-semibold text-[11px] ${
                        hasIssue ? 'text-amber-600' : 'text-emerald-600'
                      }`}
                    >
                      {doneCount}/{area.items.length} tugas {hasIssue ? '(ada kendala)' : 'bersih'}
                    </span>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setViewStep('overview')}
              className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Kembali &amp; Cek Ulang Area</span>
            </button>
          </div>

          {/* Notes & Signature */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Catatan &amp; Paraf Petugas OB
            </h3>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Catatan Petugas OB (Opsional)
              </label>
              <textarea
                rows={2}
                value={obNotes}
                onChange={(e) => setObNotes(e.target.value)}
                placeholder="Pekerjaan shift ini sudah selesai secara keseluruhan..."
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 outline-none focus:bg-white focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <SignaturePad
              label="Tanda Tangan / Paraf Petugas OB"
              initialSignature={obSignature}
              onSave={(sig) => setObSignature(sig)}
              required
            />
          </div>

          {/* Submit Actions */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => setViewStep('overview')}
              className="flex-1 py-3.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center justify-center gap-1.5"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Kembali</span>
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSubmit()}
              className="flex-[2] py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition disabled:opacity-60 cursor-pointer"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Kirim Laporan ke SPV</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
