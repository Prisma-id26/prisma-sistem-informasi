<?php

namespace App\Http\Controllers;

use App\Models\ProjectPersonnel;
use App\Models\ProjectDocument;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ProjectDetailController extends Controller
{
    public function storePersonnel(Request $request, $projectId)
    {
        $validated = $request->validate([
            'nama' => 'required|string|max:255',
            'peran' => 'required|string|max:255',
        ]);

        $personnel = ProjectPersonnel::create([
            'project_id' => $projectId,
            'nama' => $validated['nama'],
            'peran' => $validated['peran'],
        ]);

        return response()->json(['status' => 'success', 'data' => $personnel]);
    }

    public function updatePersonnel(Request $request, $id)
    {
        $personnel = ProjectPersonnel::findOrFail($id);
        $personnel->update($request->only(['nama', 'peran']));

        return response()->json(['status' => 'success', 'message' => 'Personel diupdate.']);
    }

    public function destroyPersonnel($id)
    {
        ProjectPersonnel::findOrFail($id)->delete();
        return response()->json(['status' => 'success', 'message' => 'Personel dihapus.']);
    }

     public function storeDocument(Request $request, $projectId)
    {
        $request->validate([
            'dokumen_lampiran' => 'required|array',
            'dokumen_lampiran.*' => 'file|mimes:pdf,xlsx,xls,dwg|max:20480',
        ]);

        if ($request->hasFile('dokumen_lampiran')) {
            foreach ($request->file('dokumen_lampiran') as $file) {
                $fileName = time() . '_doc_' . str_replace(' ', '_', $file->getClientOriginalName());

                // PERBAIKAN: Menggunakan disk 'public'
                $filePath = $file->storeAs('dokumen_lampiran', $fileName, 'public');

                $sizeInMB = number_format($file->getSize() / 1048576, 2) . ' MB';

                ProjectDocument::create([
                    'project_id' => $projectId,
                    'nama_file' => $file->getClientOriginalName(),
                    'path_file' => 'storage/' . $filePath, // Path rapi untuk DB
                    'ukuran' => $sizeInMB
                ]);
            }
        }

        return response()->json(['status' => 'success', 'message' => 'Dokumen berhasil diunggah.']);
    }

    public function destroyDocument($id)
    {
        $document = ProjectDocument::findOrFail($id);

        // PERBAIKAN: Hapus dari disk 'public'
        $path = str_replace('storage/', '', $document->path_file);
        if (Storage::disk('public')->exists($path)) {
            Storage::disk('public')->delete($path);
        }

        $document->delete();

        return response()->json(['status' => 'success', 'message' => 'Dokumen berhasil dihapus.']);
    }

    public function downloadGalleryArchive(Request $request, $projectId)
    {
        $project = \App\Models\Project::findOrFail($projectId);

        // Ambil seluruh foto dari laporan harian proyek ini
        $query = \Illuminate\Support\Facades\DB::table('daily_report_attachments')
            ->join('daily_reports', 'daily_report_attachments.daily_report_id', '=', 'daily_reports.id')
            ->where('daily_reports.project_id', $projectId)
            ->where('daily_report_attachments.tipe', 'foto')
            ->select(
                'daily_report_attachments.id',
                'daily_report_attachments.nama_file',
                'daily_report_attachments.path_file',
                'daily_reports.tanggal',
                'daily_reports.minggu_ke'
            )
            ->orderBy('daily_reports.tanggal', 'asc');

        // Jika ada filter minggu dari frontend
        if ($request->filled('minggu_ke') && $request->minggu_ke !== 'Semua') {
            $query->where('daily_reports.minggu_ke', $request->minggu_ke);
        }

        $photos = $query->get();

        if ($photos->isEmpty()) {
            return response()->json(['status' => 'error', 'message' => 'Belum ada foto dokumentasi untuk diunduh.'], 404);
        }

        $safeProjectName = \Illuminate\Support\Str::slug($project->nama_proyek ?? 'Proyek', '_');
        $archiveFileName = "Galeri_Dokumentasi_{$safeProjectName}_" . time() . ".zip";
        $tempPath = storage_path("app/public/{$archiveFileName}");

        $zip = new \ZipArchive;
        if ($zip->open($tempPath, \ZipArchive::CREATE | \ZipArchive::OVERWRITE) === TRUE) {
            $addedCount = 0;

            foreach ($photos as $index => $photo) {
                $cleanRelativePath = preg_replace('/^storage\//', '', ltrim($photo->path_file, '/'));
                $fullDiskPath = storage_path('app/public/' . $cleanRelativePath);

                if (file_exists($fullDiskPath)) {
                    $folderMinggu = 'Minggu_Ke_' . ($photo->minggu_ke ?? '0');
                    $tgl = $photo->tanggal ? substr($photo->tanggal, 0, 10) : 'Tanpa_Tanggal';
                    $ext = pathinfo($fullDiskPath, PATHINFO_EXTENSION) ?: 'jpg';
                    $baseName = pathinfo($photo->nama_file ?: "Foto_" . ($index + 1), PATHINFO_FILENAME);

                    // Susun di dalam folder per Minggu agar rapi saat dibuka di WinRAR
                    $entryName = "{$folderMinggu}/{$tgl}_{$baseName}_(" . ($index + 1) . ").{$ext}";
                    $zip->addFile($fullDiskPath, $entryName);
                    $addedCount++;
                }
            }

            $zip->close();

            if ($addedCount === 0) {
                @unlink($tempPath);
                return response()->json(['status' => 'error', 'message' => 'File fisik foto tidak ditemukan di penyimpanan server.'], 404);
            }

            return response()->download($tempPath, $archiveFileName)->deleteFileAfterSend(true);
        }

        return response()->json(['status' => 'error', 'message' => 'Gagal membuat paket arsip foto.'], 500);
    }
}
