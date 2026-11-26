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
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('phone')->nullable()->after('email');
            $table->string('cellphone_number', 20)->nullable()->after('phone');
            $table->date('birth_date')->nullable();
            $table->timestamp('email_verified_at')->nullable() ;
            $table->string('password');
            $table->integer('age')->nullable();
            $table->string('address')->nullable();
            $table->string('billing_name')->nullable()->after('address');
            $table->string('billing_address')->nullable()->after('billing_name');
            $table->string('billing_city')->nullable()->after('billing_address');
            $table->string('billing_postal_code', 30)->nullable()->after('billing_city');
            $table->string('billing_country', 100)->nullable()->after('billing_postal_code');
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->longText('img')->nullable();
            $table->string('payment_method', 50)->nullable()->after('billing_country');
            $table->string('payment_reference', 100)->nullable()->after('payment_method');
            $table->rememberToken();
            $table->timestamps();
            // Serves the admin users list (ORDER BY created_at DESC, id DESC).
            $table->index(['created_at', 'id'], 'users_created_at_id_index');
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('sessions');
    }
};
