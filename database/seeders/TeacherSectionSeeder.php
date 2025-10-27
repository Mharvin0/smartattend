<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Section;

class TeacherSectionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get the teacher user
        $teacher = User::where('email', 'teacher@smartattend.local')->first();
        
        if (!$teacher) {
            $this->command->error('Teacher user not found. Please run the main seeder first.');
            return;
        }

        // Get some sections to assign to the teacher
        $sections = Section::take(3)->get();
        
        if ($sections->isEmpty()) {
            $this->command->error('No sections found. Please run the main seeder first.');
            return;
        }

        // Assign sections to the teacher
        foreach ($sections as $index => $section) {
            $subjects = ['Mathematics', 'Science', 'English', 'History', 'Computer Science'];
            $subject = $subjects[$index % count($subjects)];
            
            $teacher->sections()->attach($section->id, [
                'subject' => $subject,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $this->command->info('Successfully assigned ' . $sections->count() . ' sections to the teacher.');
    }
}