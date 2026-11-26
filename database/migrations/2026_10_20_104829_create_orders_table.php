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
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->after('id')->constrained('users')->nullOnDelete();
            $table->string('customer_name');
            $table->string('customer_email')->nullable()->after('customer_name');
            $table->string('customer_phone')->nullable()->after('customer_email');
            $table->string('order_number');
            $table->date('order_date');
            $table->enum('status',
            ['pending', 'processing', 'completed', 'cancelled'])
            ->default('pending');
            $table->decimal('total', 10, 2);
            $table->string('billing_name')->nullable()->after('total');
            $table->string('billing_address')->nullable()->after('billing_name');
            $table->string('billing_city')->nullable()->after('billing_address');
            $table->string('billing_postal_code', 30)->nullable()->after('billing_city');
            $table->string('billing_country', 100)->nullable()->after('billing_postal_code');
            $table->string('payment_method', 50)->nullable()->after('billing_country');
            $table->string('payment_reference', 100)->nullable()->after('payment_method');
            $table->timestamps();
            // Serves "latest orders" (ORDER BY order_date DESC, id DESC LIMIT n).
            $table->index(['order_date', 'id'], 'orders_order_date_id_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
