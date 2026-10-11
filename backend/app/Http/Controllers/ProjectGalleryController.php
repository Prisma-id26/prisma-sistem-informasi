<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProjectGalleryController extends Controller
{
    public function index($projectId)
    {
        try {
            // Melakukan JOIN untuk mengambil lampiran bertipe 'foto'
            // dari laporan harian yang merujuk pada $projectId
            $photos = DB::table('daily_report_attachments')
                ->join('daily_reports', 'daily_report_attachments.daily_report_id', '=', 'daily_reports.id')
                ->where('daily_reports.project_id', $projectId)
                ->where('daily_report_attachments.tipe', 'foto') // Hanya ambil tipe foto
                ->select(
                    'daily_report_attachments.id',
                    'daily_report_attachments.nama_file',
                    'daily_report_attachments.path_file',
                    'daily_reports.id as daily_report_id',
                    'daily_reports.tanggal',
                    'daily_reports.minggu_ke',
                    'daily_reports.pengawas',
                    'daily_reports.status as laporan_status'
                )
                ->orderBy('daily_reports.tanggal', 'desc') // Urutkan dari foto terbaru
                ->get();

            return response()->json([
                'status' => 'success',
                'data' => $photos
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal mengambil data galeri: ' . $e->getMessage()
            ], 500);
        }
    }
}
