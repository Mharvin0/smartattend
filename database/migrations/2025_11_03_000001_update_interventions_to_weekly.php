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
        Schema::table('interventions', function (Blueprint $table) {
            // Add weekly fields (guard against partial previous runs)
            if (!Schema::hasColumn('interventions', 'week_start')) {
                $table->date('week_start')->nullable()->after('student_id');
            }
            if (!Schema::hasColumn('interventions', 'week_end')) {
                $table->date('week_end')->nullable()->after('week_start');
            }

            // Drop columns per request
            if (Schema::hasColumn('interventions', 'date')) {
                $table->dropColumn('date');
            }
            if (Schema::hasColumn('interventions', 'type')) {
                $table->dropColumn('type');
            }
            if (Schema::hasColumn('interventions', 'priority')) {
                $table->dropColumn('priority');
            }
            if (Schema::hasColumn('interventions', 'responsible_staff')) {
                $table->dropColumn('responsible_staff');
            }
            if (Schema::hasColumn('interventions', 'recorded_by')) {
                try {
                    $table->dropConstrainedForeignId('recorded_by');
                } catch (\Throwable $e) {
                    // Fallback: drop foreign then column
                    try {
                        $table->dropForeign(['recorded_by']);
                    } catch (\Throwable $e2) {}
                    $table->dropColumn('recorded_by');
                }
            }
            if (Schema::hasColumn('interventions', 'due_date')) {
                $table->dropColumn('due_date');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('interventions', function (Blueprint $table) {
            // Drop weekly fields first
            if (Schema::hasColumn('interventions', 'week_start')) {
                $table->dropColumn('week_start');
            }
            if (Schema::hasColumn('interventions', 'week_end')) {
                $table->dropColumn('week_end');
            }

            // Re-add columns (only if they don't exist)
            if (!Schema::hasColumn('interventions', 'date')) {
                $table->date('date')->nullable()->after('student_id');
            }
            if (!Schema::hasColumn('interventions', 'type')) {
                $table->string('type')->nullable()->after('date');
            }
            if (!Schema::hasColumn('interventions', 'priority')) {
                $table->string('priority')->nullable()->after('type');
            }
            if (!Schema::hasColumn('interventions', 'responsible_staff')) {
                $table->string('responsible_staff')->nullable()->after('priority');
            }
            if (!Schema::hasColumn('interventions', 'recorded_by')) {
                $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete()->after('outcome');
            }
            if (!Schema::hasColumn('interventions', 'due_date')) {
                $table->date('due_date')->nullable()->after('priority');
            }

            // Note: Index on ['student_id', 'date'] should be handled by the original create_interventions_table migration
            // when rolling back, so we don't recreate it here to avoid conflicts
        });
    }
};


