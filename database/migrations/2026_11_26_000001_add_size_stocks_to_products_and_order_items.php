<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('products', 'size_stocks')) {
            Schema::table('products', function (Blueprint $table) {
                $table->json('size_stocks')->nullable();
            });
        }

        if (! Schema::hasColumn('order_items', 'size')) {
            Schema::table('order_items', function (Blueprint $table) {
                $table->string('size')->nullable();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('products', 'size_stocks')) {
            Schema::table('products', function (Blueprint $table) {
                $table->dropColumn('size_stocks');
            });
        }

        if (Schema::hasColumn('order_items', 'size')) {
            Schema::table('order_items', function (Blueprint $table) {
                $table->dropColumn('size');
            });
        }
    }
};
