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
        Schema::table('management_remarks', function (Blueprint $table) {
            if (!Schema::hasColumn('management_remarks', 'archived')) {
                $table->boolean('archived')->default(false)->after('remark');
            }
            if (!Schema::hasColumn('management_remarks', 'archived_at')) {
                $table->timestamp('archived_at')->nullable()->after('archived');
            }
            if (!Schema::hasColumn('management_remarks', 'archived_by')) {
                $table->foreignId('archived_by')->nullable()->constrained('users')->onDelete('set null')->after('archived_at');
            }
            if (!Schema::hasColumn('management_remarks', 'specific_reasons')) {
                $table->text('specific_reasons')->nullable()->after('remark');
            }
            if (!Schema::hasColumn('management_remarks', 'deleted_at')) {
                $table->softDeletes();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('management_remarks', function (Blueprint $table) {
            if (Schema::hasColumn('management_remarks', 'archived')) {
                $table->dropColumn('archived');
            }
            if (Schema::hasColumn('management_remarks', 'archived_at')) {
                $table->dropColumn('archived_at');
            }
            if (Schema::hasColumn('management_remarks', 'archived_by')) {
                $table->dropForeign(['archived_by']);
                $table->dropColumn('archived_by');
            }
            if (Schema::hasColumn('management_remarks', 'specific_reasons')) {
                $table->dropColumn('specific_reasons');
            }
            if (Schema::hasColumn('management_remarks', 'deleted_at')) {
                $table->dropSoftDeletes();
            }
        });
    }
};
