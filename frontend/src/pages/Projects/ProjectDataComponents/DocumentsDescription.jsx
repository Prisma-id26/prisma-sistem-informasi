import React from 'react';
import { FileText, UploadCloud, Download, Trash2, Paperclip, AlignLeft } from 'lucide-react';

export default function DocumentsDescription({ project, isEditMode, editFormData, handleMainChange, canCreateData, handleUploadDocument, getDocUrl, confirmDeleteDocument }) {
  
  // LOGIKA PENTING: Gunakan editFormData saat mode edit agar file yang baru diupload langsung muncul
  const activeDocuments = isEditMode ? (editFormData.documents || []) : (project.documents || []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      
      {/* Kolom Kiri: Dokumen Administrasi */}
      <div className={`bg-white dark:bg-slate-800/60 border ${isEditMode ? 'border-blue-400/60 dark:border-blue-500/50 ring-2 ring-blue-500/10' : 'border-slate-200 dark:border-slate-700/60 shadow-sm'} rounded-2xl overflow-hidden flex flex-col transition-all relative backdrop-blur-sm h-full`}>
        <div className="px-4 md:px-5 py-4 bg-slate-50 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
          <h3 className="text-xs font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-wider flex items-center gap-2">
            <Paperclip className="w-4 h-4" /> Dokumen Administrasi
          </h3>
          {isEditMode && canCreateData && (
            <>
              <input type="file" id="docUploadAdd" className="hidden" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.dwg" onChange={handleUploadDocument} />
              <button type="button" onClick={() => document.getElementById('docUploadAdd').click()} className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20 text-[10px] font-bold rounded-lg border border-emerald-200 dark:border-emerald-500/30 transition-all animate-fade-in z-20 shadow-sm">
                <UploadCloud className="w-3.5 h-3.5" /> Upload File
              </button>
            </>
          )}
        </div>
        
        <div className="p-4 overflow-x-auto flex-1 max-h-[300px] overflow-y-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="text-[10px] uppercase text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700/50">
              <tr>
                <th className="pb-2 font-semibold">Nama File</th>
                <th className="pb-2 text-right font-semibold w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/30 text-xs">
              {activeDocuments.length === 0 ? (
                 <tr>
                   <td colSpan="2" className="py-8 text-center text-slate-500 italic">
                     <div className="flex flex-col items-center justify-center">
                       <FileText className="w-6 h-6 text-slate-300 dark:text-slate-600 mb-1" />
                       Belum ada berkas terlampir.
                     </div>
                   </td>
                 </tr>
              ) : (
                activeDocuments.map((doc, idx) => (
                  <tr key={doc.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors group">
                    <td className="py-2.5">
                      <div className="min-w-0 pr-2">
                        <p className="font-bold text-slate-800 dark:text-white truncate" title={doc.nama_file}>{doc.nama_file}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{doc.ukuran || 'N/A'}</p>
                      </div>
                    </td>
                    <td className="py-2.5 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button type="button" onClick={() => window.open(getDocUrl(doc.path_file), '_blank')} title="Download / Buka File" className="p-1.5 text-amber-500 hover:bg-amber-500 hover:text-white dark:hover:bg-amber-900/50 rounded-md transition-colors shadow-sm border border-slate-200 dark:border-slate-700/50">
                          <Download className="w-3.5 h-3.5"/>
                        </button>
                        {isEditMode && canCreateData && (
                          <button type="button" onClick={() => confirmDeleteDocument(doc.id, doc.nama_file)} title="Hapus File" className="p-1.5 text-rose-500 hover:bg-rose-500 hover:text-white dark:hover:bg-rose-900/50 rounded-md transition-colors shadow-sm border border-slate-200 dark:border-slate-700/50">
                            <Trash2 className="w-3.5 h-3.5"/>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Kolom Kanan: Deskripsi Pekerjaan */}
      <div className={`bg-white dark:bg-slate-800/60 border ${isEditMode ? 'border-blue-400/60 dark:border-blue-500/50 ring-2 ring-blue-500/10' : 'border-slate-200 dark:border-slate-700/60 shadow-sm'} rounded-2xl overflow-hidden flex flex-col transition-all relative backdrop-blur-sm h-full`}>
        <div className="px-4 md:px-5 py-4 bg-slate-50 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
          <h3 className="text-xs font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider flex items-center gap-2">
            <AlignLeft className="w-4 h-4" /> Deskripsi & Lingkup Pekerjaan
          </h3>
        </div>
        
        <div className="p-4 flex-1 max-h-[300px] overflow-y-auto custom-scrollbar flex flex-col">
          {isEditMode ? (
            <textarea 
              name="deskripsi" 
              rows={6} 
              value={editFormData.deskripsi || ''} 
              onChange={handleMainChange} 
              className="w-full flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3.5 py-3 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors custom-scrollbar" 
              placeholder="Tuliskan deskripsi ringkas tentang lingkup pekerjaan proyek ini..."
            />
          ) : (
            <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700/50 flex-1">
              {project.deskripsi || <span className="italic text-slate-400">Tidak ada deskripsi.</span>}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}