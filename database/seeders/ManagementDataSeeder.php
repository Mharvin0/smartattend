<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\WeeklySummary;
use App\Models\ManagementRemark;
use App\Models\AttendanceRecord;
use App\Models\Student;
use App\Models\Section;
use App\Models\Program;
use App\Models\Department;
use App\Models\User;
use Carbon\Carbon;

class ManagementDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('Seeding management data for SuperAdmin management tab...');

        $students = Student::with(['section.program.department'])->get();
        
        if ($students->isEmpty()) {
            $this->command->error('No students found. Please run StudentSeeder first.');
            return;
        }

        $superAdmin = User::role('Super Admin')->first();
        if (!$superAdmin) {
            $this->command->warn('Super Admin user not found. Management remarks will be created without creator.');
        }

        $weeks = [];
        $currentWeek = Carbon::now()->startOfWeek();
        
        for ($i = 8; $i >= 0; $i--) {
            $weekStart = $currentWeek->copy()->subWeeks($i);
            $weekEnd = $weekStart->copy()->endOfWeek();
            $weeks[] = [
                'start' => $weekStart,
                'end' => $weekEnd,
                'index' => $i,
            ];
        }

        $this->command->info('Creating weekly summaries for ' . count($students) . ' students across ' . count($weeks) . ' weeks...');

        $specificReasons = [
            '1. Death of Provider',
            '1. Loss of Job of the Provider',
            '1. Income Priorities',
            '1. Daily Expenses',
            '2. Personal Health Concern',
            '2. Family Health Issues',
            '3. Parent\'s Decision',
            '3. Change Address',
            '3. Prioritize family responsibilities',
            '4. Learning Challenges',
            '4. Lack of interest in chosen course',
            '4. Overwhelming Academic Load',
            '5. Bullying and Discrimination',
            '5. Early Marriage or Parenthood',
            '5. Pregnancy',
            '6. Distance to School',
            '6. Lack of Infrastructure',
            '7. Affected by Calamities',
            '7. Transferred to SUC',
            '7. Transferred to LUC',
            '7. Transferred to another Private Institution',
            '7. Transferred to another school',
            '8. Late Enrollee',
            '8. Section Change',
            '8. Change in class schedule'
        ];

        $weeklySummariesCreated = 0;
        $remarksCreated = 0;
        $attendanceRecordsCreated = 0;
        $pnsStudentsCreated = 0;

        $totalStudents = $students->count();
        $pnsCount = max(3, min(ceil($totalStudents * 0.15), $totalStudents));
        $pnsStudentIds = $totalStudents > 0 
            ? $students->random($pnsCount)->pluck('id')->toArray()
            : [];

        $this->command->info("Selected {$pnsCount} students to be PNS students.");

        foreach ($students as $student) {
            $isPNSStudent = in_array($student->id, $pnsStudentIds);
            
            foreach ($weeks as $week) {
                $weekIndex = $week['index'];
                
                $existingSummary = WeeklySummary::where('student_id', $student->id)
                    ->where('week_start', $week['start']->toDateString())
                    ->where('week_end', $week['end']->toDateString())
                    ->first();

                if ($existingSummary) {
                    continue;
                }

                $totalDays = 5;
                $presentCount = 0;
                $lateCount = 0;
                $absentCount = 0;

                if ($isPNSStudent) {
                    if ($weekIndex <= 2) { // Current week (0)
                        $absentCount = $totalDays; //all days absent = PNS status
                        $presentCount = 0;
                        $lateCount = 0;
                        if ($weekIndex === 0) {
                            $pnsStudentsCreated++;
                        }
                    } else {
                        $departmentCode = optional(optional($student->section)->program)->department->code ?? 'CIT';
                        $attendancePattern = $this->getAttendancePatternForDepartment($departmentCode);
                        $presentCount = rand($attendancePattern['present_min'], $attendancePattern['present_max']);
                        $lateCount = rand($attendancePattern['late_min'], $attendancePattern['late_max']);
                        $absentCount = max(0, $totalDays - $presentCount - $lateCount);
                    }
                } else {
                    $departmentCode = optional(optional($student->section)->program)->department->code ?? 'CIT';
                    $attendancePattern = $this->getAttendancePatternForDepartment($departmentCode);
                    
                    $presentCount = rand($attendancePattern['present_min'], $attendancePattern['present_max']);
                    $lateCount = rand($attendancePattern['late_min'], $attendancePattern['late_max']);
                    $absentCount = max(0, $totalDays - $presentCount - $lateCount);
                }
                
                $total = $presentCount + $lateCount + $absentCount;
                if ($total > 5) {
                    $excess = $total - 5;
                    if ($absentCount >= $excess) {
                        $absentCount -= $excess;
                    } elseif ($lateCount >= $excess) {
                        $lateCount -= $excess;
                    } else {
                        $presentCount -= ($excess - $lateCount - $absentCount);
                    }
                }

                $improvementIndex = $totalDays > 0 ? (($presentCount * 2 + $lateCount) / ($totalDays * 2)) * 100 : 0;

                $weeklySummary = WeeklySummary::create([
                    'student_id' => $student->id,
                    'week_start' => $week['start']->toDateString(),
                    'week_end' => $week['end']->toDateString(),
                    'present_count' => $presentCount,
                    'absent_count' => $absentCount,
                    'late_count' => $lateCount,
                    'improvement_index' => round($improvementIndex, 2),
                ]);

                $weeklySummariesCreated++;
                if ($absentCount > 0) {
                    $shouldCreateRecords = false;
                    $numRecords = 0;
                    
                    if ($isPNSStudent && $presentCount === 0 && $lateCount === 0 && $absentCount > 0) {
                        $shouldCreateRecords = true;
                        $numRecords = $absentCount;
                    } elseif (!$isPNSStudent && rand(1, 3) === 1) {
                        $shouldCreateRecords = true;
                        $numRecords = min($absentCount, rand(1, 3));
                    }

                    if ($shouldCreateRecords) {
                        $selectedReasons = [];
                        if ($isPNSStudent && $presentCount === 0 && $lateCount === 0) {
                            // PNS - more serious reasons
                            $pnsReasons = [
                                '1. Loss of Job of the Provider',
                                '1. Income Priorities',
                                '1. Daily Expenses',
                                '2. Personal Health Concern',
                                '2. Family Health Issues',
                                '3. Parent\'s Decision',
                                '4. Learning Challenges',
                                '4. Lack of interest in chosen course',
                                '6. Distance to School',
                                '7. Affected by Calamities',
                            ];
                            $selectedReasons = $pnsReasons;
                        } else {
                            $selectedReasons = $specificReasons;
                        }

                        $availableDays = [0, 1, 2, 3, 4]; //Monday to Friday
                        shuffle($availableDays);
                        $selectedDays = array_slice($availableDays, 0, $numRecords);
                        
                        foreach ($selectedDays as $dayOffset) {
                            $recordDate = $week['start']->copy()->addDays($dayOffset);
                            
                            $existingRecord = AttendanceRecord::where('student_id', $student->id)
                                ->whereDate('date', $recordDate->toDateString())
                                ->first();
                            
                            if (!$existingRecord) {
                                AttendanceRecord::create([
                                    'student_id' => $student->id,
                                    'date' => $recordDate->toDateString(),
                                    'status' => 'absent',
                                    'remarks' => $selectedReasons[array_rand($selectedReasons)],
                                    'recorded_by' => $superAdmin ? $superAdmin->id : null,
                                ]);
                                
                                $attendanceRecordsCreated++;
                            }
                        }
                    }
                }

                // PNS = 0 present, 0 late, all absent
                // SLIP = absent > 50% of total
                $isPNS = ($presentCount + $lateCount === 0 && $absentCount > 0);
                $isSLIP = ($total > 0 && $absentCount > ($total / 2));
                
                if ($isPNS || ($isSLIP && rand(1, 3) === 1)) {
                    $remarkTemplates = [
                        'Student has been consistently absent this week. Please follow up with parent/guardian.',
                        'Attendance pattern concerning. Recommend intervention.',
                        'Multiple absences noted. Requires attention.',
                        'Student needs support to improve attendance.',
                        'PNS status detected. Urgent intervention required.',
                    ];

                    ManagementRemark::firstOrCreate(
                        [
                            'student_id' => $student->id,
                            'week_start' => $week['start']->toDateString(),
                            'week_end' => $week['end']->toDateString(),
                        ],
                        [
                            'remark' => $isPNS ? $remarkTemplates[4] : $remarkTemplates[array_rand($remarkTemplates)],
                            'created_by' => $superAdmin ? $superAdmin->id : null,
                        ]
                    );
                    
                    $remarksCreated++;
                }
            }
        }

        $this->command->info("✓ Created {$weeklySummariesCreated} weekly summaries");
        $this->command->info("✓ Created {$remarksCreated} management remarks");
        $this->command->info("✓ Created {$attendanceRecordsCreated} attendance records with remarks");
        $this->command->info("✓ Created {$pnsStudentsCreated} PNS student records (Present None Status)");
        $this->command->info('Management data seeding completed successfully!');
    }

    /**
     * Get attendance pattern based on department
     * Different departments may have different typical attendance patterns
     */
    private function getAttendancePatternForDepartment(string $departmentCode): array
    {
        $patterns = [
            'CMA' => ['present_min' => 3, 'present_max' => 5, 'late_min' => 0, 'late_max' => 1], //good
            'CELA' => ['present_min' => 3, 'present_max' => 5, 'late_min' => 0, 'late_max' => 2],
            'CCJE' => ['present_min' => 4, 'present_max' => 5, 'late_min' => 0, 'late_max' => 1],
            'CEA' => ['present_min' => 2, 'present_max' => 4, 'late_min' => 0, 'late_max' => 2], //some absences
            'CAHS' => ['present_min' => 3, 'present_max' => 5, 'late_min' => 0, 'late_max' => 1],
            'CIT' => ['present_min' => 2, 'present_max' => 4, 'late_min' => 0, 'late_max' => 2], 
        ];

        return $patterns[$departmentCode] ?? ['present_min' => 2, 'present_max' => 4, 'late_min' => 0, 'late_max' => 2];
    }
}

