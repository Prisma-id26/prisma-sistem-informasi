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
        .col-bobot { width: 4%; }
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
                                <td style="font-weight: bold;">{{ number_format($item->bobot, 2) }}%</td>

                                @foreach($localWeeks as $w)
                                    @php
                                        $act = $matrix_actual[$item->id][$w->minggu_ke] ?? 0;
                                    @endphp
                                    <td>{{ $act > 0 ? number_format($act, 2) : '-' }}</td>
                                @endforeach

                                @php
                                    $cum = $cumulative_actual[$item->id] ?? 0;
                                @endphp
                                <td style="font-weight: bold; color: #059669;">{{ $cum > 0 ? number_format($cum, 2) . '%' : '-' }}</td>
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
                            $rencanaMingguan = $w->target_kumulatif - $prevTarget;
                            $prevTarget = $w->target_kumulatif;
                        @endphp
                        <th style="color: #2563eb;">{{ $rencanaMingguan > 0 ? number_format($rencanaMingguan, 2) : '-' }}</th>
                    @endforeach
                    <th style="color: #2563eb;">{{ number_format($localWeeks->last()->target_kumulatif ?? 0, 2) }}%</th>
                </tr>

                <!-- BARIS 2: JUMLAH RENCANA KUMULATIF -->
                <tr style="background-color: #e0f2fe;">
                    <th colspan="3" style="text-align: right; color: #0369a1;">Jumlah Rencana Kumulatif</th>
                    @foreach($localWeeks as $w)
                        <th style="color: #0369a1;">{{ $w->target_kumulatif > 0 ? number_format($w->target_kumulatif, 2) : '-' }}</th>
                    @endforeach
                    <th style="color: #0369a1;">-</th>
                </tr>

                <!-- BARIS 3: REALISASI -->
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
                        @php $wAct = $weekly_actual[$w->minggu_ke] ?? 0; @endphp
                        <th style="color: #059669;">{{ $wAct > 0 ? number_format($wAct, 2) : '-' }}</th>
                    @endforeach
                    <th style="color: #059669;">{{ number_format(array_sum($weekly_actual), 2) }}%</th>
                </tr>

                <!-- BARIS 4: DEVIASI -->
                <tr style="background-color: #fffbeb;">
                    <th colspan="3" style="text-align: right; color: #b45309;">Deviasi</th>
                    @php $runningActual = 0; @endphp
                    @foreach($localWeeks as $w)
                        @php
                            $wAct = $weekly_actual[$w->minggu_ke] ?? 0;
                            $runningActual += $wAct;
                            $showCum = ($maxReportedWeek > 0 && $w->minggu_ke <= $maxReportedWeek);
                            $devStr = '-';
                            $color = '#4b5563';

                            if ($showCum) {
                                $dev = $runningActual - $w->target_kumulatif;
                                $devStr = $dev > 0 ? '+'.number_format($dev, 2) : number_format($dev, 2);
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
