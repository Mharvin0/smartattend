<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\Program;
use App\Models\Section;
use App\Models\Student;
use App\Models\Subject;
use App\Models\Schedule;
use App\Models\AttendanceRecord;
use App\Models\Intervention;
use App\Models\StudentTracking;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class AdminPageController extends Controller
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

    public function index()
    {
        // Get departments, programs, and sections for filtering
        $departments = Department::select('id', 'name')->orderBy('name')->get();
        $programs = Program::with('department')->orderBy('name')->get();
        $sections = Section::with(['program.department'])->orderBy('name')->get();
        
        // Get all students with their sections and programs
        $user = auth()->user();
        $students = Student::forUser($user)->with(['section.program.department'])->get()->map(function ($student) {
            return [
                'id' => $student->id,
                'first_name' => $student->first_name,
                'last_name' => $student->last_name,
                'student_number' => $student->student_number,
                'year_level' => $student->year_level,
                'section_id' => $student->section_id,
                'section' => $student->section ? [
                    'id' => $student->section->id,
                    'name' => $student->section->name,
                    'program_id' => $student->section->program_id,
                    'program' => $student->section->program ? [
                        'id' => $student->section->program->id,
                        'name' => $student->section->program->name,
                        'department_id' => $student->section->program->department_id,
                        'department' => $student->section->program->department ? [
                            'id' => $student->section->program->department->id,
                            'name' => $student->section->program->department->name,
                        ] : null,
                    ] : null,
                ] : null,
            ];
        });
        
        // Get all subjects
        $subjects = Subject::with(['section', 'department', 'program'])->get();
        
        // Get all schedules with relationships
        $schedules = Schedule::with(['section.program.department', 'subject'])->get();

        // Get today's live attendance statistics (filtered by admin departments)
        $today = Carbon::today();
        $departmentIds = $user->getAssignedDepartmentIds();
        $programIds = Program::whereIn('department_id', $departmentIds)
            ->pluck('id')
            ->toArray();

        $todayRecordsQuery = AttendanceRecord::whereDate('date', $today)
            ->whereHas('student', function($q) use ($programIds) {
                if (!empty($programIds)) {
                    $q->whereHas('section', function($sectionQ) use ($programIds) {
                        $sectionQ->whereIn('program_id', $programIds);
                    });
                } else {
                    $q->whereRaw('1 = 0');
                }
            });

        $todayStats = [
            'present' => (clone $todayRecordsQuery)->where('status', 'present')->count(),
            'absent' => (clone $todayRecordsQuery)->where('status', 'absent')->count(),
            'late' => (clone $todayRecordsQuery)->where('status', 'late')->count(),
            'excused' => (clone $todayRecordsQuery)->where('status', 'excused')->count(),
            'total' => (clone $todayRecordsQuery)->count(),
        ];

        // Calculate live attendance rate (today only)
        $attendanceRate = $todayStats['total'] > 0
            ? round(($todayStats['present'] / $todayStats['total']) * 100, 1)
            : 0;

        $totalStudentsCount = Student::forUser($user)->count();
        $pnsCount = Student::forUser($user)->where('priority', 'PNS')->count();
        $callNeededCount = Student::forUser($user)->where('priority', 'Call Needed')->count();
        $atRiskCount = $pnsCount + $callNeededCount;

        // Recent activity: super admin sends + admin actions, filtered by admin's departments
        $departmentIds = $user->getAssignedDepartmentIds();
        $programIds = Program::whereIn('department_id', $departmentIds)
            ->pluck('id')
            ->toArray();

        $baseTrackingQuery = StudentTracking::with(['student.section.program.department', 'trackedBy.roles'])
            ->whereHas('student', function($q) use ($programIds) {
                if (!empty($programIds)) {
                    $q->whereHas('section', function($sectionQ) use ($programIds) {
                        $sectionQ->whereIn('program_id', $programIds);
                    });
                } else {
                    $q->whereRaw('1 = 0');
                }
            })
            ->where('archived', false);

        $superAdminTracking = (clone $baseTrackingQuery)
            ->whereHas('trackedBy.roles', function ($q) {
                $q->where('name', 'Super Admin');
            })
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        $adminTracking = (clone $baseTrackingQuery)
            ->where('tracked_by', $user->id)
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        $recentActivity = $superAdminTracking->map(function ($tracking) {
            return [
                'id' => 'super_' . $tracking->id,
                'source' => 'super_admin',
                'source_label' => 'From Super Admin',
                'action' => $tracking->type === 'call' ? 'Call' : 'Home Visit',
                'status' => $tracking->status,
                'time' => $tracking->created_at?->format('H:i'),
                'created_at' => $tracking->created_at?->toIso8601String(),
                'student' => [
                    'name' => $tracking->student ? ($tracking->student->first_name . ' ' . $tracking->student->last_name) : 'Unknown Student',
                    'section' => $tracking->student?->section?->name ?? 'N/A',
                    'program' => $tracking->student?->section?->program?->name ?? 'N/A',
                    'department' => $tracking->student?->section?->program?->department?->name ?? 'N/A',
                ],
            ];
        })->merge($adminTracking->map(function ($tracking) {
            return [
                'id' => 'admin_' . $tracking->id,
                'source' => 'admin',
                'source_label' => 'Your Activity',
                'action' => $tracking->type === 'call' ? 'Call' : 'Home Visit',
                'status' => $tracking->status,
                'time' => $tracking->created_at?->format('H:i'),
                'created_at' => $tracking->created_at?->toIso8601String(),
                'student' => [
                    'name' => $tracking->student ? ($tracking->student->first_name . ' ' . $tracking->student->last_name) : 'Unknown Student',
                    'section' => $tracking->student?->section?->name ?? 'N/A',
                    'program' => $tracking->student?->section?->program?->name ?? 'N/A',
                    'department' => $tracking->student?->section?->program?->department?->name ?? 'N/A',
                ],
            ];
        }))->sortByDesc('created_at')->values()->take(10);

        // Get live analytics data
        $analytics = [
            'attendance_by_section' => $this->getAttendanceBySection(),
            'attendance_by_day' => $this->getAttendanceByDay(),
            'attendance_trends' => $this->getAttendanceTrends(),
            'top_absent_students' => $this->getTopAbsentStudents(),
            'intervention_stats' => $this->getInterventionStats(),
        ];

        return Inertia::render('Admin/AdminPage', [
            'departments' => $departments,
            'programs' => $programs,
            'sections' => $sections,
            'students' => $students,
            'subjects' => $subjects,
            'schedules' => $schedules,
            'todayStats' => $todayStats,
            'attendanceRate' => $attendanceRate,
            'recentActivity' => $recentActivity,
            'dashboardCounts' => [
                'at_risk' => $atRiskCount,
                'pns' => $pnsCount,
                'call_needed' => $callNeededCount,
                'total_students' => $totalStudentsCount,
            ],
            'analytics' => $analytics,
        ]);
    }

    public function getLiveData()
    {
        $today = Carbon::today();
        
        // Real-time statistics (filtered by admin departments)
        $user = auth()->user();
        $departmentIds = $user->getAssignedDepartmentIds();
        $programIds = Program::whereIn('department_id', $departmentIds)
            ->pluck('id')
            ->toArray();

        $todayRecordsQuery = AttendanceRecord::whereDate('date', $today)
            ->whereHas('student', function($q) use ($programIds) {
                if (!empty($programIds)) {
                    $q->whereHas('section', function($sectionQ) use ($programIds) {
                        $sectionQ->whereIn('program_id', $programIds);
                    });
                } else {
                    $q->whereRaw('1 = 0');
                }
            });

        $stats = [
            'present' => (clone $todayRecordsQuery)->where('status', 'present')->count(),
            'absent' => (clone $todayRecordsQuery)->where('status', 'absent')->count(),
            'late' => (clone $todayRecordsQuery)->where('status', 'late')->count(),
            'excused' => (clone $todayRecordsQuery)->where('status', 'excused')->count(),
            'total' => (clone $todayRecordsQuery)->count(),
        ];

        $totalStudentsCount = Student::forUser($user)->count();
        $pnsCount = Student::forUser($user)->where('priority', 'PNS')->count();
        $callNeededCount = Student::forUser($user)->where('priority', 'Call Needed')->count();
        $atRiskCount = $pnsCount + $callNeededCount;

        // Recent activity (filtered by admin's departments)
        $user = auth()->user();
        $departmentIds = $user->getAssignedDepartmentIds();
        $programIds = Program::whereIn('department_id', $departmentIds)
            ->pluck('id')
            ->toArray();

        $baseTrackingQuery = StudentTracking::with(['student.section.program.department', 'trackedBy.roles'])
            ->whereHas('student', function($q) use ($programIds) {
                if (!empty($programIds)) {
                    $q->whereHas('section', function($sectionQ) use ($programIds) {
                        $sectionQ->whereIn('program_id', $programIds);
                    });
                } else {
                    $q->whereRaw('1 = 0');
                }
            })
            ->where('archived', false);

        $superAdminTracking = (clone $baseTrackingQuery)
            ->whereHas('trackedBy.roles', function ($q) {
                $q->where('name', 'Super Admin');
            })
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        $adminTracking = (clone $baseTrackingQuery)
            ->where('tracked_by', $user->id)
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        $recentActivity = $superAdminTracking->map(function ($tracking) {
            return [
                'id' => 'super_' . $tracking->id,
                'source' => 'super_admin',
                'source_label' => 'From Super Admin',
                'action' => $tracking->type === 'call' ? 'Call' : 'Home Visit',
                'status' => $tracking->status,
                'time' => $tracking->created_at?->format('H:i'),
                'created_at' => $tracking->created_at?->toIso8601String(),
                'student' => [
                    'name' => $tracking->student ? ($tracking->student->first_name . ' ' . $tracking->student->last_name) : 'Unknown Student',
                    'section' => $tracking->student?->section?->name ?? 'N/A',
                    'program' => $tracking->student?->section?->program?->name ?? 'N/A',
                    'department' => $tracking->student?->section?->program?->department?->name ?? 'N/A',
                ],
            ];
        })->merge($adminTracking->map(function ($tracking) {
            return [
                'id' => 'admin_' . $tracking->id,
                'source' => 'admin',
                'source_label' => 'Your Activity',
                'action' => $tracking->type === 'call' ? 'Call' : 'Home Visit',
                'status' => $tracking->status,
                'time' => $tracking->created_at?->format('H:i'),
                'created_at' => $tracking->created_at?->toIso8601String(),
                'student' => [
                    'name' => $tracking->student ? ($tracking->student->first_name . ' ' . $tracking->student->last_name) : 'Unknown Student',
                    'section' => $tracking->student?->section?->name ?? 'N/A',
                    'program' => $tracking->student?->section?->program?->name ?? 'N/A',
                    'department' => $tracking->student?->section?->program?->department?->name ?? 'N/A',
                ],
            ];
        }))->sortByDesc('created_at')->values()->take(5);

        return response()->json([
            'stats' => $stats,
            'dashboardCounts' => [
                'at_risk' => $atRiskCount,
                'pns' => $pnsCount,
                'call_needed' => $callNeededCount,
                'total_students' => $totalStudentsCount,
            ],
            'recentActivity' => $recentActivity,
            'timestamp' => now()->toISOString(),
        ]);
    }

    public function quickAttendance(Request $request)
    {
        $validated = $request->validate([
            'section_id' => 'required|exists:sections,id',
            'schedule_id' => 'nullable|exists:schedules,id',
            'date' => 'required|date',
            'records' => 'required|array',
            'records.*.student_id' => 'required|exists:students,id',
            'records.*.status' => 'required|in:present,late,absent,excused',
            'records.*.remarks' => 'nullable|string|max:255',
        ]);

        $attendanceRecords = [];
        foreach ($validated['records'] as $record) {
            $attendanceRecords[] = AttendanceRecord::create([
                'student_id' => $record['student_id'],
                'schedule_id' => $validated['schedule_id'],
                'date' => $validated['date'],
                'status' => $record['status'],
                'remarks' => $record['remarks'] ?? null,
                'recorded_by' => auth()->id(),
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Attendance recorded successfully',
            'records_count' => count($attendanceRecords),
        ]);
    }

    public function createIntervention(Request $request)
    {
        $validated = $request->validate([
            'student_id' => 'required|exists:students,id',
            'type' => 'required|string|max:255',
            'details' => 'required|string',
            'responsible_staff' => 'nullable|exists:users,id',
            'due_date' => 'nullable|date|after:today',
        ]);

        $intervention = Intervention::create([
            'student_id' => $validated['student_id'],
            'type' => $validated['type'],
            'details' => $validated['details'],
            'responsible_staff' => $validated['responsible_staff'] ?? null,
            'due_date' => $validated['due_date'] ?? null,
            'date' => now(),
            'status' => 'in_progress',
            'recorded_by' => auth()->id(),
        ]);

        return redirect()->back()->with('success', 'Intervention created successfully');
    }

    public function sendCommunication(Request $request)
    {
        $validated = $request->validate([
            'type' => 'required|in:email,sms,notification',
            'recipients' => 'required|array',
            'recipients.*' => 'required|exists:users,id',
            'subject' => 'required|string|max:255',
            'message' => 'required|string',
        ]);

        // Here you would implement the actual communication logic
        // For now, we'll just return a success response
        
        return response()->json([
            'success' => true,
            'message' => 'Communication sent successfully',
            'recipients_count' => count($validated['recipients']),
        ]);
    }

    private function getAttendanceBySection()
    {
        $user = auth()->user();
        $departmentIds = $user->getAssignedDepartmentIds();
        
        $sectionsQuery = Section::with(['program.department']);
        
        // Filter sections by user's departments if not Super Admin
        if (!$user->hasRole('Super Admin') && !empty($departmentIds)) {
            $sectionsQuery->whereHas('program', function($q) use ($departmentIds) {
                $q->whereIn('department_id', $departmentIds);
            });
        }
        
        return $sectionsQuery->get()
            ->map(function ($section) {
                $today = Carbon::today();
                
                // Get attendance records for this section through students
                $totalCount = AttendanceRecord::whereHas('student', function($query) use ($section) {
                    $query->where('section_id', $section->id);
                })->whereDate('date', $today)->count();
                
                $presentCount = AttendanceRecord::whereHas('student', function($query) use ($section) {
                    $query->where('section_id', $section->id);
                })->where('status', 'present')->whereDate('date', $today)->count();
                
                $attendanceRate = $totalCount > 0 
                    ? round(($presentCount / $totalCount) * 100, 1) 
                    : 0;
                
                return [
                    'id' => $section->id,
                    'name' => $section->name,
                    'program' => $section->program?->name ?? 'N/A',
                    'department' => $section->program?->department?->name ?? 'N/A',
                    'present_count' => $presentCount,
                    'total_count' => $totalCount,
                    'attendance_rate' => $attendanceRate,
                ];
            });
    }

    private function getAttendanceByDay()
    {
        $days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        $attendanceByDay = [];
        
        foreach ($days as $day) {
            $dayNumber = array_search($day, $days) + 1;
            $totalRecords = AttendanceRecord::whereRaw('DAYOFWEEK(date) = ?', [$dayNumber + 1])
                ->where('date', '>=', Carbon::now()->subWeeks(4))
                ->count();
            $presentRecords = AttendanceRecord::whereRaw('DAYOFWEEK(date) = ?', [$dayNumber + 1])
                ->where('status', 'present')
                ->where('date', '>=', Carbon::now()->subWeeks(4))
                ->count();
            
            $attendanceByDay[] = [
                'day' => $day,
                'attendance_rate' => $totalRecords > 0 ? round(($presentRecords / $totalRecords) * 100, 1) : 0,
            ];
        }
        
        return $attendanceByDay;
    }

    private function getAttendanceTrends()
    {
        $trends = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::now()->subDays($i);
            $totalRecords = AttendanceRecord::whereDate('date', $date)->count();
            $presentRecords = AttendanceRecord::whereDate('date', $date)->where('status', 'present')->count();
            
            $trends[] = [
                'date' => $date->format('Y-m-d'),
                'day' => $date->format('D'),
                'attendance_rate' => $totalRecords > 0 ? round(($presentRecords / $totalRecords) * 100, 1) : 0,
                'total_students' => $totalRecords,
            ];
        }
        
        return $trends;
    }

    private function getTopAbsentStudents()
    {
        $user = auth()->user();
        return Student::forUser($user)->with(['section.program.department'])
            ->get()
            ->map(function ($student) {
                $absentCount = AttendanceRecord::where('student_id', $student->id)
                    ->where('status', 'absent')
                    ->where('date', '>=', Carbon::now()->subDays(30))
                    ->count();
                
                return [
                    'id' => $student->id,
                    'name' => $student->first_name . ' ' . $student->last_name,
                    'student_number' => $student->student_number,
                    'section' => $student->section?->name ?? 'N/A',
                    'department' => $student->section?->program?->department?->name ?? 'N/A',
                    'absent_count' => $absentCount,
                ];
            })
            ->filter(function ($student) {
                return $student['absent_count'] > 0;
            })
            ->sortByDesc('absent_count')
            ->take(5)
            ->values();
    }

    private function getInterventionStats()
    {
        return [
            'total' => Intervention::count(),
            'done' => Intervention::where('status', 'done')->count(),
            'in_progress' => Intervention::where('status', 'in_progress')->count(),
            'no_response' => Intervention::where('status', 'no_response')->count(),
        ];
    }

    public function bulkOperation(Request $request)
    {
        try {
            $validated = $request->validate([
                'operation' => 'required|string',
                'student_ids' => 'required|array',
                'student_ids.*' => 'required|exists:students,id',
            ]);

            $operation = $validated['operation'];
            $studentIds = $validated['student_ids'];
            
            // Load students with their relationships - filtered by user's departments
            $user = auth()->user();
            $students = Student::forUser($user)->with(['section.program.department'])
                ->whereIn('id', $studentIds)
                ->get();

            if ($students->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No students found with the provided IDs'
                ], 404);
            }

            switch ($operation) {
                case 'attendance_update':
                    return $this->handleBulkAttendanceUpdate($students, $request);
                
                case 'email_notification':
                    return $this->handleBulkEmailNotification($students, $request);
                
                case 'sms_notification':
                    return $this->handleBulkSMSNotification($students, $request);
                
                case 'create_intervention':
                    return $this->handleBulkCreateIntervention($students, $request);
                
                case 'export_data':
                    return $this->handleBulkExportData($students, $request);
                
                case 'export_attendance':
                    return $this->handleBulkExportAttendance($students, $request);
                
                case 'generate_report':
                    return $this->handleBulkGenerateReport($students, $request);
                
                case 'update_status':
                    return $this->handleBulkUpdateStatus($students, $request);
                
                default:
                    return response()->json([
                        'success' => false,
                        'message' => 'Invalid operation type: ' . $operation
                    ], 400);
            }
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Bulk operation failed: ' . $e->getMessage(), [
                'operation' => $request->get('operation'),
                'student_ids' => $request->get('student_ids'),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Bulk operation failed: ' . $e->getMessage()
            ], 500);
        }
    }

    private function handleBulkAttendanceUpdate($students, $request)
    {
        $validated = $request->validate([
            'status' => 'required|in:present,absent,late,excused',
            'date' => 'required|date',
            'notes' => 'nullable|string'
        ]);

        $count = 0;
        foreach ($students as $student) {
            AttendanceRecord::create([
                'student_id' => $student->id,
                'date' => $validated['date'],
                'status' => $validated['status'],
                'notes' => $validated['notes'],
                'recorded_by' => auth()->id(),
            ]);
            $count++;
        }

        return response()->json([
            'success' => true,
            'message' => "Attendance updated for {$count} students"
        ]);
    }

    private function handleBulkEmailNotification($students, $request)
    {
        $validated = $request->validate([
            'subject' => 'required|string|max:255',
            'message' => 'required|string',
        ]);

        // Here you would implement actual email sending logic
        $count = $students->count();
        
        return response()->json([
            'success' => true,
            'message' => "Email notifications sent to {$count} students"
        ]);
    }

    private function handleBulkSMSNotification($students, $request)
    {
        $validated = $request->validate([
            'message' => 'required|string|max:160',
        ]);

        // Here you would implement actual SMS sending logic
        $count = $students->count();
        
        return response()->json([
            'success' => true,
            'message' => "SMS notifications sent to {$count} students"
        ]);
    }

    private function handleBulkCreateIntervention($students, $request)
    {
        $validated = $request->validate([
            'type' => 'required|string',
            'details' => 'required|string',
            'due_date' => 'required|date',
        ]);

        $count = 0;
        foreach ($students as $student) {
            Intervention::create([
                'student_id' => $student->id,
                'type' => $validated['type'],
                'details' => $validated['details'],
                'due_date' => $validated['due_date'],
                'date' => now(),
                'status' => 'in_progress',
                'recorded_by' => auth()->id(),
            ]);
            $count++;
        }

        return response()->json([
            'success' => true,
            'message' => "Interventions created for {$count} students"
        ]);
    }

    private function handleBulkExportData($students, $request)
    {
        // Here you would implement CSV/Excel export logic
        $count = $students->count();
        
        return response()->json([
            'success' => true,
            'message' => "Student data exported for {$count} students",
            'download_url' => '/exports/students_' . time() . '.csv'
        ]);
    }

    private function handleBulkExportAttendance($students, $request)
    {
        $validated = $request->validate([
            'date_from' => 'required|date',
            'date_to' => 'required|date|after_or_equal:date_from',
        ]);

        // Here you would implement attendance export logic
        $count = $students->count();
        
        return response()->json([
            'success' => true,
            'message' => "Attendance records exported for {$count} students",
            'download_url' => '/exports/attendance_' . time() . '.csv'
        ]);
    }

    private function handleBulkGenerateReport($students, $request)
    {
        $validated = $request->validate([
            'report_type' => 'required|in:attendance,performance,summary',
            'date_from' => 'required|date',
            'date_to' => 'required|date|after_or_equal:date_from',
        ]);

        // Here you would implement report generation logic
        $count = $students->count();
        
        return response()->json([
            'success' => true,
            'message' => "Reports generated for {$count} students",
            'download_url' => '/reports/student_reports_' . time() . '.pdf'
        ]);
    }

    private function handleBulkUpdateStatus($students, $request)
    {
        $validated = $request->validate([
            'status' => 'required|in:active,inactive,suspended,graduated',
            'notes' => 'nullable|string'
        ]);

        $count = 0;
        foreach ($students as $student) {
            $student->update([
                'status' => $validated['status'],
                'notes' => $validated['notes']
            ]);
            $count++;
        }

        return response()->json([
            'success' => true,
            'message' => "Status updated for {$count} students"
        ]);
    }

    public function storeStudent(Request $request)
    {
        try {
            $validated = $request->validate([
                'first_name' => ['required', 'string', 'max:255'],
                'last_name' => ['required', 'string', 'max:255'],
                'student_number' => ['required', 'string', 'max:255', 'unique:students,student_number'],
                'department_id' => ['required', 'exists:departments,id'],
                'program_id' => ['required', 'exists:programs,id'],
                'year_level' => ['required', 'string', 'in:1st Year,2nd Year,3rd Year,4th Year'],
                'section_id' => ['required', 'exists:sections,id'],
                'gender' => ['required', 'string', 'in:Male,Female'],
                'birth_date' => ['nullable', 'date'],
                'guardian_name' => ['required', 'string', 'max:255'],
                'guardian_contact' => ['required', 'string', 'max:20'],
                'schedule_ids' => ['nullable', 'array'],
                'schedule_ids.*' => ['integer', 'exists:schedules,id'],
            ]);

            // Create the student
            $student = Student::create([
                'first_name' => $validated['first_name'],
                'last_name' => $validated['last_name'],
                'student_number' => $validated['student_number'],
                'department_id' => $validated['department_id'],
                'program_id' => $validated['program_id'],
                'year_level' => $validated['year_level'],
                'section_id' => $validated['section_id'],
                'gender' => $validated['gender'],
                'birth_date' => $validated['birth_date'],
                'guardian_name' => $validated['guardian_name'],
                'guardian_contact' => $validated['guardian_contact'],
            ]);

            // Attach schedules if provided
            if (!empty($validated['schedule_ids'])) {
                $student->schedules()->attach($validated['schedule_ids']);
            }

            return redirect()->back()->with('success', 'Student created successfully');

        } catch (\Illuminate\Validation\ValidationException $e) {
            return redirect()->back()->withErrors($e->errors())->withInput();
        } catch (\Exception $e) {
            Log::error('Student creation failed: ' . $e->getMessage(), [
                'student_data' => $request->all(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return redirect()->back()->with('error', 'Student creation failed: ' . $e->getMessage())->withInput();
        }
    }

    public function exportStudentRecords(Request $request)
    {
        try {
            $validated = $request->validate([
                'format' => ['required', 'string', 'in:csv,xml'],
                'student_id' => ['nullable', 'exists:students,id'],
                'department_id' => ['nullable', 'exists:departments,id'],
                'program_id' => ['nullable', 'exists:programs,id'],
                'section_id' => ['nullable', 'exists:sections,id'],
                'year_level' => ['nullable', 'string'],
            ]);

            $user = auth()->user();
            
            // Build query with filters
            $query = Student::forUser($user)->with(['section.program.department']);

            // If exporting a single student, filter by student_id
            if ($validated['student_id']) {
                $query->where('id', $validated['student_id']);
            } else {
                // Apply other filters only if not exporting a single student
                if ($validated['department_id']) {
                    $query->whereHas('section.program', function($q) use ($validated) {
                        $q->where('department_id', $validated['department_id']);
                    });
                }

                if ($validated['program_id']) {
                    $query->whereHas('section', function($q) use ($validated) {
                        $q->where('program_id', $validated['program_id']);
                    });
                }

                if ($validated['section_id']) {
                    $query->where('section_id', $validated['section_id']);
                }

                if ($validated['year_level']) {
                    $query->where('year_level', $validated['year_level']);
                }
            }
            
            $students = $query->get();

            if ($validated['format'] === 'csv') {
                return $this->exportToCsv($students, $validated['student_id']);
            } else {
                return $this->exportToXml($students, $validated['student_id']);
            }

        } catch (\Exception $e) {
            Log::error('Export failed: ' . $e->getMessage(), [
                'request_data' => $request->all(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Export failed: ' . $e->getMessage()
            ], 500);
        }
    }

    private function exportToCsv($students, $studentId = null)
    {
        if ($studentId) {
            $student = $students->first();
            $filename = 'student_' . ($student->student_number ?? $student->id) . '_' . date('Y-m-d_H-i-s') . '.csv';
        } else {
            $filename = 'student_records_' . date('Y-m-d_H-i-s') . '.csv';
        }
        
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ];

        $callback = function() use ($students) {
            $file = fopen('php://output', 'w');
            
            // CSV Headers
            fputcsv($file, [
                'Student ID',
                'Student Number',
                'First Name',
                'Last Name',
                'Gender',
                'Birth Date',
                'Department',
                'Program',
                'Section',
                'Year Level',
                'Guardian Name',
                'Guardian Contact',
                'Created At',
                'Updated At'
            ]);

            // CSV Data
            foreach ($students as $student) {
                fputcsv($file, [
                    $student->id,
                    $student->student_number,
                    $student->first_name,
                    $student->last_name,
                    $student->gender,
                    $student->birth_date,
                    $student->section?->program?->department?->name ?? 'N/A',
                    $student->section?->program?->name ?? 'N/A',
                    $student->section?->name ?? 'N/A',
                    $student->year_level ?? 'N/A',
                    $student->guardian_name,
                    $student->guardian_contact,
                    $student->created_at?->format('Y-m-d H:i:s'),
                    $student->updated_at?->format('Y-m-d H:i:s')
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    private function exportToXml($students, $studentId = null)
    {
        if ($studentId) {
            $student = $students->first();
            $filename = 'student_' . ($student->student_number ?? $student->id) . '_' . date('Y-m-d_H-i-s') . '.xml';
        } else {
            $filename = 'student_records_' . date('Y-m-d_H-i-s') . '.xml';
        }
        
        $xml = new \SimpleXMLElement('<?xml version="1.0" encoding="UTF-8"?><students></students>');
        
        foreach ($students as $student) {
            $studentNode = $xml->addChild('student');
            $studentNode->addChild('id', htmlspecialchars($student->id));
            $studentNode->addChild('student_number', htmlspecialchars($student->student_number));
            $studentNode->addChild('first_name', htmlspecialchars($student->first_name));
            $studentNode->addChild('last_name', htmlspecialchars($student->last_name));
            $studentNode->addChild('gender', htmlspecialchars($student->gender));
            $studentNode->addChild('birth_date', htmlspecialchars($student->birth_date));
            $studentNode->addChild('department', htmlspecialchars($student->section?->program?->department?->name ?? 'N/A'));
            $studentNode->addChild('program', htmlspecialchars($student->section?->program?->name ?? 'N/A'));
            $studentNode->addChild('section', htmlspecialchars($student->section?->name ?? 'N/A'));
            $studentNode->addChild('year_level', htmlspecialchars($student->year_level ?? 'N/A'));
            $studentNode->addChild('guardian_name', htmlspecialchars($student->guardian_name));
            $studentNode->addChild('guardian_contact', htmlspecialchars($student->guardian_contact));
            $studentNode->addChild('created_at', htmlspecialchars($student->created_at?->format('Y-m-d H:i:s')));
            $studentNode->addChild('updated_at', htmlspecialchars($student->updated_at?->format('Y-m-d H:i:s')));
        }

        $headers = [
            'Content-Type' => 'application/xml',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ];

        return response($xml->asXML(), 200, $headers);
    }
}
