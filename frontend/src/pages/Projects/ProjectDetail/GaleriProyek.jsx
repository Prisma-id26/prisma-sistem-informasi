import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import api from '../../../api'; 
import { 
  Info, FileSpreadsheet, TrendingUp, Compass, Image as ImageIcon,
  Loader2, AlertTriangle, Calendar, User, X, ZoomIn, Download, Camera, Filter
} from 'lucide-react';

// CACHE MEMORI: Simpan data galeri per ID Proyek
let cachedGalleryDetails = {};

export default function GaleriProyek() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  useEffect(() => {
    document.title = "Prisma Group - Galeri Proyek";
  }, []);

  // Ambil Data dari Cache jika tersedia
  const getInitialCache = () => {
    if (cachedGalleryDetails[id]) return cachedGalleryDetails[id];
    return null;
  };
  const initialCache = getInitialCache();

  const [project, setProject] = useState(initialCache?.project || location.state || { id: id, nama_proyek: 'Memuat Data...' });
  const projectId = project?.id || id;

  const [photos, setPhotos] = useState(initialCache?.photos || []);
  const [availableWeeks, setAvailableWeeks] = useState(initialCache?.availableWeeks || []);
  
  const hasCachedFullData = Boolean(initialCache);
  const [isLoading, setIsLoading] = useState(!hasCachedFullData);
  const [errorMsg, setErrorMsg] = useState('');
  
  // State untuk Filter Pop-up (Mode Tag Ungu)
  const [selectedWeek, setSelectedWeek] = useState('Semua');
  const [showFilterPopup, setShowFilterPopup] = useState(false);
  const filterRef = useRef(null);

  // State untuk Modal Preview (Lightbox)
  const [previewPhoto, setPreviewPhoto] = useState(null);

  const BASE_URL = api.defaults.baseURL ? api.defaults.baseURL.replace(/\/api\/?$/, '') : '';
  const getImageUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path; 
    return `${BASE_URL}/${path.replace(/^\//, '')}`; 
  };

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

  const formatIndoDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  const fetchData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      let currentProject = project;
      // 1. Fetch data proyek (Jika belum ada)
      if (!project.tanggal_mulai) {
        const projRes = await api.get(`/projects/${projectId}`);
        currentProject = projRes.data?.data || projRes.data;
        setProject(currentProject);
      }

      // 2. Fetch Galeri
      const galRes = await api.get(`/projects/${projectId}/gallery`);
      const dataFoto = galRes.data?.data || [];
      setPhotos(dataFoto);

      // Ekstrak minggu yang tersedia untuk filter
      const weeks = [...new Set(dataFoto.map(p => p.minggu_ke))].sort((a, b) => a - b);
      setAvailableWeeks(weeks);

      // 3. Simpan ke Cache Memory
      cachedGalleryDetails[projectId] = { 
        project: currentProject, 
        photos: dataFoto, 
        availableWeeks: weeks 
      };

    } catch (error) {
      console.error(error);
      if (!silent) setErrorMsg('Gagal memuat galeri proyek.');
    } finally {
      setIsLoading(false);
    }
  };

  // Tutup popup jika user klik area luar popup filter
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setShowFilterPopup(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Jalankan fetchData: Silent update jika data sudah ada di cache
  useEffect(() => {
    fetchData(hasCachedFullData);
  }, [projectId]);

  // Data foto yang sudah di-filter
  const filteredPhotos = selectedWeek === 'Semua' 
    ? photos 
    : photos.filter(p => parseInt(p.minggu_ke) === parseInt(selectedWeek));

  // Role Access (Untuk navigasi Tab)
  const [userRole, setUserRole] = useState('Tamu');
  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem('user_data'));
      if (user) setUserRole(user.role || 'Tamu');
    } catch {}
  }, []);
  const isGuest = userRole === 'Tamu';

  return (
    <div className="w-full space-y-3.5 pb-2 relative animate-fade-in flex flex-col">
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { height: 5px; width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 10px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #475569; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #f59e0b; cursor: pointer;}
      `}</style>

      {/* ============================================================== */}
      {/* HEADER UTAMA & DUA BOKS KONTROL (KONSISTEN DENGAN UI LAINNYA)  */}
      {/* ============================================================== */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 shrink-0 mb-2">
        
        {/* INFORMASI & JUDUL PROYEK */}
        <div className="flex items-start lg:items-center gap-3 shrink-0">
          <div className="flex-1 min-w-0">
            <h1 className="text-sm lg:text-base font-bold text-slate-800 dark:text-white leading-snug flex items-center gap-1.5 flex-wrap">
              <span>Dokumentasi & Galeri Proyek</span>
            </h1>
            <div className="flex items-center flex-wrap gap-1 mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
              <span className="truncate font-medium">{project?.nama_proyek || 'Memuat Data...'}</span>
              <span className="text-slate-400">•</span>
              <span className="truncate">
                SPK: {project?.kode_kontrak || project?.nomor_kontrak_kontraktor || '-'}
              </span>
              <span className="text-slate-400">•</span>
              <span className={`px-1.5 py-0.2 rounded border text-[9px] font-extrabold uppercase tracking-wider shadow-sm truncate ${getCategoryStyle(project?.kategori)}`}>
                {project?.kategori || 'Belum Ditentukan'}
              </span>
            </div>
          </div>
        </div>

        {/* CONTAINER KONTROL: BERTUMPUK DI MOBILE & TABLET, SEJAJAR DI DESKTOP */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
          
          {/* BOKS KIRI: KONTROL FILTER DENGAN POPUP TAG UNGU */}
          <div className="flex items-center justify-between sm:justify-start gap-1 bg-white dark:bg-slate-800/80 px-1.5 h-10 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-visible z-30 transition-all shrink-0">
            <div className="relative" ref={filterRef}>
              <button 
                disabled={isLoading || availableWeeks.length === 0} 
                onClick={() => setShowFilterPopup(!showFilterPopup)} 
                className={`flex items-center justify-center gap-1.5 px-2 sm:px-2.5 h-7 rounded-lg text-[10px] sm:text-[11px] font-bold border transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  showFilterPopup || selectedWeek !== 'Semua' 
                  ? 'bg-purple-50 dark:bg-purple-500/10 border-purple-300 dark:border-purple-500/30 text-purple-600 dark:text-purple-400' 
                  : 'bg-transparent border-transparent text-slate-600 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-purple-500/10 hover:text-purple-600 dark:hover:text-purple-400'
                }`}
              >
                <Filter className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400 shrink-0" /> 
                <span>Filter</span>
              </button>
              
              {/* POPUP TAG SELEKSI MINGGU */}
              {showFilterPopup && (
                <div className="absolute left-0 sm:right-0 sm:left-auto top-full mt-2 w-64 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-4 z-50 animate-fade-in">
                  <h4 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Filter Berdasarkan Waktu</h4>
                  <div className="flex flex-wrap gap-2">
                    <button 
                      onClick={() => { setSelectedWeek('Semua'); setShowFilterPopup(false); }} 
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                        selectedWeek === 'Semua' 
                        ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-500/50 shadow-sm' 
                        : 'bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-purple-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      Semua Waktu
                    </button>
                    {availableWeeks.map(w => (
                      <button 
                        key={w} 
                        onClick={() => { setSelectedWeek(w); setShowFilterPopup(false); }} 
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                          selectedWeek === w 
                          ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-500/50 shadow-sm' 
                          : 'bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-purple-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        Minggu M-{w}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* BOKS KANAN: NAVIGASI TAB MENU (TAB GALLERY AKTIF) */}
          <div className="flex items-center justify-between sm:justify-start gap-1 bg-white dark:bg-slate-800/80 px-1.5 h-10 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-x-auto custom-scrollbar z-0 shrink-0">
            <button 
              onClick={() => navigate(`/projects/${projectId}/data`, { state: project })} 
              className="flex items-center justify-center gap-1.5 h-7 px-2 sm:px-2.5 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-[10px] sm:text-[11px] font-medium rounded-lg whitespace-nowrap shrink-0"
            >
              <Info className="w-3.5 h-3.5 text-amber-500 shrink-0" /> 
              <span className="hidden sm:inline">Data</span>
            </button>

            {!isGuest && (
              <>
                <button 
                  onClick={() => navigate(`/projects/${projectId}/rab`, { state: project })} 
                  className="flex items-center justify-center gap-1.5 h-7 px-2 sm:px-2.5 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-[10px] sm:text-[11px] font-medium rounded-lg whitespace-nowrap shrink-0"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-amber-500 shrink-0" /> 
                  <span className="hidden sm:inline">RAB</span>
                </button>

                <button 
                  onClick={() => navigate(`/projects/${projectId}/kurva-s`, { state: project })} 
                  className="flex items-center justify-center gap-1.5 h-7 px-2 sm:px-2.5 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-[10px] sm:text-[11px] font-medium rounded-lg whitespace-nowrap shrink-0"
                >
                  <TrendingUp className="w-3.5 h-3.5 text-amber-500 shrink-0" /> 
                  <span className="hidden sm:inline">Kurva Schedule</span>
                </button>
              </>
            )}

            <button 
              onClick={() => navigate(`/projects/${projectId}/peta-gis`, { state: project })} 
              className="flex items-center justify-center gap-1.5 h-7 px-2 sm:px-2.5 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-[10px] sm:text-[11px] font-medium rounded-lg whitespace-nowrap shrink-0"
            >
              <Compass className="w-3.5 h-3.5 text-amber-500 shrink-0" /> 
              <span className="hidden sm:inline">Peta GIS</span>
            </button>

            {/* TAB GALLERY - AKTIF (WARNA AMBER) */}
            <button 
              className="flex items-center justify-center gap-1.5 h-7 px-2.5 bg-amber-500 text-white dark:text-slate-950 text-[10px] sm:text-[11px] font-bold rounded-lg shadow-sm whitespace-nowrap shrink-0 cursor-default"
            >
              <ImageIcon className="w-3.5 h-3.5 shrink-0" /> 
              <span className="hidden sm:inline">Gallery</span>
            </button>
          </div>

        </div>
      </div>

      {/* BADGE FILTER AKTIF JIKA TIDAK SEMUA MINGGU */}
      {selectedWeek !== 'Semua' && (
        <div className="flex flex-wrap gap-2 animate-fade-in -mt-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[10px] font-bold rounded-lg border border-purple-200 dark:border-purple-500/20 shadow-sm">
            Menampilkan Gambar : {selectedWeek}
            <button onClick={() => setSelectedWeek('Semua')} className="hover:bg-purple-200 dark:hover:bg-purple-500/30 p-0.5 rounded-full transition-colors ml-1">
              <X className="w-3 h-3"/>
            </button>
          </span>
        </div>
      )}

      {/* ============================================================== */}
      {/* KONTEN UTAMA: GALERI GRID                                      */}
      {/* ============================================================== */}
      {isLoading && !hasCachedFullData ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh] w-full bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl shadow-sm animate-fade-in">
          <Loader2 className="w-10 h-10 text-amber-500 animate-spin mb-4" />
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Mengambil foto dokumentasi...
          </p>
        </div>
      ) : errorMsg ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh] w-full bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl shadow-sm text-center animate-fade-in">
          <AlertTriangle className="w-12 h-12 text-rose-500 mb-4" />
          <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Terjadi Kesalahan</h2>
          <p className="text-xs text-slate-500">{errorMsg}</p>
        </div>
      ) : filteredPhotos.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh] w-full bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl shadow-sm text-center animate-fade-in p-6">
          <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mb-4 border-2 border-dashed border-slate-200 dark:border-slate-700">
            <Camera className="w-8 h-8 text-slate-300 dark:text-slate-600" />
          </div>
          <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
            {selectedWeek !== 'Semua' ? `Tidak Ada Foto di Minggu Ke-${selectedWeek}` : 'Belum Ada Foto Dokumentasi'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
            {selectedWeek !== 'Semua' 
              ? 'Silakan pilih rentang minggu yang lain.' 
              : 'Foto yang diunggah melalui Laporan Harian pengawas akan otomatis muncul di galeri ini.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4 animate-fade-in">
          {filteredPhotos.map((photo) => (
            <div 
              key={photo.id} 
              className="bg-white dark:bg-slate-800/80 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700/60 shadow-sm hover:shadow-md hover:border-amber-300 dark:hover:border-amber-500/50 transition-all group flex flex-col"
            >
              {/* Image Container with Overlay */}
              <div 
                className="relative aspect-square w-full overflow-hidden cursor-pointer bg-slate-100 dark:bg-slate-900"
                onClick={() => setPreviewPhoto(photo)}
              >
                <img 
                  src={getImageUrl(photo.path_file)} 
                  alt={photo.nama_file}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  onError={(e) => {
                    e.target.onerror = null; 
                    e.target.src = 'https://placehold.co/400x400/1e293b/475569?text=Image+Not+Found';
                  }}
                />
                
                {/* Overlay Hitam Transparan saat Hover */}
                <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/40 transition-colors flex flex-col items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="bg-amber-500 text-white p-2 rounded-full shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform">
                    <ZoomIn className="w-5 h-5" />
                  </div>
                </div>

                {/* Badge Status & Minggu */}
                <div className="absolute top-2 left-2 flex gap-1">
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-slate-900/70 text-white backdrop-blur-sm shadow-sm uppercase">
                    M-{photo.minggu_ke}
                  </span>
                  {photo.laporan_status === 'approved' && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-emerald-500/90 text-white backdrop-blur-sm shadow-sm uppercase">
                      Verified
                    </span>
                  )}
                </div>
              </div>

              {/* Card Metadata Footer */}
              <div className="p-3 flex flex-col justify-between flex-1">
                <p className="text-[10px] font-bold text-slate-800 dark:text-white truncate mb-2" title={photo.nama_file}>
                  {photo.nama_file}
                </p>
                <div className="space-y-1">
                  <p className="text-[9px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    {formatIndoDate(photo.tanggal)}
                  </p>
                  <p className="text-[9px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 truncate" title={photo.pengawas}>
                    <User className="w-3 h-3 text-slate-400" />
                    {photo.pengawas}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL LIGHTBOX PRATINJAU GAMBAR PENUH                          */}
      {/* ============================================================== */}
      {previewPhoto && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setPreviewPhoto(null)}>
          
          <button 
            className="absolute top-4 right-4 md:top-6 md:right-6 p-2 bg-slate-800 hover:bg-rose-500 text-white rounded-full transition-colors z-[110]"
            onClick={() => setPreviewPhoto(null)}
          >
            <X className="w-5 h-5" />
          </button>

          <div 
            className="w-full max-w-4xl max-h-screen flex flex-col items-center justify-center relative overflow-hidden"
            onClick={(e) => e.stopPropagation()} // Mencegah klik di dalam kotak menutup modal
          >
            <img 
              src={getImageUrl(previewPhoto.path_file)} 
              alt={previewPhoto.nama_file}
              className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
            />
            
            <div className="mt-4 bg-slate-900/80 border border-slate-700/50 backdrop-blur-md px-6 py-3 rounded-2xl text-center w-full sm:w-auto max-w-full">
              <h3 className="text-white text-sm font-bold truncate mb-1">{previewPhoto.nama_file}</h3>
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-slate-300">
                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-amber-500" /> {formatIndoDate(previewPhoto.tanggal)}</span>
                <span className="text-slate-600">•</span>
                <span className="flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5 text-blue-400" /> Minggu Ke-{previewPhoto.minggu_ke}</span>
                <span className="text-slate-600">•</span>
                <span className="flex items-center gap-1"><User className="w-3.5 h-3.5 text-emerald-400" /> {previewPhoto.pengawas}</span>
              </div>
              
              <div className="mt-3 flex justify-center">
                <a 
                  href={getImageUrl(previewPhoto.path_file)} 
                  download 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-bold rounded-lg transition-colors border border-slate-600"
                >
                  <Download className="w-3.5 h-3.5" /> Unduh Gambar Asli
                </a>
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}