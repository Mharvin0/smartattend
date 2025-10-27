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
        Schema::table('programs', function (Blueprint $table) {
            // Drop the existing unique constraint on code if it exists
            if (Schema::hasIndex('programs', 'programs_code_unique')) {
                $table->dropUnique(['code']);
            }
            
            // Add a new unique constraint that considers soft deletes
            // This creates a unique constraint on (code, deleted_at) where deleted_at is NULL
            $table->unique(['code', 'deleted_at'], 'programs_code_unique_with_soft_deletes');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('programs', function (Blueprint $table) {
            // Check if the soft-delete aware constraint exists before dropping
            if (Schema::hasIndex('programs', 'programs_code_unique_with_soft_deletes')) {
                $table->dropUnique('programs_code_unique_with_soft_deletes');
            }
            
            // Only restore the original unique constraint if no duplicates exist
            $duplicates = \DB::table('programs')
                ->select('code', \DB::raw('COUNT(*) as count'))
                ->groupBy('code')
                ->having('count', '>', 1)
                ->get();
                
            if ($duplicates->count() === 0) {
                $table->unique('code');
            }
        });
    }
};
