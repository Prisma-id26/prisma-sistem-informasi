@php
    // Helper pemformatan desimal fleksibel (identik dengan formatDetailPercent di Frontend)
    $formatPercent = function ($val) {
        $num = (float) ($val ?? 0);
        if (abs($num) < 0.00001) return '0.00';
        $fixed4 = round($num, 4);
        $str4 = rtrim(rtrim(number_format($fixed4, 4, '.', ''), '0'), '.');
        $parts = explode('.', $str4);
        if (!isset($parts[1]) || strlen($parts[1]) <= 2) {
            return number_format($fixed4, 2, '.', '');
        }
        return $str4;
    };
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
        .col-total { width: 6%; }
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
                    <th class="col-total">Total</th>
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
                                <td style="font-weight: bold; color: #059669;">{{ $cum > 0 ? $formatPercent($cum) . '%' : '-' }}</td>
                            </tr>
                        @endif
                    @endforeach
                @endforeach
            </tbody>

            <tfoot>
                <!-- BARIS 1: RENCANA MINGGUAN -->
                <tr style="background-color: #eff6ff;">
                    <th colspan="3" style="text-align: right; color: #2563eb;">Rencana Mingguan</th>
                    @php $prevTarget = 0; @endphp
                    @foreach($localWeeks as $w)
                        @php
                            $rencanaMingguan = round($w->target_kumulatif - $prevTarget, 4);
                            $prevTarget = $w->target_kumulatif;
                        @endphp
                        <th style="color: #2563eb;">{{ $formatPercent($rencanaMingguan) }}</th>
                    @endforeach
                    <th style="color: #2563eb;">{{ $formatPercent($localWeeks->last()->target_kumulatif ?? 0) }}%</th>
                </tr>

                <!-- BARIS 2: JUMLAH RENCANA KUMULATIF -->
                <tr style="background-color: #e0f2fe;">
                    <th colspan="3" style="text-align: right; color: #0369a1;">Jumlah Rencana Kumulatif</th>
                    @foreach($localWeeks as $w)
                        <th style="color: #0369a1;">{{ $formatPercent($w->target_kumulatif) }}</th>
                    @endforeach
                    <th style="color: #0369a1;">-</th>
                </tr>

                <!-- BARIS 3: REALISASI (KUMULATIF SESUAI FRONTEND) -->
                <tr style="background-color: #ecfdf5;">
                    <th colspan="3" style="text-align: right; color: #059669;">Realisasi</th>
                    @php
                        $runningActual = 0;
                        $maxReportedWeek = 0;
                        if (!empty($weekly_actual)) {
                            $maxReportedWeek = max(array_keys($weekly_actual));
                        }
                    @endphp
                    @foreach($localWeeks as $w)
                        @php
                            $wAct = $weekly_actual[$w->minggu_ke] ?? 0;
                            $runningActual = round($runningActual + $wAct, 4);
                            $hasReport = ($maxReportedWeek > 0 && $w->minggu_ke <= $maxReportedWeek);
                        @endphp
                        <th style="color: #059669;">{{ $hasReport ? $formatPercent($runningActual) : '-' }}</th>
                    @endforeach
                    <th style="color: #059669;">{{ $formatPercent(array_sum($weekly_actual)) }}%</th>
                </tr>

                <!-- BARIS 4: DEVIASI -->
                <tr style="background-color: #fffbeb;">
                    <th colspan="3" style="text-align: right; color: #b45309;">Deviasi</th>
                    @php $runningActual = 0; @endphp
                    @foreach($localWeeks as $w)
                        @php
                            $wAct = $weekly_actual[$w->minggu_ke] ?? 0;
                            $runningActual = round($runningActual + $wAct, 4);
                            $showCum = ($maxReportedWeek > 0 && $w->minggu_ke <= $maxReportedWeek);
                            $devStr = '-';
                            $color = '#4b5563';

                            if ($showCum) {
                                $dev = round($runningActual - $w->target_kumulatif, 4);
                                $devFormatted = $formatPercent($dev);
                                $devStr = $dev > 0 ? '+' . $devFormatted : $devFormatted;
                                $color = $dev < 0 ? '#dc2626' : ($dev > 0 ? '#059669' : '#d97706');
                            }
                        @endphp
                        <th style="color: {{ $color }};">{{ $devStr }}</th>
                    @endforeach
                    <th style="color: #b45309;">-</th>
                </tr>
            </tfoot>
        </table>

@if(!isset($isExcel) || !$isExcel)
    </div>
</body>
</html>
@endif
