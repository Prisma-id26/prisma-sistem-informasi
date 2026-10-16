import React from 'react';
import { Image as ImageIcon, UploadCloud, ExternalLink, Trash2, Paperclip, FileText, Download } from 'lucide-react';

export function FotoCard({ isEditMode, reportData, handleUploadFile, handleDeleteFile, getDocUrl }) {
  const fotoDokumentasi = (reportData.attachments || []).filter(a => a.tipe === 'foto');

  return (
    <div className={`bg-white dark:bg-slate-800/60 border ${isEditMode ? 'border-blue-400/60 dark:border-blue-500/50 ring-2 ring-blue-500/10' : 'border-slate-200 dark:border-slate-700/60 shadow-sm'} rounded-2xl overflow-hidden flex flex-col transition-all relative backdrop-blur-sm h-full`}>
      <div className="px-4 md:px-5 py-4 bg-slate-50 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-700/60 flex items-center justify-between shrink-0">
        <h3 className="text-xs font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider flex items-center gap-2">
          <ImageIcon className="w-4 h-4" /> Dokumentasi (Foto)
        </h3>
        {isEditMode && (
          <>
            <input type="file" id="fotoUploadAdd" className="hidden" multiple accept="image/*" onChange={(e) => handleUploadFile(e, 'foto')} />
            <button type="button" onClick={() => document.getElementById('fotoUploadAdd').click()} className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold rounded-lg border border-amber-200 dark:border-amber-500/30 transition-all shadow-sm">
              <UploadCloud className="w-3.5 h-3.5" /> Upload Foto
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
            {fotoDokumentasi.length === 0 ? (
               <tr>
                 <td colSpan="2" className="py-8 text-center text-slate-500 italic">
                   <div className="flex flex-col items-center justify-center">
                     <ImageIcon className="w-6 h-6 text-slate-300 dark:text-slate-600 mb-1" />
                     Belum ada foto terlampir.
                   </div>
                 </td>
               </tr>
            ) : (
              fotoDokumentasi.map((foto, idx) => (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors group">
                  <td className="py-2.5">
                    <div className="min-w-0 pr-2">
                      <p className="font-bold text-slate-800 dark:text-white truncate" title={foto.nama_file}>{foto.nama_file}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{foto.ukuran || 'Telah Diunggah'}</p>
                    </div>
                  </td>
                  <td className="py-2.5 text-right">
                    <div className="flex justify-end gap-1.5">
                      {!isEditMode && (
                        <button type="button" onClick={() => window.open(getDocUrl(foto.path_file), '_blank')} title="Lihat Foto" className="p-1.5 text-amber-500 hover:bg-amber-500 hover:text-white dark:hover:bg-amber-900/50 rounded-md transition-colors shadow-sm border border-slate-200 dark:border-slate-700/50">
                          <ExternalLink className="w-3.5 h-3.5"/>
                        </button>
                      )}
                      {isEditMode && (
                        <button type="button" onClick={() => handleDeleteFile(foto.id)} title="Hapus Foto" className="p-1.5 text-rose-500 hover:bg-rose-500 hover:text-white dark:hover:bg-rose-900/50 rounded-md transition-colors shadow-sm border border-slate-200 dark:border-slate-700/50">
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
  );
}

export function DokumenCard({ isEditMode, reportData, handleUploadFile, handleDeleteFile, getDocUrl }) {
  const lampiranFiles = (reportData.attachments || []).filter(a => a.tipe === 'dokumen');

  return (
    <div className={`bg-white dark:bg-slate-800/60 border ${isEditMode ? 'border-blue-400/60 dark:border-blue-500/50 ring-2 ring-blue-500/10' : 'border-slate-200 dark:border-slate-700/60 shadow-sm'} rounded-2xl overflow-hidden flex flex-col transition-all relative backdrop-blur-sm h-full`}>
      <div className="px-4 md:px-5 py-4 bg-slate-50 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-700/60 flex items-center justify-between shrink-0">
        <h3 className="text-xs font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-wider flex items-center gap-2">
          <Paperclip className="w-4 h-4" /> Dokumen Lampiran
        </h3>
        {isEditMode && (
          <>
            <input type="file" id="docUploadAdd" className="hidden" multiple accept=".pdf,.doc,.docx,.xls,.xlsx" onChange={(e) => handleUploadFile(e, 'dokumen')} />
            <button type="button" onClick={() => document.getElementById('docUploadAdd').click()} className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold rounded-lg border border-emerald-200 dark:border-emerald-500/30 transition-all shadow-sm">
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
            {lampiranFiles.length === 0 ? (
               <tr>
                 <td colSpan="2" className="py-8 text-center text-slate-500 italic">
                   <div className="flex flex-col items-center justify-center">
                     <FileText className="w-6 h-6 text-slate-300 dark:text-slate-600 mb-1" />
                     Belum ada berkas terlampir.
                   </div>
                 </td>
               </tr>
            ) : (
              lampiranFiles.map((file, idx) => (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors group">
                  <td className="py-2.5">
                    <div className="min-w-0 pr-2">
                      <p className="font-bold text-slate-800 dark:text-white truncate" title={file.nama_file}>{file.nama_file}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{file.ukuran || 'Telah Diunggah'}</p>
                    </div>
                  </td>
                  <td className="py-2.5 text-right">
                    <div className="flex justify-end gap-1.5">
                      {!isEditMode && (
                        <button type="button" onClick={() => window.open(getDocUrl(file.path_file), '_blank')} title="Download / Buka File" className="p-1.5 text-amber-500 hover:bg-amber-500 hover:text-white dark:hover:bg-amber-900/50 rounded-md transition-colors shadow-sm border border-slate-200 dark:border-slate-700/50">
                          <Download className="w-3.5 h-3.5"/>
                        </button>
                      )}
                      {isEditMode && (
                        <button type="button" onClick={() => handleDeleteFile(file.id)} title="Hapus File" className="p-1.5 text-rose-500 hover:bg-rose-500 hover:text-white dark:hover:bg-rose-900/50 rounded-md transition-colors shadow-sm border border-slate-200 dark:border-slate-700/50">
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
  );
}