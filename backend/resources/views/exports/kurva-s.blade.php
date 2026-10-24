@php
    // Format seragam 4 desimal agar identik dengan formatDetailPercent di ScheduleWorkData.jsx
    $formatPercent = function ($val) {
        $num = (float) ($val ?? 0);
        return number_format(round($num, 4), 4, '.', '');
    };

    $maxReportedWeek = 0;
    if (!empty($weekly_actual)) {
        $maxReportedWeek = max(array_keys($weekly_actual));
    }

    $sumPlan = 0;
    $sumRealisasi = 0;
    $sumDeviasi = 0;
    $hasAnyRealisasi = false;
    $prevPlanCum = 0;

    $footerMetrics = [];
    foreach ($localWeeks as $w) {
        $wNum = (int) $w->minggu_ke;
        $planCum = round((float) $w->target_kumulatif, 4);
        $planWeekly = round($planCum - $prevPlanCum, 4);
        $prevPlanCum = $planCum;

        $sumPlan = round($sumPlan + $planWeekly, 4);

        $hasWeekReport = isset($weekly_actual[$wNum]);
        $actualWeekly = $hasWeekReport ? round((float) $weekly_actual[$wNum], 4) : 0;

        $devWeekly = null;
        if ($hasWeekReport) {
            $hasAnyRealisasi = true;
            $devWeekly = round($actualWeekly - $planWeekly, 4);
            $sumRealisasi = round($sumRealisasi + $actualWeekly, 4);
            $sumDeviasi = round($sumDeviasi + $devWeekly, 4);
        }

        $hasCumReport = ($maxReportedWeek > 0 && $wNum <= $maxReportedWeek);
        $actualCum = $hasCumReport ? $sumRealisasi : null;

        $footerMetrics[$wNum] = [
            'planWeekly' => $planWeekly,
            'planCum' => $planCum,
            'actualWeekly' => $actualWeekly,
            'actualCum' => $actualCum,
            'deviation' => $devWeekly,
            'hasReport' => $hasWeekReport,
            'hasCumReport' => $hasCumReport,
        ];
    }
@endphp

@if(!isset($isExcel) || !$isExcel)
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Kurva S - {{ $project->nama_proyek }}</title>
    <style>
        body { font-family: Arial, sans-serif; font-size: 8px; margin: 0; padding: 0; }
        .page-break { page-break-after: always; }
        .chart-container { width: 100%; text-align: center; margin-bottom: 20px; }
        .chart-container h2 { margin-bottom: 5px; font-size: 16px; }
        .chart-container p { margin-top: 0; margin-bottom: 15px; font-size: 12px; color: #555; }
        .chart-container img { width: 100%; height: auto; max-height: 165mm; object-fit: contain; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; table-layout: fixed; }
        th, td { border: 1px solid #333; padding: 4px 2px; text-align: center; word-wrap: break-word; vertical-align: middle; }
        th { background-color: #f3f4f6; font-weight: bold; }
        .text-left { text-align: left; }
        .col-kode { width: 6%; }
        .col-uraian { width: 25%; }
        .col-bobot { width: 5%; }
        .col-total { width: 7%; }
    </style>
</head>
<body>

    @if(!empty($chartImageBase64))
    <div class="chart-container">
        <h2>GRAFIK KURVA S & JADWAL PROYEK</h2>
        <p>{{ strtoupper($project->nama_proyek) }}</p>
        <img src="{{ $chartImageBase64 }}" alt="Grafik Kurva S">
    </div>
    <div class="page-break"></div>
    @endif

    <div class="table-container">
        @if(empty($chartImageBase64))
            <h2 style="text-align:center; margin-bottom: 15px;">MATRIKS SCHEDULE PROYEK - {{ strtoupper($project->nama_proyek) }}</h2>
        @else
            <h3 style="margin-bottom: 10px; text-align: center;">TABEL RINCIAN MATRIKS REALISASI</h3>
        @endif
@endif

        <table>
            <thead>
                <tr>
                    <th class="col-kode">Kode</th>
                    <th class="col-uraian">Uraian Pekerjaan</th>
                    <th class="col-bobot">Bobot</th>
                    @foreach($localWeeks as $w)
                        <th>M-{{ $w->minggu_ke }}</th>
                    @endforeach
                    <th class="col-total">Kumulatif</th>
                </tr>
            </thead>
            <tbody>
                @foreach($rabData as $divisi)
                    <tr style="background-color: #f8fafc;">
                        <td class="text-left"><b>{{ $divisi['kode_divisi'] }}</b></td>
                        <td class="text-left" colspan="{{ count($localWeeks) + 3 }}"><b>{{ $divisi['nama_kategori'] }}</b></td>
                    </tr>

                    @foreach($divisi['items'] as $item)
                        @if($item->is_subheader)
                            <tr style="background-color: #fdf6e3;">
                                <td class="text-left" style="font-weight: bold; color: #d97706;">{{ $item->kode_pekerjaan }}</td>
                                <td class="text-left" colspan="{{ count($localWeeks) + 3 }}"><b>{{ $item->uraian_pekerjaan }}</b></td>
                            </tr>
                        @else
                            <tr>
                                <td class="text-left" style="font-size: 7px;">{{ $item->kode_pekerjaan }}</td>
                                <td class="text-left">{{ $item->uraian_pekerjaan }}</td>
                                <td style="font-weight: bold;">{{ $formatPercent($item->bobot) }}%</td>

                                @foreach($localWeeks as $w)
                                    @php
                                        $isExist = isset($matrix_actual[$item->id][$w->minggu_ke]);
                                        $act = $matrix_actual[$item->id][$w->minggu_ke] ?? 0;
                                    @endphp
                                    <td>{{ ($isExist || $act > 0) ? $formatPercent($act) : '-' }}</td>
                                @endforeach

                                @php
                                    $cum = $cumulative_actual[$item->id] ?? 0;
                                @endphp
                                <td style="font-weight: bold; color: #059669;">{{ $cum > 0 ? $formatPercent($cum) . '%' : '0.0000%' }}</td>
                            </tr>
                        @endif
                    @endforeach
                @endforeach
            </tbody>

            <tfoot>
                <!-- BARIS 1: RENCANA MINGGUAN -->
                <tr style="background-color: #eff6ff;">
                    <th colspan="3" style="text-align: right; color: #2563eb;">Rencana Mingguan</th>
                    @foreach($localWeeks as $w)
                        @php $m = $footerMetrics[(int) $w->minggu_ke]; @endphp
                        <th style="color: #2563eb;">{{ $formatPercent($m['planWeekly']) }}</th>
                    @endforeach
                    <th style="color: #2563eb;">{{ $formatPercent($sumPlan) }}%</th>
                </tr>

                <!-- BARIS 2: JUMLAH RENCANA KUMULATIF -->
                <tr style="background-color: #e0f2fe;">
                    <th colspan="3" style="text-align: right; color: #0369a1;">Jumlah Rencana Kumulatif</th>
                    @foreach($localWeeks as $w)
                        @php $m = $footerMetrics[(int) $w->minggu_ke]; @endphp
                        <th style="color: #0369a1;">{{ $formatPercent($m['planCum']) }}</th>
                    @endforeach
                    <th style="color: #0369a1;">{{ $formatPercent($sumPlan) }}%</th>
                </tr>

                <!-- BARIS 3: REALISASI (MINGGUAN) -->
                <tr style="background-color: #ecfdf5;">
                    <th colspan="3" style="text-align: right; color: #059669;">Realisasi</th>
                    @foreach($localWeeks as $w)
                        @php $m = $footerMetrics[(int) $w->minggu_ke]; @endphp
                        <th style="color: #059669;">{{ $m['hasReport'] ? $formatPercent($m['actualWeekly']) : '-' }}</th>
                    @endforeach
                    <th style="color: #059669;">{{ $hasAnyRealisasi ? $formatPercent($sumRealisasi) . '%' : '0.0000%' }}</th>
                </tr>

                <!-- BARIS 4: JUMLAH REALISASI KUMULATIF -->
                <tr style="background-color: #ccfbf1;">
                    <th colspan="3" style="text-align: right; color: #0f766e;">Jumlah Realisasi Kumulatif</th>
                    @foreach($localWeeks as $w)
                        @php $m = $footerMetrics[(int) $w->minggu_ke]; @endphp
                        <th style="color: #0f766e;">{{ $m['hasCumReport'] ? $formatPercent($m['actualCum']) : '-' }}</th>
                    @endforeach
                    <th style="color: #0f766e;">{{ $hasAnyRealisasi ? $formatPercent($sumRealisasi) . '%' : '0.0000%' }}</th>
                </tr>

                <!-- BARIS 5: DEVIASI -->
                <tr style="background-color: #fff1f2;">
                    <th colspan="3" style="text-align: right; color: #be123c;">Deviasi</th>
                    @foreach($localWeeks as $w)
                        @php
                            $m = $footerMetrics[(int) $w->minggu_ke];
                            $dev = $m['deviation'];
                            $devStr = '-';
                            $color = '#64748b';

                            if ($dev !== null) {
                                $devFormatted = $formatPercent($dev);
                                $devStr = $dev > 0 ? '+' . $devFormatted : $devFormatted;
                                $color = $dev < 0 ? '#dc2626' : ($dev > 0 ? '#059669' : '#d97706');
                            }
                        @endphp
                        <th style="color: {{ $color }};">{{ $devStr }}</th>
                    @endforeach
                    @php
                        $sumDevColor = !$hasAnyRealisasi ? '#b45309' : ($sumDeviasi < 0 ? '#dc2626' : ($sumDeviasi > 0 ? '#059669' : '#d97706'));
                        $sumDevStr = !$hasAnyRealisasi ? '-' : (($sumDeviasi > 0 ? '+' : '') . $formatPercent($sumDeviasi) . '%');
                    @endphp
                    <th style="color: {{ $sumDevColor }};">{{ $sumDevStr }}</th>
                </tr>
            </tfoot>
        </table>

@if(!isset($isExcel) || !$isExcel)
    </div>
</body>
</html>
@endif
