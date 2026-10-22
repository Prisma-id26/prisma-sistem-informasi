<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('company_profiles', function (Blueprint $table) {
            $table->string('operasional_senin_jumat')->nullable();
            $table->string('operasional_sabtu')->nullable();
            $table->string('operasional_minggu')->nullable();
        });
    }

    public function down()
    {
        Schema::table('company_profiles', function (Blueprint $table) {
            $table->dropColumn(['operasional_senin_jumat', 'operasional_sabtu', 'operasional_minggu']);
        });
    }
};
