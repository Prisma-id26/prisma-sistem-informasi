<?php

namespace App\Services;

use Carbon\Carbon;

class KurvaService
{
    public function generateChartData($projectInfo, $schedules, $rawRealizations)
    {
        $weekMap = [];
        foreach ($schedules as $s) {
            $weekMap[$s->minggu_ke] = [
                'minggu_ke' => (int) $s->minggu_ke,
                'tanggal_awal' => $s->tanggal_awal,
                'tanggal_akhir' => $s->tanggal_akhir,
                'target_kumulatif' => (float) $s->target_kumulatif
            ];
        }
        ksort($weekMap);
        $sortedWeeks = array_values($weekMap);

        $dailyRealisasi = [];
        $dailyRealisasiWeeks = [];
        $maxReportedDayStr = '';

        foreach ($rawRealizations as $r) {
            if (!$r->tgl_input) continue;
            $dateStr = explode(' ', explode('T', $r->tgl_input)[0])[0];

            if (!isset($dailyRealisasi[$dateStr])) $dailyRealisasi[$dateStr] = 0;
            $dailyRealisasi[$dateStr] += (float) $r->bobot_realisasi;

            if ($r->minggu_ke) {
                $dailyRealisasiWeeks[$dateStr] = $r->minggu_ke;
            }
            if ($maxReportedDayStr === '' || $dateStr > $maxReportedDayStr) {
                $maxReportedDayStr = $dateStr;
            }
        }

        if (empty($projectInfo->tanggal_mulai)) {
            return []; // Kembalikan array kosong jika proyek belum punya tgl mulai
        }

        $pStart = Carbon::parse($projectInfo->tanggal_mulai)->startOfDay();
        $pEnd = !empty($projectInfo->tanggal_selesai) ? Carbon::parse($projectInfo->tanggal_selesai)->startOfDay() : $pStart->copy()->addDays(30);

        $minDate = $pStart->copy();
        $maxDate = $pEnd->copy();

        foreach ($sortedWeeks as $w) {
            if (!empty($w['tanggal_awal'])) {
                $d = Carbon::parse($w['tanggal_awal'])->startOfDay();
                if ($d->lessThan($minDate)) $minDate = $d->copy();
            }
            if (!empty($w['tanggal_akhir'])) {
                $d = Carbon::parse($w['tanggal_akhir'])->startOfDay();
                if ($d->greaterThan($maxDate)) $maxDate = $d->copy();
            }
        }
        if ($maxReportedDayStr) {
            $d = Carbon::parse($maxReportedDayStr)->startOfDay();
            if ($d->greaterThan($maxDate)) $maxDate = $d->copy();
        }

        $totalDays = $minDate->diffInDays($maxDate) + 1;

        $chartData = [];
        $cumRealisasi = 0;
        $hasAnyReportEver = count($rawRealizations) > 0;
        $months = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

        for ($i = 0; $i < $totalDays; $i++) {
            $currDate = $minDate->copy()->addDays($i);
            $yyyymmdd = $currDate->format('Y-m-d');
            $dateSlash = $currDate->format('d/m/Y');

            $monthIdx = (int) $currDate->format('n');
            $shortDate = $currDate->format('d') . ' ' . $months[$monthIdx];
            $displayDate = $currDate->format('d') . ' ' . $months[$monthIdx] . ' ' . $currDate->format('Y');

            $matchedWeek = null;
            foreach ($sortedWeeks as $w) {
                if (!empty($w['tanggal_awal']) && !empty($w['tanggal_akhir']) && $yyyymmdd >= $w['tanggal_awal'] && $yyyymmdd <= $w['tanggal_akhir']) {
                    $matchedWeek = $w;
                    break;
                }
            }

            $currentWeekNum = null;
            if (isset($dailyRealisasiWeeks[$yyyymmdd])) {
                $currentWeekNum = (int) $dailyRealisasiWeeks[$yyyymmdd];
                if (!$matchedWeek && isset($weekMap[$currentWeekNum])) {
                    $matchedWeek = $weekMap[$currentWeekNum];
                }
            } elseif ($matchedWeek) {
                $currentWeekNum = $matchedWeek['minggu_ke'];
            } else {
                $diffFromStart = $pStart->diffInDays($currDate, false);
                $currentWeekNum = $diffFromStart >= 0 ? (int) floor($diffFromStart / 7) + 1 : 0;
            }

            $targetKumulatifMingguan = $matchedWeek ? (float) $matchedWeek['target_kumulatif'] : null;
            $actVal = $dailyRealisasi[$yyyymmdd] ?? 0;
            $hasReportToday = isset($dailyRealisasi[$yyyymmdd]);

            if ($hasReportToday) {
                $cumRealisasi += $actVal;
            }

            $finalRealisasiKumulatif = null;
            $finalDeviasi = null;

            if ($hasAnyReportEver) {
                if ($maxReportedDayStr && $yyyymmdd > $maxReportedDayStr) {
                    $finalRealisasiKumulatif = null;
                } else {
                    $finalRealisasiKumulatif = $cumRealisasi;
                    if ($targetKumulatifMingguan !== null) {
                        $finalDeviasi = $cumRealisasi - $targetKumulatifMingguan;
                    }
                }
            }

            $chartData[] = [
                'hariKe' => $i + 1,
                'label' => 'H-' . str_pad($i + 1, 2, '0', STR_PAD_LEFT),
                'dateString' => $yyyymmdd,
                'dateSlash' => $dateSlash,
                'displayDate' => $displayDate,
                'shortDate' => $shortDate,
                'mingguKe' => $currentWeekNum,
                'targetKumulatifMingguan' => $targetKumulatifMingguan,
                'rencanaKumulatif' => $targetKumulatifMingguan,
                'bobotRealisasi' => $actVal,
                'realisasiKumulatif' => $finalRealisasiKumulatif,
                'deviasiKumulatif' => $finalDeviasi,
                'hasReportToday' => $hasReportToday
            ];
        }

        return $chartData;
    }
}
