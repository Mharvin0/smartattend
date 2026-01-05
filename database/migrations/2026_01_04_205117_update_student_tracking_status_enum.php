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
        // First, change the column to VARCHAR temporarily to allow any value
        DB::statement("ALTER TABLE `student_tracking` MODIFY COLUMN `status` VARCHAR(255) DEFAULT 'pending'");
        
        // Update all existing records to use the new status values
        // Map old statuses to new ones
        DB::table('student_tracking')
            ->where('status', 'completed')
            ->update(['status' => 'processing']);
        
        DB::table('student_tracking')
            ->whereIn('status', ['scheduled', 'cancelled'])
            ->update(['status' => 'pending']);
        
        DB::table('student_tracking')
            ->where('status', 'no_answer')
            ->update(['status' => 'to_follow']);
        
        // Set any other unexpected values to 'pending'
        DB::table('student_tracking')
            ->whereNotIn('status', ['pending', 'to_follow', 'processing'])
            ->update(['status' => 'pending']);
        
        // Now change it back to ENUM with the new values
        DB::statement("ALTER TABLE `student_tracking` MODIFY COLUMN `status` ENUM('pending', 'to_follow', 'processing') DEFAULT 'pending'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert back to the old ENUM values
        DB::statement("ALTER TABLE `student_tracking` MODIFY COLUMN `status` ENUM('completed', 'scheduled', 'cancelled', 'no_answer') DEFAULT 'completed'");
    }
};
