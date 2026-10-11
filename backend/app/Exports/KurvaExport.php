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
        // Menggunakan string absolut yang aman agar tidak melewati batas 31 Karakter Excel
        // Nama file tetap akan menggunakan nama proyek, ini HANYA UNTUK NAMA TAB / SHEET di dalam file Excel.
        return 'Kurva S & Schedule';
    }
}
