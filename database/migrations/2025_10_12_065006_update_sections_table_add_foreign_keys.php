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
        Schema::table('sections', function (Blueprint $table) {
            $table->foreignId('department_id')->nullable()->after('id')->constrained()->onDelete('set null');
            $table->foreignId('program_id')->nullable()->after('department_id')->constrained()->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sections', function (Blueprint $table) {
            $table->dropForeign(['department_id']);
            $table->dropForeign(['program_id']);
            $table->dropColumn(['department_id', 'program_id']);
        });
    }
};
