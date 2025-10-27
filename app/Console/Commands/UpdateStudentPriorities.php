<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Student;

class UpdateStudentPriorities extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'students:update-priorities';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Update all student priorities based on their absence count';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Updating student priorities...');
        
        $students = Student::all();
        $bar = $this->output->createProgressBar($students->count());
        
        $safeCount = 0;
        $callNeededCount = 0;
        $pnsCount = 0;
        
        foreach ($students as $student) {
            $oldPriority = $student->priority;
            $newPriority = $student->updatePriority();
            
            switch ($newPriority) {
                case 'Safe':
                    $safeCount++;
                    break;
                case 'Call Needed':
                    $callNeededCount++;
                    break;
                case 'PNS':
                    $pnsCount++;
                    break;
            }
            
            $bar->advance();
        }
        
        $bar->finish();
        $this->newLine();
        
        $this->info('Student priorities updated successfully!');
        $this->table(
            ['Priority', 'Count'],
            [
                ['Safe', $safeCount],
                ['Call Needed', $callNeededCount],
                ['PNS', $pnsCount],
            ]
        );
        
        return Command::SUCCESS;
    }
}
