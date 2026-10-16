import React from 'react';
import { Sun, Plus, Trash2, ChevronDown } from 'lucide-react';

export default function CuacaLapangan({ isEditMode, reportData, editForm, setEditForm }) {
  return (
    <div className={`bg-white dark:bg-slate-800/60 border ${isEditMode ? 'border-blue-400/60 dark:border-blue-500/50 ring-2 ring-blue-500/10' : 'border-slate-200 dark:border-slate-700/60 shadow-sm'} rounded-2xl overflow-hidden flex flex-col transition-all relative backdrop-blur-sm h-full`}>
      <div className="px-4 md:px-5 py-4 bg-slate-50 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-700/60 flex items-center justify-between shrink-0">
        <h3 className="text-xs font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider flex items-center gap-2">
          <Sun className="w-4 h-4"/> Cuaca Lapangan
        </h3>
        {isEditMode && (
          <button 
            type="button" 
            onClick={() => {
              if (editForm.cuacaItems.length < 4) {
                setEditForm({ ...editForm, cuacaItems: [...editForm.cuacaItems, { id: Date.now(), kondisi: 'Cerah', keterangan: '' }] });
              } else {
                alert("Maksimal 4 entri cuaca per hari.");
              }
            }} 
            className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold rounded-lg border border-amber-200 dark:border-amber-500/30 transition-all shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" /> Tambah
          </button>
        )}
      </div>
      
      <div className="p-4 overflow-x-auto flex-1 max-h-[300px] overflow-y-auto custom-scrollbar flex flex-col">
         {isEditMode ? (
           <div className="space-y-3">
             {editForm.cuacaItems.map((item, index) => (
               <div key={item.id} className="flex flex-col bg-slate-50 dark:bg-slate-900/40 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/60 items-start transition-all shadow-sm gap-3 relative group">
                 <div className="w-full flex justify-between items-center mb-1">
                   <span className="text-[11px] font-bold text-amber-600 dark:text-amber-500 uppercase flex items-center gap-1.5">
                     <div className="w-1.5 h-4 bg-amber-500 rounded-full"></div> Sesi Cuaca {index + 1}
                   </span>
                   {editForm.cuacaItems.length > 1 && (
                     <button type="button" onClick={() => { const newC = editForm.cuacaItems.filter(c => c.id !== item.id); setEditForm({ ...editForm, cuacaItems: newC }); }} className="p-1.5 text-rose-500 dark:text-rose-400 hover:text-white hover:bg-rose-500 bg-white dark:bg-slate-800 rounded-md transition-colors shadow-sm border border-slate-200 dark:border-slate-700"><Trash2 className="w-3.5 h-3.5" /></button>
                   )}
                 </div>
                 
                 <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-3">
                   <div className="space-y-1.5">
                     <label className="text-[10px] text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">Kondisi <span className="text-rose-500">*</span></label>
                     <div className="relative">
                       <select value={item.kondisi} onChange={(e) => { const newC = [...editForm.cuacaItems]; newC[index].kondisi = e.target.value; setEditForm({ ...editForm, cuacaItems: newC }); }} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 appearance-none cursor-pointer shadow-inner transition-all">
                         <option value="Cerah">Cerah</option><option value="Berawan">Berawan</option><option value="Hujan Gerimis">Hujan Gerimis</option><option value="Hujan Lebat">Hujan Lebat</option>
                       </select>
                       <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                     </div>
                   </div>
                   
                   <div className="sm:col-span-2 space-y-1.5">
                     <label className="text-[10px] text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">Durasi / Keterangan</label>
                     <input type="text" value={item.keterangan} onChange={(e) => { const newC = [...editForm.cuacaItems]; newC[index].keterangan = e.target.value; setEditForm({ ...editForm, cuacaItems: newC }); }} placeholder="Contoh: 08:00 - 12:00..." className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-3.5 py-2 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors shadow-inner" />
                   </div>
                 </div>
               </div>
             ))}
           </div>
         ) : (
             <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700/50 text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed flex-1 shadow-sm font-medium">
                 {reportData.cuaca || 'Tidak ada catatan cuaca harian.'}
             </div>
         )}
      </div>
    </div>
  );
}