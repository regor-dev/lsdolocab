<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->string('cellphone_number', 20)->nullable()->after('phone');
            $table->dropColumn(['unit_number']);
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->dropColumn(['cellphone_number']);
            $table->string('unit_number', 50)->nullable()->after('address');
        });
    }
};
