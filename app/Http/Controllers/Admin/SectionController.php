<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Section;
use App\Models\Student;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SectionController extends Controller
{
    public function __construct()
    {
        $this->middleware(['auth']);
        $this->middleware(function ($request, $next) {
            if (!auth()->user()->hasAnyRole(['Admin', 'Super Admin'])) {
                abort(403, 'Unauthorized access');
            }
            return $next($request);
        });
    }

    public function index()
    {
        $sections = Section::with(['department', 'program', 'teachers'])
            ->orderBy('program')
            ->orderBy('year_level')
            ->orderBy('name')
            ->get();

        // Get Teachers for adviser selection
        $teachers = \App\Models\Teacher::with(['department', 'optionalDepartment'])
            ->orderBy('name')
            ->get();

        return Inertia::render('Admin/Sections', [
            'sections' => $sections,
            'programs' => Section::getPrograms(),
            'programsList' => \App\Models\Program::with('department')->get(),
            'yearLevels' => Section::getYearLevels(),
            'semesters' => Section::getSemesters(),
            'departments' => \App\Models\Department::all(),
            'teachers' => $teachers,
        ]);
    }

    public function show(Section $section)
    {
        $section->load(['department', 'program', 'teachers', 'students']);
        
        return response()->json([
            'section' => [
                'id' => $section->id,
                'name' => $section->name,
                'year_level' => $section->year_level,
                'adviser_name' => $section->adviser_name,
                'program' => $section->program,
                'department' => $section->department,
                'semester' => $section->semester,
                'academic_year' => $section->academic_year,
                'department_id' => $section->department_id,
                'program_id' => $section->program_id,
                'students_count' => $section->students_count,
                'teachers' => $section->teachers->map(function ($teacher) {
                    return [
                        'id' => $teacher->id,
                        'name' => $teacher->name,
                        'email' => $teacher->email,
                        'subject' => $teacher->pivot->subject ?? 'General',
                    ];
                }),
                'students' => $section->students->map(function ($student) {
                    return [
                        'id' => $student->id,
                        'student_id' => $student->student_id,
                        'name' => $student->first_name . ' ' . $student->last_name,
                        'email' => $student->email,
                    ];
                }),
            ]
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'year_level' => ['required', 'string', 'max:255'],
            'adviser_name' => ['required', 'string', 'max:255'],
            'adviser_id' => ['nullable', 'integer', 'exists:teachers,id'],
            'program' => ['required', 'string', 'max:255'],
            'department' => ['nullable', 'string', 'max:255'],
            'semester' => ['required', 'string', 'max:255'],
            'academic_year' => ['required', 'string', 'max:255'],
            'department_id' => ['nullable', 'integer', 'exists:departments,id'],
            'program_id' => ['nullable', 'integer', 'exists:programs,id'],
        ]);

        Section::create($validated);
        return back()->with('success', 'Section created successfully');
    }

    public function update(Request $request, Section $section)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'year_level' => ['required', 'string', 'max:255'],
            'adviser_name' => ['required', 'string', 'max:255'],
            'program' => ['required', 'string', 'max:255'],
            'department' => ['nullable', 'string', 'max:255'],
            'semester' => ['required', 'string', 'max:255'],
            'academic_year' => ['required', 'string', 'max:255'],
            'department_id' => ['nullable', 'integer', 'exists:departments,id'],
            'program_id' => ['nullable', 'integer', 'exists:programs,id'],
        ]);

        $section->update($validated);
        return back()->with('success', 'Section updated successfully');
    }

    public function destroy(Section $section)
    {
        $section->delete();
        return back()->with('success', 'Section deleted successfully');
    }

    public function importForm()
    {
        $departments = Section::getDepartments();
        $programs = Section::getPrograms();
        
        return Inertia::render('Admin/SectionsImport', [
            'departments' => $departments,
            'programs' => $programs,
        ]);
    }

    public function importStore(Request $request)
    {
        $validated = $request->validate([
            'file' => ['required','file','mimes:csv,txt'],
        ]);

        $file = $request->file('file');
        $handle = fopen($file->getRealPath(), 'r');
        if ($handle === false) {
            return back()->with('error', 'Unable to read uploaded file');
        }

        $header = fgetcsv($handle);
        $normalized = array_map(fn($h) => strtolower(trim($h)), $header ?: []);

        $colIndex = [
            'section_name' => array_search('section_name', $normalized, true),
            'year_level' => array_search('year_level', $normalized, true),
            'adviser_name' => array_search('adviser_name', $normalized, true),
            'program' => array_search('program', $normalized, true),
            'department' => array_search('department', $normalized, true),
            'semester' => array_search('semester', $normalized, true),
            'academic_year' => array_search('academic_year', $normalized, true),
            'student_number' => array_search('student_number', $normalized, true),
            'first_name' => array_search('first_name', $normalized, true),
            'last_name' => array_search('last_name', $normalized, true),
            'middle_name' => array_search('middle_name', $normalized, true),
            'birth_date' => array_search('birth_date', $normalized, true),
            'gender' => array_search('gender', $normalized, true),
            'guardian_name' => array_search('guardian_name', $normalized, true),
            'guardian_contact' => array_search('guardian_contact', $normalized, true),
        ];

        DB::transaction(function () use ($handle, $colIndex) {
            $section = null;
            while (($row = fgetcsv($handle)) !== false) {
                if (!$section) {
                    $section = Section::create([
                        'name' => $row[$colIndex['section_name']] ?? 'A',
                        'year_level' => $row[$colIndex['year_level']] ?? '',
                        'adviser_name' => $row[$colIndex['adviser_name']] ?? '',
                        'program' => $row[$colIndex['program']] ?? '',
                        'department' => $colIndex['department'] !== false ? ($row[$colIndex['department']] ?? null) : null,
                        'semester' => $row[$colIndex['semester']] ?? '',
                        'academic_year' => $row[$colIndex['academic_year']] ?? '',
                    ]);
                }

                // Skip if no student number
                $studentNumber = $row[$colIndex['student_number']] ?? null;
                if (!$studentNumber) {
                    continue;
                }

                Student::updateOrCreate(
                    ['student_number' => $studentNumber],
                    [
                        'first_name' => $row[$colIndex['first_name']] ?? '',
                        'last_name' => $row[$colIndex['last_name']] ?? '',
                        'middle_name' => $colIndex['middle_name'] !== false ? ($row[$colIndex['middle_name']] ?: null) : null,
                        'birth_date' => $colIndex['birth_date'] !== false ? ($row[$colIndex['birth_date']] ?: null) : null,
                        'gender' => $colIndex['gender'] !== false ? ($row[$colIndex['gender']] ?: null) : null,
                        'guardian_name' => $colIndex['guardian_name'] !== false ? ($row[$colIndex['guardian_name']] ?: null) : null,
                        'guardian_contact' => $colIndex['guardian_contact'] !== false ? ($row[$colIndex['guardian_contact']] ?: null) : null,
                        'section_id' => $section->id,
                    ]
                );
            }
        });

        return redirect()->route('admin.sections')->with('success', 'Section and students imported successfully');
    }
}