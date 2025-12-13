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
        $this->command->info('Clearing students, sections, subjects, schedules, and related attendance data...');
        $this->clearAcademicTables();

        $departments = Department::with('programs')->get();
        
        if ($departments->isEmpty()) {
            $this->command->error('No departments or programs found. Please run DepartmentProgramSeeder first.');
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
            'Andrew', 'Sandra', 'Kenneth', 'Donna', 'Joshua', 'Carol', 'Kevin', 'Ruth'
        ];
        
        $lastNames = [
            'Alcantara', 'Santos', 'Reyes', 'Cruz', 'Garcia', 'Lopez', 'Martinez',
            'Gonzalez', 'Rodriguez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore',
            'Jackson', 'Martin', 'Lee', 'Thompson', 'White', 'Harris', 'Sanchez',
            'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'King', 'Scott'
        ];

        $maxStudents = 30;
        
        foreach ($departments as $department) {
            if ($studentsCreated >= $maxStudents) {
                break;
            }
            
            $programs = $department->programs()->take(2)->get();
            
            foreach ($programs as $program) {
                if ($studentsCreated >= $maxStudents) {
                    break;
                }
                
                foreach ($yearLevels as $yearLevel) {
                    if ($studentsCreated >= $maxStudents) {
                        break;
                    }
                    
                    $sectionName = $program->code . substr($yearLevel, 0, 1) . '-' . sprintf('%02d', rand(1, 10));
                    
                    $section = Section::firstOrCreate([
                        'name' => $sectionName,
                        'year_level' => $yearLevel,
                        'program_id' => $program->id,
                        'department_id' => $department->id
                    ], [
                        'semester' => '1st Semester',
                        'academic_year' => '2024-2025',
                    ]);
                    
                    if ($section->wasRecentlyCreated) {
                        $sectionsCreated++;
                    }

                    $remainingSlots = $maxStudents - $studentsCreated;
                    $numStudents = min(rand(3, 5), $remainingSlots);
                    
                    for ($i = 1; $i <= $numStudents; $i++) {
                        if ($studentsCreated >= $maxStudents) {
                            break;
                        }
                        
                        $firstName = $firstNames[array_rand($firstNames)];
                        $lastName = $lastNames[array_rand($lastNames)];
                        $studentNumber = sprintf('%02d-%04d-%05d', rand(1, 99), rand(1000, 9999), rand(10000, 99999));
                        
                        Student::create([
                            'first_name' => $firstName,
                            'last_name' => $lastName,
                            'student_number' => $studentNumber,
                            'section_id' => $section->id,
                            'department_id' => $department->id,
                            'program_id' => $program->id,
                            'year_level' => $yearLevel,
                            'gender' => $genders[array_rand($genders)],
                            'guardian_name' => $firstName . ' ' . $lastName . ' (Parent)',
                            'guardian_contact' => '09' . sprintf('%09d', rand(100000000, 999999999)),
                            'birth_date' => Carbon::now()->subYears(rand(18, 25))->subDays(rand(0, 365))->format('Y-m-d'),
                            'status' => 'active',
                        ]);
                        
                        $studentsCreated++;
                    }
                }
            }
        }

        $this->command->info("Created {$sectionsCreated} sections and {$studentsCreated} students across multiple departments and programs.");
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