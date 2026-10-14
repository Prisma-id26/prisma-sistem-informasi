<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\ProjectDocument;
use App\Services\ProjectCacheService;
use App\Services\RabService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Barryvdh\DomPDF\Facade\Pdf;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\ProjectDetailExport;
use App\Imports\ProjectsImport;
use PhpOffice\PhpSpreadsheet\Shared\Date;
use Illuminate\Support\Str;

class ProjectController extends Controller
{
    private function injectProgressToCollection($projects)
    {
        if ($projects->isEmpty()) return $projects;

        $projectIds = $projects->pluck('id')->toArray();

        // 1. Ambil seluruh jadwal mingguan per proyek (diurutkan berdasarkan minggu_ke)
        $allSchedules = DB::table('project_schedules')
            ->whereIn('project_id', $projectIds)
            ->orderBy('minggu_ke', 'asc')
            ->get()
            ->groupBy('project_id');

        // 2. Ambil realisasi mingguan per proyek dari laporan harian yang disetujui (approved)
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

        // 3. Hitung Kolom Kumulatif (Sum Plan, Sum Realisasi, Sum Deviasi) persis seperti ScheduleWorkData.jsx
        return $projects->map(function ($project) use ($allSchedules, $weeklyActualsRows) {
            $schedules = $allSchedules[$project->id] ?? collect([]);
            $actualRows = $weeklyActualsRows[$project->id] ?? collect([]);

            // Peta mingguan: minggu_ke => total_persen
            $weeklyActualMap = [];
            foreach ($actualRows as $row) {
                $w = (int) $row->minggu_ke;
                $weeklyActualMap[$w] = round((float) $row->total_persen, 4);
            }

            // Dedup jadwal per minggu_ke sebagaimana di frontend
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

            // Jika ada realisasi pada minggu di luar jadwal yang terdaftar, tetap tambahkan ke sumRealisasi
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

    public function index()
    {
        $projects = Project::orderBy('created_at', 'desc')->get();
        $optimizedProjects = $this->injectProgressToCollection($projects);

        return response()->json($optimizedProjects);
    }

    public function show($id)
    {
        $project = Project::with(['personnels', 'documents', 'gisDocuments'])->findOrFail($id);
        $optimizedProject = $this->injectProgressToCollection(collect([$project]))->first();

        return response()->json($optimizedProject);
    }

    public function getActiveForReport()
    {
        $projects = Project::whereNotIn('status', ['Selesai', 'Selesai 100%', 'Batal'])->get();

        $validProjects = $projects->filter(function ($project) {
            return DB::table('project_schedules')->where('project_id', $project->id)->exists();
        })->values();

        $optimizedActive = $this->injectProgressToCollection($validProjects);

        return response()->json(['status' => 'success', 'data' => $optimizedActive]);
    }

    private function clearGlobalProjectCache($projectId = null)
    {
        Cache::forget('all_projects_list_cache');
        Cache::forget('active_projects_for_report');
        if ($projectId) {
            ProjectCacheService::clearProjectCache($projectId);
            RabService::clearCache($projectId);
        }
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama_proyek' => 'required|string|max:255',
            'kategori' => 'nullable|string|max:255',
            'kode_kontrak' => 'required|string|max:255',
            'nomor_kontrak_kontraktor' => 'nullable|string|max:255',
            'sumber_dana' => 'nullable|string|max:255',
            'tahun_anggaran' => 'nullable|string|max:4',
            'nilai_kontrak' => 'required|numeric',
            'tanggal_mulai' => 'required|date',
            'tanggal_selesai' => 'nullable|date',
            'waktu_pelaksanaan' => 'nullable|string|max:255',
            'masa_pemeliharaan' => 'nullable|string|max:255',
            'lokasi_wilayah' => 'nullable|string|max:255',
            'ppk' => 'nullable|string|max:255',
            'kontraktor' => 'nullable|string|max:255',
            'konsultan' => 'nullable|string|max:255',
            'deskripsi' => 'nullable|string',
            'status' => 'nullable|string',
            'foto_sampul' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:5120'
        ]);

        $validated['status'] = $validated['status'] ?? 'Persiapan';

        if ($request->hasFile('foto_sampul')) {
            $file = $request->file('foto_sampul');
            $fileName = time() . '_sampul_' . str_replace(' ', '_', $file->getClientOriginalName());
            $file->storeAs('foto_proyek', $fileName, 'public');
            $validated['foto_sampul'] = $fileName;
        }

        $project = Project::create($validated);

        if ($request->hasFile('dokumen_lampiran')) {
            $request->validate(['dokumen_lampiran.*' => 'file|mimes:pdf,xlsx,xls,dwg|max:20480']);
            foreach ($request->file('dokumen_lampiran') as $file) {
                $fileName = time() . '_doc_' . str_replace(' ', '_', $file->getClientOriginalName());
                $filePath = $file->storeAs('dokumen_lampiran', $fileName, 'public');
                $sizeInMB = number_format($file->getSize() / 1048576, 2) . ' MB';

                ProjectDocument::create([
                    'project_id' => $project->id,
                    'nama_file' => $file->getClientOriginalName(),
                    'path_file' => 'storage/' . $filePath,
                    'ukuran' => $sizeInMB
                ]);
            }
        }

        $this->clearGlobalProjectCache($project->id);

        return response()->json([
            'status' => 'success',
            'message' => 'Proyek beserta lampiran berhasil ditambahkan!',
            'data' => $project
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $project = Project::findOrFail($id);

        $rules = [
            'nama_proyek' => 'required|string|max:255',
            'kategori' => 'nullable|string|max:255',
            'kode_kontrak' => 'required|string|max:255',
            'nomor_kontrak_kontraktor' => 'nullable|string|max:255',
            'sumber_dana' => 'nullable|string|max:255',
            'tahun_anggaran' => 'nullable|string|max:4',
            'nilai_kontrak' => 'required|numeric',
            'tanggal_mulai' => 'required|date',
            'tanggal_selesai' => 'nullable|date',
            'waktu_pelaksanaan' => 'nullable|string|max:255',
            'masa_pemeliharaan' => 'nullable|string|max:255',
            'lokasi_wilayah' => 'nullable|string|max:255',
            'geojson_data' => 'nullable|string',
            'ppk' => 'nullable|string|max:255',
            'kontraktor' => 'nullable|string|max:255',
            'konsultan' => 'nullable|string|max:255',
            'deskripsi' => 'nullable|string',
            'status' => 'nullable|string',
        ];

        if ($request->has('remove_foto') && $request->remove_foto == 'true') {
            if ($project->foto_sampul && Storage::disk('public')->exists('foto_proyek/' . $project->foto_sampul)) {
                Storage::disk('public')->delete('foto_proyek/' . $project->foto_sampul);
            }
            $project->foto_sampul = null;
            $project->save();
        }

        if ($request->hasFile('foto_sampul')) {
            $rules['foto_sampul'] = 'image|mimes:jpeg,png,jpg,webp|max:5120';
        }

        $validated = $request->validate($rules);

        if ($request->hasFile('foto_sampul')) {
            if ($project->foto_sampul && Storage::disk('public')->exists('foto_proyek/' . $project->foto_sampul)) {
                Storage::disk('public')->delete('foto_proyek/' . $project->foto_sampul);
            }
            $file = $request->file('foto_sampul');
            $fileName = time() . '_sampul_' . str_replace(' ', '_', $file->getClientOriginalName());
            $file->storeAs('foto_proyek', $fileName, 'public');
            $validated['foto_sampul'] = $fileName;
        } else {
            unset($validated['foto_sampul']);
        }

        $project->update($validated);

        $this->clearGlobalProjectCache($project->id);

        return response()->json([
            'status' => 'success',
            'message' => 'Data master proyek berhasil diperbarui!',
            'data' => $project
        ]);
    }

    public function destroy($id)
    {
        $project = Project::findOrFail($id);
        if ($project->foto_sampul && Storage::disk('public')->exists('foto_proyek/' . $project->foto_sampul)) {
            Storage::disk('public')->delete('foto_proyek/' . $project->foto_sampul);
        }
        $project->delete();

        $this->clearGlobalProjectCache($id);

        return response()->json([
            'status' => 'success',
            'message' => 'Data proyek berhasil dihapus permanen.'
        ]);
    }

    public function exportPdf($id)
    {
        $project = Project::with(['personnels', 'documents'])->findOrFail($id);
        $pdf = Pdf::loadView('exports.project_pdf', compact('project'));
        $fileName = 'Executive_Summary_' . Str::slug($project->nama_proyek, '_') . '.pdf';
        return $pdf->download($fileName);
    }

    public function exportExcel($id)
    {
        $project = Project::findOrFail($id);
        $fileName = 'Data_Proyek_' . Str::slug($project->nama_proyek, '_') . '.xlsx';
        return Excel::download(new ProjectDetailExport($id), $fileName);
    }

    public function import(Request $request)
    {
        $request->validate(['file' => 'required|mimes:xlsx,xls']);

        try {
            $sheets = Excel::toArray(new \stdClass(), $request->file('file'));
            $berhasilImport = 0;

            foreach ($sheets as $sheet) {
                $dataProyek = [
                    'status'            => 'Persiapan',
                    'kategori'          => 'Belum Ditentukan',
                    'deskripsi'         => null,
                    'nama_proyek'       => null,
                    'kode_kontrak'      => '-',
                    'nomor_kontrak_kontraktor'  => '-',
                    'nilai_kontrak'     => 0,
                    'sumber_dana'       => null,
                    'tahun_anggaran'    => null,
                    'tanggal_mulai'     => null,
                    'tanggal_selesai'   => null,
                    'waktu_pelaksanaan' => null,
                    'masa_pemeliharaan' => null,
                    'lokasi_wilayah'    => null,
                    'ppk'               => null,
                    'kontraktor'        => null,
                    'konsultan'         => null,
                ];

                foreach ($sheet as $row) {
                    $parameter = strtolower(trim($row[0] ?? ''));
                    $nilai = $row[1] ?? null;

                    if (empty($parameter) || is_null($nilai)) continue;

                    if (str_contains($parameter, 'nama proyek')) {
                        $dataProyek['nama_proyek'] = $nilai;
                    }
                    elseif (str_contains($parameter, 'kategori') || str_contains($parameter, 'bidang')) {
                        $dataProyek['kategori'] = $nilai;
                    }
                    elseif (str_contains($parameter, 'kontrak konsultan') || $parameter === 'kode kontrak') {
                        $dataProyek['kode_kontrak'] = $nilai;
                    }
                    elseif (str_contains($parameter, 'kontrak kontraktor')) {
                        $dataProyek['nomor_kontrak_kontraktor'] = $nilai;
                    }
                    elseif (str_contains($parameter, 'nilai kontrak') || str_contains($parameter, 'pagu')) {
                        $dataProyek['nilai_kontrak'] = (float) preg_replace('/[^0-9]/', '', $nilai);
                    }
                    elseif (str_contains($parameter, 'sumber dana')) {
                        $dataProyek['sumber_dana'] = $nilai;
                    }
                    elseif (str_contains($parameter, 'tahun anggaran')) {
                        $dataProyek['tahun_anggaran'] = $nilai;
                    }
                    elseif (str_contains($parameter, 'tanggal mulai')) {
                        $dataProyek['tanggal_mulai'] = $this->formatExcelDate($nilai);
                    }
                    elseif (str_contains($parameter, 'tanggal selesai')) {
                        $dataProyek['tanggal_selesai'] = $this->formatExcelDate($nilai);
                    }
                    elseif (str_contains($parameter, 'waktu pelaksanaan')) {
                        $dataProyek['waktu_pelaksanaan'] = $nilai;
                    }
                    elseif (str_contains($parameter, 'masa pemeliharaan')) {
                        $dataProyek['masa_pemeliharaan'] = $nilai;
                    }
                    elseif (str_contains($parameter, 'lokasi') || str_contains($parameter, 'wilayah')) {
                        $dataProyek['lokasi_wilayah'] = $nilai;
                    }
                    elseif (str_contains($parameter, 'deskripsi') || str_contains($parameter, 'lingkup')) {
                        $dataProyek['deskripsi'] = $nilai;
                    }
                    elseif (str_contains($parameter, 'ppk') || str_contains($parameter, 'owner')) {
                        $dataProyek['ppk'] = $nilai;
                    }
                    elseif (str_contains($parameter, 'kontraktor') || str_contains($parameter, 'pelaksana')) {
                        $dataProyek['kontraktor'] = $nilai;
                    }
                    elseif (str_contains($parameter, 'konsultan') || str_contains($parameter, 'pengawas')) {
                        $dataProyek['konsultan'] = $nilai;
                    }
                }

                if (!empty($dataProyek['nama_proyek'])) {
                    Project::create($dataProyek);
                    $berhasilImport++;
                }
            }

            if ($berhasilImport === 0) {
                return response()->json(['status' => 'error', 'message' => 'Format file tidak dikenali atau kolom "Nama Proyek" kosong.'], 400);
            }

            $this->clearGlobalProjectCache();

            return response()->json(['status' => 'success', 'message' => "Hebat! $berhasilImport proyek berhasil diimpor."]);

        } catch (\Exception $e) {
            return response()->json(['status' => 'error', 'message' => 'Gagal mengimpor data: ' . $e->getMessage()], 500);
        }
    }

    private function formatExcelDate($value)
    {
        if (empty($value)) return null;
        if (is_numeric($value)) return Date::excelToDateTimeObject($value)->format('Y-m-d');
        return date('Y-m-d', strtotime(str_replace('/', '-', $value)));
    }
}
