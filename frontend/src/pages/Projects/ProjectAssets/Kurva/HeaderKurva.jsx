import React from 'react';
import { Filter, Edit3, X, CheckCircle2, Loader2, FileSpreadsheet, Download } from 'lucide-react';
import ProjectNavigation from '../../ProjectNavigation'; // Path disesuaikan dengan struktur Anda

export default function HeaderKurva({
  project, projectId, isEditMode, isLoading, isSaving, isScheduleEmpty, canCreateData, canExportData, isGuest,
  showFilterPopup, setShowFilterPopup, filterRef, tempFilterMode, setTempFilterMode,
  startDateFilter, setStartDateFilter, endDateFilter, setEndDateFilter, projectBounds, handleApplyFilter, applyFilter, getActiveFilterLabel, filterMode,
  handleBatalEdit, toggleEditMode, setSaveModal, setExportModal, openWeekModal
}) {

  const getCategoryStyle = (kat) => {
    switch (kat) {
      case 'Infrastruktur Jalan & Jembatan': return 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600';
      case 'Gedung & Bangunan Sipil': return 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/50';
      case 'Sumber Daya Air & Irigasi': return 'bg-cyan-50 text-cyan-600 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-400 dark:border-cyan-800/50';
      case 'Tata Lingkungan & Sanitasi': return 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50';
      case 'Preservasi Jalan': return 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/50';
      default: return 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800/50';
    }
  };

  return (
    <>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 shrink-0">
        <div className="flex items-start lg:items-center gap-3 shrink-0">
          <div className="flex-1 min-w-0">
            <h1 className="text-sm lg:text-base font-bold text-slate-800 dark:text-white leading-snug flex items-center gap-1.5 flex-wrap">
              <span>Kurva S & Schedule Proyek</span>
              {isEditMode && <span className="px-2 py-0.5 ml-1 text-[9px] bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 rounded-md animate-pulse border border-amber-200 dark:border-amber-500/30 font-extrabold tracking-wider shadow-sm">DRAFT MODE</span>}
            </h1>
            <div className="flex items-center flex-wrap gap-1 mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
              <span className="truncate font-medium">{project?.nama_proyek || 'Memuat Data...'}</span>
              <span className="text-slate-400">•</span>
              <span className={`px-1.5 py-0.2 rounded border text-[9px] font-extrabold uppercase tracking-wider shadow-sm truncate ${getCategoryStyle(project?.kategori)}`}>
                {project?.kategori || 'Belum Ditentukan'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
          
          {/* KONTROL AKSI & EKSPOR */}
          <div className="flex items-center justify-between sm:justify-start gap-1 bg-white dark:bg-slate-800/80 px-1.5 h-10 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-visible z-30 transition-all shrink-0">
            {!isEditMode && (
              <div className="relative" ref={filterRef}>
                <button 
                  disabled={isLoading || isScheduleEmpty} 
                  onClick={() => setShowFilterPopup(!showFilterPopup)} 
                  className={`flex items-center justify-center gap-1.5 px-2 sm:px-2.5 h-7 rounded-lg text-[10px] sm:text-[11px] font-bold border transition-all disabled:opacity-50 disabled:cursor-not-allowed ${showFilterPopup || filterMode === 'Harian' ? 'bg-purple-50 dark:bg-purple-500/10 border-purple-300 dark:border-purple-500/30 text-purple-600 dark:text-purple-400' : 'bg-transparent border-transparent text-slate-600 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-purple-500/10 hover:text-purple-600 dark:hover:text-purple-400'}`}
                >
                  <Filter className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400 shrink-0" /> 
                  <span>Filter</span>
                </button>
                {showFilterPopup && (
                  <div className="absolute left-0 sm:right-0 sm:left-auto top-full mt-2 w-72 sm:w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-4 z-50 animate-fade-in">
                    <h4 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Skala Tampilan Sumbu X</h4>
                    <div className="flex bg-slate-100 dark:bg-slate-900/60 rounded-xl p-1 mb-4 shadow-inner border border-slate-200 dark:border-slate-700/50">
                      {['Harian', 'Mingguan', 'Bulanan'].map(mode => (
                        <button key={mode} onClick={() => setTempFilterMode(mode)} className={`flex-1 text-[10px] py-1.5 font-bold rounded-lg transition-all ${tempFilterMode === mode ? 'bg-white dark:bg-slate-700 shadow text-purple-600 dark:text-purple-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>
                          {mode}
                        </button>
                      ))}
                    </div>
                    
                    {tempFilterMode === 'Harian' && (
                      <div className="animate-fade-in mb-4">
                        <h4 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Rentang Waktu (Wajib)</h4>
                        <div className="flex flex-col gap-2.5">
                          <div className="space-y-1"><label className="text-[10px] font-medium text-slate-500">Mulai Tanggal <span className="text-rose-500">*</span></label><input type="date" min={projectBounds.start} max={endDateFilter || projectBounds.end} value={startDateFilter} onChange={e => setStartDateFilter(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-inner [color-scheme:light_dark]" /></div>
                          <div className="space-y-1"><label className="text-[10px] font-medium text-slate-500">Sampai Tanggal <span className="text-rose-500">*</span></label><input type="date" min={startDateFilter || projectBounds.start} max={projectBounds.end} value={endDateFilter} onChange={e => setEndDateFilter(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-inner [color-scheme:light_dark]" /></div>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex gap-2 mt-2">
                      <button onClick={handleApplyFilter} className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs shadow-sm transition-colors">Terapkan Filter</button>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {canCreateData && isEditMode && (
              <button onClick={handleBatalEdit} disabled={isSaving || isLoading} className="flex items-center justify-center gap-1.5 h-7 px-2 sm:px-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 text-[10px] sm:text-[11px] font-bold rounded-lg border border-slate-300 dark:border-slate-600 whitespace-nowrap">
                <X className="w-3.5 h-3.5 shrink-0" /> <span>Batal</span>
              </button>
            )}

            {canCreateData && !isScheduleEmpty && (
              <button 
                onClick={isEditMode ? () => setSaveModal(true) : toggleEditMode} 
                disabled={isSaving || isLoading} 
                className={`flex items-center justify-center gap-1.5 h-7 px-2 sm:px-2.5 text-[10px] sm:text-[11px] font-bold rounded-lg transition-all whitespace-nowrap shadow-sm ${isEditMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-transparent hover:bg-blue-50 dark:hover:bg-blue-500/10 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400'}`}
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0 text-white" /> : (isEditMode ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-white" /> : <Edit3 className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 shrink-0" />)} 
                <span>{isSaving ? 'Menyimpan...' : (isEditMode ? 'Simpan' : 'Edit')}</span>
              </button>
            )}

            {!isGuest && !isEditMode && !isScheduleEmpty && canExportData && (
              <>
                <div className="w-px h-4 bg-slate-200 dark:bg-slate-700/80 mx-0.5 shrink-0"></div>
                <button onClick={() => setExportModal({ show: true, type: 'excel' })} disabled={isLoading} className="flex items-center justify-center gap-1.5 h-7 px-2 sm:px-2.5 bg-transparent hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 text-[10px] sm:text-[11px] font-medium rounded-lg whitespace-nowrap">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 shrink-0" /><span>Excel</span>
                </button>
                <button onClick={() => setExportModal({ show: true, type: 'pdf' })} disabled={isLoading} className="flex items-center justify-center gap-1.5 h-7 px-2 sm:px-2.5 bg-transparent hover:bg-rose-50 dark:hover:bg-rose-500/10 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 text-[10px] sm:text-[11px] font-medium rounded-lg whitespace-nowrap">
                  <Download className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400 shrink-0" /><span>PDF</span>
                </button>
              </>
            )}
          </div>

          <ProjectNavigation projectId={projectId} project={project} activeTab="kurva" />
        </div>
      </div>

      {(filterMode !== 'Mingguan') && !isEditMode && !isScheduleEmpty && (
        <div className="flex flex-wrap gap-2 animate-fade-in -mt-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[10px] font-bold rounded-lg border border-purple-200 dark:border-purple-500/20 shadow-sm">
            Tampilan Grafik: {getActiveFilterLabel()}
            <button onClick={() => applyFilter('Semua')} className="hover:bg-purple-200 dark:hover:bg-purple-500/30 p-0.5 rounded-full transition-colors ml-1"><X className="w-3 h-3"/></button>
          </span>
        </div>
      )}
    </>
  );
}