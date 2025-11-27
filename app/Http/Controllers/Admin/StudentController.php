<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Student;
use App\Models\Section;

class StudentController extends Controller
{
    public function __construct()
    {
        $this->middleware(['auth']);
        $this->middleware(function ($request, $next) {
            $user = auth()->user();
            
            // Check if user is authenticated
            if (!$user) {
                return redirect()->route('login');
            }
            
            // Check if user has admin role
            if (!$user->hasRole('Admin')) {
                // Redirect based on their actual role
                if ($user->hasRole('Super Admin')) {
                    return redirect()->route('super.dashboard');
                } elseif ($user->hasRole('Teacher')) {
                    return redirect()->route('teacher.dashboard');
                }
                // Otherwise, show 403 error
                abort(403, 'Access denied. Admin role required.');
            }
            
            return $next($request);
        });
    }

    public function index(Request $request)
    {
        // Get all students with their sections and priority information - matching System Admin structure
        $studentsQuery = Student::with(['section.program.department', 'weeklySummaries', 'schedules.subject', 'attendanceRecords'])
            ->orderBy('last_name')
            ->orderBy('first_name');

        // Apply filters
        if ($request->filled('department')) {
            $studentsQuery->whereHas('section.program', function ($q) use ($request) {
                $q->where('department_id', $request->department);
            });
        }

        if ($request->filled('program')) {
            $studentsQuery->whereHas('section', function ($q) use ($request) {
                $q->where('program_id', $request->program);
            });
        }

        if ($request->filled('year_level')) {
            $studentsQuery->where('year_level', $request->year_level);
        }

        // Note: Status filter will be applied in the frontend after calculating attendance_status
        // We keep priority filter for backward compatibility but will use status in frontend
        if ($request->filled('priority')) {
            $studentsQuery->where('priority', $request->priority);
        }

        if ($request->filled('search')) {
            $searchTerm = $request->search;
            $studentsQuery->where(function ($query) use ($searchTerm) {
                $query->where('first_name', 'like', "%{$searchTerm}%")
                      ->orWhere('last_name', 'like', "%{$searchTerm}%")
                      ->orWhere('student_number', 'like', "%{$searchTerm}%")
                      ->orWhere('email', 'like', "%{$searchTerm}%");
            });
        }

        $students = $studentsQuery->get()->map(function ($student) {
            // Update priority for this student
            $student->updatePriority();
            // Calculate attendance status (Normal, SLIP, PNS)
            $student->attendance_status = $student->calculateAttendanceStatus();
            
            return $student;
        });

        // Get departments for filter dropdown
        $departments = \App\Models\Department::select('id', 'name')->orderBy('name')->get();

        // Get programs for filter dropdown
        $programs = \App\Models\Program::with('department')->orderBy('name')->get();

        // Get sections for filter dropdown - matching System Admin structure
        $sections = \App\Models\Section::with(['program.department'])->orderBy('name')->get(['id', 'name', 'program_id']);

        // Get status options (Normal, SLIP, PNS)
        $statuses = ['Normal', 'SLIP', 'PNS'];
        
        // Get priority options (for backward compatibility)
        $priorities = ['Safe', 'Call Needed', 'PNS'];

        // Calculate statistics based on attendance status - matching System Admin
        $normalCount = $students->where('attendance_status', 'Normal')->count();
        $slipCount = $students->where('attendance_status', 'SLIP')->count();
        $pnsCount = $students->where('attendance_status', 'PNS')->count();

        // Get statistics
        $stats = [
            'total_students' => $students->count(),
            'normal_count' => $normalCount,
            'slip_count' => $slipCount,
            'pns_count' => $pnsCount,
        ];

        return Inertia::render('Admin/Students', [
            'students' => $students,
            'departments' => $departments,
            'programs' => $programs,
            'sections' => $sections,
            'statuses' => $statuses,
            'priorities' => $priorities, // Keep for backward compatibility
            'stats' => $stats,
            'filters' => $request->only(['department', 'program', 'year_level', 'priority', 'status', 'search']),
        ]);
    }

    public function show(Student $student)
    {
        // Update priority for this student
        $student->updatePriority();
        
        $studentData = [
            'id' => $student->id,
            'student_id' => $student->student_id,
            'name' => $student->first_name . ' ' . $student->last_name,
            'email' => $student->email,
            'section' => $student->section?->name ?? 'No Section',
            'program' => $student->section?->program?->name ?? 'No Program',
            'department' => $student->section?->program?->department?->name ?? 'No Department',
            'year_level' => $student->section?->year_level ?? 'N/A',
            'status' => $student->status ?? 'Active',
            'priority' => $student->priority ?? 'Safe',
            'absence_count' => $student->absence_count ?? 0,
        ];

        return Inertia::render('Admin/StudentProfile', [
            'student' => $studentData,
        ]);
    }

    public function updatePriority(Request $request)
    {
        $request->validate([
            'student_id' => 'required|exists:students,id',
        ]);

        $student = Student::findOrFail($request->student_id);
        $newPriority = $student->updatePriority();

        return response()->json([
            'success' => true,
            'priority' => $newPriority,
            'absence_count' => $student->absence_count,
            'message' => 'Student priority updated successfully'
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'student_number' => 'required|string|unique:students,student_number',
            'email' => 'required|email|unique:students,email',
            'section_id' => 'required|exists:sections,id',
            'year_level' => 'required|string',
            'gender' => 'nullable|string',
            'birth_date' => 'nullable|date',
            'guardian_name' => 'nullable|string|max:255',
            'guardian_contact' => 'nullable|string|max:255',
        ]);

        $student = Student::create([
            'first_name' => $validated['first_name'],
            'last_name' => $validated['last_name'],
            'student_number' => $validated['student_number'],
            'student_id' => $validated['student_number'],
            'email' => $validated['email'],
            'section_id' => $validated['section_id'],
            'year_level' => $validated['year_level'],
            'gender' => $validated['gender'] ?? null,
            'birth_date' => $validated['birth_date'] ?? null,
            'guardian_name' => $validated['guardian_name'] ?? null,
            'guardian_contact' => $validated['guardian_contact'] ?? null,
            'status' => 'Active',
        ]);

        $student->updatePriority();

        return redirect()->route('admin.students')->with('success', 'Student created successfully!');
    }

    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,xml|max:10240',
            'type' => 'required|in:csv,xml',
        ]);

        $file = $request->file('file');
        $type = $request->input('type');
        $imported = 0;
        $errors = [];

        try {
            if ($type === 'csv') {
                $data = array_map('str_getcsv', file($file->getRealPath()));
                $headers = array_shift($data);

                foreach ($data as $row) {
                    if (count($row) < 6) continue;
                    
                    try {
                        $student = Student::create([
                            'first_name' => $row[0] ?? '',
                            'last_name' => $row[1] ?? '',
                            'student_number' => $row[2] ?? '',
                            'student_id' => $row[2] ?? '',
                            'email' => $row[3] ?? '',
                            'section_id' => $row[4] ?? null,
                            'year_level' => $row[5] ?? '1st Year',
                            'status' => 'Active',
                        ]);
                        $student->updatePriority();
                        $imported++;
                    } catch (\Exception $e) {
                        $errors[] = "Row " . ($imported + count($errors) + 1) . ": " . $e->getMessage();
                    }
                }
            } else {
                // XML import
                $xml = simplexml_load_file($file->getRealPath());
                foreach ($xml->student as $studentXml) {
                    try {
                        $student = Student::create([
                            'first_name' => (string)$studentXml->first_name,
                            'last_name' => (string)$studentXml->last_name,
                            'student_number' => (string)$studentXml->student_number,
                            'student_id' => (string)$studentXml->student_number,
                            'email' => (string)$studentXml->email,
                            'section_id' => isset($studentXml->section_id) ? (int)$studentXml->section_id : null,
                            'year_level' => (string)$studentXml->year_level ?? '1st Year',
                            'status' => 'Active',
                        ]);
                        $student->updatePriority();
                        $imported++;
                    } catch (\Exception $e) {
                        $errors[] = "Student " . ($imported + count($errors) + 1) . ": " . $e->getMessage();
                    }
                }
            }

            $message = "Successfully imported {$imported} students.";
            if (count($errors) > 0) {
                $message .= " " . count($errors) . " errors occurred.";
            }

            return redirect()->route('admin.students')->with('success', $message)->with('errors', $errors);
        } catch (\Exception $e) {
            return redirect()->route('admin.students')->with('error', 'Import failed: ' . $e->getMessage());
        }
    }

    public function destroy(Student $student)
    {
        $student->delete(); // Soft delete
        
        // Return redirect back with success message for Inertia
        return back()->with('success', 'Student deleted successfully.');
    }
}