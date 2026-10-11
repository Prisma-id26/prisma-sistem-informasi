<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Project;
use App\Models\RabCategory;
use App\Models\RabItem;
use Throwable;
use Illuminate\Support\Facades\Storage;
use Barryvdh\DomPDF\Facade\Pdf;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\KurvaExport;
use App\Services\ProjectProgressService;
use App\Services\ProjectCacheService;
use App\Services\RabService;
use App\Services\KurvaService;

class ProjectScheduleController extends Controller
{
    private $progressService;
    private $kurvaService;

    // SUNTIKKAN SERVICE KE CONSTRUCTOR
    public function __construct(ProjectProgressService $progressService, KurvaService $kurvaService)
    {
        $this->progressService = $progressService;
        $this->kurvaService = $kurvaService;
    }

    private function autoHealLegacyManualItems($projectId)
    {
        $orphanedActivities = DB::table('daily_report_activities')
            ->join('daily_reports', 'daily_report_activities.daily_report_id', '=', 'daily_reports.id')
            ->where('daily_reports.project_id', $projectId)
            ->whereNull('daily_report_activities.rab_item_id')
            ->select('daily_report_activities.id', 'daily_report_activities.uraian', 'daily_report_activities.satuan')
            ->get();

        if ($orphanedActivities->count() > 0) {
            $category = RabCategory::firstOrCreate(
                ['project_id' => $projectId, 'nama_kategori' => 'PEKERJAAN TAMBAHAN (ADDENDUM)'],
                ['kode_divisi' => 'ADD']
            );

            foreach ($orphanedActivities as $act) {
                $item = RabItem::firstOrCreate(
                    ['rab_category_id' => $category->id, 'uraian_pekerjaan' => $act->uraian],
                    ['kode_pekerjaan' => '-', 'satuan' => $act->satuan ?? 'Ls', 'volume' => 0, 'harga_satuan' => 0, 'total_harga' => 0, 'is_subheader' => false]
                );
                DB::table('daily_report_activities')->where('id', $act->id)->update(['rab_item_id' => $item->id]);
            }
            ProjectCacheService::clearProjectCache($projectId);
            RabService::clearCache($projectId);
        }
    }

    public function getSchedules($projectId)
    {
        try {
            $this->autoHealLegacyManualItems($projectId);

            // Pass kurvaService ke dalam closure cache
            $data = ProjectCacheService::rememberSchedule($projectId, function () use ($projectId) {
                $projectInfo = DB::table('projects')->where('id', $projectId)->first();
                $grandTotalRAB = $this->progressService->calculateTotalProjectValue($projectId);

                $rabCategories = DB::table('rab_categories')->where('project_id', $projectId)->get();
                $categoryIds = $rabCategories->pluck('id')->toArray();

                $rabItems = collect([]);
                if (!empty($categoryIds)) {
                    $rabItems = DB::table('rab_items')->whereIn('rab_category_id', $categoryIds)->get();
                }

                $rabData = [];
                foreach ($rabCategories as $cat) {
                    $items = collect($rabItems)->where('rab_category_id', $cat->id)->map(function ($item) use ($grandTotalRAB) {
                        $bobot = ($grandTotalRAB > 0 && !$item->is_subheader) ? ($item->total_harga / $grandTotalRAB) * 100 : 0;
                        $item->bobot = round($bobot, 2);
                        return $item;
                    })->values();

                    if ($items->count() > 0) {
                        $rabData[] = ['id' => $cat->id, 'nama_kategori' => $cat->nama_kategori, 'kode_divisi' => $cat->kode_divisi ?? null, 'items' => $items];
                    }
                }

                $schedules = DB::table('project_schedules')->where('project_id', $projectId)->orderBy('minggu_ke', 'asc')->get();

                $matrix_actual = [];
                $weekly_actual = [];
                $cumulative_actual = [];

                $rawRealizations = DB::table('daily_report_activities')
                    ->join('daily_reports', 'daily_report_activities.daily_report_id', '=', 'daily_reports.id')
                    ->where('daily_reports.project_id', $projectId)
                    ->where('daily_reports.status', 'approved')
                    ->select('daily_reports.id as report_id', 'daily_report_activities.id as activity_id', 'daily_report_activities.uraian as uraian_laporan', 'daily_report_activities.rab_item_id', 'daily_reports.minggu_ke', 'daily_reports.tanggal as tgl_input', 'daily_report_activities.volume as volume_laporan', 'daily_report_activities.persentase as bobot_realisasi', 'daily_reports.status as status_laporan')
                    ->get();

                $aggregatedActuals = DB::table('daily_report_activities')
                    ->join('daily_reports', 'daily_report_activities.daily_report_id', '=', 'daily_reports.id')
                    ->where('daily_reports.project_id', $projectId)
                    ->where('daily_reports.status', 'approved')
                    ->select('daily_report_activities.rab_item_id', 'daily_reports.minggu_ke', DB::raw('SUM(daily_report_activities.persentase) as total_persen'))
                    ->groupBy('daily_report_activities.rab_item_id', 'daily_reports.minggu_ke')
                    ->get();

                foreach ($aggregatedActuals as $r) {
                    $itemId = $r->rab_item_id;
                    $minggu = $r->minggu_ke ?? 0;
                    $persen = (float) $r->total_persen;

                    if ($itemId) {
                        if (!isset($matrix_actual[$itemId])) $matrix_actual[$itemId] = [];
                        $matrix_actual[$itemId][$minggu] = $persen;

                        if (!isset($weekly_actual[$minggu])) $weekly_actual[$minggu] = 0;
                        $weekly_actual[$minggu] += $persen;

                        if (!isset($cumulative_actual[$itemId])) $cumulative_actual[$itemId] = 0;
                        $cumulative_actual[$itemId] += $persen;
                    }
                }

                // ==========================================================
                // EKSEKUSI SERVICE DI BACKEND
                // ==========================================================
                $chartData = $this->kurvaService->generateChartData($projectInfo, $schedules, $rawRealizations);

                return [
                    'project_info' => $projectInfo, 'grand_total_rab' => (float) $grandTotalRAB, 'rab_data' => $rabData,
                    'schedules' => $schedules, 'matrix_actual' => $matrix_actual, 'weekly_actual' => $weekly_actual,
                    'cumulative_actual' => $cumulative_actual, 'realizations' => $rawRealizations,
                    'full_chart_data' => $chartData // KEMBALIKAN KE FRONTEND
                ];
            });

            return response()->json(['status' => 'success', 'data' => $data]);
        } catch (Throwable $e) {
            return response()->json(['status' => 'error', 'message' => 'Backend Crash: ' . $e->getMessage() . ' | Line: ' . $e->getLine()], 500);
        }
    }
    public function saveSchedules(Request $request, $projectId)
    {
        try {
            DB::beginTransaction();

            $isFullSync = $request->input('full_sync', false);
            $weeks = $request->input('weeks', []);

            if ($isFullSync) {
                DB::table('project_schedules')->where('project_id', $projectId)->delete();
            } else {
                foreach ($weeks as $week) {
                    DB::table('project_schedules')->where('project_id', $projectId)->where('minggu_ke', $week['minggu_ke'])->delete();
                }
            }

            $insertData = [];
            $now = now();
            foreach ($weeks as $week) {
                $insertData[] = [
                    'project_id' => $projectId, 'minggu_ke' => $week['minggu_ke'], 'bulan' => $week['bulan'] ?? null,
                    'tanggal_awal' => $week['tanggal_awal'] ?? null, 'tanggal_akhir' => $week['tanggal_akhir'] ?? null,
                    'target_kumulatif' => (float) ($week['target_kumulatif'] ?? 0), 'created_at' => $now, 'updated_at' => $now,
                ];
            }

            if (!empty($insertData)) DB::table('project_schedules')->insert($insertData);

            $project = Project::find($projectId);
            if ($project && $project->status === 'Perencanaan') $project->update(['status' => 'Persiapan']);

            DB::commit();
            ProjectCacheService::clearProjectCache($projectId);
            return response()->json(['status' => 'success', 'message' => 'Jadwal Mingguan (Plan) berhasil disimpan!']);
        } catch (Throwable $e) {
            DB::rollBack();
            return response()->json(['status' => 'error', 'message' => 'System Crash: ' . $e->getMessage()], 500);
        }
    }

    public function destroySchedules($projectId)
    {
        try {
            DB::beginTransaction();
            DB::table('project_schedules')->where('project_id', $projectId)->delete();
            DB::commit();
            ProjectCacheService::clearProjectCache($projectId);
            return response()->json(['status' => 'success', 'message' => 'Seluruh Jadwal Matriks berhasil dikosongkan.']);
        } catch (Throwable $e) {
            DB::rollBack();
            return response()->json(['status' => 'error', 'message' => 'Gagal menghapus jadwal: ' . $e->getMessage()], 500);
        }
    }

    private function prepareExportData($projectId, $request)
    {
        $this->autoHealLegacyManualItems($projectId);

        $projectInfo = DB::table('projects')->where('id', $projectId)->first();
        $grandTotalRAB = $this->progressService->calculateTotalProjectValue($projectId);

        $schedules = DB::table('project_schedules')->where('project_id', $projectId)->orderBy('minggu_ke', 'asc')->get();

        $matrix_actual = [];
        $weekly_actual = [];
        $cumulative_actual = [];

        try {
            $aggregatedActuals = DB::table('daily_report_activities')
                ->join('daily_reports', 'daily_report_activities.daily_report_id', '=', 'daily_reports.id')
                ->where('daily_reports.project_id', $projectId)
                ->where('daily_reports.status', 'approved')
                ->select('daily_report_activities.rab_item_id', 'daily_reports.minggu_ke', DB::raw('SUM(daily_report_activities.persentase) as total_persen'))
                ->groupBy('daily_report_activities.rab_item_id', 'daily_reports.minggu_ke')
                ->get();

            foreach ($aggregatedActuals as $r) {
                $itemId = $r->rab_item_id;
                $minggu = $r->minggu_ke ?? 0;
                $persen = (float) $r->total_persen;

                if ($itemId) {
                    if (!isset($matrix_actual[$itemId])) $matrix_actual[$itemId] = [];
                    $matrix_actual[$itemId][$minggu] = $persen;
                    if (!isset($weekly_actual[$minggu])) $weekly_actual[$minggu] = 0;
                    $weekly_actual[$minggu] += $persen;
                    if (!isset($cumulative_actual[$itemId])) $cumulative_actual[$itemId] = 0;
                    $cumulative_actual[$itemId] += $persen;
                }
            }
        } catch (Throwable $th) {}

        $showAddendum = filter_var($request->show_addendum, FILTER_VALIDATE_BOOLEAN);
        $rabCatQuery = DB::table('rab_categories')->where('project_id', $projectId);

        if (!$showAddendum) {
            $rabCatQuery->where('nama_kategori', '!=', 'PEKERJAAN TAMBAHAN (ADDENDUM)');
        }

        $rabCategories = $rabCatQuery->get();
        $categoryIds = $rabCategories->pluck('id')->toArray();

        $rabItems = collect([]);
        if (!empty($categoryIds)) $rabItems = DB::table('rab_items')->whereIn('rab_category_id', $categoryIds)->get();

        $rabData = [];
        foreach ($rabCategories as $cat) {
            $items = collect($rabItems)->where('rab_category_id', $cat->id)->map(function ($item) use ($grandTotalRAB) {
                $bobot = ($grandTotalRAB > 0 && !$item->is_subheader) ? ($item->total_harga / $grandTotalRAB) * 100 : 0;
                $item->bobot = round($bobot, 2);
                return $item;
            })->values();

            if ($items->count() > 0) $rabData[] = ['id' => $cat->id, 'nama_kategori' => $cat->nama_kategori, 'kode_divisi' => $cat->kode_divisi ?? null, 'items' => $items];
        }

        return [
            'project' => $projectInfo, 'rabData' => $rabData, 'localWeeks' => $schedules, 'matrix_actual' => $matrix_actual,
            'weekly_actual' => $weekly_actual, 'cumulative_actual' => $cumulative_actual, 'grandTotalRAB' => $grandTotalRAB,
            'startDate' => $request->start_date, 'endDate' => $request->end_date, 'viewMode' => $request->view_mode
        ];
    }

    public function exportKurvaPdf(Request $request, $projectId)
    {
        $exportData = $this->prepareExportData($projectId, $request);
        $exportData['isExcel'] = false; // FLAG PDF
        $exportData['chartImageBase64'] = $request->chart_image ?? null;

        $pdf = Pdf::loadView('exports.kurva-s', $exportData)->setPaper('a4', 'landscape');
        $safeName = preg_replace('/[^A-Za-z0-9\-]/', '_', $exportData['project']->nama_proyek ?? 'Proyek');
        return $pdf->download("KurvaS_Matriks_{$safeName}.pdf");
    }

    public function exportKurvaExcel(Request $request, $projectId)
    {
        try {
            $exportData = $this->prepareExportData($projectId, $request);
            $exportData['isExcel'] = true; // FLAG EXCEL SANGAT PENTING

            $safeName = preg_replace('/[^A-Za-z0-9\-]/', '_', $exportData['project']->nama_proyek ?? 'Proyek');
            $export = new KurvaExport($exportData);
            return Excel::download($export, "KurvaS_Matriks_{$safeName}.xlsx");
        } catch (Throwable $e) {
            return response()->json(['status' => 'error', 'message' => 'Gagal export Excel: ' . $e->getMessage() . ' di baris ' . $e->getLine()], 500);
        }
    }
}
