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
            // Check if columns don't exist before adding them
            if (!Schema::hasColumn('students', 'department_id')) {
                $table->foreignId('department_id')->nullable()->constrained()->onDelete('set null');
            }
            if (!Schema::hasColumn('students', 'program_id')) {
                $table->foreignId('program_id')->nullable()->constrained()->onDelete('set null');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            if (Schema::hasColumn('students', 'department_id')) {
                $table->dropForeign(['department_id']);
                $table->dropColumn('department_id');
            }
            if (Schema::hasColumn('students', 'program_id')) {
                $table->dropForeign(['program_id']);
                $table->dropColumn('program_id');
            }
        });
    }
};