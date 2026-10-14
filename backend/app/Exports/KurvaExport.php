<?php

namespace App\Exports;

use Illuminate\Contracts\View\View;
use Maatwebsite\Excel\Concerns\FromView;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\WithCustomValueBinder;
use PhpOffice\PhpSpreadsheet\Cell\StringValueBinder;

// Menggunakan StringValueBinder agar format desimal (0.0044, 5.00, +0.07) tidak diubah otomatis oleh Excel
class KurvaExport extends StringValueBinder implements FromView, WithTitle, WithCustomValueBinder
{
    protected $data;

    public function __construct($data)
    {
        $this->data = $data;
    }

    public function view(): View
    {
        return view('exports.kurva-s', $this->data);
    }

    public function title(): string
    {
        return 'Kurva S dan Matriks';
    }
}
