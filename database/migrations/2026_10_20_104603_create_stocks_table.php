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
        Schema::create('stocks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
           $table->enum('status', 
            ['in_stock', 'low_stock', 'out_of_stock'])
            ->default('in_stock');
            $table->integer('quantity');
            $table->timestamps();
            // Index-only GROUP BY status + SUM(quantity) for the dashboard, and the low-stock list.
            $table->index(['status', 'quantity'], 'stocks_status_quantity_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stocks');
    }
};
