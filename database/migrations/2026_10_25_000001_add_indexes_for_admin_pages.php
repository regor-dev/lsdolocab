<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Ensure one stock row per product (matches StockController validation).
        Schema::table('stocks', function (Blueprint $table) {
            if (! Schema::hasIndex('stocks', 'stocks_product_id_unique')) {
                $table->unique('product_id', 'stocks_product_id_unique');
            }
        });

        Schema::table('brands', function (Blueprint $table) {
            $table->index('brand_name', 'brands_brand_name_index');
        });

        Schema::table('products', function (Blueprint $table) {
            $table->index('name', 'products_name_index');
            $table->index('brand_id', 'products_brand_id_index');
        });

        Schema::table('roles', function (Blueprint $table) {
            $table->index('created_at', 'roles_created_at_index');
        });
    }

    public function down(): void
    {
        Schema::table('roles', fn (Blueprint $t) => $t->dropIndex('roles_created_at_index'));
        Schema::table('products', function (Blueprint $t) {
            $t->dropIndex('products_name_index');
            $t->dropIndex('products_brand_id_index');
        });
        Schema::table('brands', fn (Blueprint $t) => $t->dropIndex('brands_brand_name_index'));
        Schema::table('stocks', fn (Blueprint $t) => $t->dropUnique('stocks_product_id_unique'));
    }
};
