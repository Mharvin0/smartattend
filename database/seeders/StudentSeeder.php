<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Student;
use App\Models\Section;
use App\Models\Program;
use App\Models\Department;

class StudentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Clear all existing students first (handle foreign key constraints)
        $this->command->info('Clearing all existing student records...');
        
        // Delete related records first (only if tables exist)
        try {
            \DB::table('attendance_histories')->whereNotNull('student_id')->delete();
        } catch (\Exception $e) {
            // Table doesn't exist, skip
        }
        
        try {
            \DB::table('attendance_records')->whereNotNull('student_id')->delete();
        } catch (\Exception $e) {
            // Table doesn't exist, skip
        }
        
        try {
            \DB::table('interventions')->whereNotNull('student_id')->delete();
        } catch (\Exception $e) {
            // Table doesn't exist, skip
        }
        
        // Now delete all students
        Student::query()->delete();
        
        // Get existing CITE department or create if not exists
        $department = Department::where('code', 'CITE')->first() ?? Department::first();
        
        // Get existing BSIT program or create if not exists
        $program = Program::where('code', 'BSIT')->first() ?? Program::first();
        
        if (!$department || !$program) {
            $this->command->error('No departments or programs found. Please run DepartmentProgramSeeder first.');
            return;
        }

        // Create BSIT4-06 section
        $section = Section::firstOrCreate([
            'name' => 'BSIT4-06',
            'year_level' => '4th Year',
            'program_id' => $program->id,
            'department_id' => $department->id
        ]);

        // Create only Adonis Alcantara
        $student = Student::create([
            'first_name' => 'Adonis',
            'last_name' => 'Alcantara', 
            'student_number' => '03-1111-11111',
            'section_id' => $section->id,
            'gender' => 'Male',
            'guardian_name' => 'Maria Alcantara',
            'guardian_contact' => '09123456789',
            'birth_date' => '2000-05-15'
        ]);

        $this->command->info('Cleared all students and created only Adonis Alcantara (ID: ' . $student->id . ')');
    }
}