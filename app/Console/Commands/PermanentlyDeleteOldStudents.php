<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Student;
use Carbon\Carbon;

class PermanentlyDeleteOldStudents extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'students:permanently-delete-old';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Permanently delete students that were soft-deleted more than 30 days ago';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $cutoffDate = Carbon::now()->subDays(30);
        
        $deletedStudents = Student::withTrashed()
            ->whereNotNull('deleted_at')
            ->where('deleted_at', '<=', $cutoffDate)
            ->get();

        $count = $deletedStudents->count();

        if ($count > 0) {
            foreach ($deletedStudents as $student) {
                $student->forceDelete(); // Permanently delete
            }
            $this->info("Permanently deleted {$count} student(s) that were soft-deleted more than 30 days ago.");
        } else {
            $this->info('No students to permanently delete.');
        }

        return Command::SUCCESS;
    }
}

