<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\Program;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DepartmentProgramSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->deduplicateExistingData();

        $departmentsData = [
            [
                'name' => 'College of Management and Accountancy',
                'code' => 'CMA',
                'description' => 'Offers business and management programs',
                'programs' => [
                    ['name' => 'Bachelor of Science in Accountancy', 'code' => 'BSA', 'duration_years' => 4],
                    ['name' => 'Bachelor of Science in Management Accounting', 'code' => 'BSMA', 'duration_years' => 4],
                    ['name' => 'Bachelor of Science in Accountancy Technology', 'code' => 'BSAT', 'duration_years' => 4],
                    ['name' => 'Bachelor of Science in Hospitality Management', 'code' => 'BSHM', 'duration_years' => 4],
                    ['name' => 'Bachelor of Science in Tourism Management', 'code' => 'BSTM', 'duration_years' => 4],
                    ['name' => 'Bachelor of Science in Business Administration', 'code' => 'BSBA', 'duration_years' => 4],
                    ['name' => 'Bachelor of Science in Business Administration Major in Marketing Management', 'code' => 'BSBA-MM', 'duration_years' => 4],
                    ['name' => 'Bachelor of Science in Business Administration Major in Financial Management', 'code' => 'BSBA-FM', 'duration_years' => 4],
                ]
            ],
            [
                'name' => 'College of Education and Liberal Arts',
                'code' => 'CELA',
                'description' => 'Offers education and liberal arts programs',
                'programs' => [
                    ['name' => 'Bachelor of Arts in Political Science', 'code' => 'BAPS', 'duration_years' => 4],
                    ['name' => 'Bachelor of Science in Elementary Education', 'code' => 'BSEED', 'duration_years' => 4],
                    ['name' => 'Bachelor of Secondary Education', 'code' => 'BSED', 'duration_years' => 4],
                    ['name' => 'Bachelor of Secondary Education Major in English', 'code' => 'BSED-ENG', 'duration_years' => 4],
                    ['name' => 'Bachelor of Secondary Education Major in Math', 'code' => 'BSED-MATH', 'duration_years' => 4],
                    ['name' => 'Bachelor of Secondary Education Major in Science', 'code' => 'BSED-SCI', 'duration_years' => 4],
                    ['name' => 'Bachelor of Secondary Education Major in Social Studies', 'code' => 'BSED-SS', 'duration_years' => 4],
                ]
            ],
            [
                'name' => 'College of Criminal Justice Education',
                'code' => 'CCJE',
                'description' => 'Offers criminal justice programs',
                'programs' => [
                    ['name' => 'Bachelor of Science in Criminology', 'code' => 'BSCRIM', 'duration_years' => 4],
                ]
            ],
            [
                'name' => 'College of Engineering and Architecture',
                'code' => 'CEA',
                'description' => 'Offers engineering and architecture programs',
                'programs' => [
                    ['name' => 'Bachelor of Science in Architecture', 'code' => 'BSARCH', 'duration_years' => 5],
                    ['name' => 'Bachelor of Science in Computer Engineering', 'code' => 'BSCpE', 'duration_years' => 5],
                    ['name' => 'Bachelor of Science in Civil Engineering', 'code' => 'BSCE', 'duration_years' => 5],
                    ['name' => 'Bachelor of Science in Electrical Engineering', 'code' => 'BSEE', 'duration_years' => 5],
                    ['name' => 'Bachelor of Science in Mechanical Engineering', 'code' => 'BSME', 'duration_years' => 5],
                ]
            ],
            [
                'name' => 'College of Allied Health Sciences',
                'code' => 'CAHS',
                'description' => 'Offers allied health programs',
                'programs' => [
                    ['name' => 'Bachelor of Science in Nursing', 'code' => 'BSN', 'duration_years' => 4],
                    ['name' => 'Bachelor of Science in Pharmacy', 'code' => 'BSPHARM', 'duration_years' => 5],
                    ['name' => 'Bachelor in Medical Laboratory Science', 'code' => 'BMLS', 'duration_years' => 4],
                    ['name' => 'Bachelor of Science in Psychology', 'code' => 'BSPSYCH', 'duration_years' => 4],
                ]
            ],
            [
                'name' => 'College of Information Technology',
                'code' => 'CIT',
                'description' => 'Offers information technology programs',
                'programs' => [
                    ['name' => 'Bachelor of Science in Information Technology', 'code' => 'BSIT', 'duration_years' => 4],
                ]
            ],
        ];

        foreach ($departmentsData as $departmentData) {
            $programs = $departmentData['programs'];
            unset($departmentData['programs']);

            // Restore soft-deleted department if it exists to avoid unique key collisions.
            $department = Department::withTrashed()->where('code', $departmentData['code'])->first();
            if ($department) {
                if ($department->trashed()) {
                    $department->restore();
                }
                $department->update([
                    'name' => $departmentData['name'],
                    'description' => $departmentData['description'],
                ]);
            } else {
                $department = Department::create($departmentData);
            }
            
            foreach ($programs as $programData) {
                $programData['department_id'] = $department->id;
                $programData['description'] = null;
                $programData['is_active'] = true;

                $program = Program::withTrashed()
                    ->where('code', $programData['code'])
                    ->where('department_id', $department->id)
                    ->first();

                if ($program) {
                    if ($program->trashed()) {
                        $program->restore();
                    }
                    $program->update([
                        'name' => $programData['name'],
                        'duration_years' => $programData['duration_years'],
                        'description' => $programData['description'],
                        'is_active' => $programData['is_active'],
                    ]);
                } else {
                    Program::create($programData);
                }
            }
        }
    }

    /**
     * Remove duplicate departments/programs while preserving a single record per code.
     */
    private function deduplicateExistingData(): void
    {
        $duplicateDeptCodes = Department::withTrashed()
            ->select('code')
            ->groupBy('code')
            ->havingRaw('COUNT(*) > 1')
            ->pluck('code');

        foreach ($duplicateDeptCodes as $code) {
            $canonical = Department::withTrashed()
                ->where('code', $code)
                ->orderByRaw('deleted_at IS NULL DESC')
                ->orderBy('id')
                ->first();

            Department::withTrashed()
                ->where('code', $code)
                ->where('id', '!=', $canonical->id)
                ->get()
                ->each(function (Department $duplicate) use ($canonical) {
                    Program::withTrashed()
                        ->where('department_id', $duplicate->id)
                        ->update(['department_id' => $canonical->id]);
                    // Hard delete to avoid soft-delete unique collisions.
                    $duplicate->forceDelete();
                });
        }

        $duplicatePrograms = Program::withTrashed()
            ->select('code', 'department_id')
            ->groupBy('code', 'department_id')
            ->havingRaw('COUNT(*) > 1')
            ->get();

        foreach ($duplicatePrograms as $duplicate) {
            $canonical = Program::withTrashed()
                ->where('code', $duplicate->code)
                ->where('department_id', $duplicate->department_id)
                ->orderByRaw('deleted_at IS NULL DESC')
                ->orderBy('id')
                ->first();

            Program::withTrashed()
                ->where('code', $duplicate->code)
                ->where('department_id', $duplicate->department_id)
                ->where('id', '!=', $canonical->id)
                ->get()
                ->each(function (Program $duplicateProgram) {
                    $duplicateProgram->forceDelete();
                });
        }
    }
}
