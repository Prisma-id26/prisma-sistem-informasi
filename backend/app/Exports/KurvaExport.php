<?php

namespace App\Exports;

use Illuminate\Contracts\View\View;
use Maatwebsite\Excel\Concerns\FromView;
use Maatwebsite\Excel\Concerns\WithTitle;

// HAPUS ShouldAutoSize AGAR TIDAK ERROR 500
class KurvaExport implements FromView, WithTitle
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
        return 'Kurva S dan Matriks'; // SANGAT AMAN: Hanya 20 Karakter
    }
}
