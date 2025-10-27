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
        // First, let's check for duplicate programs by code
        $duplicates = DB::table('programs')
            ->select('code', DB::raw('COUNT(*) as count'))
            ->groupBy('code')
            ->having('count', '>', 1)
            ->get();

        foreach ($duplicates as $duplicate) {
            echo "Found duplicate program code: {$duplicate->code} ({$duplicate->count} entries)\n";
            
            // Get all programs with this code
            $programs = DB::table('programs')
                ->where('code', $duplicate->code)
                ->orderBy('created_at', 'asc')
                ->get();

            // Keep the first one, soft delete the rest
            $keepProgram = $programs->first();
            $deletePrograms = $programs->skip(1);

            foreach ($deletePrograms as $program) {
                echo "Soft deleting program ID {$program->id} ({$program->name})\n";
                DB::table('programs')
                    ->where('id', $program->id)
                    ->update([
                        'deleted_at' => now(),
                        'code' => $program->code . '_deleted_' . $program->id // Make code unique
                    ]);
            }
        }

        // Now check for any remaining duplicates after cleanup
        $remainingDuplicates = DB::table('programs')
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
            echo "All duplicates cleaned up successfully!\n";
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Restore soft deleted programs
        DB::table('programs')
            ->whereNotNull('deleted_at')
            ->where('code', 'LIKE', '%_deleted_%')
            ->update([
                'deleted_at' => null,
                'code' => DB::raw("SUBSTRING(code, 1, LOCATE('_deleted_', code) - 1)")
            ]);
    }
};