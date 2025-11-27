<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class CleanupDuplicates extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'cleanup:duplicates';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Remove duplicate departments and programs from the database';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting cleanup of duplicate departments and programs...');
        
        $deletedDepartments = 0;
        $deletedPrograms = 0;

        // Remove duplicate departments (by code, keeping the first one)
        $departmentDuplicates = DB::table('departments')
            ->select('code', DB::raw('COUNT(*) as count'))
            ->whereNull('deleted_at')
            ->groupBy('code')
            ->having('count', '>', 1)
            ->get();

        foreach ($departmentDuplicates as $dup) {
            $this->info("Found duplicate department code: {$dup->code} ({$dup->count} entries)");
            
            $departments = \App\Models\Department::where('code', $dup->code)
                ->whereNull('deleted_at')
                ->orderBy('created_at', 'asc')
                ->get();
            
            // Keep the first one, delete the rest
            if ($departments->count() > 1) {
                $keep = $departments->first();
                $toDelete = $departments->skip(1);
                
                foreach ($toDelete as $dept) {
                    $this->info("  - Soft deleting department ID {$dept->id} ({$dept->name})");
                    
                    // Move any programs from deleted department to the kept one
                    \App\Models\Program::where('department_id', $dept->id)
                        ->update(['department_id' => $keep->id]);
                    
                    // Update code to make it unique before soft deleting
                    $dept->code = $dept->code . '_deleted_' . $dept->id;
                    $dept->save();
                    $dept->delete(); // Soft delete
                    $deletedDepartments++;
                }
            }
        }

        // Remove duplicate programs (by code within same department, keeping the first one)
        $programDuplicates = DB::table('programs')
            ->select('code', 'department_id', DB::raw('COUNT(*) as count'))
            ->whereNull('deleted_at')
            ->groupBy('code', 'department_id')
            ->having('count', '>', 1)
            ->get();

        foreach ($programDuplicates as $dup) {
            $this->info("Found duplicate program code: {$dup->code} in department {$dup->department_id} ({$dup->count} entries)");
            
            $programs = \App\Models\Program::where('code', $dup->code)
                ->where('department_id', $dup->department_id)
                ->whereNull('deleted_at')
                ->orderBy('created_at', 'asc')
                ->get();
            
            // Keep the first one, delete the rest
            if ($programs->count() > 1) {
                $keep = $programs->first();
                $toDelete = $programs->skip(1);
                
                foreach ($toDelete as $program) {
                    $this->info("  - Soft deleting program ID {$program->id} ({$program->name})");
                    
                    // Move any sections from deleted program to the kept one
                    \App\Models\Section::where('program_id', $program->id)
                        ->update(['program_id' => $keep->id]);
                    
                    // Update code to make it unique before soft deleting
                    $program->code = $program->code . '_deleted_' . $program->id;
                    $program->save();
                    $program->delete(); // Soft delete
                    $deletedPrograms++;
                }
            }
        }

        $this->info("Cleanup completed!");
        $this->info("  - Removed {$deletedDepartments} duplicate departments");
        $this->info("  - Removed {$deletedPrograms} duplicate programs");
        
        return 0;
    }
}
