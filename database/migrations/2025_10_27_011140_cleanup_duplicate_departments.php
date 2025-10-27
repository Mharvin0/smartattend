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
        // First, let's check for duplicate departments by code
        $duplicates = DB::table('departments')
            ->select('code', DB::raw('COUNT(*) as count'))
            ->groupBy('code')
            ->having('count', '>', 1)
            ->get();

        foreach ($duplicates as $duplicate) {
            echo "Found duplicate department code: {$duplicate->code} ({$duplicate->count} entries)\n";
            
            // Get all departments with this code
            $departments = DB::table('departments')
                ->where('code', $duplicate->code)
                ->orderBy('created_at', 'asc')
                ->get();

            // Keep the first one, soft delete the rest
            $keepDepartment = $departments->first();
            $deleteDepartments = $departments->skip(1);

            foreach ($deleteDepartments as $department) {
                echo "Soft deleting department ID {$department->id} ({$department->name})\n";
                DB::table('departments')
                    ->where('id', $department->id)
                    ->update([
                        'deleted_at' => now(),
                        'code' => $department->code . '_deleted_' . $department->id // Make code unique
                    ]);
            }
        }

        // Now check for any remaining duplicates after cleanup
        $remainingDuplicates = DB::table('departments')
            ->select('code', DB::raw('COUNT(*) as count'))
            ->whereNull('deleted_at')
            ->groupBy('code')
            ->having('count', '>', 1)
            ->get();

        if ($remainingDuplicates->count() > 0) {
            echo "Warning: Still have duplicates after cleanup:\n";
            foreach ($remainingDuplicates as $dup) {
                echo "- {$dup->code}: {$dup->count} entries\n";
            }
        } else {
            echo "All department duplicates cleaned up successfully!\n";
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Restore soft deleted departments
        DB::table('departments')
            ->whereNotNull('deleted_at')
            ->where('code', 'LIKE', '%_deleted_%')
            ->update([
                'deleted_at' => null,
                'code' => DB::raw("SUBSTRING(code, 1, LOCATE('_deleted_', code) - 1)")
            ]);
    }
};