import React from 'react';
import { Edit3, X, CheckCircle2, Loader2 } from 'lucide-react';
import ProjectNavigation from '../../ProjectNavigation';

export default function HeaderGIS({
  id,
  projectData,
  isEditMode,
  setIsEditMode,
  isSaving,
  isLoading,
  isGisEmpty,
  canCreateData,
  cancelEdit,
  handleSaveGIS
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
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 shrink-0 mb-2">
      <div className="flex items-start lg:items-center gap-3 shrink-0">
        <div className="flex-1 min-w-0">
          <h1 className="text-sm lg:text-base font-bold text-slate-800 dark:text-white leading-snug flex items-center gap-1.5 flex-wrap">
            <span>Peta & Informasi Spasial (GIS)</span>
            {isEditMode && (
              <span className="px-2 py-0.5 ml-1 text-[9px] bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 rounded-md animate-pulse border border-blue-200 dark:border-blue-500/30 font-extrabold tracking-wider shadow-sm">
                DRAFT MODE
              </span>
            )}
          </h1>
          
          <div className="flex items-center flex-wrap gap-1 mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
            <span className="truncate font-medium">{projectData?.nama_proyek || 'Memuat Data...'}</span>
            <span className="text-slate-400">•</span>
            <span className="truncate" title={`Kns: ${projectData?.kode_kontrak || '-'} | Knt: ${projectData?.nomor_kontrak_kontraktor || '-'}`}>
              SPK: {projectData?.kode_kontrak || projectData?.nomor_kontrak_kontraktor || '-'}
            </span>
            <span className="text-slate-400">•</span>
            <span className={`px-1.5 py-0.2 rounded border text-[9px] font-extrabold uppercase tracking-wider shadow-sm truncate ${getCategoryStyle(projectData?.kategori)}`}>
              {projectData?.kategori || 'Belum Ditentukan'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
        {/* BOKS KIRI: KONTROL AKSI (EDIT, BATAL, SIMPAN) */}
        {canCreateData && (!isGisEmpty || isLoading) && (
          <div className="flex items-center justify-between sm:justify-start gap-1 bg-white dark:bg-slate-800/80 px-1.5 h-10 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-x-auto custom-scrollbar z-30 transition-all shrink-0">
            {isEditMode && (
              <button 
                onClick={cancelEdit} 
                disabled={isSaving || isLoading} 
                className="flex items-center justify-center gap-1 h-7 px-2 sm:px-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 text-[10px] sm:text-[11px] font-bold rounded-lg border border-slate-300 dark:border-slate-600 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="w-3.5 h-3.5 shrink-0" /> 
                <span>Batal</span>
              </button>
            )}
            <button 
              onClick={isEditMode ? handleSaveGIS : () => setIsEditMode(true)} 
              disabled={isSaving || isLoading} 
              className={`flex items-center justify-center gap-1.5 px-2 sm:px-2.5 h-7 text-[10px] sm:text-[11px] font-bold rounded-lg transition-all whitespace-nowrap shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${isEditMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-transparent hover:bg-blue-50 dark:hover:bg-blue-500/10 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400'}`}
            >
              {isSaving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0 text-blue-500" />
              ) : isEditMode ? (
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-white" />
              ) : (
                <Edit3 className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 shrink-0" />
              )} 
              <span>{isSaving ? 'Menyimpan...' : (isEditMode ? 'Simpan' : 'Edit')}</span>
            </button>
          </div>
        )}

        {/* BOKS KANAN: NAVIGASI TAB MENU TERPUSAT */}
        <ProjectNavigation projectId={id} project={projectData} activeTab="gis" />
      </div>
    </div>
  );
}