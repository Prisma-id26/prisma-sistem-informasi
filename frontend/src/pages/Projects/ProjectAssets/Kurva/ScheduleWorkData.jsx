import React, { useState, useMemo, useEffect } from 'react';
import { Target, Info, Activity, CheckCircle2, Clock, X, CalendarDays, Inbox, Plus, Trash2, Edit3, Check, Loader2, Eye, EyeOff } from 'lucide-react';
import api from '../../../../api';

export default function ScheduleWorkData({
  scheduleData, localWeeks, isEditMode, canCreateData, grandTotalRAB,
  handleWeekCumulativeChange, openWeekModal, handleRemoveWeek, onRefresh,
  showAddendum, setShowAddendum, userRole
}) {
  const [detailModal, setDetailModal] = useState({ show: false, item: null, weekNum: null, targetPlan: 0, realizations: [] });
  const [inlineEditId, setInlineEditId] = useState(null);
  const [inlineEditData, setInlineEditData] = useState({ volume: '', persentase: '' });
  const [isSavingInline, setIsSavingInline] = useState(false);
  
  const [localWeeklyInputs, setLocalWeeklyInputs] = useState({});

  const getSafeFloat = (val) => {
    if (val === null || val === undefined || val === '') return 0;
    const parsed = parseFloat(String(val).replace(',', '.'));
    return isNaN(parsed) ? 0 : parsed;
  };

  // Format seragam 4 angka di belakang koma (0.0000)
  const formatDetailPercent = (val) => {
    const num = getSafeFloat(val);
    return num.toFixed(4);
  };

  const formatIndoDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const safeLocalWeeks = Array.isArray(localWeeks) ? localWeeks : (localWeeks ? Object.values(localWeeks) : []);
  const weeksArray = safeLocalWeeks.map(w => parseInt(w.minggu_ke) || 0);

  const rawRabData = scheduleData?.rab_data;
  let safeRabData = Array.isArray(rawRabData) ? rawRabData : (rawRabData ? Object.values(rawRabData) : []);
  const cumulativeActualMap = scheduleData?.cumulative_actual || {};

  safeRabData = safeRabData.map(cat => {
    const items = Array.isArray(cat?.items) ? cat.items : (cat?.items ? Object.values(cat.items) : []);
    const filteredItems = items.filter(item => cumulativeActualMap[item.id] !== undefined);
    return { ...cat, items: filteredItems };
  }).filter(cat => cat.items.length > 0);

  const ADDENDUM_NAME = 'PEKERJAAN TAMBAHAN (ADDENDUM)';
  const hasAddendum = safeRabData.some(cat => cat.nama_kategori === ADDENDUM_NAME);

  let displayRabData = safeRabData;
  if (!showAddendum) {
      displayRabData = displayRabData.filter(cat => cat.nama_kategori !== ADDENDUM_NAME);
  } else {
      const normalData = displayRabData.filter(cat => cat.nama_kategori !== ADDENDUM_NAME);
      const addenData = displayRabData.filter(cat => cat.nama_kategori === ADDENDUM_NAME);
      displayRabData = [...normalData, ...addenData];
  }

  const handleOpenCellDetail = (item, weekNum) => {
    const targetVal = getSafeFloat(safeLocalWeeks.find(w => parseInt(w.minggu_ke) === weekNum)?.target_kumulatif);
    const safeRealizations = Array.isArray(scheduleData?.realizations) ? scheduleData.realizations : (scheduleData?.realizations ? Object.values(scheduleData.realizations) : []);
    const dailyRealizations = safeRealizations.filter(r => r.rab_item_id === item.id && parseInt(r.minggu_ke) === weekNum);

    setDetailModal({ show: true, item, weekNum, targetPlan: targetVal, realizations: dailyRealizations });
    setInlineEditId(null);
  };

  const startInlineEdit = (r) => {
    setInlineEditId(r.activity_id);
    setInlineEditData({ volume: r.volume_laporan || '', persentase: r.bobot_realisasi || '' });
  };

  const saveInlineEdit = async (activityId) => {
    setIsSavingInline(true);
    try {
      await api.put(`/daily-report-activities/${activityId}`, { volume: inlineEditData.volume, persentase: inlineEditData.persentase });
      if (onRefresh) onRefresh();
    } catch(e) {
      alert("Gagal mengupdate data realisasi.");
    } finally {
      setIsSavingInline(false);
    }
  };

  const extraCols = isEditMode && canCreateData ? 4 : 3;

  // =========================================================================
  // MESIN KALKULASI FOOTER & KOLOM KUMULATIF (SUM REALISASI & SUM DEVIASI)
  // =========================================================================
  const { weeklyMetrics, totalsSummary } = useMemo(() => {
    const metrics = {};
    let sumPlan = 0;
    let sumRealisasi = 0;
    let sumDeviasi = 0;
    let hasAnyRealisasi = false;

    weeksArray.forEach((w, index) => {
      const hasWeekReport = scheduleData?.weekly_actual?.[w] !== undefined;
      const weekActual = parseFloat(getSafeFloat(scheduleData?.weekly_actual?.[w]).toFixed(4));

      const currentCumPlan = parseFloat(getSafeFloat(safeLocalWeeks.find(week => parseInt(week.minggu_ke) === w)?.target_kumulatif).toFixed(4));
      const prevCumPlan = index === 0 ? 0 : parseFloat(getSafeFloat(safeLocalWeeks.find(week => parseInt(week.minggu_ke) === weeksArray[index - 1])?.target_kumulatif).toFixed(4));
      const rencanaMingguan = parseFloat((currentCumPlan - prevCumPlan).toFixed(4));

      sumPlan = parseFloat((sumPlan + rencanaMingguan).toFixed(4));

      let deviation = null;
      if (hasWeekReport) {
        hasAnyRealisasi = true;
        // Deviasi mingguan = Realisasi Minggu ke-w dikurangi Rencana Mingguan ke-w
        deviation = parseFloat((weekActual - rencanaMingguan).toFixed(4));
        sumRealisasi = parseFloat((sumRealisasi + weekActual).toFixed(4));
        sumDeviasi = parseFloat((sumDeviasi + deviation).toFixed(4));
      }

      metrics[w] = {
        planWeekly: rencanaMingguan,
        planCum: currentCumPlan,
        actualWeekly: weekActual,
        deviation: deviation,
        hasReport: hasWeekReport
      };
    });

    return {
      weeklyMetrics: metrics,
      totalsSummary: {
        sumPlan,
        sumRealisasi,
        sumDeviasi,
        hasAnyRealisasi
      }
    };
  }, [scheduleData?.weekly_actual, weeksArray, safeLocalWeeks]);

  // Sinkronkan nilai Kolom Kumulatif ke sessionStorage agar ProjectData.jsx langsung menerima nilai yang sama
  useEffect(() => {
    const projId = scheduleData?.project_info?.id;
    if (!projId) return;
    try {
      const cacheKey = `cached_project_detail_${projId}`;
      const existingStr = sessionStorage.getItem(cacheKey);
      const existingObj = existingStr ? JSON.parse(existingStr) : (scheduleData?.project_info || {});
      const updatedObj = {
        ...existingObj,
        progress_plan: totalsSummary.sumPlan,
        progress_actual: totalsSummary.sumRealisasi,
        deviasi: totalsSummary.hasAnyRealisasi ? totalsSummary.sumDeviasi : 0
      };
      sessionStorage.setItem(cacheKey, JSON.stringify(updatedObj));
    } catch {}
  }, [scheduleData?.project_info?.id, totalsSummary]);

  useEffect(() => {
    if (isEditMode) {
      setLocalWeeklyInputs(prev => {
        const nextInputs = {};
        weeksArray.forEach((w) => {
          if (prev[w] !== undefined) {
            nextInputs[w] = prev[w];
          } else {
            const pw = weeklyMetrics[w]?.planWeekly ?? 0;
            nextInputs[w] = formatDetailPercent(pw);
          }
        });
        return nextInputs;
      });
    } else {
      setLocalWeeklyInputs({});
    }
  }, [isEditMode, weeksArray.length]);

  const renderedTableBody = useMemo(() => {
    if (displayRabData.length === 0) {
      return (
        <tr>
          <td colSpan={weeksArray.length + (isEditMode && canCreateData ? 6 : 5)} className="p-10 text-center bg-white dark:bg-slate-800/40">
            <div className="flex flex-col items-center justify-center max-w-md mx-auto border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-6">
              <Inbox className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
              <h4 className="font-bold text-slate-700 dark:text-slate-300 text-xs mb-1">Belum Ada Realisasi Pekerjaan</h4>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                Daftar uraian pekerjaan otomatis muncul di tabel matriks ini bila <strong>Laporan Harian</strong> telah disetujui (*Approved*).
              </p>
            </div>
          </td>
        </tr>
      );
    }

    return displayRabData.map(cat => {
      const safeItems = Array.isArray(cat?.items) ? cat.items : (cat?.items ? Object.values(cat.items) : []);
      return (
        <React.Fragment key={cat.id || Math.random()}>
          <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700/50">
            <td className="p-2 font-bold text-[10px] text-slate-700 dark:text-slate-300 text-center border-r border-slate-200 dark:border-slate-700/60">
              {cat.kode_divisi || '-'}
            </td>
            <td colSpan={weeksArray.length + extraCols} className="p-2 font-extrabold text-[11px] text-slate-800 dark:text-white uppercase border-r border-slate-200 dark:border-slate-700/60">
              {cat.nama_kategori || 'Kategori'}
            </td>
          </tr>
          
          {safeItems.map(item => {
            const bobotStandar = grandTotalRAB > 0 ? getSafeFloat((Number(item.total_harga || 0) / grandTotalRAB) * 100) : 0;
            const itemCumulative = getSafeFloat(scheduleData?.cumulative_actual?.[item.id]);

            return (
              <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors group">
                <td className="p-2 font-mono text-[10px] text-slate-500 text-center border-r border-slate-200 dark:border-slate-700/60">
                  {item.kode_pekerjaan || '-'}
                </td>
                <td className="p-2 text-[11px] font-medium border-r border-slate-200 dark:border-slate-700/60">
                  <div className="line-clamp-2" title={item.uraian_pekerjaan}>{item.uraian_pekerjaan}</div>
                </td>
                <td className="p-2 text-center font-mono text-[10px] font-extrabold text-blue-600 dark:text-blue-400 border-r border-slate-200 dark:border-slate-700/60 bg-blue-50/30 dark:bg-blue-900/10">
                  {`${formatDetailPercent(bobotStandar)}%`}
                </td>

                {weeksArray.map(w => {
                  const totalActual = getSafeFloat(scheduleData?.matrix_actual?.[item.id]?.[w]);
                  const isExist = scheduleData?.matrix_actual?.[item.id]?.[w] !== undefined;
                  
                  return (
                    <td key={w} className="p-1.5 text-center border-r border-slate-200 dark:border-slate-700/60 relative">
                      {isExist ? (
                        <button 
                          onClick={() => handleOpenCellDetail({ ...item, kategori_nama: cat.nama_kategori }, w)}
                          title="Klik untuk lihat rincian laporan"
                          className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded border transition-colors cursor-pointer shadow-sm active:scale-95 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-800/40 border-emerald-200 dark:border-emerald-800/30"
                        >
                          {formatDetailPercent(totalActual)}
                        </button>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600 text-[10px]">-</span>
                      )}
                    </td>
                  );
                })}

                {isEditMode && canCreateData && <td className="p-1.5 border-r border-slate-200 dark:border-slate-700/60 bg-emerald-50/5 dark:bg-emerald-900/5"></td>}

                <td className="p-2 text-right font-mono text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/10">
                  {itemCumulative > 0 ? `${formatDetailPercent(itemCumulative)}%` : '0.0000%'}
                </td>
              </tr>
            );
          })}
        </React.Fragment>
      );
    });
  }, [displayRabData, weeksArray, scheduleData?.matrix_actual, scheduleData?.cumulative_actual, grandTotalRAB, isEditMode, canCreateData, extraCols]);

  // Warna untuk Sum Deviasi di kolom Kumulatif
  const sumDeviasiColor = !totalsSummary.hasAnyRealisasi
    ? 'text-amber-700 dark:text-amber-400'
    : totalsSummary.sumDeviasi > 0
      ? 'text-emerald-600 dark:text-emerald-400'
      : totalsSummary.sumDeviasi < 0
        ? 'text-rose-600 dark:text-rose-400'
        : 'text-amber-600 dark:text-amber-400';

  const sumDeviasiFormatted = !totalsSummary.hasAnyRealisasi
    ? '-'
    : `${totalsSummary.sumDeviasi > 0 ? '+' : ''}${formatDetailPercent(totalsSummary.sumDeviasi)}%`;

  return (
    <>
      <style>{`.custom-scrollbar::-webkit-scrollbar { height: 5px; width: 5px; } .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 10px; } .dark .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #475569; } .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #f59e0b; cursor: pointer;}`}</style>
      
      {userRole === 'Administrator' && hasAddendum && (
        <div className="flex justify-end mb-2 animate-fade-in">
          <button 
            onClick={() => setShowAddendum(!showAddendum)}
            className={`flex items-center justify-center gap-1.5 p-2 px-3 rounded-lg text-[10px] font-bold border transition-all shadow-sm ${
              showAddendum 
              ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-300 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400' 
              : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            {showAddendum ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
            <span>{showAddendum ? 'Sembunyikan Pekerjaan Tambahan' : 'Tampilkan Pekerjaan Tambahan'}</span>
          </button>
        </div>
      )}

      <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl shadow-sm flex flex-col relative z-0 backdrop-blur-sm transition-all animate-fade-in w-full overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar w-full relative pb-4">
          <table className="w-full text-left border-collapse min-w-max text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700/80 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="p-2.5 w-[75px] text-center border-r border-slate-200 dark:border-slate-700/60">Kode</th>
                <th className="p-2.5 w-[280px] border-r border-slate-200 dark:border-slate-700/60">Uraian Pekerjaan (Realisasi Aktual)</th>
                <th className="p-2.5 w-[65px] text-center border-r border-slate-200 dark:border-slate-700/60 text-blue-600 dark:text-blue-400 bg-blue-50/30 dark:bg-blue-900/10">Bobot</th>

                {weeksArray.map(w => {
                  const currentWeekData = safeLocalWeeks.find(week => parseInt(week.minggu_ke) === w);
                  const tglAwal = currentWeekData?.tanggal_awal ? formatIndoDate(currentWeekData.tanggal_awal) : '?';
                  const tglAkhir = currentWeekData?.tanggal_akhir ? formatIndoDate(currentWeekData.tanggal_akhir) : '?';

                  return (
                    <th key={w} className="p-2 w-[78px] text-center border-r border-slate-200 dark:border-slate-700/60 align-middle">
                      <div className="flex flex-col items-center justify-center h-full gap-1">
                        <div className="relative group cursor-pointer w-full flex justify-center">
                          <span className="border-b border-dashed border-slate-400 dark:border-slate-500 hover:text-amber-500 transition-colors inline-block pb-0.5">
                            M-{w}
                          </span>
                          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-max px-3 py-2 bg-slate-800 dark:bg-slate-700 border border-slate-700 dark:border-slate-600 text-white text-[10px] font-medium rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[60] pointer-events-none flex flex-col items-center">
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-b-slate-800 dark:border-b-slate-700"></div>
                            <span className="text-amber-400 font-extrabold mb-1 tracking-wider uppercase">Rentang Minggu Ke-{w}</span>
                            <span className="flex items-center gap-1.5"><CalendarDays className="w-3 h-3 text-slate-300"/> {tglAwal} - {tglAkhir}</span>
                          </div>
                        </div>

                        {isEditMode && canCreateData && (
                          <div className="flex items-center gap-1 mt-1">
                            <button onClick={() => openWeekModal(w)} className="p-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-blue-500 dark:text-blue-400 rounded hover:bg-blue-50 dark:hover:bg-slate-700 shadow-sm transition-colors" title="Atur Tanggal"><CalendarDays className="w-3 h-3" /></button>
                            <button onClick={() => handleRemoveWeek(w)} className="p-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-rose-500 dark:text-rose-400 rounded hover:bg-rose-50 dark:hover:bg-slate-700 shadow-sm transition-colors" title="Hapus Minggu Ini"><Trash2 className="w-3 h-3" /></button>
                          </div>
                        )}
                      </div>
                    </th>
                  );
                })}

                {isEditMode && canCreateData && (
                  <th className="p-2 w-[78px] text-center border-r border-slate-200 dark:border-slate-700/60 align-middle">
                     <button onClick={() => openWeekModal()} className="w-full py-1.5 flex flex-col items-center justify-center gap-1 text-emerald-500 dark:text-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-lg transition-colors border border-dashed border-emerald-300 dark:border-emerald-500/50 shadow-sm">
                       <Plus className="w-3.5 h-3.5" /> <span className="text-[9px] font-bold">Baru</span>
                     </button>
                  </th>
                )}
                
                <th className="p-2.5 w-[95px] text-right">Kumulatif</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/30 text-slate-700 dark:text-slate-300">
              {renderedTableBody}
            </tbody>
            
            <tfoot className="shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
              {/* 1. BARIS RENCANA MINGGUAN */}
              <tr className="bg-blue-50 dark:bg-blue-500/5 border-t-2 border-blue-200 dark:border-blue-500/20">
                <td colSpan="3" className="p-2 text-right font-extrabold text-blue-600 dark:text-blue-400 uppercase text-[10px] border-r border-blue-200 dark:border-blue-500/20">
                  Rencana Mingguan
                </td>
                {weeksArray.map((w, index) => {
                  const derivedWeekly = weeklyMetrics[w]?.planWeekly ?? 0;
                  const displayValue = isEditMode 
                    ? (localWeeklyInputs[w] ?? '') 
                    : formatDetailPercent(derivedWeekly);
                  
                  return (
                    <td key={w} className="p-1.5 text-center border-r border-blue-200 dark:border-blue-500/20 font-mono text-[10px] font-bold text-blue-600 dark:text-blue-400">
                      {isEditMode ? (
                        <div className="flex items-center justify-center">
                          <input 
                            type="text" 
                            inputMode="decimal"
                            placeholder="0.0000"
                            value={displayValue} 
                            onChange={(e) => {
                                const rawVal = e.target.value.replace(',', '.');
                                if (!/^\d*\.?\d{0,4}$/.test(rawVal)) return;

                                setLocalWeeklyInputs(prev => ({ ...prev, [w]: rawVal }));
                                
                                const valNum = parseFloat(rawVal) || 0;
                                const currentCum = getSafeFloat(safeLocalWeeks.find(week => parseInt(week.minggu_ke) === w)?.target_kumulatif);
                                const prevCum = index === 0 ? 0 : getSafeFloat(safeLocalWeeks.find(week => parseInt(week.minggu_ke) === weeksArray[index-1])?.target_kumulatif);
                                const oldWeeklyNum = parseFloat((currentCum - prevCum).toFixed(4));
                                const delta = parseFloat((valNum - oldWeeklyNum).toFixed(4));

                                for (let i = index; i < weeksArray.length; i++) {
                                    const targetW = weeksArray[i];
                                    const oldCumTarget = getSafeFloat(safeLocalWeeks.find(week => parseInt(week.minggu_ke) === targetW)?.target_kumulatif);
                                    const newCumTarget = Math.max(0, parseFloat((oldCumTarget + delta).toFixed(4)));
                                    handleWeekCumulativeChange(targetW, newCumTarget.toString());
                                }
                            }} 
                            onBlur={() => {
                                const currentVal = getSafeFloat(localWeeklyInputs[w]);
                                setLocalWeeklyInputs(prev => ({ ...prev, [w]: formatDetailPercent(currentVal) }));
                            }}
                            className="w-16 bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-500/50 rounded-md px-1 py-0.5 text-center font-mono font-extrabold text-blue-700 dark:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm text-[10px]"
                          />
                        </div>
                      ) : (
                        displayValue
                      )}
                    </td>
                  );
                })}
                {isEditMode && canCreateData && <td className="border-r border-blue-200 dark:border-blue-500/20 bg-blue-50/10 dark:bg-blue-900/10"></td>}
                {/* KOLOM KUMULATIF: SUM RENCANA MINGGUAN */}
                <td className="p-2 text-right font-mono text-[10px] font-extrabold text-blue-600 dark:text-blue-400">
                  {`${formatDetailPercent(totalsSummary.sumPlan)}%`}
                </td>
              </tr>

              {/* 2. BARIS JUMLAH RENCANA KUMULATIF */}
              <tr className="bg-sky-50 dark:bg-sky-500/5 border-t border-sky-200 dark:border-sky-500/20">
                <td colSpan="3" className="p-2 text-right font-extrabold text-sky-700 dark:text-sky-400 uppercase text-[10px] border-r border-sky-200 dark:border-sky-500/20">
                  Jumlah Rencana Kumulatif
                </td>
                {weeksArray.map(w => (
                  <td key={w} className="p-1.5 text-center border-r border-sky-200 dark:border-sky-500/20">
                    <span className="font-mono text-[10px] font-extrabold text-sky-700 dark:text-sky-400">
                      {formatDetailPercent(weeklyMetrics[w]?.planCum ?? 0)}
                    </span>
                  </td>
                ))}
                {isEditMode && canCreateData && <td className="border-r border-sky-200 dark:border-sky-500/20 bg-sky-50/20 dark:bg-sky-900/10"></td>}
                <td className="p-2 text-right font-mono text-[10px] font-extrabold text-sky-700 dark:text-sky-400">
                  {`${formatDetailPercent(totalsSummary.sumPlan)}%`}
                </td>
              </tr>

              {/* 3. BARIS REALISASI & KOLOM KUMULATIF (SUM REALISASI) */}
              <tr className="bg-emerald-50 dark:bg-emerald-500/5 border-t border-emerald-200 dark:border-emerald-500/20">
                <td colSpan="3" className="p-2.5 text-right font-extrabold text-emerald-600 dark:text-emerald-400 uppercase text-[10px] border-r border-emerald-200 dark:border-emerald-500/20">
                  Realisasi
                </td>
                {weeksArray.map(w => (
                  <td key={w} className="p-2 text-center border-r border-emerald-200 dark:border-emerald-500/20 font-mono text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    {weeklyMetrics[w]?.hasReport ? formatDetailPercent(weeklyMetrics[w].actualWeekly) : '-'}
                  </td>
                ))}
                {isEditMode && canCreateData && <td className="border-r border-emerald-200 dark:border-emerald-500/20 bg-emerald-50/10 dark:bg-emerald-900/10"></td>}
                {/* KOLOM KUMULATIF: SUM REALISASI */}
                <td className="p-2.5 text-right font-mono text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400">
                  {totalsSummary.hasAnyRealisasi ? `${formatDetailPercent(totalsSummary.sumRealisasi)}%` : '0.0000%'}
                </td>
              </tr>

              {/* 4. BARIS DEVIASI & KOLOM KUMULATIF (SUM DEVIASI) */}
              <tr className="bg-rose-50 dark:bg-rose-500/5 border-t border-rose-200 dark:border-rose-500/20">
                <td colSpan="3" className="p-2 text-right font-extrabold text-rose-700 dark:text-rose-400 uppercase text-[10px] border-r border-rose-200 dark:border-rose-500/20">
                  Deviasi
                </td>
                {weeksArray.map(w => {
                  const dev = weeklyMetrics[w]?.deviation;
                  let devClass = "text-slate-500 dark:text-slate-400";
                  let devStr = "-";
                  
                  if (dev !== null && dev !== undefined) {
                      const devFormatted = formatDetailPercent(dev);
                      devStr = dev > 0 ? `+${devFormatted}` : devFormatted;
                      if (dev > 0) devClass = "text-emerald-600 dark:text-emerald-400";
                      else if (dev < 0) devClass = "text-rose-600 dark:text-rose-400";
                      else devClass = "text-amber-600 dark:text-amber-400";
                  }

                  return (
                    <td key={w} className={`p-1.5 text-center border-r border-amber-200 dark:border-amber-500/20 font-mono text-[10px] font-extrabold ${devClass}`}>
                      {devStr}
                    </td>
                  );
                })}
                {isEditMode && canCreateData && <td className="border-r border-amber-200 dark:border-amber-500/20 bg-amber-50/20 dark:bg-amber-900/10"></td>}
                {/* KOLOM KUMULATIF: SUM DEVIASI */}
                <td className={`p-2 text-right font-mono text-[10px] font-extrabold ${sumDeviasiColor}`}>
                  {sumDeviasiFormatted}
                </td>
              </tr>

            </tfoot>
          </table>
        </div>
      </div>

      <div className="mt-2.5 bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/40 rounded-xl py-2 px-3 text-xs flex flex-wrap items-center gap-3 shadow-sm shrink-0">
        <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 text-[11px]"><Info className="w-3.5 h-3.5 text-amber-500 shrink-0" /> Keterangan Matriks:</span>
        <div className="flex gap-x-4 gap-y-1.5 flex-wrap text-slate-500 dark:text-slate-400 text-[11px]">
          <span className="flex items-center gap-1.5"><span className="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/30 font-bold">0.0000</span> Aktual Laporan Harian (Bisa di-klik)</span>
          <span className="flex items-center gap-1.5"><span className="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-800/30 font-bold">0.0000</span> Rencana Mingguan (Edit Plan)</span>
        </div>
      </div>

      {detailModal.show && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-900/40 flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-white uppercase flex gap-2"><Activity className="w-4 h-4 text-emerald-500" /> SUMBER REALISASI HARIAN (M-{detailModal.weekNum})</h3>
              <button onClick={() => setDetailModal({ ...detailModal, show: false })} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"><X className="w-5 h-5"/></button>
            </div>
            
            <div className="overflow-y-auto custom-scrollbar flex-1 bg-white dark:bg-slate-800/80 p-5">
               {(detailModal.realizations || []).length === 0 ? (
                 <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 dark:border-slate-700/60 rounded-xl">
                   <Clock className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
                   <p className="text-slate-500 dark:text-slate-400 text-xs text-center">Belum ada progres harian yang diinput oleh pengawas untuk pekerjaan ini.</p>
                 </div>
               ) : (
                 <div className="border border-slate-200 dark:border-slate-700/60 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-900/50 shadow-sm">
                   <table className="w-full text-left border-collapse">
                     <thead className="bg-slate-100 dark:bg-slate-900/80 text-[10px] text-slate-500 dark:text-slate-400 uppercase border-b border-slate-200 dark:border-slate-700/60">
                       <tr>
                         <th className="p-3 text-center border-r border-slate-200 dark:border-slate-700/60 w-12">Hari</th>
                         <th className="p-3 border-r border-slate-200 dark:border-slate-700/60 w-32">Tanggal Laporan</th>
                         <th className="p-3 border-r border-slate-200 dark:border-slate-700/60">Uraian Pekerjaan</th>
                         <th className="p-3 text-center border-r border-slate-200 dark:border-slate-700/60 w-24">Volume</th>
                         <th className="p-3 text-center border-r border-slate-200 dark:border-slate-700/60 w-24">Aktual (%)</th>
                         <th className="p-3 text-center border-r border-slate-200 dark:border-slate-700/60 w-24">Status</th>
                         {isEditMode && canCreateData && <th className="p-3 text-center w-28">Aksi</th>}
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 text-xs text-slate-800 dark:text-slate-200">
                       {(detailModal.realizations || []).map((r, index) => {
                         const isEditing = inlineEditId === r.activity_id;
                         return (
                           <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                             <td className="p-3 text-center font-mono font-bold text-slate-500">H{index + 1}</td>
                             <td className="p-3 border-r border-slate-200 dark:border-slate-700/60 font-medium">{new Date(r.tgl_input).toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' })}</td>
                             <td className="p-3 border-r border-slate-200 dark:border-slate-700/60 leading-relaxed font-semibold">
                               {r.uraian_laporan || detailModal.item?.uraian_pekerjaan || '-'}
                             </td>
                             <td className="p-3 text-center border-r border-slate-200 dark:border-slate-700/60">
                               {isEditing ? <input type="number" step="any" className="w-full text-center border border-blue-400 rounded p-1 text-xs dark:bg-slate-800 focus:outline-none" value={inlineEditData.volume} onChange={(e)=>setInlineEditData({...inlineEditData, volume: e.target.value})} /> : <span className="font-mono font-bold">{getSafeFloat(r.volume_laporan)} {detailModal.item?.satuan || ''}</span>}
                             </td>
                             <td className="p-3 text-center border-r border-slate-200 dark:border-slate-700/60">
                               {isEditing ? <input type="number" step="any" className="w-full text-center border border-emerald-400 rounded p-1 text-xs dark:bg-slate-800 focus:outline-none text-emerald-600 font-bold" value={inlineEditData.persentase} onChange={(e)=>setInlineEditData({...inlineEditData, persentase: e.target.value})} /> : <span className="font-mono font-extrabold text-emerald-600 dark:text-emerald-400">{formatDetailPercent(r.bobot_realisasi)}%</span>}
                             </td>
                             <td className="p-3 text-center border-r border-slate-200 dark:border-slate-700/60">
                               {r.status_laporan === 'approved' ? <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-900/40 px-2 py-1 rounded border border-emerald-200 dark:border-emerald-800/30 shadow-sm"><CheckCircle2 className="w-3 h-3"/> Disetujui</span> : <span className="text-slate-400 text-[10px]">Pending</span>}
                             </td>
                             {isEditMode && canCreateData && (
                               <td className="p-2 text-center">
                                 {isEditing ? (
                                   <div className="flex gap-1.5 justify-center">
                                     {isSavingInline ? <Loader2 className="w-5 h-5 text-emerald-500 animate-spin"/> : (
                                       <><button onClick={() => saveInlineEdit(r.activity_id)} className="p-1.5 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 shadow-sm"><Check className="w-3.5 h-3.5"/></button><button onClick={() => setInlineEditId(null)} className="p-1.5 bg-rose-500 text-white rounded-md hover:bg-rose-600 shadow-sm"><X className="w-3.5 h-3.5"/></button></>
                                     )}
                                   </div>
                                 ) : <button onClick={() => startInlineEdit(r)} className="flex items-center justify-center gap-1.5 w-full bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-500 hover:text-white text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 px-2 py-1.5 rounded-lg text-[10px] font-bold transition-colors shadow-sm"><Edit3 className="w-3 h-3" /> Edit</button>}
                               </td>
                             )}
                           </tr>
                         );
                       })}
                     </tbody>
                   </table>
                 </div>
               )}
            </div>
            <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex justify-end shrink-0">
              <button onClick={() => setDetailModal({ ...detailModal, show: false })} className="px-6 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 text-xs shadow-sm transition-colors">Tutup Rincian</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}