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
            
            // Explicitly block CSDL users from admin routes
            if ($user->hasRole('CSDL') && !$user->hasRole('Admin') && !$user->hasRole('Super Admin')) {
                return redirect()->route('csdl.dashboard');
            }
            
            // Check if user has admin role
            if (!$user->hasRole('Admin') && !$user->hasRole('Super Admin')) {
                // Redirect based on their actual role
                if ($user->hasRole('Super Admin')) {
                    return redirect()->route('super.dashboard');
                } elseif ($user->hasRole('CSDL')) {
                    return redirect()->route('csdl.dashboard');
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
            // Refresh the model to get the updated absence_count
            $student->refresh();
            // attendance_status is now automatically available via the accessor and $appends
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

	public function update(Request $request, Student $student)
	{
		$validated = $request->validate([
			'status' => 'required|string|in:Normal,SLIP,PNS',
			'absence_count' => 'required|integer|min:0',
		]);

		$student->status = $validated['status'];
		$student->absence_count = $validated['absence_count'];
		$student->calculatePriority();
		$student->save();

		return back()->with('success', 'Student updated successfully.');
	}

    public function store(Request $request)
    {
        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'student_number' => 'required|string|regex:/^[0-9-]+$/|unique:students,student_number',
            'email' => 'required|email|unique:students,email',
            'phone' => 'nullable|digits:11',
            'section_id' => 'nullable|exists:sections,id',
            'year_level' => 'nullable|string',
            'gender' => 'nullable|string',
            'birth_date' => 'nullable|date',
            'guardian_name' => 'nullable|string|max:255',
            'guardian_contact' => 'nullable|digits:11',
        ]);

        $student = Student::create([
            'first_name' => $validated['first_name'],
            'last_name' => $validated['last_name'],
            'student_number' => $validated['student_number'],
            'student_id' => $validated['student_number'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'section_id' => $validated['section_id'] ?? null,
            'year_level' => $validated['year_level'] ?? null,
            'gender' => $validated['gender'] ?? null,
            'birth_date' => $validated['birth_date'] ?? null,
            'guardian_name' => $validated['guardian_name'] ?? null,
            'guardian_contact' => $validated['guardian_contact'] ?? null,
            'status' => 'Normal',
            'absence_count' => 0,
        ]);

        $student->updatePriority();

        return redirect()->route('admin.students')->with('success', 'Student created successfully!');
    }

    public function sendToCSDL(Request $request, $id)
    {
        $validated = $request->validate([
            'type' => 'required|in:call,home_visit',
            'csdl_user_id' => 'nullable|exists:users,id',
            'notes' => 'nullable|string',
        ]);

        $student = Student::findOrFail($id);

        // Get CSDL user - if not specified, use the first available CSDL user
        $csdlUserId = $validated['csdl_user_id'] ?? \App\Models\User::role('CSDL')->first()?->id;

        if (!$csdlUserId) {
            return redirect()->back()->with('error', 'No CSDL available to assign this task.');
        }

        // Create tracking record
        \App\Models\StudentTracking::create([
            'student_id' => $student->id,
            'tracked_by' => $csdlUserId,
            'type' => $validated['type'],
            'date' => now()->toDateString(),
            'status' => 'scheduled',
            'notes' => $validated['notes'] ?? "Assigned by " . auth()->user()->name,
        ]);

        // Update student priority so they appear in "Students Needing Attention" table
        $priority = $validated['type'] === 'home_visit' ? 'PNS' : 'Call Needed';
        $student->update(['priority' => $priority]);

        return redirect()->back()->with('success', "Student sent to CSDL for {$validated['type']}.");
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

    public function export(Request $request)
    {
        try {
            // Handle both FormData and JSON requests
            // Convert empty strings to null for nullable fields
            $input = $request->all();
            foreach (['student_id', 'department_id', 'program_id', 'section_id', 'year_level', 'status'] as $field) {
                if (isset($input[$field]) && $input[$field] === '') {
                    $input[$field] = null;
                }
            }
            
            $validated = validator($input, [
                'format' => ['required', 'string', 'in:csv,xml'],
                'student_id' => ['nullable', 'integer', 'exists:students,id'],
                'department_id' => ['nullable', 'integer', 'exists:departments,id'],
                'program_id' => ['nullable', 'integer', 'exists:programs,id'],
                'section_id' => ['nullable', 'integer', 'exists:sections,id'],
                'year_level' => ['nullable', 'string'],
                'status' => ['nullable', 'string'],
            ])->validate();
            
            // Convert string IDs to integers if they come from FormData
            if (!empty($validated['student_id'])) {
                $validated['student_id'] = (int) $validated['student_id'];
            }
            if (!empty($validated['department_id'])) {
                $validated['department_id'] = (int) $validated['department_id'];
            }
            if (!empty($validated['program_id'])) {
                $validated['program_id'] = (int) $validated['program_id'];
            }
            if (!empty($validated['section_id'])) {
                $validated['section_id'] = (int) $validated['section_id'];
            }

            // Build query with filters
            $query = Student::with(['section.program.department']);

            // If exporting a single student, filter by student_id
            if (!empty($validated['student_id'])) {
                $query->where('id', $validated['student_id']);
            } else {
                // Apply other filters only if not exporting a single student
                if (!empty($validated['department_id'])) {
                    $query->whereHas('section.program', function($q) use ($validated) {
                        $q->where('department_id', $validated['department_id']);
                    });
                }

                if (!empty($validated['program_id'])) {
                    $query->whereHas('section', function($q) use ($validated) {
                        $q->where('program_id', $validated['program_id']);
                    });
                }

                if (!empty($validated['section_id'])) {
                    $query->where('section_id', $validated['section_id']);
                }

                if (!empty($validated['year_level'])) {
                    $query->where('year_level', $validated['year_level']);
                }
            }

            $students = $query->get();
            
            // Apply status filter after calculating attendance status
            if (!empty($validated['status'])) {
                $students = $students->filter(function($student) use ($validated) {
                    $student->updatePriority();
                    $student->refresh();
                    // attendance_status is now automatically available via the accessor and $appends
                    return $student->attendance_status === $validated['status'];
                });
            } else {
                // Update priority for all students
                $students = $students->map(function($student) {
                    $student->updatePriority();
                    $student->refresh();
                    // attendance_status is now automatically available via the accessor and $appends
                    return $student;
                });
            }
            
            if ($students->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No students found matching the criteria.'
                ], 404);
            }

            if ($validated['format'] === 'csv') {
                return $this->exportStudentsToCsv($students, $validated['student_id'] ?? null);
            } else {
                return $this->exportStudentsToXml($students, $validated['student_id'] ?? null);
            }

        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::error('Export validation failed: ' . $e->getMessage(), [
                'request_data' => $request->all(),
                'errors' => $e->errors()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Validation failed: ' . $e->getMessage(),
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Export failed: ' . $e->getMessage(), [
                'request_data' => $request->all(),
                'trace' => $e->getTraceAsString(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Export failed: ' . $e->getMessage(),
                'error_details' => config('app.debug') ? [
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                    'trace' => $e->getTraceAsString()
                ] : null
            ], 500);
        }
    }

    private function exportStudentsToCsv($students, $studentId = null)
    {
        try {
            if ($studentId) {
                $student = $students->first();
                $filename = 'student_' . ($student->student_number ?? $student->id) . '_' . date('Y-m-d_H-i-s') . '.csv';
            } else {
                $filename = 'student_records_' . date('Y-m-d_H-i-s') . '.csv';
            }
            
            $headers = [
                'Content-Type' => 'text/csv; charset=UTF-8',
                'Content-Disposition' => 'attachment; filename="' . $filename . '"',
            ];

            $callback = function() use ($students) {
                $file = fopen('php://output', 'w');
                
                if ($file === false) {
                    throw new \Exception('Failed to open output stream for CSV export');
                }
                
                // CSV Headers
                fputcsv($file, [
                    'Student ID',
                    'Student Number',
                    'First Name',
                    'Last Name',
                    'Email',
                    'Phone',
                    'Gender',
                    'Birth Date',
                    'Department',
                    'Program',
                    'Section',
                    'Year Level',
                    'Guardian Name',
                    'Guardian Contact',
                    'Status',
                    'Priority',
                    'Absence Count',
                    'Created At',
                    'Updated At',
                ]);

                foreach ($students as $student) {
                    try {
                        $birthDate = $student->birth_date ? (is_string($student->birth_date) ? $student->birth_date : $student->birth_date->format('Y-m-d')) : '';
                        $createdAt = $student->created_at ? (is_string($student->created_at) ? $student->created_at : $student->created_at->format('Y-m-d H:i:s')) : '';
                        $updatedAt = $student->updated_at ? (is_string($student->updated_at) ? $student->updated_at : $student->updated_at->format('Y-m-d H:i:s')) : '';
                        
                        fputcsv($file, [
                            isset($student->student_id) ? $student->student_id : '',
                            isset($student->student_number) ? $student->student_number : '',
                            isset($student->first_name) ? $student->first_name : '',
                            isset($student->last_name) ? $student->last_name : '',
                            isset($student->email) ? $student->email : '',
                            isset($student->phone) ? $student->phone : '',
                            isset($student->gender) ? $student->gender : '',
                            $birthDate,
                            $student->section?->program?->department?->name ?? '',
                            $student->section?->program?->name ?? '',
                            $student->section?->name ?? '',
                            isset($student->year_level) ? $student->year_level : '',
                            isset($student->guardian_name) ? $student->guardian_name : '',
                            isset($student->guardian_contact) ? $student->guardian_contact : '',
                            isset($student->status) ? $student->status : '',
                            isset($student->priority) ? $student->priority : '',
                            isset($student->absence_count) ? $student->absence_count : 0,
                            $createdAt,
                            $updatedAt,
                        ]);
                    } catch (\Exception $e) {
                        \Log::warning('Failed to export student ' . ($student->id ?? 'unknown') . ': ' . $e->getMessage());
                        continue;
                    }
                }

                fclose($file);
            };

            return response()->stream($callback, 200, $headers);
        } catch (\Exception $e) {
            \Log::error('CSV export failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'CSV export failed: ' . $e->getMessage()
            ], 500);
        }
    }

    private function exportStudentsToXml($students, $studentId = null)
    {
        try {
            if ($studentId) {
                $student = $students->first();
                $filename = 'student_' . ($student->student_number ?? $student->id) . '_' . date('Y-m-d_H-i-s') . '.xml';
            } else {
                $filename = 'student_records_' . date('Y-m-d_H-i-s') . '.xml';
            }

            $xml = new \SimpleXMLElement('<?xml version="1.0" encoding="UTF-8"?><students></students>');

            foreach ($students as $student) {
                try {
                    $studentXml = $xml->addChild('student');
                    $studentXml->addChild('student_id', isset($student->student_id) ? htmlspecialchars($student->student_id) : '');
                    $studentXml->addChild('student_number', isset($student->student_number) ? htmlspecialchars($student->student_number) : '');
                    $studentXml->addChild('first_name', isset($student->first_name) ? htmlspecialchars($student->first_name) : '');
                    $studentXml->addChild('last_name', isset($student->last_name) ? htmlspecialchars($student->last_name) : '');
                    $studentXml->addChild('email', isset($student->email) ? htmlspecialchars($student->email) : '');
                    $studentXml->addChild('phone', isset($student->phone) ? htmlspecialchars($student->phone) : '');
                    $studentXml->addChild('gender', isset($student->gender) ? htmlspecialchars($student->gender) : '');
                    $studentXml->addChild('birth_date', $student->birth_date ? (is_string($student->birth_date) ? $student->birth_date : $student->birth_date->format('Y-m-d')) : '');
                    $studentXml->addChild('department', htmlspecialchars($student->section?->program?->department?->name ?? ''));
                    $studentXml->addChild('program', htmlspecialchars($student->section?->program?->name ?? ''));
                    $studentXml->addChild('section', htmlspecialchars($student->section?->name ?? ''));
                    $studentXml->addChild('year_level', isset($student->year_level) ? htmlspecialchars($student->year_level) : '');
                    $studentXml->addChild('guardian_name', isset($student->guardian_name) ? htmlspecialchars($student->guardian_name) : '');
                    $studentXml->addChild('guardian_contact', isset($student->guardian_contact) ? htmlspecialchars($student->guardian_contact) : '');
                    $studentXml->addChild('status', isset($student->status) ? htmlspecialchars($student->status) : '');
                    $studentXml->addChild('priority', isset($student->priority) ? htmlspecialchars($student->priority) : '');
                    $studentXml->addChild('absence_count', isset($student->absence_count) ? $student->absence_count : 0);
                    $studentXml->addChild('created_at', $student->created_at ? (is_string($student->created_at) ? $student->created_at : $student->created_at->format('Y-m-d H:i:s')) : '');
                    $studentXml->addChild('updated_at', $student->updated_at ? (is_string($student->updated_at) ? $student->updated_at : $student->updated_at->format('Y-m-d H:i:s')) : '');
                } catch (\Exception $e) {
                    \Log::warning('Failed to export student ' . ($student->id ?? 'unknown') . ': ' . $e->getMessage());
                    continue;
                }
            }

            return response($xml->asXML(), 200)
                ->header('Content-Type', 'application/xml; charset=UTF-8')
                ->header('Content-Disposition', 'attachment; filename="' . $filename . '"');
        } catch (\Exception $e) {
            \Log::error('XML export failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'XML export failed: ' . $e->getMessage()
            ], 500);
        }
    }
}