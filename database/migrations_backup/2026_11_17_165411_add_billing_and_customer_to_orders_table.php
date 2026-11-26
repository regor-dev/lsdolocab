<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table): void {
            $table->foreignId('user_id')->nullable()->after('id')->constrained('users')->nullOnDelete();
            $table->string('customer_email')->nullable()->after('customer_name');
            $table->string('customer_phone')->nullable()->after('customer_email');
            $table->string('billing_name')->nullable()->after('total');
            $table->string('billing_address')->nullable()->after('billing_name');
            $table->string('billing_city')->nullable()->after('billing_address');
            $table->string('billing_postal_code', 30)->nullable()->after('billing_city');
            $table->string('billing_country', 100)->nullable()->after('billing_postal_code');
            $table->string('payment_method', 50)->nullable()->after('billing_country');
            $table->string('payment_reference', 100)->nullable()->after('payment_method');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table): void {
            $table->dropForeign(['user_id']);
            $table->dropColumn([
                'user_id',
                'customer_email',
                'customer_phone',
                'billing_name',
                'billing_address',
                'billing_city',
                'billing_postal_code',
                'billing_country',
                'payment_method',
                'payment_reference',
            ]);
        });
    }
};
