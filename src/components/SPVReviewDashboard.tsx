import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Star, 
  User, 
  Send, 
  Eye, 
  ChevronRight, 
  Filter,
  Check,
  X,
  FileText,
  Calendar,
  Layers,
  ArrowLeft,
  Sparkles,
  Search,
  MessageSquare
} from 'lucide-react';
import { DailyChecklistReport, InspectionStatus, AuthUser } from '../types';
import { SignaturePad } from './SignaturePad';
import { updateSPVReview } from '../services/checklistService';

interface SPVReviewDashboardProps {
  currentUser: AuthUser;
  reports: DailyChecklistReport[];
}

export const SPVReviewDashboard: React.FC<SPVReviewDashboardProps> = ({ 
  currentUser,
  reports 
}) => {
  const [filterStatus, setFilterStatus] = useState<'all' | InspectionStatus>('all');
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Review modal state
  const [rating, setRating] = useState<number>(5);
  const [spvNotes, setSpvNotes] = useState<string>('');
  const [spvSignature, setSpvSignature] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activePhotoModal, setActivePhotoModal] = useState<string | null>(null);

  const selectedReport = reports.find((r) => r.id === selectedReportId);

  // Filter reports
  const filteredReports = reports.filter((r) => {
    if (filterStatus !== 'all' && r.inspectionStatus !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        r.obName.toLowerCase().includes(q) ||
        r.date.includes(q) ||
        r.shift.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Open review for a specific report
  const handleOpenReport = (report: DailyChecklistReport) => {
    setSelectedReportId(report.id);
    setRating(report.spvRating || 5);
    setSpvNotes(report.spvNotes || '');
    setSpvSignature(report.spvSignature || '');
  };

  // Back button from detail back to list
  const handleBackToList = () => {
    setSelectedReportId(null);
  };

  // Submit SPV approval or revision
  const handleReviewAction = async (status: 'approved' | 'needs_revision') => {
    if (!selectedReport) return;

    if (!spvSignature && status === 'approved') {
      if (!confirm('Anda belum membubuhkan tanda tangan SPV. Lanjutkan approval tanpa paraf?')) {
        return;
      }
    }

    if (status === 'needs_revision' && !spvNotes.trim()) {
      alert('Mohon cantumkan catatan revisi agar petugas OB mengetahui apa yang perlu diperbaiki.');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateSPVReview(selectedReport.id, {
        inspectionStatus: status,
        spvName: currentUser.name,
        spvRating: rating,
        spvNotes: spvNotes.trim(),
        spvSignature,
        reviewedAt: new Date().toISOString(),
      });

      alert(
        status === 'approved'
          ? 'Checklist berhasil DISETUJUI & diverifikasi!'
          : 'Status checklist diubah menjadi PERLU REVISI.'
      );
      // Return back to list
      setSelectedReportId(null);
    } catch (e: any) {
      alert('Gagal memperbarui status: ' + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Summary counts
  const pendingCount = reports.filter((r) => r.inspectionStatus === 'pending_review').length;
  const approvedCount = reports.filter((r) => r.inspectionStatus === 'approved').length;
  const revisionCount = reports.filter((r) => r.inspectionStatus === 'needs_revision').length;

  return (
    <div className="pb-24 max-w-xl mx-auto space-y-4 animate-in fade-in duration-200">
      {/* Photo Preview Modal */}
      {activePhotoModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setActivePhotoModal(null)}
        >
          <div className="relative max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={activePhotoModal}
              alt="Bukti Foto"
              className="w-full h-auto max-h-[80vh] object-contain rounded-2xl"
            />
            <button
              onClick={() => setActivePhotoModal(null)}
              className="mt-3 w-full py-2.5 rounded-xl bg-white/20 text-white text-xs font-bold hover:bg-white/30 transition flex items-center justify-center gap-1.5"
            >
              <X className="w-4 h-4" />
              <span>Tutup Foto</span>
            </button>
          </div>
        </div>
      )}

      {/* DETAIL VIEW: Ketika SPV sedang memeriksa 1 checklist */}
      {selectedReport ? (
        <div className="space-y-4">
          {/* Back Navigation Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-xs flex items-center justify-between">
            <button
              type="button"
              onClick={handleBackToList}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition active:scale-95 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Daftar Checklist</span>
            </button>

            <span
              className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                selectedReport.inspectionStatus === 'approved'
                  ? 'bg-emerald-100 text-emerald-800'
                  : selectedReport.inspectionStatus === 'needs_revision'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {selectedReport.inspectionStatus === 'approved' && 'Disetujui'}
              {selectedReport.inspectionStatus === 'needs_revision' && 'Perlu Revisi'}
              {selectedReport.inspectionStatus === 'pending_review' && 'Menunggu Cek'}
            </span>
          </div>

          {/* Overview Info Card */}
          <div className="bg-indigo-950 text-white rounded-2xl p-4 shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider block">
                  Pemeriksaan Checklist OB
                </span>
                <h3 className="text-base font-extrabold text-white">
                  {selectedReport.obName}
                </h3>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-indigo-200 block">
                  Shift {selectedReport.shift}
                </span>
                <span className="text-[11px] text-indigo-300">
                  {selectedReport.date} • {selectedReport.time}
                </span>
              </div>
            </div>

            {selectedReport.obNotes && (
              <div className="p-2.5 rounded-xl bg-white/10 text-xs text-indigo-100 border border-white/10">
                <p className="text-[10px] text-indigo-300 font-bold mb-0.5">Catatan Petugas OB:</p>
                <p>"{selectedReport.obNotes}"</p>
              </div>
            )}
          </div>

          {/* List of Areas & Tasks Checked by OB */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider px-1">
              Hasil Pengecekan Tiap Area ({selectedReport.areas.length})
            </h4>

            {selectedReport.areas.map((area, idx) => {
              const allDone = area.items.every((it) => it.status === 'done');
              const hasIssue = area.items.some((it) => it.status === 'issue');

              return (
                <div key={area.areaId || idx} className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-xs space-y-2.5">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div>
                      <h5 className="text-xs font-bold text-slate-900">
                        {idx + 1}. {area.areaName}
                      </h5>
                      <span className="text-[10px] text-slate-400">{area.locationFloor}</span>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        allDone
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : hasIssue
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-slate-50 text-slate-600'
                      }`}
                    >
                      {allDone ? 'Semua Bersih' : hasIssue ? 'Ada Kendala' : 'Sebagian Selesai'}
                    </span>
                  </div>

                  {/* Tasks */}
                  <div className="space-y-1.5 text-xs">
                    {area.items.map((it) => (
                      <div key={it.id} className="flex items-start justify-between gap-2 py-1">
                        <span className="text-slate-700 font-medium leading-snug flex-1">
                          • {it.name}
                        </span>
                        <div className="text-right flex-shrink-0">
                          {it.status === 'done' && (
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                              ✓ Bersih
                            </span>
                          )}
                          {it.status === 'issue' && (
                            <div className="text-right">
                              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                                ⚠ Kendala
                              </span>
                              {it.note && (
                                <p className="text-[10px] text-amber-800 font-normal mt-0.5 italic">
                                  {it.note}
                                </p>
                              )}
                            </div>
                          )}
                          {it.status === 'na' && (
                            <span className="text-[10px] text-slate-400">N/A</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Photos */}
                  {area.photos && area.photos.length > 0 && (
                    <div className="pt-2 border-t border-slate-100">
                      <p className="text-[10px] text-slate-500 font-semibold mb-1.5">
                        Foto Bukti Pengerjaan (Klik untuk memperbesar):
                      </p>
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {area.photos.map((p, pIdx) => (
                          <img
                            key={pIdx}
                            src={p}
                            alt="Bukti Area"
                            onClick={() => setActivePhotoModal(p)}
                            className="w-16 h-16 rounded-xl object-cover border border-slate-200 cursor-pointer hover:opacity-90 transition flex-shrink-0"
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {area.notes && (
                    <div className="bg-slate-50 p-2 rounded-xl text-[11px] text-slate-600">
                      <strong>Catatan Area:</strong> {area.notes}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* SPV Evaluation & Actions Form */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-4">
            <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              Evaluasi &amp; Tanda Tangan Supervisor
            </h4>

            {/* Rating Stars */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Beri Nilai / Rating Kebersihan (1 - 5 Bintang)
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 transition hover:scale-110 active:scale-95"
                  >
                    <Star
                      className={`w-7 h-7 ${
                        star <= rating
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-slate-300'
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs font-bold text-slate-700 ml-1">
                  {rating === 5 && 'Sangat Bersih (5/5)'}
                  {rating === 4 && 'Bersih & Baik (4/5)'}
                  {rating === 3 && 'Cukup (3/5)'}
                  {rating === 2 && 'Kurang Bersih (2/5)'}
                  {rating === 1 && 'Perlu Pembersihan Total (1/5)'}
                </span>
              </div>
            </div>

            {/* Supervisor Notes */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Catatan Supervisor / Instruksi Perbaikan
              </label>
              <textarea
                rows={2}
                value={spvNotes}
                onChange={(e) => setSpvNotes(e.target.value)}
                placeholder="Tuliskan catatan untuk petugas OB jika ada area yang perlu disempurnakan..."
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* SPV Signature Pad */}
            <SignaturePad
              label="Tanda Tangan / Paraf Supervisor (SPV)"
              initialSignature={spvSignature}
              onSave={(sig) => setSpvSignature(sig)}
              required
            />

            {/* Approval Action Buttons */}
            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleReviewAction('needs_revision')}
                className="flex-1 py-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold transition flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-60 cursor-pointer"
              >
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span>Minta Revisi</span>
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleReviewAction('approved')}
                className="flex-[2] py-3 rounded-xl bg-indigo-950 hover:bg-indigo-900 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md active:scale-95 disabled:opacity-60 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Setujui &amp; Approve</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* LIST VIEW: Daftar Checklist untuk SPV */
        <div className="space-y-3">
          {/* Header Summary Cards */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setFilterStatus('pending_review')}
              className={`p-3 rounded-2xl border text-center transition ${
                filterStatus === 'pending_review'
                  ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200'
              }`}
            >
              <span className="text-[10px] font-medium block">Perlu Dicek</span>
              <span className="text-xl font-black">{pendingCount}</span>
            </button>

            <button
              onClick={() => setFilterStatus('approved')}
              className={`p-3 rounded-2xl border text-center transition ${
                filterStatus === 'approved'
                  ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200'
              }`}
            >
              <span className="text-[10px] font-medium block">Disetujui</span>
              <span className="text-xl font-black">{approvedCount}</span>
            </button>

            <button
              onClick={() => setFilterStatus('needs_revision')}
              className={`p-3 rounded-2xl border text-center transition ${
                filterStatus === 'needs_revision'
                  ? 'bg-red-600 text-white border-red-700 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200'
              }`}
            >
              <span className="text-[10px] font-medium block">Perlu Revisi</span>
              <span className="text-xl font-black">{revisionCount}</span>
            </button>
          </div>

          {/* Filter and Search Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-2.5 shadow-xs flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Cari nama OB, tanggal, atau shift..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs text-slate-800 bg-transparent outline-none placeholder-slate-400"
            />
            {filterStatus !== 'all' && (
              <button
                onClick={() => setFilterStatus('all')}
                className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold px-2 py-1 rounded-lg flex-shrink-0"
              >
                Reset Filter
              </button>
            )}
          </div>

          {/* List of Reports */}
          <div className="space-y-2.5">
            {filteredReports.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 space-y-2">
                <FileText className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs font-semibold">Tidak ada checklist ditemukan</p>
                <p className="text-[11px] text-slate-400">
                  Data checklist yang dikirimkan oleh Petugas OB akan otomatis muncul di sini secara real-time.
                </p>
              </div>
            ) : (
              filteredReports.map((report) => {
                const totalTasks = report.areas.reduce((acc, a) => acc + a.items.length, 0);
                const doneTasks = report.areas.reduce(
                  (acc, a) => acc + a.items.filter((i) => i.status === 'done').length,
                  0
                );
                const hasIssues = report.areas.some((a) =>
                  a.items.some((i) => i.status === 'issue')
                );

                return (
                  <div
                    key={report.id}
                    onClick={() => handleOpenReport(report)}
                    className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-xs hover:border-indigo-400 active:scale-98 transition cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${
                          report.inspectionStatus === 'approved'
                            ? 'bg-emerald-100 text-emerald-700'
                            : report.inspectionStatus === 'needs_revision'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {report.shift.charAt(0)}
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold text-slate-900 leading-tight">
                            {report.obName}
                          </h4>
                          <span className="text-[10px] text-slate-400">
                            • Shift {report.shift}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          {report.date} ({report.time}) • {doneTasks}/{totalTasks} tugas selesai
                        </p>
                        {hasIssues && (
                          <span className="text-[10px] text-amber-700 font-bold inline-block mt-0.5">
                            ⚠ Ada kendala dilaporkan
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            report.inspectionStatus === 'approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : report.inspectionStatus === 'needs_revision'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {report.inspectionStatus === 'approved' && 'Disetujui'}
                          {report.inspectionStatus === 'needs_revision' && 'Perlu Revisi'}
                          {report.inspectionStatus === 'pending_review' && 'Perlu Dicek'}
                        </span>
                        {report.spvRating && (
                          <span className="block text-[10px] text-amber-500 font-bold mt-0.5">
                            ★ {report.spvRating}/5
                          </span>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
