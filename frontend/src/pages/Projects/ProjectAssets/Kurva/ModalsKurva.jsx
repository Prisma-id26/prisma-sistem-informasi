import React from 'react';
import { CalendarDays, Save, CheckCircle2, Download, Loader2 } from 'lucide-react';

export function ModalMingguan({ weekModal, setWeekModal, saveWeekModal, projectBounds }) {
  if (!weekModal.show) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-2xl shadow-2xl p-6 border border-slate-200 dark:border-slate-700">
        <h3 className="text-sm font-extrabold text-amber-600 dark:text-amber-500 uppercase tracking-wider flex items-center gap-2 mb-5">
          <CalendarDays className="w-5 h-5" /> Atur Info Minggu Ke-{weekModal.minggu_ke}
        </h3>
        <div className="space-y-4 mb-6">
          <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-500 uppercase">Bulan Ke- (Opsional)</label><input type="number" value={weekModal.bulan} onChange={(e) => setWeekModal({...weekModal, bulan: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors" /></div>
          <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-500 uppercase">Tanggal Mulai</label><input type="date" min={projectBounds.start} max={weekModal.tanggal_akhir || projectBounds.end} value={weekModal.tanggal_awal} onChange={(e) => setWeekModal({...weekModal, tanggal_awal: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors [color-scheme:light_dark]" /></div>
          <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-500 uppercase">Tanggal Akhir</label><input type="date" min={weekModal.tanggal_awal || projectBounds.start} max={projectBounds.end} value={weekModal.tanggal_akhir} onChange={(e) => setWeekModal({...weekModal, tanggal_akhir: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors [color-scheme:light_dark]" /></div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setWeekModal({ show: false })} className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-xs shadow-sm">Batal</button>
          <button onClick={saveWeekModal} className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white dark:text-slate-950 font-bold rounded-xl shadow-md flex justify-center items-center gap-1.5 transition-colors"><Save className="w-4 h-4"/> Set Tanggal</button>
        </div>
      </div>
    </div>
  );
}

export function ModalSimpan({ saveModal, setSaveModal, handleSaveSchedule }) {
  if (!saveModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-2xl shadow-2xl p-6 text-center border border-slate-200 dark:border-slate-700">
        <div className="w-14 h-14 bg-amber-50 dark:bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-200 dark:border-amber-500/20"><Save className="w-6 h-6 text-amber-600 dark:text-amber-500" /></div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Simpan Perubahan?</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">Target rencana mingguan akan diperbarui dan diterapkan langsung ke database S-Curve.</p>
        <div className="flex gap-3">
          <button onClick={() => setSaveModal(false)} className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-xs shadow-sm">Batal</button>
          <button onClick={handleSaveSchedule} className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white dark:text-slate-950 font-bold rounded-xl shadow-md flex items-center justify-center gap-2 text-xs transition-colors"><CheckCircle2 className="w-4 h-4" /> Ya, Simpan</button>
        </div>
      </div>
    </div>
  );
}

export function ModalExport({ exportModal, setExportModal, executeExport, isExportingExcel, isExportingPdf, startDateFilter, endDateFilter, formatIndoDate }) {
  if (!exportModal.show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden text-center p-6">
        <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${exportModal.type === 'excel' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 border border-emerald-200' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-500 border border-rose-200'}`}><Download className="w-6 h-6" /></div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Ekspor Laporan Penuh?</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">Sistem akan memotret grafik di rentang <strong>{formatIndoDate(startDateFilter)} s/d {formatIndoDate(endDateFilter)}</strong> dan menggabungkannya bersama <strong>Tabel Matriks Schedule</strong> ke dalam format <strong className="uppercase">{exportModal.type}</strong>.</p>
        <div className="flex gap-3">
          <button disabled={isExportingExcel || isExportingPdf} onClick={() => setExportModal({ show: false, type: '' })} className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">Batal</button>
          <button disabled={isExportingExcel || isExportingPdf} onClick={executeExport} className={`flex-1 py-2.5 text-white text-xs font-bold rounded-xl shadow-md flex justify-center items-center gap-2 transition-all ${exportModal.type === 'excel' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-rose-500 hover:bg-rose-600'}`}>{isExportingExcel || isExportingPdf ? <Loader2 className="w-4 h-4 animate-spin"/> : <Download className="w-4 h-4"/>} Proses</button>
        </div>
      </div>
    </div>
  );
}