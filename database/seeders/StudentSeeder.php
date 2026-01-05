<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use App\Models\Student;
use App\Models\Section;
use App\Models\Program;
use App\Models\Department;
use Carbon\Carbon;

class StudentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('Clearing all existing students...');
        $this->clearAcademicTables();

        $departments = Department::with('programs')->get();
        
        if ($departments->isEmpty()) {
            $this->command->error('No departments found. Please run DepartmentProgramSeeder first.');
            return;
        }

        $studentsCreated = 0;
        $sectionsCreated = 0;

        $yearLevels = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
        $genders = ['Male', 'Female'];
        
        $firstNames = [
            'Adonis', 'Maria', 'Juan', 'Ana', 'Carlos', 'Liza', 'James', 'Sarah',
            'Michael', 'Jennifer', 'David', 'Michelle', 'John', 'Patricia', 'Robert',
            'Linda', 'Mark', 'Barbara', 'Paul', 'Elizabeth', 'Steven', 'Helen',
            'Andrew', 'Sandra', 'Kenneth', 'Donna', 'Joshua', 'Carol', 'Kevin', 'Ruth',
            'Daniel', 'Nancy', 'Matthew', 'Lisa', 'Anthony', 'Betty', 'Christopher', 'Margaret',
            'Joseph', 'Sandra', 'William', 'Ashley', 'Richard', 'Kimberly', 'Thomas', 'Emily',
            'Charles', 'Donna', 'Christopher', 'Michelle', 'Daniel', 'Dorothy', 'Matthew', 'Carol'
        ];
        
        $lastNames = [
            'Alcantara', 'Santos', 'Reyes', 'Cruz', 'Garcia', 'Lopez', 'Martinez',
            'Gonzalez', 'Rodriguez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore',
            'Jackson', 'Martin', 'Lee', 'Thompson', 'White', 'Harris', 'Sanchez',
            'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'King', 'Scott',
            'Green', 'Adams', 'Baker', 'Nelson', 'Carter', 'Mitchell', 'Perez', 'Roberts',
            'Turner', 'Phillips', 'Campbell', 'Parker', 'Evans', 'Edwards', 'Collins', 'Stewart',
            'Morris', 'Rogers', 'Reed', 'Cook', 'Morgan', 'Bell', 'Murphy', 'Bailey'
        ];

        $studentsPerDepartment = 10;
        
        foreach ($departments as $department) {
            // Get the first program for this department, or create a default one if none exists
            $program = $department->programs()->first();
            
            if (!$program) {
                $this->command->warn("No programs found for department: {$department->name}. Skipping...");
                continue;
            }
            
            // Create a section for this department/program
            $sectionName = $program->code . '-1-01';
            
            $section = Section::firstOrCreate([
                'name' => $sectionName,
                'year_level' => '1st Year',
                'program_id' => $program->id,
                'department_id' => $department->id
            ], [
                'semester' => '1st Semester',
                'academic_year' => '2024-2025',
            ]);
            
            if ($section->wasRecentlyCreated) {
                $sectionsCreated++;
            }

            // Create exactly 10 students for this department
            for ($i = 1; $i <= $studentsPerDepartment; $i++) {
                $firstName = $firstNames[($studentsCreated % count($firstNames))];
                $lastName = $lastNames[($studentsCreated % count($lastNames))];
                
                // Generate unique student number
                $studentNumber = sprintf('%02d-%04d-%05d', 
                    $department->id, 
                    $program->id, 
                    str_pad($i, 5, '0', STR_PAD_LEFT)
                );
                
                // Generate unique email
                $email = strtolower($firstName . '.' . $lastName . '.' . $i . '@student.local');
                
                Student::create([
                    'first_name' => $firstName,
                    'last_name' => $lastName,
                    'student_number' => $studentNumber,
                    'email' => $email,
                    'section_id' => $section->id,
                    'department_id' => $department->id,
                    'program_id' => $program->id,
                    'year_level' => '1st Year',
                    'gender' => $genders[$i % 2],
                    'guardian_name' => $firstName . ' ' . $lastName . ' (Parent)',
                    'guardian_contact' => '09' . sprintf('%09d', rand(100000000, 999999999)),
                    'birth_date' => Carbon::now()->subYears(rand(18, 25))->subDays(rand(0, 365))->format('Y-m-d'),
                    'status' => 'Active',
                ]);
                
                $studentsCreated++;
            }
        }

        $this->command->info("Created {$sectionsCreated} sections and {$studentsCreated} students ({$studentsPerDepartment} per department).");
    }

    private function clearAcademicTables(): void
    {
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');

        foreach ([
            'weekly_summaries',
            'attendance_histories',
            'attendance_records',
            'interventions',
            'management_remarks',
            'teacher_sections',
            'schedules',
            'subjects',
            'students',
            'sections',
        ] as $table) {
            if (Schema::hasTable($table)) {
                DB::table($table)->truncate();
            }
        }

        DB::statement('SET FOREIGN_KEY_CHECKS=1;');
    }
}