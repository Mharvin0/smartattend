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
        // Add 'completed', 'cancelled', and 'no_answer' to the existing enum
        DB::statement("ALTER TABLE `student_tracking` MODIFY COLUMN `status` ENUM('pending', 'to_follow', 'processing', 'completed', 'cancelled', 'no_answer') DEFAULT 'pending'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove 'completed', 'cancelled', and 'no_answer' from the enum
        // First, update any records with these statuses to 'pending'
        DB::table('student_tracking')
            ->whereIn('status', ['completed', 'cancelled', 'no_answer'])
            ->update(['status' => 'pending']);
        
        // Then remove them from the enum
        DB::statement("ALTER TABLE `student_tracking` MODIFY COLUMN `status` ENUM('pending', 'to_follow', 'processing') DEFAULT 'pending'");
    }
};
