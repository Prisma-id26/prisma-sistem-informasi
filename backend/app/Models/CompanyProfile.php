<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CompanyProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'hero_title', 'hero_subtitle', 'btn_text', 'hero_image',
        'email', 'phone', 'website', 'address',
        'operasional_senin_jumat', 'operasional_sabtu', 'operasional_minggu' // Kolom baru ditambahkan
    ];
}
