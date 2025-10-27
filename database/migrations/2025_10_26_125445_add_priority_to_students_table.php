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
        Schema::table('students', function (Blueprint $table) {
            $table->string('status')->default('Active')->after('guardian_contact');
            $table->string('email')->nullable()->after('status');
            $table->enum('priority', ['Safe', 'Call Needed', 'PNS'])->default('Safe')->after('email');
            $table->integer('absence_count')->default(0)->after('priority');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropColumn(['status', 'email', 'priority', 'absence_count']);
        });
    }
};
