<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('order_logs', function (Blueprint $table) {
            $table->unsignedBigInteger('order_id')->nullable()->after('id');
            $table->foreign('order_id')->references('id')->on('orders')->onDelete('cascade');

            $table->unsignedBigInteger('user_id')->nullable()->after('order_id');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');

            $table->string('action')->nullable()->after('user_id');
        });
    }

    public function down(): void
    {
        Schema::table('order_logs', function (Blueprint $table) {
            $table->dropForeign(['order_id']);
            $table->dropForeign(['user_id']);
            $table->dropColumn(['order_id', 'user_id', 'action']);
        });
    }
};
