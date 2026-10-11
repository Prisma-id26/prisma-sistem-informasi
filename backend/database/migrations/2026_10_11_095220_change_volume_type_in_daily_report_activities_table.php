<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('daily_report_activities', function (Blueprint $table) {
            // Mengubah tipe kolom volume menjadi VARCHAR (string)
            // Membutuhkan package doctrine/dbal jika kamu menggunakan Laravel versi 9 ke bawah
            $table->string('volume')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('daily_report_activities', function (Blueprint $table) {
            // Mengembalikan ke tipe desimal jika sewaktu-waktu di-rollback
            // Saya asumsikan sebelumnya menggunakan decimal(16,4) berdasarkan foto
            $table->decimal('volume', 16, 4)->change();
        });
    }
};
