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
        $user = auth()->user();
        $perPage = 20;
        $statusFilter = $request->status;

        $baseQuery = Student::forUser($user)->select('students.*');

        // Apply filters
        if ($request->filled('department')) {
            $baseQuery->whereHas('section.program', function ($q) use ($request) {
                $q->where('department_id', $request->department);
            });
        }

        if ($request->filled('program')) {
            $baseQuery->whereHas('section', function ($q) use ($request) {
                $q->where('program_id', $request->program);
            });
        }

        if ($request->filled('year_level')) {
            $baseQuery->where('year_level', $request->year_level);
        }

        // Keep priority filter for backward compatibility
        if ($request->filled('priority')) {
            $baseQuery->where('priority', $request->priority);
        }

        if ($request->filled('search')) {
            $searchTerm = $request->search;
            $baseQuery->where(function ($query) use ($searchTerm) {
                $query->where('first_name', 'like', "%{$searchTerm}%")
                      ->orWhere('last_name', 'like', "%{$searchTerm}%")
                      ->orWhere('student_number', 'like', "%{$searchTerm}%")
                      ->orWhere('email', 'like', "%{$searchTerm}%");
            });
        }

        $studentsQuery = (clone $baseQuery)
            ->with(['section.program.department', 'department', 'weeklySummaries', 'schedules.subject', 'attendanceRecords'])
            ->orderBy('last_name')
            ->orderBy('first_name');

        if (!empty($statusFilter)) {
            $studentsCollection = $studentsQuery->get();
            $studentsFiltered = $studentsCollection->filter(function ($student) use ($statusFilter) {
                return $student->attendance_status === $statusFilter;
            })->values();

            $currentPage = \Illuminate\Pagination\LengthAwarePaginator::resolveCurrentPage();
            $students = new \Illuminate\Pagination\LengthAwarePaginator(
                $studentsFiltered->forPage($currentPage, $perPage)->values(),
                $studentsFiltered->count(),
                $perPage,
                $currentPage,
                [
                    'path' => $request->url(),
                    'query' => $request->query(),
                ]
            );
        } else {
            $students = $studentsQuery->paginate($perPage)->withQueryString();
        }

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
        $stats = [
            'total_students' => 0,
            'normal_count' => 0,
            'slip_count' => 0,
            'pns_count' => 0,
        ];

        if (!empty($statusFilter)) {
            $stats['total_students'] = $studentsFiltered->count();
            $stats['normal_count'] = $studentsFiltered->where('attendance_status', 'Normal')->count();
            $stats['slip_count'] = $studentsFiltered->where('attendance_status', 'SLIP')->count();
            $stats['pns_count'] = $studentsFiltered->where('attendance_status', 'PNS')->count();
        } else {
            $statsQuery = (clone $baseQuery)->with(['attendanceRecords.schedule.subject']);
            $statsQuery->chunkById(200, function ($chunk) use (&$stats) {
                foreach ($chunk as $student) {
                    $stats['total_students']++;
                    $status = $student->attendance_status;
                    if ($status === 'Normal') {
                        $stats['normal_count']++;
                    } elseif ($status === 'SLIP') {
                        $stats['slip_count']++;
                    } elseif ($status === 'PNS') {
                        $stats['pns_count']++;
                    }
                }
            });
        }

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
        // Don't call updatePriority() to preserve manually set absence_count values
        $student->refresh();
        
        $studentData = [
            'id' => $student->id,
            'student_id' => $student->student_id,
            'name' => $student->first_name . ' ' . $student->last_name,
            'email' => $student->email,
            'section' => $student->section?->name ?? 'No Section',
            'program' => $student->section?->program?->name ?? 'No Program',
            'department' => $student->section?->program?->department?->name ?? 'No Department',
            'year_level' => $student->section?->year_level ?? 'N/A',
            'status' => $student->status ?? $student->attendance_status ?? 'Normal',
            'attendance_status' => $student->attendance_status ?? 'Normal',
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
		try {
			$validated = $request->validate([
				'status' => 'nullable|string|in:Normal,SLIP,PNS',
				'absence_count' => 'nullable|integer|min:0',
			]);

			// Update status (attendance status: Normal, SLIP, PNS)
			if (isset($validated['status'])) {
				$student->status = $validated['status'];
			}
			
			// Update absence_count if provided (manual edit)
			// IMPORTANT: When manually setting absence_count, we should NOT recalculate it from attendance records
			if (isset($validated['absence_count'])) {
				$student->absence_count = (int)$validated['absence_count'];
				
				// Calculate priority based on the manually set absence_count
				$absenceCount = (int)$validated['absence_count'];
				if ($absenceCount < 4) {
					$student->priority = 'Safe';
				} elseif ($absenceCount >= 4 && $absenceCount < 8) {
					$student->priority = 'Call Needed';
				} else {
					$student->priority = 'PNS';
				}
			} elseif (isset($validated['status'])) {
				// If only status changed (and absence_count wasn't changed), 
				// recalculate priority from current absence_count without recalculating absence_count
				$absenceCount = $student->absence_count ?? 0;
				if ($absenceCount < 4) {
					$student->priority = 'Safe';
				} elseif ($absenceCount >= 4 && $absenceCount < 8) {
					$student->priority = 'Call Needed';
				} else {
					$student->priority = 'PNS';
				}
			}
			
			// Refresh to ensure latest data is available
			$student->refresh();
			
			if (!$student->save()) {
				throw new \Exception('Failed to save student to database');
			}

			return back()->with('success', 'Student updated successfully.');
		} catch (\Illuminate\Validation\ValidationException $e) {
			return back()->withErrors($e->errors())->withInput();
		} catch (\Exception $e) {
			\Log::error('Error updating student: ' . $e->getMessage());
			\Log::error('Stack trace: ' . $e->getTraceAsString());
			return back()->with('error', 'Failed to update student: ' . $e->getMessage());
		}
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
            'status' => 'pending',
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

            return redirect()
                ->route('admin.students')
                ->with('success', $message)
                ->with('error', count($errors) > 0 ? 'Some rows failed to import.' : null)
                ->with('import_errors', $errors);
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
            $user = auth()->user();
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
            $query = Student::forUser($user)->with(['section.program.department']);
            $statusFilter = $validated['status'] ?? null;
            $shouldUpdatePriority = empty($statusFilter);

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

            if (!empty($statusFilter)) {
                $matchedCount = 0;
                $countQuery = (clone $query)->with(['attendanceRecords.schedule.subject']);
                $countQuery->chunkById(200, function ($students) use (&$matchedCount, $statusFilter) {
                    foreach ($students as $student) {
                        $student->updatePriority();
                        $student->refresh();
                        if ($student->attendance_status === $statusFilter) {
                            $matchedCount++;
                        }
                    }
                });

                if ($matchedCount === 0) {
                    return response()->json([
                        'success' => false,
                        'message' => 'No students found matching the criteria.'
                    ], 404);
                }

                $query->with(['attendanceRecords.schedule.subject']);
            } else {
                if (!(clone $query)->exists()) {
                    return response()->json([
                        'success' => false,
                        'message' => 'No students found matching the criteria.'
                    ], 404);
                }
            }

            if ($validated['format'] === 'csv') {
                return $this->exportStudentsToCsv($query, $validated['student_id'] ?? null, $statusFilter, $shouldUpdatePriority);
            } else {
                return $this->exportStudentsToXml($query, $validated['student_id'] ?? null, $statusFilter, $shouldUpdatePriority);
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

    private function exportStudentsToCsv($query, $studentId = null, $statusFilter = null, $shouldUpdatePriority = true)
    {
        try {
            if ($studentId) {
                $student = (clone $query)->first();
                $filename = 'student_' . ($student->student_number ?? $student->id) . '_' . date('Y-m-d_H-i-s') . '.csv';
            } else {
                $filename = 'student_records_' . date('Y-m-d_H-i-s') . '.csv';
            }
            
            $headers = [
                'Content-Type' => 'text/csv; charset=UTF-8',
                'Content-Disposition' => 'attachment; filename="' . $filename . '"',
            ];

            $callback = function() use ($query, $statusFilter, $shouldUpdatePriority) {
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

                $exportQuery = (clone $query);
                $exportQuery->chunkById(200, function ($students) use ($file, $statusFilter, $shouldUpdatePriority) {
                    foreach ($students as $student) {
                        try {
                            if ($shouldUpdatePriority) {
                                $student->updatePriority();
                                $student->refresh();
                            }

                            if (!empty($statusFilter) && $student->attendance_status !== $statusFilter) {
                                continue;
                            }

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
                });

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

    private function exportStudentsToXml($query, $studentId = null, $statusFilter = null, $shouldUpdatePriority = true)
    {
        try {
            if ($studentId) {
                $student = (clone $query)->first();
                $filename = 'student_' . ($student->student_number ?? $student->id) . '_' . date('Y-m-d_H-i-s') . '.xml';
            } else {
                $filename = 'student_records_' . date('Y-m-d_H-i-s') . '.xml';
            }
            
            $headers = [
                'Content-Type' => 'application/xml; charset=UTF-8',
                'Content-Disposition' => 'attachment; filename="' . $filename . '"',
            ];

            $callback = function() use ($query, $statusFilter, $shouldUpdatePriority) {
                $escape = function ($value) {
                    return htmlspecialchars((string) $value, ENT_XML1 | ENT_QUOTES, 'UTF-8');
                };

                echo '<?xml version="1.0" encoding="UTF-8"?>';
                echo '<students>';

                $exportQuery = (clone $query);
                $exportQuery->chunkById(200, function ($students) use ($escape, $statusFilter, $shouldUpdatePriority) {
                    foreach ($students as $student) {
                        try {
                            if ($shouldUpdatePriority) {
                                $student->updatePriority();
                                $student->refresh();
                            }

                            if (!empty($statusFilter) && $student->attendance_status !== $statusFilter) {
                                continue;
                            }

                            $birthDate = $student->birth_date ? (is_string($student->birth_date) ? $student->birth_date : $student->birth_date->format('Y-m-d')) : '';
                            $createdAt = $student->created_at ? (is_string($student->created_at) ? $student->created_at : $student->created_at->format('Y-m-d H:i:s')) : '';
                            $updatedAt = $student->updated_at ? (is_string($student->updated_at) ? $student->updated_at : $student->updated_at->format('Y-m-d H:i:s')) : '';

                            echo '<student>';
                            echo '<student_id>' . $escape($student->student_id ?? '') . '</student_id>';
                            echo '<student_number>' . $escape($student->student_number ?? '') . '</student_number>';
                            echo '<first_name>' . $escape($student->first_name ?? '') . '</first_name>';
                            echo '<last_name>' . $escape($student->last_name ?? '') . '</last_name>';
                            echo '<email>' . $escape($student->email ?? '') . '</email>';
                            echo '<phone>' . $escape($student->phone ?? '') . '</phone>';
                            echo '<gender>' . $escape($student->gender ?? '') . '</gender>';
                            echo '<birth_date>' . $escape($birthDate) . '</birth_date>';
                            echo '<department>' . $escape($student->section?->program?->department?->name ?? '') . '</department>';
                            echo '<program>' . $escape($student->section?->program?->name ?? '') . '</program>';
                            echo '<section>' . $escape($student->section?->name ?? '') . '</section>';
                            echo '<year_level>' . $escape($student->year_level ?? '') . '</year_level>';
                            echo '<guardian_name>' . $escape($student->guardian_name ?? '') . '</guardian_name>';
                            echo '<guardian_contact>' . $escape($student->guardian_contact ?? '') . '</guardian_contact>';
                            echo '<status>' . $escape($student->status ?? '') . '</status>';
                            echo '<priority>' . $escape($student->priority ?? '') . '</priority>';
                            echo '<absence_count>' . $escape($student->absence_count ?? 0) . '</absence_count>';
                            echo '<created_at>' . $escape($createdAt) . '</created_at>';
                            echo '<updated_at>' . $escape($updatedAt) . '</updated_at>';
                            echo '</student>';
                        } catch (\Exception $e) {
                            \Log::warning('Failed to export student ' . ($student->id ?? 'unknown') . ': ' . $e->getMessage());
                            continue;
                        }
                    }
                });

                echo '</students>';
            };

            return response()->stream($callback, 200, $headers);
        } catch (\Exception $e) {
            \Log::error('XML export failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'XML export failed: ' . $e->getMessage()
            ], 500);
        }
    }
}