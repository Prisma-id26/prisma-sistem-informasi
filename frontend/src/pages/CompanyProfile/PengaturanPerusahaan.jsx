import React, { useState, useEffect } from 'react';
import { 
  LayoutTemplate, Briefcase, CalendarDays, Contact2, 
  Save, Plus, Trash2, Loader2, CheckCircle2, X, AlertCircle, ImagePlus, Globe, Edit3, Clock 
} from 'lucide-react';
import api from '../../api';

export default function PengaturanPerusahaan() {
  const [activeTab, setActiveTab] = useState('landing');
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  // STATE: Menyimpan data yang AKTIF di Database (untuk Preview & Placeholder)
  const [landingData, setLandingData] = useState({ hero_title: '', hero_subtitle: '', btn_text: '', current_hero_image: null });
  const [contactData, setContactData] = useState({ email: '', phone: '', website: '', address: '', operasional_senin_jumat: '', operasional_sabtu: '', operasional_minggu: '' });
  const [services, setServices] = useState([]);
  const [events, setEvents] = useState([]);

  // STATE: Menyimpan data ketikan User (Jika kosong, backend akan mengabaikannya)
  const [landingForm, setLandingForm] = useState({ hero_title: '', hero_subtitle: '', btn_text: '', hero_image: null });
  const [contactForm, setContactForm] = useState({ email: '', phone: '', website: '', address: '', operasional_senin_jumat: '', operasional_sabtu: '', operasional_minggu: '' });
  
  const [isLandingModalOpen, setIsLandingModalOpen] = useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [serviceForm, setServiceForm] = useState({ title: '', description: '', image: null });
  const [eventForm, setEventForm] = useState({ title: '', category: 'Berita Proyek', date: '', status: 'Diterbitkan', image: null });

  const baseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '');

  useEffect(() => {
    document.title = "Prisma Group - Pengaturan Profil";
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const resPublic = await api.get('/public/company-profile');
      if (resPublic.data?.profile) {
        setLandingData({
          hero_title: resPublic.data.profile.hero_title || '',
          hero_subtitle: resPublic.data.profile.hero_subtitle || '',
          btn_text: resPublic.data.profile.btn_text || '',
          current_hero_image: resPublic.data.profile.hero_image || null
        });
        setContactData({
          email: resPublic.data.profile.email || '',
          phone: resPublic.data.profile.phone || '',
          website: resPublic.data.profile.website || '',
          address: resPublic.data.profile.address || '',
          operasional_senin_jumat: resPublic.data.profile.operasional_senin_jumat || '',
          operasional_sabtu: resPublic.data.profile.operasional_sabtu || '',
          operasional_minggu: resPublic.data.profile.operasional_minggu || ''
        });
      }
      const resServices = await api.get('/cms/services');
      setServices(resServices.data || []);
      const resEvents = await api.get('/cms/events');
      setEvents(resEvents.data || []);
    } catch (error) {
      showMessage('error', 'Gagal memuat data dari server.');
    } finally {
      setIsLoading(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 4000);
  };

  // ===================== KONTROL LANDING PAGE =====================
  const handleSaveLanding = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      let hasChange = false;

      // Hanya masukkan yang diketik user
      if (landingForm.hero_title) { formData.append('hero_title', landingForm.hero_title); hasChange = true; }
      if (landingForm.hero_subtitle) { formData.append('hero_subtitle', landingForm.hero_subtitle); hasChange = true; }
      if (landingForm.btn_text) { formData.append('btn_text', landingForm.btn_text); hasChange = true; }
      if (landingForm.hero_image) { formData.append('hero_image', landingForm.hero_image); hasChange = true; }

      if (!hasChange) {
         showMessage('success', 'Tidak ada kolom baru yang diisi (Data lama dipertahankan).');
         setIsLandingModalOpen(false);
         setIsSubmitting(false);
         return;
      }

      await api.post('/cms/landing-page', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      showMessage('success', 'Landing Page berhasil diperbarui!');
      
      // Kosongkan form kembali
      setLandingForm({ hero_title: '', hero_subtitle: '', btn_text: '', hero_image: null });
      setIsLandingModalOpen(false);
      fetchAllData();
    } catch (err) { showMessage('error', err.response?.data?.message || 'Gagal menyimpan Landing Page.'); }
    setIsSubmitting(false);
  };

  const handleDeleteLanding = async () => {
    if(!window.confirm('Yakin ingin mereset Landing Page ke teks Default dan menghapus gambarnya?')) return;
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('hero_title', ''); formData.append('hero_subtitle', ''); formData.append('btn_text', '');
      formData.append('remove_image', 'true');
      await api.post('/cms/landing-page', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      showMessage('success', 'Landing Page berhasil direset ke Default!');
      fetchAllData();
    } catch (err) { showMessage('error', err.response?.data?.message || 'Gagal menghapus Landing Page.'); }
    setIsSubmitting(false);
  };

  // ===================== KONTROL KONTAK & JADWAL =====================
  const handleSaveContact = async () => {
    setIsSubmitting(true);
    try {
      const payload = {};
      // Hanya masukkan yang diketik user
      if (contactForm.email) payload.email = contactForm.email;
      if (contactForm.phone) payload.phone = contactForm.phone;
      if (contactForm.website) payload.website = contactForm.website;
      if (contactForm.address) payload.address = contactForm.address;
      if (contactForm.operasional_senin_jumat) payload.operasional_senin_jumat = contactForm.operasional_senin_jumat;
      if (contactForm.operasional_sabtu) payload.operasional_sabtu = contactForm.operasional_sabtu;
      if (contactForm.operasional_minggu) payload.operasional_minggu = contactForm.operasional_minggu;

      if (Object.keys(payload).length === 0) {
        showMessage('success', 'Tidak ada kolom yang diubah (Data lama dipertahankan).');
        setIsSubmitting(false);
        return;
      }

      await api.post('/cms/contact', payload);
      showMessage('success', 'Informasi Kontak & Jadwal berhasil diperbarui!');
      
      // Kosongkan form kembali
      setContactForm({ email: '', phone: '', website: '', address: '', operasional_senin_jumat: '', operasional_sabtu: '', operasional_minggu: '' });
      fetchAllData();
    } catch (err) { showMessage('error', err.response?.data?.message || 'Gagal menyimpan Kontak.'); }
    setIsSubmitting(false);
  };

  // ===================== KONTROL LAYANAN & EVENT =====================
  const handleAddService = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', serviceForm.title); formData.append('description', serviceForm.description);
      if (serviceForm.image) formData.append('image', serviceForm.image);
      await api.post('/cms/services', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setServiceForm({ title: '', description: '', image: null }); setIsServiceModalOpen(false); fetchAllData();
      showMessage('success', 'Layanan ditambahkan!');
    } catch (err) { showMessage('error', 'Gagal menambah layanan.'); }
    setIsSubmitting(false);
  };
  const handleDeleteService = async (id) => {
    if(!window.confirm('Hapus layanan ini?')) return;
    try { await api.delete(`/cms/services/${id}`); fetchAllData(); showMessage('success', 'Layanan dihapus.');
    } catch (err) { showMessage('error', 'Gagal menghapus layanan.'); }
  };

  const handleAddEvent = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', eventForm.title); formData.append('category', eventForm.category);
      formData.append('date', eventForm.date); formData.append('status', eventForm.status);
      if (eventForm.image) formData.append('image', eventForm.image);
      await api.post('/cms/events', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setEventForm({ title: '', category: 'Berita Proyek', date: '', status: 'Diterbitkan', image: null }); setIsEventModalOpen(false); fetchAllData();
      showMessage('success', 'Event disimpan!');
    } catch (err) { showMessage('error', 'Gagal menyimpan event.'); }
    setIsSubmitting(false);
  };
  const handleDeleteEvent = async (id) => {
    if(!window.confirm('Hapus berita/event ini?')) return;
    try { await api.delete(`/cms/events/${id}`); fetchAllData(); showMessage('success', 'Event dihapus.');
    } catch (err) { showMessage('error', 'Gagal menghapus event.'); }
  };

  if (isLoading) return <div className="flex justify-center items-center py-40"><Loader2 className="w-10 h-10 text-amber-500 animate-spin" /></div>;

  return (
    <div className="w-full space-y-6 animate-fade-in pb-10">
      
      <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-5 shadow-sm backdrop-blur-sm">
        <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-inner shrink-0">
          <img src="/PRISMA.PNG" alt="Logo" className="h-16 w-auto drop-shadow-sm dark:hidden" />
          <img src="/PRISMA_NEGATIF.PNG" alt="Logo" className="h-16 w-auto drop-shadow-sm hidden dark:block" />
        </div>
        <div className="text-center md:text-left">
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-wide">Pengaturan Profil Perusahaan</h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Kelola konten website publik secara independen & real-time.</p>
        </div>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-bold border animate-fade-in ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' : 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {message.text}
        </div>
      )}

      <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-2 flex flex-wrap gap-2 shadow-sm">
        {[
          { id: 'landing', label: 'Landing Page', icon: LayoutTemplate },
          { id: 'layanan', label: 'Layanan', icon: Briefcase },
          { id: 'event', label: 'Event & Berita', icon: CalendarDays },
          { id: 'kontak', label: 'Kontak & Jadwal', icon: Contact2 },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold transition-all ${
              activeTab === tab.id ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'
            }`}>
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* --- KONTEN LANDING PAGE --- */}
      {activeTab === 'landing' && (
        <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-6 shadow-sm animate-fade-in">
          <div className="flex items-center justify-between mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">
            <h2 className="text-lg font-extrabold text-slate-800 dark:text-white flex items-center gap-2"><LayoutTemplate className="w-5 h-5 text-amber-500" /> Landing Page (Hero)</h2>
            <div className="flex items-center gap-2">
              <button onClick={() => setIsLandingModalOpen(true)} className="flex items-center gap-1.5 px-4 py-2 bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 font-bold rounded-xl border border-blue-200 dark:border-blue-500/30 text-xs shadow-sm hover:scale-95 transition-transform"><Edit3 className="w-4 h-4" /> Edit</button>
              <button onClick={handleDeleteLanding} className="flex items-center gap-1.5 px-4 py-2 bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 font-bold rounded-xl border border-rose-200 dark:border-rose-500/30 text-xs shadow-sm hover:scale-95 transition-transform"><Trash2 className="w-4 h-4" /> Hapus</button>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row gap-6 p-5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 rounded-2xl transition-all hover:border-amber-400/50">
             <div className="w-full md:w-1/3 h-48 bg-slate-200 dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-300 dark:border-slate-600 flex items-center justify-center relative">
                 {landingData.current_hero_image ? (
                    <img src={`${baseUrl}/storage/${landingData.current_hero_image}`} className="w-full h-full object-cover" alt="Hero" />
                 ) : <ImagePlus className="w-8 h-8 text-slate-400" />}
             </div>
             <div className="flex-1 space-y-3 flex flex-col justify-center">
                <div>
                   <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-500/30 uppercase tracking-wider shadow-sm">
                     {landingData.btn_text || 'Sistem Manajemen Proyek Terpadu'}
                   </span>
                </div>
                <h3 className="text-2xl font-extrabold text-slate-800 dark:text-white leading-snug">
                  {landingData.hero_title || 'Pantau Progres & Pengawasan Lapangan Secara Real-Time'}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                  {landingData.hero_subtitle || 'Kelola volume progres, laporan harian, matriks Kurva S, hingga pemetaan GIS...'}
                </p>
             </div>
          </div>
        </div>
      )}

      {/* --- KONTEN KONTAK & JAM OPERASIONAL --- */}
      {activeTab === 'kontak' && (
        <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-6 shadow-sm animate-fade-in">
          
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-700 pb-4">
            <h2 className="text-lg font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
              <Contact2 className="w-5 h-5 text-amber-500" /> Pengaturan Kontak & Jadwal
            </h2>
            <p className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700">
              Kosongkan input jika tidak ingin mengubah data.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Email Resmi</label>
              <input type="email" value={contactForm.email} onChange={e => setContactForm({...contactForm, email: e.target.value})} placeholder={contactData.email || 'Belum diisi...'} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-amber-500" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Telepon / WhatsApp</label>
              <input type="text" value={contactForm.phone} onChange={e => setContactForm({...contactForm, phone: e.target.value})} placeholder={contactData.phone || 'Belum diisi...'} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-amber-500" />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Website Perusahaan</label>
              <div className="relative">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" value={contactForm.website} onChange={e => setContactForm({...contactForm, website: e.target.value})} placeholder={contactData.website || 'Belum diisi...'} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl pl-10 pr-4 py-3 text-sm font-semibold text-slate-800 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-amber-500" />
              </div>
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Alamat Lengkap</label>
              <textarea rows="2" value={contactForm.address} onChange={e => setContactForm({...contactForm, address: e.target.value})} placeholder={contactData.address || 'Belum diisi...'} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-amber-500 resize-none"></textarea>
            </div>
          </div>

          <h3 className="text-sm font-extrabold text-slate-800 dark:text-white mb-4 mt-8 flex items-center gap-2"><Clock className="w-4 h-4 text-emerald-500"/> Jam Operasional</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Senin - Jumat</label>
              <input type="text" value={contactForm.operasional_senin_jumat} onChange={e => setContactForm({...contactForm, operasional_senin_jumat: e.target.value})} placeholder={contactData.operasional_senin_jumat || '08:00 - 17:00 WITA'} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Sabtu</label>
              <input type="text" value={contactForm.operasional_sabtu} onChange={e => setContactForm({...contactForm, operasional_sabtu: e.target.value})} placeholder={contactData.operasional_sabtu || '08:00 - 13:00 WITA'} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-amber-500" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Minggu / Libur</label>
              <input type="text" value={contactForm.operasional_minggu} onChange={e => setContactForm({...contactForm, operasional_minggu: e.target.value})} placeholder={contactData.operasional_minggu || 'Tutup'} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 text-sm font-semibold text-rose-600 dark:text-rose-400 placeholder:text-slate-400 focus:ring-2 focus:ring-rose-500" />
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-700 flex justify-end">
            <button onClick={handleSaveContact} disabled={isSubmitting} className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-md disabled:opacity-50">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>} Simpan Perubahan
            </button>
          </div>
        </div>
      )}

      {/* --- KONTEN LAYANAN (Dipersingkat untuk space, biarkan fungsi lama) --- */}
      {activeTab === 'layanan' && (
        <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-6 shadow-sm animate-fade-in">
          <div className="flex items-center justify-between mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">
            <h2 className="text-lg font-extrabold text-slate-800 dark:text-white flex items-center gap-2"><Briefcase className="w-5 h-5 text-amber-500" /> Kelola Layanan</h2>
            <button onClick={() => setIsServiceModalOpen(true)} className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 font-bold rounded-xl border border-emerald-200 dark:border-emerald-500/30 text-xs shadow-sm hover:scale-95 transition-transform"><Plus className="w-4 h-4" /> Tambah</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {services.map(item => (
              <div key={item.id} className="flex items-start gap-4 p-5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 rounded-2xl relative group">
                <div className="w-16 h-16 shrink-0 rounded-xl bg-slate-200 dark:bg-slate-800 overflow-hidden border border-slate-300 dark:border-slate-600 flex items-center justify-center">
                   {item.image ? <img src={`${baseUrl}/storage/${item.image}`} className="w-full h-full object-cover" alt="" /> : <ImagePlus className="w-6 h-6 text-slate-400" />}
                </div>
                <div className="flex-1 pr-6"><h3 className="font-extrabold text-sm text-slate-800 dark:text-white mb-1">{item.title}</h3><p className="text-xs font-medium text-slate-500 dark:text-slate-400 line-clamp-2">{item.description}</p></div>
                <button onClick={() => handleDeleteService(item.id)} className="absolute top-4 right-4 p-1.5 text-rose-400 hover:bg-rose-500 hover:text-white rounded-md shadow-sm border border-slate-200 dark:border-slate-700 opacity-0 group-hover:opacity-100 transition-all bg-white dark:bg-slate-800"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- KONTEN EVENT (Dipersingkat) --- */}
      {activeTab === 'event' && (
        <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-6 shadow-sm animate-fade-in">
          <div className="flex items-center justify-between mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">
            <h2 className="text-lg font-extrabold text-slate-800 dark:text-white flex items-center gap-2"><CalendarDays className="w-5 h-5 text-amber-500" /> Event & Berita</h2>
            <button onClick={() => setIsEventModalOpen(true)} className="flex items-center gap-1.5 px-4 py-2 bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 font-bold rounded-xl border border-amber-200 dark:border-amber-500/30 text-xs shadow-sm hover:scale-95 transition-transform"><Plus className="w-4 h-4" /> Tambah</button>
          </div>
          <div className="space-y-4">
            {events.map(event => (
              <div key={event.id} className="flex flex-col md:flex-row items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 rounded-xl group relative">
                <div className="w-full md:w-20 h-20 shrink-0 rounded-xl bg-slate-200 dark:bg-slate-800 overflow-hidden border border-slate-300 dark:border-slate-600 flex items-center justify-center">
                   {event.image ? <img src={`${baseUrl}/storage/${event.image}`} className="w-full h-full object-cover" alt="" /> : <ImagePlus className="w-6 h-6 text-slate-400" />}
                </div>
                <div className="flex-1 w-full pr-10 md:pr-0">
                  <div className="flex items-center gap-2 mb-1"><h3 className="font-bold text-sm text-slate-800 dark:text-white">{event.title}</h3>{event.status === 'Draf' && <span className="px-1.5 py-0.5 bg-rose-100 text-rose-600 text-[9px] font-bold rounded">DRAF</span>}</div>
                  <div className="flex items-center gap-3 mt-1"><span className="text-[10px] font-bold uppercase bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">{event.category}</span><span className="text-xs font-medium text-slate-500 dark:text-slate-400">{event.date}</span></div>
                </div>
                <button onClick={() => handleDeleteEvent(event.id)} className="absolute top-4 right-4 md:static md:w-auto p-2 bg-white dark:bg-slate-800 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm transition-colors"><Trash2 className="w-4 h-4"/></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: EDIT LANDING PAGE */}
      {/* ========================================================= */}
      {isLandingModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center p-5 border-b border-slate-200 dark:border-slate-700">
              <h3 className="font-extrabold text-slate-800 dark:text-white">Edit Landing Page</h3>
              <button onClick={() => setIsLandingModalOpen(false)}><X className="w-5 h-5 text-slate-400 hover:text-rose-500" /></button>
            </div>
            <form onSubmit={handleSaveLanding} className="p-6 space-y-4">
              <p className="text-[10px] font-bold text-slate-400 mb-2 bg-slate-100 dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                Kolom yang dibiarkan kosong tidak akan menghapus data lama.
              </p>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Label / Badge</label>
                <input type="text" value={landingForm.btn_text} onChange={e => setLandingForm({...landingForm, btn_text: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-amber-500" placeholder={landingData.btn_text || 'Sistem Manajemen...'} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Judul Utama (Hero Title)</label>
                <input type="text" value={landingForm.hero_title} onChange={e => setLandingForm({...landingForm, hero_title: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-amber-500" placeholder={landingData.hero_title || 'Pantau Progres...'} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Deskripsi Singkat</label>
                <textarea rows="3" value={landingForm.hero_subtitle} onChange={e => setLandingForm({...landingForm, hero_subtitle: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-amber-500 resize-none" placeholder={landingData.hero_subtitle || 'Kelola volume progres...'}></textarea>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Ubah Gambar Baru (Biarkan kosong jika tidak ganti)</label>
                <input type="file" accept="image/*" onChange={e => setLandingForm({...landingForm, hero_image: e.target.files[0]})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2 text-sm text-slate-800 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-amber-50 file:text-amber-600 hover:file:bg-amber-100" />
              </div>
              <div className="flex justify-end gap-3 pt-6">
                <button type="button" onClick={() => setIsLandingModalOpen(false)} className="px-5 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs">Batal</button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-2">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Simpan Pembaruan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH LAYANAN (Tetap sama) */}
      {isServiceModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center p-5 border-b border-slate-200 dark:border-slate-700">
              <h3 className="font-extrabold text-slate-800 dark:text-white">Tambah Layanan</h3>
              <button onClick={() => setIsServiceModalOpen(false)}><X className="w-5 h-5 text-slate-400 hover:text-rose-500" /></button>
            </div>
            <form onSubmit={handleAddService} className="p-6 space-y-4">
              <div className="space-y-1.5"><label className="text-xs font-bold text-slate-700 dark:text-slate-300">Nama Layanan</label><input required type="text" value={serviceForm.title} onChange={e => setServiceForm({...serviceForm, title: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 dark:text-white focus:ring-2 focus:ring-amber-500" /></div>
              <div className="space-y-1.5"><label className="text-xs font-bold text-slate-700 dark:text-slate-300">Deskripsi Layanan</label><textarea required rows="4" value={serviceForm.description} onChange={e => setServiceForm({...serviceForm, description: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 dark:text-white focus:ring-2 focus:ring-amber-500 resize-none"></textarea></div>
              <div className="space-y-1.5"><label className="text-xs font-bold text-slate-700 dark:text-slate-300">Foto / Gambar (Opsional)</label><input type="file" accept="image/*" onChange={e => setServiceForm({...serviceForm, image: e.target.files[0]})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2 text-sm text-slate-800 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-amber-50 file:text-amber-600 hover:file:bg-amber-100" /></div>
              <div className="flex justify-end gap-3 pt-6"><button type="button" onClick={() => setIsServiceModalOpen(false)} className="px-5 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs">Batal</button><button type="submit" disabled={isSubmitting} className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs flex items-center gap-2">{isSubmitting ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Simpan'}</button></div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH EVENT (Tetap sama) */}
      {isEventModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center p-5 border-b border-slate-200 dark:border-slate-700">
              <h3 className="font-extrabold text-slate-800 dark:text-white">Publikasi Event/Berita</h3>
              <button onClick={() => setIsEventModalOpen(false)}><X className="w-5 h-5 text-slate-400 hover:text-rose-500" /></button>
            </div>
            <form onSubmit={handleAddEvent} className="p-6 space-y-4">
              <div className="space-y-1.5"><label className="text-xs font-bold text-slate-700 dark:text-slate-300">Judul Berita</label><input required type="text" value={eventForm.title} onChange={e => setEventForm({...eventForm, title: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 dark:text-white focus:ring-2 focus:ring-amber-500" /></div>
              <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1.5">
  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Kategori</label>
              <input type="text" required value={eventForm.category} onChange={e => setEventForm({...eventForm, category: e.target.value})} placeholder="Contoh: Berita Proyek" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 dark:text-white focus:ring-2 focus:ring-amber-500 shadow-inner transition-colors"/></div>
                <div className="space-y-1.5"><label className="text-xs font-bold text-slate-700 dark:text-slate-300">Tanggal</label><input required type="date" value={eventForm.date} onChange={e => setEventForm({...eventForm, date: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 dark:text-white focus:ring-2 focus:ring-amber-500" /></div>
                <div className="space-y-1.5 col-span-2"><label className="text-xs font-bold text-slate-700 dark:text-slate-300">Status Publikasi</label><select value={eventForm.status} onChange={e => setEventForm({...eventForm, status: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 dark:text-white focus:ring-2 focus:ring-amber-500"><option value="Diterbitkan">Diterbitkan (Langsung Tampil)</option><option value="Draf">Draf (Sembunyikan Sementara)</option></select></div>
              </div>
              <div className="space-y-1.5"><label className="text-xs font-bold text-slate-700 dark:text-slate-300">Foto Dokumentasi (Opsional)</label><input type="file" accept="image/*" onChange={e => setEventForm({...eventForm, image: e.target.files[0]})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2 text-sm text-slate-800 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-amber-50 file:text-amber-600 hover:file:bg-amber-100" /></div>
              <div className="flex justify-end gap-3 pt-6"><button type="button" onClick={() => setIsEventModalOpen(false)} className="px-5 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs">Batal</button><button type="submit" disabled={isSubmitting} className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs flex items-center gap-2">{isSubmitting ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Publikasi'}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}