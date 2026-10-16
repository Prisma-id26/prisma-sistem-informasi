import React from 'react';
import { Building2, MapPin, Calendar, UserCheck, Target, ChevronDown } from 'lucide-react';

export default function InfoPengawasan({ isEditMode, reportData, editForm, setEditForm, availableWeeks = [] }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* KARTU 1: LOKASI & PROYEK */}
      <div className={`bg-white dark:bg-slate-800/60 border p-4 md:p-5 rounded-2xl space-y-4 relative shadow-sm transition-all flex flex-col justify-center h-full ${isEditMode ? 'border-blue-400/60 dark:border-blue-500/50 ring-2 ring-blue-500/10' : 'border-slate-200 dark:border-slate-700/60'}`}>
        <div className="space-y-3 text-xs flex-1">
          <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 md:p-4 rounded-xl border border-slate-200 dark:border-slate-700/50">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5 text-amber-500" /> Nama Proyek</span>
            <p className="text-sm font-bold text-slate-800 dark:text-white leading-snug">{reportData.project?.nama_proyek}</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 md:p-4 rounded-xl border border-slate-200 dark:border-slate-700/50">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-amber-500" /> Lokasi Pengawasan</span>
            {isEditMode ? (
              <input type="text" value={editForm.lokasi} onChange={e => setEditForm({...editForm, lokasi: e.target.value})} className="w-full bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-500/50 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors shadow-inner" />
            ) : (
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{reportData.lokasi}</p>
            )}
          </div>
        </div>
      </div>

      {/* KARTU 2: WAKTU & PENGAWAS */}
      <div className={`bg-white dark:bg-slate-800/60 border p-4 md:p-5 rounded-2xl space-y-4 relative shadow-sm transition-all flex flex-col justify-center h-full ${isEditMode ? 'border-blue-400/60 dark:border-blue-500/50 ring-2 ring-blue-500/10' : 'border-slate-200 dark:border-slate-700/60'}`}>
        <div className="space-y-3 text-xs flex-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 md:p-4 rounded-xl border border-slate-200 dark:border-slate-700/50">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-blue-500" /> Tanggal</span>
              {isEditMode ? (
                <input type="date" value={editForm.tanggal} onChange={e => setEditForm({...editForm, tanggal: e.target.value})} className="w-full bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-500/50 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors shadow-inner [color-scheme:light_dark]" />
              ) : (
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{reportData.tanggal}</p>
              )}
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 md:p-4 rounded-xl border border-slate-200 dark:border-slate-700/50">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Target className="w-3.5 h-3.5 text-indigo-500" /> Minggu Ke-</span>
              {isEditMode ? (
                <div className="relative">
                  <select value={editForm.minggu_ke} onChange={e => setEditForm({...editForm, minggu_ke: e.target.value})} className="w-full bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-500/50 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none shadow-inner cursor-pointer">
                    <option value="" disabled>-- Pilih --</option>
                    {availableWeeks.map(w => <option key={w} value={w}>Minggu Ke-{w}</option>)}
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              ) : (
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">Ke-{reportData.minggu_ke || '-'}</p>
              )}
            </div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 md:p-4 rounded-xl border border-slate-200 dark:border-slate-700/50">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5"><UserCheck className="w-3.5 h-3.5 text-emerald-500" /> Nama Pengawas</span>
            {isEditMode ? (
              <input type="text" value={editForm.pengawas} onChange={e => setEditForm({...editForm, pengawas: e.target.value})} className="w-full bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-500/50 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors shadow-inner" />
            ) : (
              <p className="text-xs font-semibold text-slate-800 dark:text-white">{reportData.pengawas}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}