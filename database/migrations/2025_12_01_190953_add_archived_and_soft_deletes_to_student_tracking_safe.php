<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('student_tracking', function (Blueprint $table) {
            // Check if columns exist before adding
            if (!Schema::hasColumn('student_tracking', 'archived')) {
                $table->boolean('archived')->default(false)->after('follow_up_date');
            }
            if (!Schema::hasColumn('student_tracking', 'archived_at')) {
                $table->timestamp('archived_at')->nullable()->after('archived');
            }
            if (!Schema::hasColumn('student_tracking', 'deleted_at')) {
                $table->softDeletes();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('student_tracking', function (Blueprint $table) {
            if (Schema::hasColumn('student_tracking', 'archived')) {
                $table->dropColumn('archived');
            }
            if (Schema::hasColumn('student_tracking', 'archived_at')) {
                $table->dropColumn('archived_at');
            }
            if (Schema::hasColumn('student_tracking', 'deleted_at')) {
                $table->dropColumn('deleted_at');
            }
        });
    }
};
