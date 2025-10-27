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
        Schema::table('programs', function (Blueprint $table) {
            // Drop the existing unique constraint on code
            $table->dropUnique(['code']);
            
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
            // Drop the soft-delete aware constraint
            $table->dropUnique('programs_code_unique_with_soft_deletes');
            
            // Restore the original simple unique constraint
            $table->unique('code');
        });
    }
};
