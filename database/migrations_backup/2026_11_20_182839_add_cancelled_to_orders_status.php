<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** Add 'cancelled' to the orders status check constraint. */
    public function up(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE "orders" DROP CONSTRAINT IF EXISTS orders_status_check');
            DB::statement("ALTER TABLE \"orders\" ADD CONSTRAINT orders_status_check CHECK (\"status\" IN ('pending', 'processing', 'completed', 'cancelled'))");
        } elseif ($driver === 'sqlite') {
            Schema::create('orders_new', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
                $table->string('customer_name');
                $table->string('customer_email')->nullable();
                $table->string('customer_phone')->nullable();
                $table->string('order_number');
                $table->date('order_date');
                $table->string('status')->default('pending');
                $table->decimal('total', 10, 2);
                $table->string('billing_name')->nullable();
                $table->string('billing_address')->nullable();
                $table->string('billing_city')->nullable();
                $table->string('billing_postal_code', 30)->nullable();
                $table->string('billing_country', 100)->nullable();
                $table->string('payment_method', 50)->nullable();
                $table->string('payment_reference', 100)->nullable();
                $table->timestamps();
            });

            DB::statement('INSERT INTO "orders_new" ("id", "user_id", "customer_name", "customer_email", "customer_phone", "order_number", "order_date", "status", "total", "billing_name", "billing_address", "billing_city", "billing_postal_code", "billing_country", "payment_method", "payment_reference", "created_at", "updated_at") SELECT "id", "user_id", "customer_name", "customer_email", "customer_phone", "order_number", "order_date", "status", "total", "billing_name", "billing_address", "billing_city", "billing_postal_code", "billing_country", "payment_method", "payment_reference", "created_at", "updated_at" FROM "orders"');

            Schema::drop('orders');
            Schema::rename('orders_new', 'orders');
        }
    }

    /** Remove 'cancelled' from the orders status check constraint. */
    public function down(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE "orders" DROP CONSTRAINT IF EXISTS orders_status_check');
            DB::statement("ALTER TABLE \"orders\" ADD CONSTRAINT orders_status_check CHECK (\"status\" IN ('pending', 'processing', 'completed'))");
        } elseif ($driver === 'sqlite') {
            Schema::create('orders_new', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
                $table->string('customer_name');
                $table->string('customer_email')->nullable();
                $table->string('customer_phone')->nullable();
                $table->string('order_number');
                $table->date('order_date');
                $table->string('status')->default('pending');
                $table->decimal('total', 10, 2);
                $table->string('billing_name')->nullable();
                $table->string('billing_address')->nullable();
                $table->string('billing_city')->nullable();
                $table->string('billing_postal_code', 30)->nullable();
                $table->string('billing_country', 100)->nullable();
                $table->string('payment_method', 50)->nullable();
                $table->string('payment_reference', 100)->nullable();
                $table->timestamps();
            });

            DB::statement('INSERT INTO "orders_new" ("id", "user_id", "customer_name", "customer_email", "customer_phone", "order_number", "order_date", "status", "total", "billing_name", "billing_address", "billing_city", "billing_postal_code", "billing_country", "payment_method", "payment_reference", "created_at", "updated_at") SELECT "id", "user_id", "customer_name", "customer_email", "customer_phone", "order_number", "order_date", "status", "total", "billing_name", "billing_address", "billing_city", "billing_postal_code", "billing_country", "payment_method", "payment_reference", "created_at", "updated_at" FROM "orders" WHERE "status" != \'cancelled\'');

            Schema::drop('orders');
            Schema::rename('orders_new', 'orders');
        }
    }
};
