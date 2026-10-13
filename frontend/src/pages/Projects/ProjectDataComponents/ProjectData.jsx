import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import api from '../../../api.js'; 
import { Download, FileSpreadsheet, Edit3, CheckCircle2, AlertTriangle, Trash2, Loader2, X, Camera, Users } from 'lucide-react';

import ProjectNavigation from '../ProjectNavigation';
import ProgressSnapshot from './ProgressSnapshot';
import ContractAdminData from './ContactAdminData.jsx';
import StakeholdersPersonnel from './StakeholdersPersonnel';
import DocumentsDescription from './DocumentsDescription';

let cachedProjectDetails = {};

export default function ProjectData() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  useEffect(() => {
    document.title = "Prisma Group - Data Utama";
  }, []);

  const getInitialProject = () => {
    if (cachedProjectDetails[id]) return cachedProjectDetails[id];
    try {
      const saved = sessionStorage.getItem(`cached_project_detail_${id}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    if (location.state && location.state.tanggal_mulai) return location.state;
    return location.state || { id: id, nama_proyek: 'Memuat Data...' };
  };

  const initialProject = getInitialProject();
  const [project, setProject] = useState(initialProject);
  const projectId = project?.id || id;

  const hasCachedFullData = Boolean(project && project.tanggal_mulai);
  const [isLoading, setIsLoading] = useState(!hasCachedFullData);
  const [errorMsg, setErrorMsg] = useState('');

  const [progressData, setProgressData] = useState({ 
    plan: parseFloat(initialProject?.progress_plan) || 0, 
    actual: parseFloat(initialProject?.progress_actual) || 0, 
    deviasi: parseFloat(initialProject?.deviasi) || 0 
  });

  const [isEditMode, setIsEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState(initialProject || {});
  const [isSavingMain, setIsSavingMain] = useState(false);

  const [fotoSampul, setFotoSampul] = useState(null);
  const [newFotoPreview, setNewFotoPreview] = useState(null);
  const [removeFoto, setRemoveFoto] = useState(false); 

  const [showPersonnelModal, setShowPersonnelModal] = useState(false);
  const [newDocuments, setNewDocuments] = useState([]); 
  const [personnelForm, setPersonnelForm] = useState({ id: null, nama: '', peran: '' });

  const [deleteConfig, setDeleteConfig] = useState({ show: false, type: '', id: null, name: '' });

  const [userRole, setUserRole] = useState('Tamu');

  useEffect(() => {
    const userDataStr = localStorage.getItem('user_data');
    if (userDataStr) {
      try { setUserRole(JSON.parse(userDataStr).role || 'Tamu'); } catch {}
    }
  }, []);

  const canCreateData = ['Administrator', 'Team Leader', 'Pengawas Lapangan'].includes(userRole);
  const canEditData = canCreateData;
  const canViewFinance = ['Administrator', 'Direktur', 'Team Leader', 'Owner / PPK'].includes(userRole);
  const canExportData = ['Administrator', 'Direktur'].includes(userRole);
  const isGuest = userRole === 'Tamu';

  const fetchProjectDetail = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const projRes = await api.get(`/projects/${id}`);
      const data = projRes.data?.data || projRes.data;
      
      setProject(data);
      
      setEditFormData(prev => ({
        ...prev,
        personnels: data.personnels || [],
        documents: data.documents || []
      }));
      
      if(!isEditMode) {
         setEditFormData(data);
      }

      cachedProjectDetails[id] = data;
      try { sessionStorage.setItem(`cached_project_detail_${id}`, JSON.stringify(data)); } catch {}

      setProgressData({ 
        plan: parseFloat(data.progress_plan) || 0, 
        actual: parseFloat(data.progress_actual) || 0, 
        deviasi: parseFloat(data.deviasi) || 0 
      });
    } catch (error) {
      if (!silent) setErrorMsg('Gagal memuat data proyek.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { 
    const hasData = hasCachedFullData || Boolean(cachedProjectDetails[id]);
    fetchProjectDetail(hasData); 
  }, [id]);

  const BASE_URL = api.defaults.baseURL ? api.defaults.baseURL.replace(/\/api\/?$/, '') : '';

  const getImageUrl = (filename) => {
    if (!filename) return null;
    if (filename.startsWith('http')) return filename; 
    return `${BASE_URL}/storage/foto_proyek/${filename}`; 
  };

  const getDocUrl = (path) => {
    if (!path) return '#';
    if (path.startsWith('http')) return path;
    return `${BASE_URL}/${path.replace(/^\//, '')}`;
  };

  const handleMainChange = (e) => setEditFormData({ ...editFormData, [e.target.name]: e.target.value });

  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFotoSampul(file);
      setNewFotoPreview(URL.createObjectURL(file));
      setRemoveFoto(false);
    }
  };

  const getCategoryStyle = (kat) => {
    switch (kat) {
      case 'Infrastruktur Jalan & Jembatan': return 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600';
      case 'Gedung & Bangunan Sipil': return 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/50';
      case 'Sumber Daya Air & Irigasi': return 'bg-cyan-50 text-cyan-600 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-400 dark:border-cyan-800/50';
      case 'Tata Lingkungan & Sanitasi': return 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50';
      case 'Preservasi Jalan': return 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/50';
      case '':
      case null:
      case undefined: return 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800/50';
      default: return 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900/30 dark:text-slate-400 dark:border-slate-800/50';
    }
  };

  const toggleEditMode = async () => {
    if (isEditMode) {
      setIsSavingMain(true);
      try {
        const payloadData = { ...editFormData };
        const personnelsArray = editFormData.personnels || [];
        
        // Buang data array/objek yang tidak dikenali backend utama
        delete payloadData.documents; 
        delete payloadData.created_at; 
        delete payloadData.updated_at; 
        delete payloadData.foto_sampul; 
        delete payloadData.personnels; 

        // 1. SIMPAN DATA MASTER PROYEK (Kontrak, Uraian, dsb)
        const formDataToSend = new FormData();
        Object.keys(payloadData).forEach(key => formDataToSend.append(key, payloadData[key] === null ? '' : payloadData[key]));
        
        if (fotoSampul) formDataToSend.append('foto_sampul', fotoSampul);
        if (removeFoto) formDataToSend.append('remove_foto', 'true');
        
        formDataToSend.append('_method', 'PUT'); 
        await api.post(`/projects/${id}`, formDataToSend, { headers: { 'Content-Type': 'multipart/form-data' }}); 

        // 2. SIMPAN DRAF PERSONEL KE ENDPOINT KHUSUS PERSONEL
        const drafPersonnels = personnelsArray.filter(p => p.temp_id);
        for (const person of drafPersonnels) {
            await api.post(`/projects/${id}/personnels`, { nama: person.nama, peran: person.peran });
        }

        // 3. SIMPAN DRAF DOKUMEN KE ENDPOINT KHUSUS DOKUMEN
        if (newDocuments.length > 0) {
            const docFormData = new FormData();
            newDocuments.forEach(file => docFormData.append('dokumen_lampiran[]', file));
            await api.post(`/projects/${id}/documents`, docFormData, { headers: { 'Content-Type': 'multipart/form-data' }});
        }

        delete cachedProjectDetails[id];
        try { 
          sessionStorage.removeItem(`cached_project_detail_${id}`);
          sessionStorage.removeItem('cached_projects_list');
        } catch {}

        await fetchProjectDetail(false); 
        setIsEditMode(false); 
        setFotoSampul(null); 
        setNewFotoPreview(null); 
        setRemoveFoto(false);
        setNewDocuments([]); 
      } catch (error) { 
        alert("Gagal menyimpan perubahan. Periksa kembali jaringan Anda."); 
      } finally { 
        setIsSavingMain(false); 
      }
    } else { 
      setEditFormData(project); 
      setIsEditMode(true); 
    }
  };

  const cancelEditMode = () => { 
    setEditFormData(project); 
    setIsEditMode(false); 
    setFotoSampul(null); 
    setNewFotoPreview(null); 
    setRemoveFoto(false); 
    setNewDocuments([]); 
  };

  const openPersonnelModal = (person = null) => {
    if (person) setPersonnelForm({ id: person.id || person.temp_id, nama: person.nama, peran: person.peran });
    else setPersonnelForm({ id: null, nama: '', peran: '' });
    setShowPersonnelModal(true);
  };

  const handleSavePersonnel = (e) => {
    e.preventDefault();
    setEditFormData(prev => {
      const existingPersonnels = prev.personnels || [];
      if (personnelForm.id) {
        return {
          ...prev,
          personnels: existingPersonnels.map(p => 
            (p.id === personnelForm.id || p.temp_id === personnelForm.id) 
            ? { ...p, nama: personnelForm.nama, peran: personnelForm.peran } : p
          )
        };
      } 
      return {
        ...prev,
        personnels: [...existingPersonnels, { temp_id: Date.now(), nama: personnelForm.nama, peran: personnelForm.peran }]
      };
    });
    setShowPersonnelModal(false); 
  };

  const handleUploadDocument = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    setNewDocuments(prev => [...prev, ...files]);
    
    const fakeDocs = files.map(f => ({
      temp_id: Date.now() + Math.random(),
      nama_file: f.name,
      ukuran: 'Akan diupload',
      is_draft: true
    }));

    setEditFormData(prev => ({
      ...prev,
      documents: [...(prev.documents || []), ...fakeDocs]
    }));

    e.target.value = null;
  };

  const handleDeletePersonnel = async (personId) => {
    setEditFormData(prev => ({
      ...prev,
      personnels: (prev.personnels || []).filter(p => (p.id || p.temp_id) !== personId)
    }));

    if (String(personId).length <= 10) {
      try {
        await api.delete(`/personnels/${personId}`);
        setProject(prev => ({
          ...prev,
          personnels: (prev.personnels || []).filter(p => p.id !== personId)
        }));
      } catch (error) {
        console.error("Gagal menghapus personel dari server:", error);
      }
    }
  };

  const handleDeleteDocument = async (docId, docName) => {
    setEditFormData(prev => ({
      ...prev,
      documents: (prev.documents || []).filter(d => (d.id || d.temp_id) !== docId)
    }));

    if (String(docId).length > 10) {
      setNewDocuments(prev => prev.filter(f => f.name !== docName));
      return;
    }

    try {
      await api.delete(`/documents/${docId}`);
      setProject(prev => ({
        ...prev,
        documents: (prev.documents || []).filter(d => d.id !== docId)
      }));
    } catch (error) {
      console.error("Gagal menghapus dokumen dari server:", error);
    }
  };

  const executeDeleteProject = async () => {
    try {
      await api.delete(`/projects/${deleteConfig.id}`); 
      delete cachedProjectDetails[id];
      try { 
        sessionStorage.removeItem(`cached_project_detail_${id}`);
        sessionStorage.removeItem('cached_projects_list');
      } catch {}
      alert("Proyek dihapus."); 
      navigate('/projects'); 
    } catch (error) { 
      alert("Gagal menghapus data proyek."); 
    }
  };

  const handleExportExcel = async () => {
    try {
      const response = await api.get(`/projects/${projectId}/export/excel`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a'); link.href = url;
      link.setAttribute('download', `Data_Proyek_${project.nama_proyek.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`); 
      document.body.appendChild(link); link.click(); link.remove();
    } catch (error) { alert("Gagal export Excel."); }
  };

  const handleExportPDF = async () => {
    try {
      const response = await api.get(`/projects/${projectId}/export/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a'); link.href = url;
      link.setAttribute('download', `Executive_Summary_${project.nama_proyek.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
      document.body.appendChild(link); link.click(); link.remove();
    } catch (error) { alert("Gagal export PDF."); }
  };

  const progressPlan = progressData.plan.toFixed(2); 
  const progressReal = progressData.actual.toFixed(2);
  const rawDeviasi = progressData.deviasi;
  const deviasi = rawDeviasi > 0 ? `+${rawDeviasi.toFixed(2)}` : rawDeviasi.toFixed(2);
  
  const calculatedStatus = project?.status || 'Persiapan';
  const displayStatus = (isGuest && (calculatedStatus === 'Kritis' || calculatedStatus === 'Terlambat')) ? 'Berjalan' : calculatedStatus;
  const isActuallyDelayed = calculatedStatus === 'Kritis' || calculatedStatus === 'Terlambat';

  return (
    <div className="w-full space-y-3.5 pb-2 relative">
      <style>{`.custom-scrollbar::-webkit-scrollbar { height: 5px; width: 5px; } .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 10px; } .dark .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #475569; } .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #f59e0b; cursor: pointer;}`}</style>

      {/* HEADER UTAMA & DUA BOKS KONTROL */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 shrink-0 mb-2">
        <div className="flex items-start lg:items-center gap-3 shrink-0">
          <div className="relative group shrink-0 mt-0.5 lg:mt-0">
            <input type="file" id="bannerUploadInput" accept="image/*" onChange={handleFotoChange} className="hidden" disabled={!isEditMode} />
            <div 
              onClick={() => { if (isEditMode) document.getElementById('bannerUploadInput')?.click(); }}
              className={`w-11 h-11 lg:w-12 lg:h-12 rounded-xl bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center font-bold text-slate-500 overflow-hidden shadow-sm relative transition-all ${isEditMode ? 'cursor-pointer hover:ring-2 hover:ring-blue-500/50 hover:opacity-90' : ''}`}
              title={isEditMode ? "Klik untuk ganti foto sampul" : "Foto Sampul Proyek"}
            >
              {newFotoPreview ? <img src={newFotoPreview} alt="Preview" className="w-full h-full object-cover" /> : (project?.foto_sampul && !removeFoto) ? <img src={getImageUrl(project.foto_sampul)} alt="Banner" className="w-full h-full object-cover" /> : <span className="text-base font-extrabold text-amber-500">{project?.nama_proyek ? project.nama_proyek.charAt(0).toUpperCase() : 'P'}</span>}
              {isEditMode && <div className="absolute inset-0 bg-slate-900/60 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"><Camera className="w-4 h-4 text-white" /><span className="text-[7px] font-bold mt-0.5">Ubah</span></div>}
            </div>
            {isEditMode && (newFotoPreview || (project?.foto_sampul && !removeFoto)) && <button type="button" onClick={(e) => { e.stopPropagation(); setFotoSampul(null); setNewFotoPreview(null); setRemoveFoto(true); }} className="absolute -top-1.5 -right-1.5 p-1 bg-rose-500 hover:bg-rose-600 text-white rounded-full shadow-md z-10 transition-transform active:scale-95" title="Hapus Foto Sampul"><X className="w-2.5 h-2.5" /></button>}
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-sm lg:text-base font-bold text-slate-800 dark:text-white leading-snug flex items-center gap-1.5 flex-wrap">
              <span>Data Utama Proyek</span>
              {isEditMode && <span className="px-2 py-0.5 ml-1 text-[9px] bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 rounded-md animate-pulse border border-blue-200 dark:border-blue-500/30 font-extrabold tracking-wider shadow-sm">DRAFT MODE</span>}
            </h1>
            
            {/* TAMPILAN HEADER ASLI (TANPA DROPDOWN, HANYA BADGE) */}
            <div className="flex items-center flex-wrap gap-1 mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
              <span className="truncate font-medium">{isEditMode ? (editFormData.nama_proyek || 'Memuat Data...') : (project?.nama_proyek || 'Memuat Data...')}</span>
              <span className="text-slate-400">•</span>
              <span className="truncate">SPK: {isEditMode ? (editFormData.kode_kontrak || editFormData.nomor_kontrak_kontraktor || '-') : (project?.kode_kontrak || project?.nomor_kontrak_kontraktor || '-')}</span>
              <span className="text-slate-400">•</span>
              <span className={`px-1.5 py-0.2 rounded border text-[9px] font-extrabold uppercase tracking-wider shadow-sm truncate ${getCategoryStyle(isEditMode ? editFormData.kategori : project?.kategori)}`}>
                {(isEditMode ? editFormData.kategori : project?.kategori) || 'Belum Ditentukan'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
          
          <div className="flex items-center justify-between sm:justify-start gap-1 bg-white dark:bg-slate-800/80 px-1.5 h-10 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-x-auto custom-scrollbar z-30 transition-all shrink-0">
            {canEditData && (
              isEditMode ? (
                <>
                  <button type="button" onClick={cancelEditMode} disabled={isSavingMain || isLoading} className="flex items-center justify-center gap-1 h-7 px-2 sm:px-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 text-[10px] sm:text-[11px] font-bold rounded-lg border border-slate-300 dark:border-slate-600 whitespace-nowrap shrink-0 disabled:opacity-50"><X className="w-3.5 h-3.5 shrink-0" /> <span>Batal</span></button>
                  <button type="button" onClick={toggleEditMode} disabled={isSavingMain || isLoading} className="flex items-center justify-center gap-1.5 h-7 px-2 sm:px-2.5 text-[10px] sm:text-[11px] font-bold rounded-lg transition-all whitespace-nowrap shadow-sm bg-blue-600 hover:bg-blue-700 text-white shrink-0 disabled:opacity-50">{isSavingMain ? <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0 text-white" /> : <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-white" />} <span>{isSavingMain ? 'Menyimpan...' : 'Simpan'}</span></button>
                </>
              ) : (
                <button type="button" onClick={toggleEditMode} disabled={isLoading && !hasCachedFullData} className="flex items-center justify-center gap-1.5 h-7 px-2 sm:px-2.5 text-[10px] sm:text-[11px] font-medium rounded-lg transition-all whitespace-nowrap bg-transparent hover:bg-blue-50 dark:hover:bg-blue-500/10 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 shrink-0 disabled:opacity-50"><Edit3 className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 shrink-0" /> <span>Edit</span></button>
              )
            )}

            {!isEditMode && canExportData && (
              <>
                <div className="w-px h-4 bg-slate-200 dark:bg-slate-700/80 mx-0.5 shrink-0"></div>
                <button type="button" onClick={handleExportExcel} disabled={isLoading && !hasCachedFullData} className="flex items-center justify-center gap-1.5 h-7 px-2 sm:px-2.5 bg-transparent hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 text-[10px] sm:text-[11px] font-medium rounded-lg transition-all whitespace-nowrap shrink-0 disabled:opacity-50"><FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 shrink-0" /><span>Excel</span></button>
                <button type="button" onClick={handleExportPDF} disabled={isLoading && !hasCachedFullData} className="flex items-center justify-center gap-1.5 h-7 px-2 sm:px-2.5 bg-transparent hover:bg-rose-50 dark:hover:bg-rose-500/10 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 text-[10px] sm:text-[11px] font-medium rounded-lg transition-all whitespace-nowrap shrink-0 disabled:opacity-50"><Download className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400 shrink-0" /><span>PDF</span></button>
              </>
            )}
          </div>

          <ProjectNavigation projectId={projectId} project={project} activeTab="data" />
        </div>
      </div>

      {isLoading && !hasCachedFullData ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh] w-full bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl shadow-sm animate-fade-in"><Loader2 className="w-10 h-10 text-amber-500 animate-spin mb-4" /><p className="text-sm font-medium text-slate-500 dark:text-slate-400">Memuat rincian proyek...</p></div>
      ) : errorMsg || !project?.tanggal_mulai ? ( 
        <div className="flex flex-col items-center justify-center min-h-[50vh] w-full bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl shadow-sm text-center animate-fade-in"><AlertTriangle className="w-12 h-12 text-rose-500 mb-4" /><h2 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Proyek Tidak Ditemukan</h2><button onClick={() => navigate('/projects')} className="px-6 py-2 bg-slate-200 dark:bg-slate-800 rounded-xl font-bold mt-4 transition-colors">Kembali ke Daftar</button></div>
      ) : (
        <div className="space-y-4 animate-fade-in">
          <ProgressSnapshot progressPlan={progressPlan} progressReal={progressReal} deviasi={deviasi} isGuest={isGuest} isActuallyDelayed={isActuallyDelayed} />
          <ContractAdminData project={project} isEditMode={isEditMode} editFormData={editFormData} handleMainChange={handleMainChange} canViewFinance={canViewFinance} displayStatus={displayStatus} isActuallyDelayed={isActuallyDelayed} />
          <StakeholdersPersonnel project={project} isEditMode={isEditMode} editFormData={editFormData} handleMainChange={handleMainChange} canCreateData={canCreateData} openPersonnelModal={openPersonnelModal} handleDeletePersonnel={handleDeletePersonnel} />
          <DocumentsDescription project={project} isEditMode={isEditMode} editFormData={editFormData} handleMainChange={handleMainChange} canCreateData={canCreateData} handleUploadDocument={handleUploadDocument} getDocUrl={getDocUrl} handleDeleteDocument={handleDeleteDocument} />
        </div>
      )}

      {/* MODAL PERSONEL */}
      {showPersonnelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2"><Users className="w-4 h-4 text-amber-500"/> {personnelForm.id ? 'Edit Personel' : 'Tambah Personel Lapangan'}</h3>
              <button onClick={() => setShowPersonnelModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={handleSavePersonnel}>
              <div className="p-5 space-y-4">
                <div className="space-y-1.5"><label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Nama Lengkap <span className="text-rose-500">*</span></label><input type="text" required value={personnelForm.nama} onChange={(e) => setPersonnelForm({...personnelForm, nama: e.target.value})} placeholder="Contoh: Budi Santoso, S.T." className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-amber-500 transition-colors" /></div>
                <div className="space-y-1.5"><label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Posisi / Peran <span className="text-rose-500">*</span></label><input type="text" required value={personnelForm.peran} onChange={(e) => setPersonnelForm({...personnelForm, peran: e.target.value})} placeholder="Contoh: Site Manager" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-amber-500 transition-colors" /></div>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
                <button type="button" onClick={() => setShowPersonnelModal(false)} className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl shadow-sm">Batal</button>
                <button type="submit" className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white dark:text-slate-950 text-xs font-bold rounded-xl transition-colors shadow-md flex items-center gap-2"><CheckCircle2 className="w-4 h-4"/> Set Draf Personil</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI HAPUS HANYA UNTUK PROYEK */}
      {deleteConfig.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden text-center p-6" onClick={e => e.stopPropagation()}>
            <div className="w-14 h-14 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse"><AlertTriangle className="w-6 h-6 text-rose-500 dark:text-rose-400" /></div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Konfirmasi Hapus</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">Anda yakin ingin menghapus <span className="font-bold text-slate-700 dark:text-slate-300">{deleteConfig.name}</span> secara permanen dari sistem? <span className="block mt-2 text-rose-500 font-medium">Peringatan: Seluruh data RAB, Jadwal, dan Laporan Harian yang terkait dengan proyek ini juga akan ikut terhapus!</span></p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfig({ show: false, type: '', id: null, name: '' })} className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">Batal</button>
              <button onClick={executeDeleteProject} className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-xl transition-colors shadow-lg shadow-rose-500/20 flex items-center justify-center gap-2"><Trash2 className="w-4 h-4"/> Ya, Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}