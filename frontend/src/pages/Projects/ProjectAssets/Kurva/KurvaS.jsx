import React, { useState, useEffect, useRef, useMemo } from 'react';
import html2canvas from 'html2canvas';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import api from '../../../../api.js';
import { TrendingUp, Loader2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

import ScheduleWorkData from './ScheduleWorkData'; // Lokasi ini tetap
import HeaderKurva from './HeaderKurva';
import SetupJadwalPertama from './SetupJadwalPertama';
import { ModalMingguan, ModalSimpan, ModalExport } from './ModalsKurva';

let cachedScheduleDetails = {};

const LOADING_MESSAGES = [
  'Memuat data kurva...',
  'Memuat data schedule...',
  'Menyusun matriks & grafik S-Curve...'
];

export default function KurvaS({ selectedProject }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  useEffect(() => { document.title = "Prisma Group - Kurva S & Time Schedule"; }, []);

  const targetId = selectedProject?.id || location.state?.id || id;

  const getInitialSchedule = () => {
    if (cachedScheduleDetails[targetId]) return cachedScheduleDetails[targetId];
    return null;
  };
  const initialCache = getInitialSchedule();

  const [scheduleData, setScheduleData] = useState(initialCache);
  const [grandTotalRAB, setGrandTotalRAB] = useState(initialCache?.grand_total_rab || 0);

  const hasCachedFullData = Boolean(initialCache);
  const [isLoading, setIsLoading] = useState(!hasCachedFullData);
  const [isRenderingUI, setIsRenderingUI] = useState(true);

  // STATE TRANSISI LOADING INTERAKTIF
  const [loadingStep, setLoadingStep] = useState(0);

  useEffect(() => {
    if (!isLoading && !isRenderingUI) return;
    const interval = setInterval(() => {
      setLoadingStep((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 1200);
    return () => clearInterval(interval);
  }, [isLoading, isRenderingUI]);

  const project = selectedProject || location.state || scheduleData?.project_info || { 
    id: targetId, 
    nama_proyek: LOADING_MESSAGES[loadingStep] 
  };
  const projectId = project.id || targetId;

  const [userRole] = useState(() => {
    try {
      const userDataStr = localStorage.getItem('user_data');
      return userDataStr ? JSON.parse(userDataStr).role || 'Tamu' : 'Tamu';
    } catch { return 'Tamu'; }
  });

  const canCreateData = ['Administrator', 'Team Leader', 'Pengawas Lapangan'].includes(userRole);
  const canExportData = ['Administrator', 'Direktur'].includes(userRole);
  const isGuest = userRole === 'Tamu';

  useEffect(() => {
    setIsRenderingUI(true);
    const timer = setTimeout(() => setIsRenderingUI(false), 50);
    return () => clearTimeout(timer);
  }, [projectId]);

  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveModal, setSaveModal] = useState(false);
  const [localWeeks, setLocalWeeks] = useState([]); 
  const [weekModal, setWeekModal] = useState({ show: false, minggu_ke: '', bulan: '', tanggal_awal: '', tanggal_akhir: '' });

  const [projectBounds, setProjectBounds] = useState({ start: '', end: '' }); 
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [showFilterPopup, setShowFilterPopup] = useState(false);
  
  const [filterMode, setFilterMode] = useState('Mingguan'); 
  const [tempFilterMode, setTempFilterMode] = useState('Mingguan');
  const filterRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) setShowFilterPopup(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // AUTO-SWITCH SKALA GRAFIK BERDASARKAN JUMLAH MINGGU
  const prevWeekCount = useRef(0);
  useEffect(() => {
    if (localWeeks.length > 0 && prevWeekCount.current !== localWeeks.length) {
      if (localWeeks.length === 1) {
        setFilterMode('Harian');
        setTempFilterMode('Harian');
        setStartDateFilter(localWeeks[0].tanggal_awal ? localWeeks[0].tanggal_awal.substring(0, 10) : '');
        setEndDateFilter(localWeeks[0].tanggal_akhir ? localWeeks[0].tanggal_akhir.substring(0, 10) : '');
      } else if (localWeeks.length > 1 && prevWeekCount.current <= 1) {
        setFilterMode('Mingguan');
        setTempFilterMode('Mingguan');
        setStartDateFilter('');
        setEndDateFilter('');
      }
      prevWeekCount.current = localWeeks.length;
    }
  }, [localWeeks]);
  
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportModal, setExportModal] = useState({ show: false, type: '' });

  const [isSavingInitial, setIsSavingInitial] = useState(false);
  const [weeksForm, setWeeksForm] = useState([{ id: Date.now(), minggu_ke: 1, bulan: 1, tanggal_mulai: '', tanggal_selesai: '', target_kumulatif: '' }]);

  const [showAddendum, setShowAddendum] = useState(false);
  const [showPlanCurve, setShowPlanCurve] = useState(true);
  const [showActualCurve, setShowActualCurve] = useState(true);
  const [showDeviationCurve, setShowDeviationCurve] = useState(true);

  const handleInitialWeekChange = (id, field, value) => setWeeksForm(weeksForm.map(w => w.id === id ? { ...w, [field]: value } : w));
  const handleAddInitialWeek = () => {
    const lastWeek = weeksForm[weeksForm.length - 1];
    setWeeksForm([...weeksForm, { id: Date.now(), minggu_ke: parseInt(lastWeek.minggu_ke) + 1, bulan: lastWeek.bulan, tanggal_mulai: '', tanggal_selesai: '', target_kumulatif: '' }]);
  };
  const handleRemoveInitialWeek = (id) => setWeeksForm(weeksForm.filter(w => w.id !== id));

  const handleSaveInitialSchedule = async () => {
    if (weeksForm.some(w => !w.tanggal_mulai || !w.tanggal_selesai || w.target_kumulatif === '' || w.target_kumulatif === null || w.target_kumulatif === undefined)) {
      return alert("Mohon lengkapi Tanggal Mulai, Tanggal Selesai, dan Target Kumulatif pada semua minggu.");
    }
    
    setIsSavingInitial(true);
    try {
      const payload = weeksForm.map(w => ({
        minggu_ke: w.minggu_ke, 
        bulan: w.bulan, 
        tanggal_awal: w.tanggal_mulai, 
        tanggal_akhir: w.tanggal_selesai, 
        target_kumulatif: parseFloat((parseFloat(w.target_kumulatif.toString().replace(',', '.')) || 0).toFixed(4))
      }));
      await api.post(`/projects/${projectId}/schedules`, { full_sync: true, weeks: payload });
      alert("Jadwal Pertama Berhasil Disimpan!");
      clearCacheAndFetch();
    } catch (error) { alert("Gagal menyimpan jadwal."); } finally { setIsSavingInitial(false); }
  };

  const getSafeFloat = (val) => {
    if (val === null || val === undefined) return 0;
    const parsed = parseFloat(val);
    return isNaN(parsed) ? 0 : parsed;
  };

  const formatIndoDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatDateSlash = (dateStr) => {
    if (!dateStr) return '-';
    const parts = dateStr.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
  };

  const fetchSchedule = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const res = await api.get(`/projects/${projectId}/schedules`);
      const data = res.data?.data;
      setScheduleData(data);
      setGrandTotalRAB(data?.grand_total_rab || 0);
      cachedScheduleDetails[projectId] = data;

      if (data?.project_info) {
        setProjectBounds({
          start: data.project_info.tanggal_mulai ? data.project_info.tanggal_mulai.substring(0, 10) : '',
          end: data.project_info.tanggal_selesai ? data.project_info.tanggal_selesai.substring(0, 10) : ''
        });
      }

      let rawSchedules = data?.schedules;
      let fetchedSchedules = Array.isArray(rawSchedules) ? rawSchedules : (rawSchedules ? Object.values(rawSchedules) : []);
      const wMap = {};
      fetchedSchedules.forEach(s => {
        const wNum = parseInt(s.minggu_ke);
        if (!wMap[wNum]) {
          wMap[wNum] = { minggu_ke: wNum, bulan: s.bulan || '', tanggal_awal: s.tanggal_awal || '', tanggal_akhir: s.tanggal_akhir || '', target_kumulatif: parseFloat(s.target_kumulatif || 0) };
        }
      });
      setLocalWeeks(Object.values(wMap).sort((a,b) => a.minggu_ke - b.minggu_ke));
    } catch (error) { console.error("Gagal menarik data Kurva S:", error); } finally { setIsLoading(false); }
  };

  const clearCacheAndFetch = () => { delete cachedScheduleDetails[projectId]; fetchSchedule(false); };
  useEffect(() => { if (projectId) fetchSchedule(hasCachedFullData); }, [projectId]);

  const handleBatalEdit = () => { setIsEditMode(false); fetchSchedule(true); };
  const handleWeekCumulativeChange = (weekNum, value) => {
    const val = value.replace(',', '.');
    if (isNaN(val) && val !== '.') return;
    setLocalWeeks(prev => {
      const safePrev = Array.isArray(prev) ? prev : [];
      return safePrev.map(w => parseInt(w.minggu_ke) === parseInt(weekNum) ? { ...w, target_kumulatif: val } : w);
    });
  };

  const openWeekModal = (weekNum = null) => {
    const safeWeeks = Array.isArray(localWeeks) ? localWeeks : [];
    if (weekNum) {
      const existing = safeWeeks.find(w => parseInt(w.minggu_ke) === parseInt(weekNum));
      setWeekModal({ show: true, ...(existing || { minggu_ke: weekNum }) });
    } else {
      const maxW = safeWeeks.length > 0 ? Math.max(...safeWeeks.map(w => parseInt(w.minggu_ke) || 0)) : 0;
      setWeekModal({ show: true, minggu_ke: maxW + 1, bulan: '', tanggal_awal: '', tanggal_akhir: '', target_kumulatif: 0 });
    }
  };

  const saveWeekModal = () => {
    if(!weekModal.tanggal_awal || !weekModal.tanggal_akhir) return alert("Pilih Tanggal Mulai dan Akhir!");
    setLocalWeeks(prev => {
      const safePrev = Array.isArray(prev) ? prev : [];
      const exists = safePrev.find(w => parseInt(w.minggu_ke) === parseInt(weekModal.minggu_ke));
      if (exists) return safePrev.map(w => parseInt(w.minggu_ke) === parseInt(weekModal.minggu_ke) ? { ...w, ...weekModal } : w);
      return [...safePrev, { ...weekModal }].sort((a,b) => parseInt(a.minggu_ke) - parseInt(b.minggu_ke));
    });
    setWeekModal({ show: false, minggu_ke: '', bulan: '', tanggal_awal: '', tanggal_akhir: '' });
  };

  const handleRemoveWeek = (weekNum) => {
    if (window.confirm(`Anda yakin ingin menghapus kolom Target Minggu Ke-${weekNum}?\nKolom akan terhapus dari draf tampilan sebelum Anda menyimpannya ke database.`)) {
      setLocalWeeks(prev => {
        const safePrev = Array.isArray(prev) ? prev : [];
        return safePrev.filter(w => parseInt(w.minggu_ke) !== parseInt(weekNum));
      });
    }
  };

  const handleSaveSchedule = async () => {
    setSaveModal(false); setIsSaving(true);
    const safeWeeks = Array.isArray(localWeeks) ? localWeeks : [];
    const payloadWeeks = safeWeeks.map(w => ({ 
      ...w, 
      target_kumulatif: parseFloat((parseFloat(String(w.target_kumulatif).replace(',', '.')) || 0).toFixed(4)) 
    }));
    try {
      await api.post(`/projects/${projectId}/schedules`, { full_sync: true, weeks: payloadWeeks });
      alert("Target Jadwal Berhasil Disimpan!");
      setIsEditMode(false); clearCacheAndFetch();
    } catch (error) { alert("Gagal menyimpan perubahan jadwal."); } finally { setIsSaving(false); }
  };

  const handleApplyFilter = () => {
    if (tempFilterMode === 'Harian') {
      if (!startDateFilter || !endDateFilter) return alert("Wajib memasukkan Mulai Tanggal dan Sampai Tanggal untuk Skala Harian agar grafik tidak memberatkan sistem.");
    } else { setStartDateFilter(''); setEndDateFilter(''); }
    setFilterMode(tempFilterMode); setShowFilterPopup(false);
  };

  const applyFilter = (mode) => {
    if (mode === 'Semua') { setFilterMode('Mingguan'); setTempFilterMode('Mingguan'); setStartDateFilter(''); setEndDateFilter(''); setShowFilterPopup(false); } 
  };

  const getActiveFilterLabel = () => {
    if (filterMode === 'Harian') {
      let rangeLabel = (startDateFilter || endDateFilter) ? `${startDateFilter ? formatIndoDate(startDateFilter) : 'Awal'} - ${endDateFilter ? formatIndoDate(endDateFilter) : 'Akhir'}` : 'Memerlukan Rentang Waktu';
      return `Skala Harian | ${rangeLabel}`;
    }
    return `Skala ${filterMode} | Seluruh Waktu`;
  };

  // =========================================================================
  // PERHITUNGAN DATA HARIAN (TITIK AKTUAL HANYA MUNCUL SAAT ADA LAPORAN)
  // =========================================================================
  const fullChartData = useMemo(() => {
    if (!scheduleData) return [];

    const parseLocalDate = (dateStr) => {
      if (!dateStr) return new Date();
      const cleanStr = dateStr.split(' ')[0].split('T')[0];
      const [y, m, d] = cleanStr.split('-');
      return new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    };

    const weekMap = {};
    const safeSchedules = Array.isArray(scheduleData.schedules) ? scheduleData.schedules : (scheduleData.schedules ? Object.values(scheduleData.schedules) : []);
    
    safeSchedules.forEach(s => {
      const w = parseInt(s.minggu_ke);
      if (!weekMap[w]) {
        weekMap[w] = { 
          minggu_ke: w, 
          bulan: s.bulan || null, 
          tanggal_awal: s.tanggal_awal || null, 
          tanggal_akhir: s.tanggal_akhir || null, 
          target_kumulatif: getSafeFloat(s.target_kumulatif) 
        };
      }
      if (!weekMap[w].tanggal_awal && s.tanggal_awal) weekMap[w].tanggal_awal = s.tanggal_awal;
      if (!weekMap[w].tanggal_akhir && s.tanggal_akhir) weekMap[w].tanggal_akhir = s.tanggal_akhir;
    });

    const sortedWeeks = Object.values(weekMap).sort((a, b) => a.minggu_ke - b.minggu_ke);
    const hasAnyWeekDates = sortedWeeks.some(w => w.tanggal_awal && w.tanggal_akhir);

    const dailyRealisasi = {};
    const dailyRealisasiWeeks = {};
    let maxReportedDayStr = '';

    const safeRealizations = Array.isArray(scheduleData.realizations) ? scheduleData.realizations : (scheduleData.realizations ? Object.values(scheduleData.realizations) : []);

    safeRealizations.forEach(r => {
      if (!r.tgl_input) return;
      const ymd = r.tgl_input.split('T')[0].split(' ')[0]; 
      dailyRealisasi[ymd] = getSafeFloat(dailyRealisasi[ymd]) + getSafeFloat(r.bobot_realisasi);
      if (r.minggu_ke) dailyRealisasiWeeks[ymd] = r.minggu_ke;
      if (!maxReportedDayStr || ymd > maxReportedDayStr) maxReportedDayStr = ymd;
    });

    const pStart = scheduleData.project_info?.tanggal_mulai ? parseLocalDate(scheduleData.project_info.tanggal_mulai) : new Date(); pStart.setHours(0,0,0,0);
    const pEnd = scheduleData.project_info?.tanggal_selesai ? parseLocalDate(scheduleData.project_info.tanggal_selesai) : new Date(pStart.getTime() + (30 * 24 * 3600 * 1000)); pEnd.setHours(0,0,0,0);

    let minDate = new Date(pStart); let maxDate = new Date(pEnd);
    sortedWeeks.forEach(w => {
      if (w.tanggal_awal) { const d = parseLocalDate(w.tanggal_awal); if (d < minDate) minDate = d; }
      if (w.tanggal_akhir) { const d = parseLocalDate(w.tanggal_akhir); if (d > maxDate) maxDate = d; }
    });
    if (maxReportedDayStr) { const d = parseLocalDate(maxReportedDayStr); if (d > maxDate) maxDate = d; }

    minDate.setHours(0,0,0,0); maxDate.setHours(0,0,0,0);
    const totalDays = Math.max(1, Math.floor((maxDate - minDate) / (1000 * 3600 * 24)) + 1);

    const tempChartData = [];
    let cumRealisasi = 0;

    for (let i = 0; i < totalDays; i++) {
      const currDate = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate() + i);
      const yyyy = currDate.getFullYear();
      const mm = String(currDate.getMonth() + 1).padStart(2, '0');
      const dd = String(currDate.getDate()).padStart(2, '0');
      const yyyymmdd = `${yyyy}-${mm}-${dd}`; 

      const shortDate = currDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
      const displayDate = currDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
      const dateSlash = formatDateSlash(yyyymmdd);

      let matchedWeek = sortedWeeks.find(w => w.tanggal_awal && w.tanggal_akhir && yyyymmdd >= w.tanggal_awal && yyyymmdd <= w.tanggal_akhir);
      let currentWeekNum = null;

      if (matchedWeek) {
        currentWeekNum = matchedWeek.minggu_ke;
      } else if (dailyRealisasiWeeks[yyyymmdd]) {
        currentWeekNum = parseInt(dailyRealisasiWeeks[yyyymmdd]);
        if (weekMap[currentWeekNum]) matchedWeek = weekMap[currentWeekNum];
      } else if (!hasAnyWeekDates) {
        const diffFromStart = Math.floor((currDate - pStart) / (1000 * 3600 * 24));
        currentWeekNum = diffFromStart >= 0 ? Math.floor(diffFromStart / 7) + 1 : 0;
      }

      const targetKumulatifMingguan = matchedWeek ? getSafeFloat(matchedWeek.target_kumulatif) : null;
      const actVal = getSafeFloat(dailyRealisasi[yyyymmdd]);
      const hasReportToday = dailyRealisasi[yyyymmdd] !== undefined;

      if (hasReportToday) cumRealisasi += actVal;
      
      let finalRealisasiKumulatif = null;
      let finalDeviasi = null;

      if (hasReportToday) {
        finalRealisasiKumulatif = getSafeFloat(cumRealisasi);
        if (targetKumulatifMingguan !== null) {
          finalDeviasi = getSafeFloat(cumRealisasi - targetKumulatifMingguan);
        }
      }

      tempChartData.push({
        hariKe: i + 1, label: `H-${(i + 1).toString().padStart(2, '0')}`, dateString: yyyymmdd, dateSlash, displayDate, shortDate, mingguKe: currentWeekNum,
        targetKumulatifMingguan, rencanaKumulatif: targetKumulatifMingguan, bobotRealisasi: actVal,
        realisasiKumulatif: finalRealisasiKumulatif, deviasiKumulatif: finalDeviasi, hasReportToday
      });
    }
    
    return tempChartData;
  }, [scheduleData]);

  // =========================================================================
  // AGREGASI SKALA HARIAN, MINGGUAN, DAN BULANAN
  // =========================================================================
  const chartData = useMemo(() => {
    if (fullChartData.length === 0) return [];
    let filtered = fullChartData;
    
    if (filterMode === 'Harian') {
      if (!startDateFilter || !endDateFilter) return []; 
      filtered = filtered.filter(d => d.dateString >= startDateFilter && d.dateString <= endDateFilter);
      return filtered.map(d => ({ ...d, xAxisLabel: d.shortDate, tooltipLabel: d.displayDate }));
    } 
    
    if (filterMode === 'Bulanan') {
      const monthMap = {};
      filtered.forEach(d => {
        const dateObj = new Date(d.dateString);
        const monthKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
        const shortMonth = dateObj.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
        const longMonth = dateObj.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
        
        monthMap[monthKey] = { 
          ...d, xAxisLabel: shortMonth, tooltipLabel: `Bulan: ${longMonth}`,
          rencanaKumulatif: d.targetKumulatifMingguan !== null ? d.targetKumulatifMingguan : (monthMap[monthKey]?.rencanaKumulatif ?? null),
          realisasiKumulatif: d.realisasiKumulatif !== null ? d.realisasiKumulatif : (monthMap[monthKey]?.realisasiKumulatif ?? null),
          deviasiKumulatif: d.deviasiKumulatif !== null ? d.deviasiKumulatif : (monthMap[monthKey]?.deviasiKumulatif ?? null)
        };
      });
      return Object.values(monthMap);
    } 
    
    const weekMap = {};
    filtered.forEach(d => {
      const wKey = d.mingguKe || 0;
      if (wKey === 0) return; 
      weekMap[wKey] = { 
        ...d, xAxisLabel: `M-${wKey}`, tooltipLabel: `Minggu Ke-${wKey}`,
        rencanaKumulatif: d.targetKumulatifMingguan !== null ? d.targetKumulatifMingguan : (weekMap[wKey]?.rencanaKumulatif ?? null),
        realisasiKumulatif: d.realisasiKumulatif !== null ? d.realisasiKumulatif : (weekMap[wKey]?.realisasiKumulatif ?? null),
        deviasiKumulatif: d.deviasiKumulatif !== null ? d.deviasiKumulatif : (weekMap[wKey]?.deviasiKumulatif ?? null)
      };
    });
    return Object.values(weekMap);

  }, [fullChartData, startDateFilter, endDateFilter, filterMode]);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const dataInfo = payload[0].payload;
      return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3.5 rounded-xl shadow-xl text-xs z-50 min-w-[150px]">
          <p className="font-extrabold text-slate-800 dark:text-white mb-2 pb-2 border-b border-slate-200 dark:border-slate-700">{dataInfo.tooltipLabel}</p>
          {payload.map((entry, index) => {
            if (entry.value === undefined || entry.value === null) return null; 
            const num = getSafeFloat(entry.value);
            let valText = `${Number.isInteger(num) ? num.toFixed(2) : parseFloat(num.toFixed(4))}%`;
            if (entry.dataKey === 'deviasiKumulatif') valText = entry.value > 0 ? `+${valText}` : valText;
            return (
              <div key={index} className="flex justify-between items-center gap-6 font-medium mb-1.5 last:mb-0">
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div><span className="text-slate-600 dark:text-slate-300">{entry.name}</span></div>
                <span className="font-mono font-bold" style={{ color: entry.color }}>{valText}</span>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  const executeExport = async () => {
    const type = exportModal.type;
    setExportModal({ show: false, type: '' });
    if (type === 'excel') setIsExportingExcel(true); else setIsExportingPdf(true);

    try {
      let base64Image = null;
      if (type === 'pdf') {
        const chartElement = document.getElementById('chart-area');
        if (!chartElement) return alert("Area grafik tidak ditemukan!");
        const canvas = await html2canvas(chartElement, { scale: 2.5, backgroundColor: '#ffffff' });
        base64Image = canvas.toDataURL('image/jpeg', 0.8);
      }

      const response = await api.post(`/projects/${projectId}/export-kurva/${type}`, {
        chart_image: base64Image, start_date: startDateFilter, end_date: endDateFilter, view_mode: filterMode.toLowerCase(), show_addendum: showAddendum
      }, { responseType: 'blob' });

      const safeLabel = getActiveFilterLabel().replace(/[^a-zA-Z0-9]/g, '_');
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a'); link.href = url;
      link.setAttribute('download', `Kurva_S_${safeLabel}_${type === 'excel' ? 'Lengkap.xlsx' : 'Lengkap.pdf'}`);
      document.body.appendChild(link); link.click(); link.remove();
    } catch (error) { alert(`Gagal mengunduh.`); } finally { setIsExportingExcel(false); setIsExportingPdf(false); }
  };

  const isScheduleEmpty = !scheduleData?.schedules || scheduleData.schedules.length === 0;

  if (isRenderingUI) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] w-full bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl shadow-sm animate-fade-in">
        <Loader2 className="w-10 h-10 text-amber-500 animate-spin mb-3" />
        <p key={loadingStep} className="text-sm font-bold text-slate-700 dark:text-slate-200 animate-fade-in transition-all duration-300">
          {LOADING_MESSAGES[loadingStep]}
        </p>
        <div className="flex items-center gap-1.5 mt-3">
          {LOADING_MESSAGES.map((_, idx) => (
            <span 
              key={idx} 
              className={`h-1.5 rounded-full transition-all duration-300 ${loadingStep === idx ? 'w-5 bg-amber-500' : 'w-1.5 bg-slate-300 dark:bg-slate-600'}`} 
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-3.5 pb-2 relative animate-fade-in flex flex-col">
      <style>{`.custom-scrollbar::-webkit-scrollbar { height: 5px; width: 5px; } .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 10px; } .dark .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #475569; } .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #f59e0b; cursor: pointer;}`}</style>

      {/* HEADER UTAMA BERISI PROJECT NAVIGATION */}
      <HeaderKurva
        project={project} projectId={projectId} isEditMode={isEditMode} isLoading={isLoading} isSaving={isSaving} isScheduleEmpty={isScheduleEmpty} canCreateData={canCreateData} canExportData={canExportData} isGuest={isGuest} showFilterPopup={showFilterPopup} setShowFilterPopup={setShowFilterPopup} filterRef={filterRef} tempFilterMode={tempFilterMode} setTempFilterMode={setTempFilterMode} startDateFilter={startDateFilter} setStartDateFilter={setStartDateFilter} endDateFilter={endDateFilter} setEndDateFilter={setEndDateFilter} projectBounds={projectBounds} handleApplyFilter={handleApplyFilter} applyFilter={applyFilter} getActiveFilterLabel={getActiveFilterLabel} filterMode={filterMode} handleBatalEdit={handleBatalEdit} toggleEditMode={() => setIsEditMode(true)} setSaveModal={setSaveModal} setExportModal={setExportModal} openWeekModal={openWeekModal}
      />

      {isLoading && !hasCachedFullData ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] w-full bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl shadow-sm animate-fade-in">
          <Loader2 className="w-10 h-10 text-amber-500 animate-spin mb-3" />
          <p key={loadingStep} className="text-sm font-bold text-slate-700 dark:text-slate-200 animate-fade-in transition-all duration-300">
            {LOADING_MESSAGES[loadingStep]}
          </p>
          <div className="flex items-center gap-1.5 mt-3">
            {LOADING_MESSAGES.map((_, idx) => (
              <span 
                key={idx} 
                className={`h-1.5 rounded-full transition-all duration-300 ${loadingStep === idx ? 'w-5 bg-amber-500' : 'w-1.5 bg-slate-300 dark:bg-slate-600'}`} 
              />
            ))}
          </div>
        </div>
      ) : isScheduleEmpty ? (
        <SetupJadwalPertama weeksForm={weeksForm} handleInitialWeekChange={handleInitialWeekChange} handleAddInitialWeek={handleAddInitialWeek} handleRemoveInitialWeek={handleRemoveInitialWeek} projectBounds={projectBounds} handleSaveInitialSchedule={handleSaveInitialSchedule} isSavingInitial={isSavingInitial} navigate={navigate} />
      ) : (
        <div className="animate-fade-in space-y-3.5">
          <div id="chart-area" className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 p-4 sm:p-5 rounded-2xl flex flex-col shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 dark:border-slate-700/60 pb-3 mb-3 gap-2">
              <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-500" /> Grafik Kurva S (S-Curve)
              </h3>
              <div className="flex items-center gap-3 text-[10px] bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 rounded-lg shadow-inner">
                <button onClick={() => setShowPlanCurve(!showPlanCurve)} className={`flex items-center gap-1.5 font-semibold transition-all ${showPlanCurve ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-600 grayscale opacity-60'}`}><span className={`w-2 h-2 rounded-full ${showPlanCurve ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]' : 'bg-slate-400'}`}></span> Target Plan</button>
                <button onClick={() => setShowActualCurve(!showActualCurve)} className={`flex items-center gap-1.5 font-semibold transition-all ${showActualCurve ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-600 grayscale opacity-60'}`}><span className={`w-2 h-2 rounded-full ${showActualCurve ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-slate-400'}`}></span> Aktual Kumulatif</button>
                <button onClick={() => setShowDeviationCurve(!showDeviationCurve)} className={`flex items-center gap-1.5 font-semibold transition-all ${showDeviationCurve ? 'text-amber-500' : 'text-slate-400 dark:text-slate-600 grayscale opacity-60'}`}><span className={`w-2 h-2 rounded-full ${showDeviationCurve ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]' : 'bg-slate-400'}`}></span> Deviasi</button>
              </div>
            </div>
            
            <div className="w-full h-[320px] overflow-x-auto custom-scrollbar">
              <div className={`h-full ${chartData.length > 30 ? 'min-w-[1500px]' : 'min-w-[550px]'}`}>
                {chartData.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-xs text-slate-400 italic text-center px-6">{filterMode === 'Harian' && (!startDateFilter || !endDateFilter) ? "Untuk menghindari lag, grafik Skala Harian memerlukan Rentang Waktu. Silakan masukkan Mulai Tanggal & Sampai Tanggal di menu Filter." : "Tidak ada data di rentang tanggal ini."}</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 15, right: 15, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" vertical={false} className="dark:stroke-slate-700" />
                      <XAxis dataKey="xAxisLabel" stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} className="dark:stroke-slate-400" />
                      <YAxis stroke="#64748b" fontSize={11} domain={['auto', 100]} unit="%" tickLine={false} axisLine={false} className="dark:stroke-slate-400" />
                      <Tooltip content={<CustomTooltip />} />
                      {showPlanCurve && <Line type="monotone" dataKey="rencanaKumulatif" name="Target Rencana" stroke="#3b82f6" strokeWidth={3} dot={{ r: 3, strokeWidth: 2 }} activeDot={{ r: 6 }} connectNulls={true} />}
                      {showActualCurve && <Line type="monotone" dataKey="realisasiKumulatif" name="Aktual Kumulatif" stroke="#10b981" strokeWidth={3} dot={{ r: 3, strokeWidth: 2 }} activeDot={{ r: 6 }} connectNulls={true} />}
                      {showDeviationCurve && <Line type="monotone" dataKey="deviasiKumulatif" name="Deviasi" stroke="#f59e0b" strokeWidth={3} strokeDasharray="5 5" dot={{ r: 3, strokeWidth: 2 }} activeDot={{ r: 6 }} connectNulls={true} />}
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          <ScheduleWorkData scheduleData={scheduleData} localWeeks={localWeeks} isEditMode={isEditMode} canCreateData={canCreateData} grandTotalRAB={grandTotalRAB} handleWeekCumulativeChange={handleWeekCumulativeChange} openWeekModal={openWeekModal} handleRemoveWeek={handleRemoveWeek} onRefresh={clearCacheAndFetch} showAddendum={showAddendum} setShowAddendum={setShowAddendum} userRole={userRole} />
        </div>
      )}

      <ModalMingguan weekModal={weekModal} setWeekModal={setWeekModal} saveWeekModal={saveWeekModal} projectBounds={projectBounds} />
      <ModalSimpan saveModal={saveModal} setSaveModal={setSaveModal} handleSaveSchedule={handleSaveSchedule} />
      <ModalExport exportModal={exportModal} setExportModal={setExportModal} executeExport={executeExport} isExportingExcel={isExportingExcel} isExportingPdf={isExportingPdf} startDateFilter={startDateFilter} endDateFilter={endDateFilter} formatIndoDate={formatIndoDate} />
    </div>
  );
}