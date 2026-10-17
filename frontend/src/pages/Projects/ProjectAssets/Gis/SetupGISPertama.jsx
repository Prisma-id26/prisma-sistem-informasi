import React from 'react';
import { Compass, MapPin, Map as MapIcon, Loader2 } from 'lucide-react';

export default function SetupGISPertama({
  canCreateData,
  wilayahAdministrasi,
  editForm,
  handleChange,
  handleSaveGIS,
  isSaving
}) {
  return (
    <div className="flex flex-col items-center justify-center bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-8 md:p-12 shadow-sm text-center min-h-[50vh] animate-fade-in">
      <div className="w-20 h-20 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-full flex items-center justify-center mb-6 shadow-inner mx-auto">
        <Compass className="w-10 h-10 text-amber-500" />
      </div>
      <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white mb-2">Peta Spasial Belum Diatur</h2>
      
      {canCreateData ? (
        <>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 max-w-lg leading-relaxed mx-auto">
            Silakan tentukan titik koordinat awal dan akhir proyek untuk mengaktifkan pemantauan visual. Data ini akan menjadi batas acuan area kerja proyek Anda.
          </p>
          <form onSubmit={handleSaveGIS} className="w-full max-w-2xl bg-slate-50 dark:bg-slate-900/50 p-6 md:p-8 rounded-2xl border border-slate-200 dark:border-slate-700/50 text-center shadow-sm mx-auto flex flex-col items-center">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm mb-6 inline-block min-w-[250px]">
              <span className="font-bold text-slate-700 dark:text-slate-300 text-xs mb-1 block">Wilayah Administrasi</span>
              <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">{wilayahAdministrasi}</p>
            </div>
            <h4 className="text-xs font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider mb-5 flex items-center justify-center gap-1.5">
              <MapPin className="w-4 h-4" /> Masukkan Koordinat Proyek Utama
            </h4>
            <div className="flex flex-col sm:flex-row gap-5 mb-8 w-full">
              <div className="flex-1 bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <span className="font-bold text-slate-700 dark:text-slate-300 text-xs mb-3 block border-b border-slate-100 dark:border-slate-700 pb-2">Titik Awal Proyek</span>
                <div className="text-left">
                  <label className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1.5 font-medium text-center">Titik Koordinat (Lat, Long)</label>
                  <input type="text" required name="koordinat_awal" value={editForm.koordinat_awal || ''} onChange={handleChange} placeholder="-3.3191, 114.5911" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-slate-800 dark:text-white focus:ring-2 focus:ring-amber-500 font-mono text-xs text-center custom-scrollbar" />
                </div>
              </div>
              <div className="flex-1 bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <span className="font-bold text-slate-700 dark:text-slate-300 text-xs mb-3 block border-b border-slate-100 dark:border-slate-700 pb-2">Titik Akhir Proyek</span>
                <div className="text-left">
                  <label className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1.5 font-medium text-center">Titik Koordinat (Lat, Long)</label>
                  <input type="text" required name="koordinat_akhir" value={editForm.koordinat_akhir || ''} onChange={handleChange} placeholder="-3.3215, 114.6102" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-slate-800 dark:text-white focus:ring-2 focus:ring-amber-500 font-mono text-xs text-center custom-scrollbar" />
                </div>
              </div>
            </div>
            <button type="submit" disabled={isSaving} className="px-8 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs transition-colors shadow-md flex items-center gap-2">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : <MapIcon className="w-4 h-4"/>} Aktifkan Peta GIS
            </button>
          </form>
        </>
      ) : (
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md leading-relaxed mx-auto">
          Peta spasial untuk proyek ini belum dikonfigurasi. Silakan hubungi tim lapangan atau administrator untuk mengatur koordinat lokasi.
        </p>
      )}
    </div>
  );
}