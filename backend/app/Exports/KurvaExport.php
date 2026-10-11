<?php

namespace App\Exports;

use Illuminate\Contracts\View\View;
use Maatwebsite\Excel\Concerns\FromView;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;

class KurvaExport implements FromView, WithTitle, ShouldAutoSize
{
    protected $data;

    public function __construct($data)
    {
        $this->data = $data;
    }

    public function view(): View
    {
        // Mengekspor menggunakan layout blade yang sama dengan PDF
        return view('exports.kurva-s', $this->data);
    }

    public function title(): string
    {
        $projectName = $this->data['project']->nama_proyek ?? 'Proyek';
        // 1. Bersihkan karakter yang dilarang Excel
        $cleanName = str_replace(['*', ':', '/', '\\', '?', '[', ']'], '', $projectName);
        // 2. Gabungkan nama
        $title = 'Kurva ' . $cleanName;
        // 3. Wajib dipotong maksimal 31 huruf
        return substr($title, 0, 31);
    }
}
