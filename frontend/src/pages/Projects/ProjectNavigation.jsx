import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Info, FileSpreadsheet, TrendingUp, Compass, Image as ImageIcon } from 'lucide-react';

export default function ProjectNavigation({ projectId, project, activeTab }) {
  const navigate = useNavigate();
  
  // Deteksi role pengguna otomatis dari localStorage
  const [userRole, setUserRole] = useState('Tamu');
  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem('user_data'));
      if (user) setUserRole(user.role || 'Tamu');
    } catch {}
  }, []);

  const isGuest = userRole === 'Tamu';

  // Konfigurasi daftar tab menu
  const tabs = [
    { id: 'data', label: 'Data', icon: Info, path: `/projects/${projectId}/data`, hideForGuest: false },
    { id: 'rab', label: 'RAB', icon: FileSpreadsheet, path: `/projects/${projectId}/rab`, hideForGuest: true },
    { id: 'kurva', label: 'Kurva Schedule', icon: TrendingUp, path: `/projects/${projectId}/kurva-s`, hideForGuest: true },
    { id: 'gis', label: 'Peta GIS', icon: Compass, path: `/projects/${projectId}/peta-gis`, hideForGuest: false },
    { id: 'gallery', label: 'Gallery', icon: ImageIcon, path: `/projects/${projectId}/gallery`, hideForGuest: false },
  ];

  return (
    <div className="flex items-center justify-between sm:justify-start gap-1 bg-white dark:bg-slate-800/80 px-1.5 h-10 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-x-auto custom-scrollbar z-0 shrink-0">
      {tabs.map((tab) => {
        // Sembunyikan tab rahasia (RAB & Kurva) jika user adalah Guest
        if (isGuest && tab.hideForGuest) return null;

        const isActive = activeTab === tab.id;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            onClick={() => !isActive && navigate(tab.path, { state: project })}
            className={`flex items-center justify-center gap-1.5 h-7 px-2 sm:px-2.5 text-[10px] sm:text-[11px] rounded-lg whitespace-nowrap shrink-0 transition-all ${
              isActive
                ? 'bg-amber-500 text-white dark:text-slate-950 font-bold shadow-sm cursor-default'
                : 'bg-transparent hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-medium'
            }`}
          >
            <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? '' : 'text-amber-500'}`} />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}