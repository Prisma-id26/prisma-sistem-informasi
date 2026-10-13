import React from 'react';
import { UserCheck, Users, HardHat, Plus, Edit3, Trash2 } from 'lucide-react';

export default function StakeholdersPersonnel({ project, isEditMode, editFormData, handleMainChange, canCreateData, openPersonnelModal, handleDeletePersonnel }) {
  
  const activePersonnels = isEditMode ? (editFormData.personnels || []) : (project.personnels || []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className={`bg-white dark:bg-slate-800/60 border ${isEditMode ? 'border-blue-400/60 dark:border-blue-500/50 ring-2 ring-blue-500/10' : 'border-slate-200 dark:border-slate-700/60 shadow-sm'} rounded-2xl overflow-hidden flex flex-col transition-all relative backdrop-blur-sm h-full`}>
        <div className="px-4 md:px-5 py-4 bg-slate-50 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
          <h3 className="text-xs font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider flex items-center gap-2">
            <UserCheck className="w-4 h-4" /> Para Pihak (Stakeholders)
          </h3>
        </div>
        
        <div className="p-4 space-y-3 text-xs flex-1">
          <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/50 space-y-1">
            <span className="text-slate-500 dark:text-slate-400 text-[11px] block mb-1">PPK (Pejabat Pembuat Komitmen) / Owner</span>
            {isEditMode ? <input type="text" name="ppk" value={editFormData.ppk || ''} onChange={handleMainChange} className="w-full bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-500/50 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" /> : <p className="font-semibold text-slate-800 dark:text-white">{project.ppk || '-'}</p>}
          </div>
          <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/50 space-y-1">
            <span className="text-slate-500 dark:text-slate-400 text-[11px] block mb-1">Kontraktor Pelaksana (Penyedia Jasa)</span>
            {isEditMode ? <input type="text" name="kontraktor" value={editFormData.kontraktor || ''} onChange={handleMainChange} className="w-full bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-500/50 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" /> : <p className="font-semibold text-slate-800 dark:text-white">{project.kontraktor || '-'}</p>}
          </div>
          <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/50 space-y-1">
            <span className="text-slate-500 dark:text-slate-400 text-[11px] block mb-1">Konsultan Pengawas / Manajemen Konstruksi</span>
            {isEditMode ? <input type="text" name="konsultan" value={editFormData.konsultan || ''} onChange={handleMainChange} className="w-full bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-500/50 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" /> : <p className="font-semibold text-slate-800 dark:text-white">{project.konsultan || '-'}</p>}
          </div>
        </div>
      </div>

      <div className={`bg-white dark:bg-slate-800/60 border ${isEditMode ? 'border-blue-400/60 dark:border-blue-500/50 ring-2 ring-blue-500/10' : 'border-slate-200 dark:border-slate-700/60 shadow-sm'} rounded-2xl overflow-hidden flex flex-col transition-all relative backdrop-blur-sm h-full`}>
        <div className="px-4 md:px-5 py-4 bg-slate-50 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
          <h3 className="text-xs font-bold text-blue-600 dark:text-blue-500 uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4" /> Personel Lapangan
          </h3>
          {isEditMode && canCreateData && (
            <button onClick={() => openPersonnelModal()} className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20 text-[10px] font-bold rounded-lg border border-blue-200 dark:border-blue-500/30 transition-all animate-fade-in z-20 shadow-sm">
              <Plus className="w-3.5 h-3.5" /> Tambah
            </button>
          )}
        </div>
        
        <div className="p-4 overflow-x-auto flex-1 max-h-[300px] overflow-y-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="text-[10px] uppercase text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700/50">
              <tr>
                <th className="pb-2 font-semibold">Nama & Posisi</th>
                {isEditMode && canCreateData && <th className="pb-2 text-right font-semibold w-16 animate-fade-in">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/30 text-xs">
              {activePersonnels.length === 0 ? (
                <tr>
                  <td colSpan={isEditMode && canCreateData ? "2" : "1"} className="py-8 text-center text-slate-500 italic">
                    <div className="flex flex-col items-center justify-center">
                      <HardHat className="w-6 h-6 text-slate-300 dark:text-slate-600 mb-1" />
                      Belum ada tim terdaftar.
                    </div>
                  </td>
                </tr>
              ) : (
                activePersonnels.map((person, idx) => (
                  <tr key={person.id || person.temp_id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors group">
                    <td className="py-2.5">
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm shrink-0 relative">
                          <HardHat className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                          {person.temp_id && <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full shadow animate-pulse"></span>}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 dark:text-white leading-tight">{person.nama}</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{person.peran}</p>
                        </div>
                      </div>
                    </td>
                    {isEditMode && canCreateData && (
                      <td className="py-2.5 text-right animate-fade-in">
                        <div className="flex justify-end gap-1.5">
                          <button type="button" onClick={() => openPersonnelModal(person)} className="p-1.5 text-blue-500 hover:bg-blue-500 hover:text-white dark:hover:bg-blue-900/50 rounded-md transition-colors shadow-sm border border-slate-200 dark:border-slate-700/50"><Edit3 className="w-3.5 h-3.5"/></button>
                          
                          {/* TOMBOL DELETE MENGGUNAKAN handleDeletePersonnel TANPA MODAL */}
                          <button type="button" onClick={() => handleDeletePersonnel(person.id || person.temp_id)} className="p-1.5 text-rose-500 hover:bg-rose-500 hover:text-white dark:hover:bg-rose-900/50 rounded-md transition-colors shadow-sm border border-slate-200 dark:border-slate-700/50"><Trash2 className="w-3.5 h-3.5"/></button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}