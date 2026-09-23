import React, { useState } from 'react';
import { 
  BarChart3, 
  Download, 
  Printer, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Star, 
  User, 
  Filter,
  FileSpreadsheet
} from 'lucide-react';
import { DailyChecklistReport } from '../types';

interface ReportsViewProps {
  reports: DailyChecklistReport[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({ reports }) => {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  // Filter reports by selected month
  const filtered = reports.filter((r) => r.date.startsWith(selectedMonth));

  // Compute metrics
  const totalReports = filtered.length;
  const approved = filtered.filter((r) => r.inspectionStatus === 'approved').length;
  const pending = filtered.filter((r) => r.inspectionStatus === 'pending_review').length;
  const revision = filtered.filter((r) => r.inspectionStatus === 'needs_revision').length;

  const ratings = filtered.map((r) => r.spvRating).filter((v): v is number => typeof v === 'number');
  const avgRating = ratings.length > 0 ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : '-';

  // Export to CSV
  const handleExportCSV = () => {
    if (filtered.length === 0) {
      alert('Tidak ada data untuk diekspor!');
      return;
    }

    const headers = [
      'ID Laporan',
      'Tanggal',
      'Jam',
      'Shift',
      'Petugas OB',
      'Status Approval',
      'Supervisor (SPV)',
      'Rating Kebersihan',
      'Catatan OB',
      'Catatan SPV',
      'Jumlah Area',
      'Total Tugas Selesai',
    ];

    const rows = filtered.map((r) => {
      const totalTasks = r.areas.reduce((acc, a) => acc + a.items.length, 0);
      const doneTasks = r.areas.reduce(
        (acc, a) => acc + a.items.filter((i) => i.status === 'done').length,
        0
      );

      return [
        `"${r.id}"`,
        `"${r.date}"`,
        `"${r.time}"`,
        `"${r.shift}"`,
        `"${r.obName}"`,
        `"${r.inspectionStatus}"`,
        `"${r.spvName || '-'}"`,
        `"${r.spvRating || '-'}"`,
        `"${(r.obNotes || '').replace(/"/g, '""')}"`,
        `"${(r.spvNotes || '').replace(/"/g, '""')}"`,
        r.areas.length,
        `${doneTasks}/${totalTasks}`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_Checklist_OB_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="pb-24 max-w-xl mx-auto space-y-4">
      {/* Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <BarChart3 className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-slate-900 leading-tight">Rekap &amp; Laporan</h2>
              <p className="text-[11px] text-slate-500">Statistik kebersihan &amp; ekspor data</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrint}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              title="Cetak Laporan / Simpan PDF"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition"
              title="Unduh Excel CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Ekspor CSV</span>
            </button>
          </div>
        </div>

        {/* Month Selector */}
        <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
          <Calendar className="w-4 h-4 text-slate-500" />
          <span className="text-xs text-slate-600 font-medium">Bulan Periode:</span>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="text-xs font-bold text-slate-800 bg-transparent outline-none cursor-pointer"
          />
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-xs">
          <span className="text-[11px] text-slate-500 font-medium block mb-1">Total Checklist</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">{totalReports}</span>
            <span className="text-[10px] text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded-full">
              Bulan Ini
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-xs">
          <span className="text-[11px] text-slate-500 font-medium block mb-1">Rata-rata Rating SPV</span>
          <div className="flex items-baseline justify-between">
            <div className="flex items-center gap-1">
              <span className="text-2xl font-black text-slate-900">{avgRating}</span>
              <Star className="w-4 h-4 text-amber-400 fill-amber-400 inline" />
            </div>
            <span className="text-[10px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-full">
              Skala 5
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-xs">
          <span className="text-[11px] text-slate-500 font-medium block mb-1">Disetujui (Approved)</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-600">{approved}</span>
            <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
              {totalReports > 0 ? Math.round((approved / totalReports) * 100) : 0}%
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-xs">
          <span className="text-[11px] text-slate-500 font-medium block mb-1">Perlu Revisi</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-red-600">{revision}</span>
            <span className="text-[10px] text-red-700 font-semibold bg-red-50 px-2 py-0.5 rounded-full">
              {totalReports > 0 ? Math.round((revision / totalReports) * 100) : 0}%
            </span>
          </div>
        </div>
      </div>

      {/* Table / Summary List */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
          Riwayat Checklist ({filtered.length})
        </h3>

        {filtered.length === 0 ? (
          <div className="py-6 text-center text-slate-400 text-xs">
            Belum ada checklist pada bulan {selectedMonth}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((item) => (
              <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    <span>{item.obName}</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      ({item.shift})
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500">
                    {item.date} • {item.time}
                  </span>
                </div>

                <div className="text-right">
                  {item.inspectionStatus === 'approved' && (
                    <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      Disetujui
                    </span>
                  )}
                  {item.inspectionStatus === 'needs_revision' && (
                    <span className="inline-block px-2 py-0.5 rounded-full bg-red-100 text-red-800 text-[10px] font-bold">
                      Revisi
                    </span>
                  )}
                  {item.inspectionStatus === 'pending_review' && (
                    <span className="inline-block px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                      Menunggu
                    </span>
                  )}
                  {item.spvRating && (
                    <span className="block text-[10px] text-amber-500 font-bold mt-0.5">
                      ★ {item.spvRating}/5
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
