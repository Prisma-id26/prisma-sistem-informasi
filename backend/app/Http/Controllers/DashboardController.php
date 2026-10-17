<?php

namespace App\Http\Controllers;

use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    // MENGGUNAKAN MESIN HITUNG YANG SAMA DENGAN PROJECT & KURVA S
    private function injectProgressToCollection($projects)
    {
        if ($projects->isEmpty()) return $projects;

        $projectIds = $projects->pluck('id')->toArray();

        $allSchedules = DB::table('project_schedules')
            ->whereIn('project_id', $projectIds)
            ->orderBy('minggu_ke', 'asc')
            ->get()
            ->groupBy('project_id');

        $weeklyActualsRows = DB::table('daily_report_activities')
            ->join('daily_reports', 'daily_report_activities.daily_report_id', '=', 'daily_reports.id')
            ->whereIn('daily_reports.project_id', $projectIds)
            ->where('daily_reports.status', 'approved')
            ->select(
                'daily_reports.project_id',
                'daily_reports.minggu_ke',
                DB::raw('SUM(daily_report_activities.persentase) as total_persen')
            )
            ->groupBy('daily_reports.project_id', 'daily_reports.minggu_ke')
            ->get()
            ->groupBy('project_id');

        return $projects->map(function ($project) use ($allSchedules, $weeklyActualsRows) {
            $schedules = $allSchedules[$project->id] ?? collect([]);
            $actualRows = $weeklyActualsRows[$project->id] ?? collect([]);

            $weeklyActualMap = [];
            foreach ($actualRows as $row) {
                $w = (int) $row->minggu_ke;
                $weeklyActualMap[$w] = round((float) $row->total_persen, 4);
            }

            $uniqueWeeks = [];
            foreach ($schedules as $s) {
                $wNum = (int) $s->minggu_ke;
                if (!isset($uniqueWeeks[$wNum])) {
                    $uniqueWeeks[$wNum] = (float) $s->target_kumulatif;
                }
            }
            ksort($uniqueWeeks);

            $sumPlan = 0;
            $sumRealisasi = 0;
            $sumDeviasi = 0;
            $prevCumPlan = 0;
            $hasAnyRealisasi = false;

            foreach ($uniqueWeeks as $wNum => $currentCumPlan) {
                $planWeekly = round($currentCumPlan - $prevCumPlan, 4);
                $prevCumPlan = $currentCumPlan;
                $sumPlan = round($sumPlan + $planWeekly, 4);

                if (isset($weeklyActualMap[$wNum])) {
                    $hasAnyRealisasi = true;
                    $actWeekly = $weeklyActualMap[$wNum];
                    $devWeekly = round($actWeekly - $planWeekly, 4);

                    $sumRealisasi = round($sumRealisasi + $actWeekly, 4);
                    $sumDeviasi = round($sumDeviasi + $devWeekly, 4);
                }
            }

            foreach ($weeklyActualMap as $wNum => $actWeekly) {
                if (!isset($uniqueWeeks[$wNum])) {
                    $hasAnyRealisasi = true;
                    $sumRealisasi = round($sumRealisasi + $actWeekly, 4);
                    $sumDeviasi = round($sumDeviasi + $actWeekly, 4);
                }
            }

            $project->progress_plan = round($sumPlan, 4);
            $project->progress_actual = round($sumRealisasi, 4);
            $project->deviasi = $hasAnyRealisasi ? round($sumDeviasi, 4) : 0;

            if ($project->status !== 'Selesai') {
                if ($sumPlan == 0 && $sumRealisasi == 0) {
                    $project->status = 'Belum Mulai';
                } else if ($project->deviasi < -5) {
                    $project->status = 'Kritis';
                } else if ($project->deviasi < 0) {
                    $project->status = 'Terlambat';
                } else {
                    $project->status = 'On Track';
                }
            }

            return $project;
        });
    }

    // PERBAIKAN: Ubah nama fungsi dari summary() menjadi index() agar cocok dengan api.php
    public function index()
    {
        try {
            $projects = Project::all();
            $projectsWithProgress = $this->injectProgressToCollection($projects);

            $activeProjects = $projectsWithProgress->filter(function ($p) {
                return !in_array($p->status, ['Selesai', 'Selesai 100%', 'Batal']);
            });

            // 1. KPI
            $totalProyek = $activeProjects->count();

            // Memaksa casting ke (float) untuk mencegah TypeError
            $nilaiKontrak = (float) $activeProjects->sum('nilai_kontrak');
            $rataDeviasi = $activeProjects->count() > 0 ? (float) $activeProjects->avg('deviasi') : 0.0;
            $proyekKritis = $activeProjects->where('status', 'Kritis')->count();

            // 2. Chart
            $chartProgressData = $activeProjects->map(function ($p) {
                return [
                    'name' => $p->nama_proyek,
                    'plan' => (float) $p->progress_plan,
                    'actual' => (float) $p->progress_actual,
                    'deviasi' => (float) $p->deviasi
                ];
            })->values();

            // 3. Proyek Aktif Teratas
            $proyekAktif = $activeProjects->map(function ($p) {
                return [
                    'id' => $p->id,
                    'nama' => $p->nama_proyek,
                    'progress' => (float) $p->progress_actual,
                    'plan' => (float) $p->progress_plan,
                    'deviasi' => (float) $p->deviasi,
                    'status' => $p->status
                ];
            })->sortBy('deviasi')->take(5)->values();

            // 4. Laporan Terbaru
            $laporanTerbaru = DB::table('daily_reports')
                ->join('projects', 'daily_reports.project_id', '=', 'projects.id')
                ->orderBy('daily_reports.tanggal', 'desc')
                ->orderBy('daily_reports.id', 'desc')
                ->take(5)
                ->select(
                    'daily_reports.id',
                    'projects.nama_proyek as proyek',
                    'daily_reports.pengawas',
                    'daily_reports.tanggal',
                    'daily_reports.status'
                )
                ->get()
                ->map(function ($lap) {
                    $kegiatanCount = DB::table('daily_report_activities')->where('daily_report_id', $lap->id)->count();
                    return [
                        'id' => $lap->id,
                        'proyek' => $lap->proyek,
                        'pengawas' => $lap->pengawas,
                        'tanggal' => date('d M Y', strtotime($lap->tanggal)),
                        'status' => ucfirst($lap->status),
                        'jumlahKegiatan' => $kegiatanCount,
                        'originalData' => $lap
                    ];
                });

            return response()->json([
                'status' => 'success',
                'data' => [
                    'kpi' => [
                        'totalProyek' => $totalProyek,
                        'nilaiKontrak' => number_format($nilaiKontrak, 0, ',', '.'),
                        'rataDeviasi' => number_format($rataDeviasi, 4, '.', ''),
                        'proyekKritis' => $proyekKritis
                    ],
                    'chartProgressData' => $chartProgressData,
                    'proyekAktif' => $proyekAktif,
                    'laporanTerbaru' => $laporanTerbaru
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Kesalahan Server: ' . $e->getMessage()
            ], 500);
        }
    }
}
