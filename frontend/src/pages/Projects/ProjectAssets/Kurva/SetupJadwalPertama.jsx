import React from 'react';
import { CalendarDays, AlertTriangle, Plus, Trash2, Calendar, Target, Save, Loader2 } from 'lucide-react';

export default function SetupJadwalPertama({
  weeksForm, handleInitialWeekChange, handleAddInitialWeek, handleRemoveInitialWeek,
  projectBounds, handleSaveInitialSchedule, isSavingInitial, navigate
}) {
  return (
    <div className="animate-fade-in space-y-4">
      <div className="p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-sm">
        <div className="p-3 bg-amber-100 dark:bg-amber-500/20 rounded-full shrink-0">
          <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-500" />
        </div>
        <div>
          <h3 className="font-bold text-amber-800 dark:text-amber-400 text-sm mb-1">Time Schedule Belum Dibuat</h3>
          <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
            Grafik Kurva S dan Matriks belum bisa ditampilkan. Silakan atur <strong>Jadwal Minggu Pertama</strong> di bawah ini untuk memulai.
          </p>
        </div>
      </div>
      
      <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-5 md:p-6 shadow-sm">
        <h3 className="text-lg font-extrabold text-blue-600 dark:text-blue-500 flex items-center gap-2 mb-6"><CalendarDays className="w-5 h-5"/> Setup Jadwal Pertama</h3>
        <div className="space-y-4">
          {weeksForm.map((week, index) => (
            <div key={week.id} className="bg-slate-50 dark:bg-slate-900/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm relative transition-all">
              <div className="flex flex-wrap items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3 mb-4 gap-2">
                <h2 className="text-xs font-bold text-blue-600 dark:text-blue-500 uppercase tracking-wider flex items-center gap-2">Minggu Ke-{week.minggu_ke || (index+1)}</h2>
                {weeksForm.length > 1 && <button onClick={() => handleRemoveInitialWeek(week.id)} className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 text-rose-600 text-[10px] font-medium rounded-lg transition-all border border-rose-200 dark:border-rose-500/20"><Trash2 className="w-3.5 h-3.5" /> Hapus</button>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-4">
                   <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2"><Calendar className="w-3.5 h-3.5" /> Rentang Waktu</label>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5"><label className="text-[10px] font-medium text-slate-500">Bulan Ke-</label><input type="number" min="1" value={week.bulan} onChange={(e) => handleInitialWeekChange(week.id, 'bulan', e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-blue-500" /></div>
                      <div className="space-y-1.5"><label className="text-[10px] font-medium text-slate-500">Minggu Ke-</label><input type="number" min="1" value={week.minggu_ke} onChange={(e) => handleInitialWeekChange(week.id, 'minggu_ke', e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-blue-500" /></div>
                      <div className="space-y-1.5"><label className="text-[10px] font-medium text-slate-500">Tgl Mulai <span className="text-rose-500">*</span></label><input type="date" min={projectBounds.start} max={week.tanggal_selesai || projectBounds.end} value={week.tanggal_mulai} onChange={(e) => handleInitialWeekChange(week.id, 'tanggal_mulai', e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-blue-500 [color-scheme:light_dark]" /></div>
                      <div className="space-y-1.5"><label className="text-[10px] font-medium text-slate-500">Tgl Akhir <span className="text-rose-500">*</span></label><input type="date" min={week.tanggal_mulai || projectBounds.start} max={projectBounds.end} value={week.tanggal_selesai} onChange={(e) => handleInitialWeekChange(week.id, 'tanggal_selesai', e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-blue-500 [color-scheme:light_dark]" /></div>
                   </div>
                 </div>
                 <div className="space-y-4 md:border-l md:border-slate-200 md:dark:border-slate-700 md:pl-6">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2"><Target className="w-3.5 h-3.5" /> Target S-Curve</label>
                    <div className="space-y-3 pt-1">
                      <label className="text-[10px] font-medium text-slate-500">Target Kumulatif (Plan) <span className="text-rose-500">*</span></label>
                      <div className="flex items-center gap-3">
                         <input type="text" placeholder="0.00" value={week.target_kumulatif} onChange={(e) => handleInitialWeekChange(week.id, 'target_kumulatif', e.target.value)} className="w-32 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-300 dark:border-emerald-500/50 text-center font-mono text-xl font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-xl text-emerald-600 dark:text-emerald-400 py-3 shadow-inner" />
                         <span className="font-extrabold text-emerald-600 dark:text-emerald-500 text-2xl">%</span>
                      </div>
                    </div>
                 </div>
              </div>
            </div>
          ))}
          <button onClick={handleAddInitialWeek} className="w-full py-4 border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-blue-500 rounded-2xl bg-slate-50 dark:bg-slate-900 text-slate-500 hover:text-blue-500 font-bold text-xs flex justify-center items-center gap-2 transition-all shadow-sm"><Plus className="w-5 h-5" /> Tambah Minggu Berikutnya</button>
        </div>
        <div className="mt-6 flex justify-end gap-3 pt-5 border-t border-slate-200 dark:border-slate-700">
          <button onClick={() => navigate(-1)} className="px-6 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-xs shadow-sm">Batal & Kembali</button>
          <button onClick={handleSaveInitialSchedule} disabled={isSavingInitial} className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md disabled:opacity-50 transition-all flex items-center gap-2 text-xs">{isSavingInitial ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>} Simpan & Render Matriks</button>
        </div>
      </div>
    </div>
  );
}