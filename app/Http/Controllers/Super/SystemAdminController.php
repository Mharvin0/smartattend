<?php

namespace App\Http\Controllers\Super;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Services\AuditLogService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SystemAdminController extends Controller
{
    public function __construct()
    {
        $this->middleware(['auth', 'role:Super Admin']);
    }

    public function systemAdmin()
    {
        return Inertia::render('Super/SuperDashboard', [
            'users' => \App\Models\User::with('roles')->get(),
            'systemStats' => $this->getSystemStats(),
            'activityLogs' => $this->getRecentActivityLogs(),
            'integrations' => $this->getIntegrationStatus(),
            'systemTools' => $this->getSystemToolsData(),
            'auditLogs' => AuditLog::with('user')->orderBy('created_at', 'desc')->limit(50)->get(),
        ]);
    }

    public function test()
    {
        $driver = config('database.default');
        $sqliteDbPath = database_path('database.sqlite');
        $isSqliteAvailable = file_exists($sqliteDbPath);
        
        return response()->json([
            'success' => true,
            'message' => 'System Admin Controller is working!',
            'timestamp' => now()->format('Y-m-d H:i:s'),
            'user' => auth()->user()->email,
            'database' => [
                'driver' => $driver,
                'sqlite_path' => $sqliteDbPath,
                'sqlite_exists' => $isSqliteAvailable
            ]
        ]);
    }

    public function index()
    {
        return Inertia::render('Super/SystemAdmin', [
            'activeTab' => 'dashboard',
            'pageTitle' => 'Dashboard',
            'users' => \App\Models\User::with('roles')->get(),
            'systemStats' => $this->getSystemStats(),
            'activityLogs' => $this->getRecentActivityLogs(),
            'integrations' => $this->getIntegrationStatus(),
            'systemTools' => $this->getSystemToolsData(),
            'auditLogs' => AuditLog::with('user')->orderBy('created_at', 'desc')->limit(50)->get(),
        ]);
    }

    public function interventions()
    {
        return Inertia::render('Super/SystemAdmin', [
            'activeTab' => 'interventions',
            'users' => \App\Models\User::with('roles')->get(),
            'systemStats' => $this->getSystemStats(),
            'activityLogs' => $this->getRecentActivityLogs(),
            'integrations' => $this->getIntegrationStatus(),
            'systemTools' => $this->getSystemToolsData(),
            'auditLogs' => AuditLog::with('user')->orderBy('created_at', 'desc')->limit(50)->get(),
            'interventions' => $this->getInterventionsData(),
            'departments' => \App\Models\Department::orderBy('name')->get(),
            'programs' => \App\Models\Program::with('department')->orderBy('name')->get(),
            'sections' => \App\Models\Section::with(['program.department'])->orderBy('name')->get(),
            'students' => \App\Models\Student::with(['section.program.department'])->orderBy('first_name')->get(),
        ]);
    }

    public function attendance()
    {
        // Get attendance statistics
        $stats = \App\Models\AttendanceRecord::getAttendanceStats([]);
        
        // Get today's attendance overview
        $todayAttendance = $this->getTodayAttendanceOverview();
        
        // Get recent attendance trends
        $trends = \App\Models\AttendanceRecord::getAttendanceTrends([]);
        
        // Get filter options
        $departments = \App\Models\Department::orderBy('name')->get(['id', 'name']);
        $programs = \App\Models\Program::orderBy('name')->get(['id', 'name']);
        $sections = \App\Models\Section::with(['program.department'])->orderBy('name')->get(['id', 'name', 'program_id']);
        
        // Get recent attendance records
        $recentRecords = $this->getRecentAttendanceRecords([]);
        
        // Get attendance calendar data
        $calendarData = $this->getAttendanceCalendarData([]);

        return Inertia::render('Super/SystemAdmin', [
            'activeTab' => 'attendance',
            'users' => \App\Models\User::with('roles')->get(),
            'systemStats' => $this->getSystemStats(),
            'activityLogs' => $this->getRecentActivityLogs(),
            'integrations' => $this->getIntegrationStatus(),
            'systemTools' => $this->getSystemToolsData(),
            'auditLogs' => AuditLog::with('user')->orderBy('created_at', 'desc')->limit(50)->get(),
            'attendanceStats' => $stats,
            'todayAttendance' => $todayAttendance,
            'trends' => $trends,
            'departments' => $departments,
            'programs' => $programs,
            'sections' => $sections,
            'recentRecords' => $recentRecords,
            'calendarData' => $calendarData,
            'departmentTrends' => $this->getDepartmentAttendanceTrends(),
            'facultyCompliance' => $this->getFacultyComplianceTrends(),
        ]);
    }

    public function getTrendsData()
    {
        return response()->json([
            'departmentTrends' => $this->getDepartmentAttendanceTrends(),
            'facultyCompliance' => $this->getFacultyComplianceTrends(),
            'timestamp' => now()->toISOString(),
        ]);
    }

    public function refreshDashboard()
    {
        return response()->json([
            'departmentTrends' => $this->getDepartmentAttendanceTrends(),
            'facultyCompliance' => $this->getFacultyComplianceTrends(),
            'systemStats' => $this->getSystemStats(),
            'timestamp' => now()->toISOString(),
        ]);
    }

    public function generateWeeklyPdf()
    {
        try {
            // Get weekly attendance data
            $startOfWeek = now()->startOfWeek();
            $endOfWeek = now()->endOfWeek();
            
            $attendanceData = \App\Models\AttendanceRecord::whereBetween('date', [$startOfWeek, $endOfWeek])
                ->with(['student.section.program.department', 'schedule.subject'])
                ->get();
            
            $departmentStats = [];
            $totalRecords = $attendanceData->count();
            $presentCount = $attendanceData->where('status', 'present')->count();
            $absentCount = $attendanceData->where('status', 'absent')->count();
            $lateCount = $attendanceData->where('status', 'late')->count();
            
            // Group by department
            foreach ($attendanceData->groupBy('student.section.program.department.name') as $deptName => $records) {
                $deptPresent = $records->where('status', 'present')->count();
                $deptTotal = $records->count();
                $deptRate = $deptTotal > 0 ? round(($deptPresent / $deptTotal) * 100, 1) : 0;
                
                $departmentStats[] = [
                    'department' => $deptName,
                    'total_records' => $deptTotal,
                    'present_count' => $deptPresent,
                    'attendance_rate' => $deptRate,
                ];
            }
            
            // Generate PDF using DomPDF
            $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('reports.weekly-summary', [
                'attendanceData' => $attendanceData,
                'departmentStats' => $departmentStats,
                'totalRecords' => $totalRecords,
                'presentCount' => $presentCount,
                'absentCount' => $absentCount,
                'lateCount' => $lateCount,
                'weekStart' => $startOfWeek->format('M d, Y'),
                'weekEnd' => $endOfWeek->format('M d, Y'),
            ]);
            
            return $pdf->download('weekly-summary-' . now()->format('Y-m-d') . '.pdf');
            
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to generate PDF: ' . $e->getMessage()], 500);
        }
    }

    public function exportStudentRecordsExcel()
    {
        try {
            // Get all student records with attendance data
            $students = \App\Models\Student::with([
                'section.program.department',
                'attendanceRecords.schedule.subject',
                'interventions'
            ])->get();
            
            $data = [];
            
            foreach ($students as $student) {
                $attendanceRecords = $student->attendanceRecords;
                $totalRecords = $attendanceRecords->count();
                $presentCount = $attendanceRecords->where('status', 'present')->count();
                $absentCount = $attendanceRecords->where('status', 'absent')->count();
                $lateCount = $attendanceRecords->where('status', 'late')->count();
                $attendanceRate = $totalRecords > 0 ? round(($presentCount / $totalRecords) * 100, 1) : 0;
                
                $data[] = [
                    'Student ID' => $student->student_id,
                    'Name' => $student->name,
                    'Email' => $student->email,
                    'Department' => $student->section->program->department->name ?? 'N/A',
                    'Program' => $student->section->program->name ?? 'N/A',
                    'Section' => $student->section->name ?? 'N/A',
                    'Total Records' => $totalRecords,
                    'Present' => $presentCount,
                    'Absent' => $absentCount,
                    'Late' => $lateCount,
                    'Attendance Rate (%)' => $attendanceRate,
                    'Interventions Count' => $student->interventions->count(),
                    'Priority' => $student->priority ?? 'Normal',
                    'Created At' => $student->created_at->format('Y-m-d H:i:s'),
                ];
            }
            
            // Generate Excel file using Laravel Excel
            return \Maatwebsite\Excel\Facades\Excel::download(
                new \App\Exports\StudentRecordsExport($data),
                'student-records-' . now()->format('Y-m-d') . '.xlsx'
            );
            
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to export Excel: ' . $e->getMessage()], 500);
        }
    }

    public function reports()
    {
        return Inertia::render('Super/SystemAdmin', [
            'activeTab' => 'reports',
            'users' => \App\Models\User::with('roles')->get(),
            'systemStats' => $this->getSystemStats(),
            'activityLogs' => $this->getRecentActivityLogs(),
            'integrations' => $this->getIntegrationStatus(),
            'systemTools' => $this->getSystemToolsData(),
            'auditLogs' => AuditLog::with('user')->orderBy('created_at', 'desc')->limit(50)->get(),
        ]);
    }

    public function settings()
    {
        // Get teachers with their assignments
        $teachers = \App\Models\User::role('Teacher')
            ->with(['department', 'program', 'sections'])
            ->get();

        return Inertia::render('Super/SystemAdmin', [
            'activeTab' => 'settings',
            'users' => \App\Models\User::with('roles')->get(),
            'systemStats' => $this->getSystemStats(),
            'activityLogs' => $this->getRecentActivityLogs(),
            'integrations' => $this->getIntegrationStatus(),
            'systemTools' => $this->getSystemToolsData(),
            'auditLogs' => AuditLog::with('user')->orderBy('created_at', 'desc')->limit(50)->get(),
            'teachers' => $teachers,
            'departments' => \App\Models\Department::orderBy('name')->get(['id', 'name']),
            'programs' => \App\Models\Program::with('department')->orderBy('name')->get(['id', 'name', 'department_id']),
            'sections' => \App\Models\Section::with(['program.department'])->orderBy('name')->get(['id', 'name', 'program_id']),
        ]);
    }

    // Teacher Management Methods
    public function storeTeacher(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
            'department_id' => 'nullable|exists:departments,id',
            'program_id' => 'nullable|exists:programs,id',
            'section_ids' => 'nullable|array',
            'section_ids.*' => 'exists:sections,id',
        ]);

        try {
            // Create the user
            $user = \App\Models\User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => \Hash::make($request->password),
                'department_id' => $request->department_id,
                'program_id' => $request->program_id,
            ]);

            // Assign Teacher role
            $user->assignRole('Teacher');

            // Assign sections if provided
            if ($request->section_ids) {
                $user->sections()->sync($request->section_ids);
            }

            return response()->json([
                'success' => true,
                'message' => 'Teacher created successfully',
                'teacher' => $user->load(['department', 'program', 'sections'])
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create teacher: ' . $e->getMessage()
            ], 500);
        }
    }

    public function updateTeacher(Request $request, $id)
    {
        try {
            \Log::info('Update teacher request', [
                'id' => $id,
                'data' => $request->all(),
                'department_id' => $request->department_id,
                'program_id' => $request->program_id,
                'section_ids' => $request->section_ids
            ]);

            $teacher = \App\Models\User::role('Teacher')->findOrFail($id);

            $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|email|unique:users,email,' . $id,
                'password' => 'nullable|string|min:8',
                'department_id' => 'nullable|integer|exists:departments,id',
                'program_id' => 'nullable|integer|exists:programs,id',
                'section_ids' => 'nullable|array',
                'section_ids.*' => 'integer|exists:sections,id',
            ]);

            $updateData = [
                'name' => $request->name,
                'email' => $request->email,
                'department_id' => $request->department_id ? (int)$request->department_id : null,
                'program_id' => $request->program_id ? (int)$request->program_id : null,
            ];

            // Only update password if provided
            if ($request->password) {
                $updateData['password'] = \Hash::make($request->password);
            }

            $teacher->update($updateData);

            // Update section assignments
            if ($request->has('section_ids')) {
                $teacher->sections()->sync($request->section_ids ?? []);
            }

            \Log::info('Teacher updated successfully', ['teacher_id' => $teacher->id]);

            return response()->json([
                'success' => true,
                'message' => 'Teacher updated successfully',
                'teacher' => $teacher->load(['department', 'program', 'sections'])
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::error('Validation error updating teacher', [
                'id' => $id,
                'errors' => $e->errors()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Error updating teacher', [
                'id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to update teacher: ' . $e->getMessage()
            ], 500);
        }
    }

    public function destroyTeacher($id)
    {
        try {
            $teacher = \App\Models\User::role('Teacher')->findOrFail($id);
            
            // Remove section assignments
            $teacher->sections()->detach();
            
            // Delete the teacher
            $teacher->delete();

            return response()->json([
                'success' => true,
                'message' => 'Teacher deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete teacher: ' . $e->getMessage()
            ], 500);
        }
    }

    // Intervention CRUD methods
    public function storeIntervention(\Illuminate\Http\Request $request)
    {
        try {
            $validated = $request->validate([
                'student_id' => 'required|exists:students,id',
                'type' => 'required|string|max:255',
                'details' => 'required|string',
                'priority' => 'required|in:low,medium,high',
                'responsible_staff' => 'nullable|exists:users,id',
                'due_date' => 'nullable|date|after:today',
                'status' => 'required|in:in_progress,done,no_response'
            ]);

            $intervention = \App\Models\Intervention::create([
                'student_id' => $validated['student_id'],
                'type' => $validated['type'],
                'details' => $validated['details'],
                'priority' => $validated['priority'],
                'responsible_staff' => $validated['responsible_staff'],
                'due_date' => $validated['due_date'],
                'date' => now(),
                'status' => $validated['status'],
                'recorded_by' => auth()->id(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Intervention created successfully',
                'intervention' => $intervention->load(['student.section.program.department', 'recordedBy', 'responsibleStaff'])
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create intervention: ' . $e->getMessage()
            ], 500);
        }
    }

    public function updateIntervention(\Illuminate\Http\Request $request, $id)
    {
        try {
            $intervention = \App\Models\Intervention::findOrFail($id);
            
            $validated = $request->validate([
                'student_id' => 'required|exists:students,id',
                'type' => 'required|string|max:255',
                'details' => 'required|string',
                'priority' => 'required|in:low,medium,high',
                'responsible_staff' => 'nullable|exists:users,id',
                'due_date' => 'nullable|date',
                'status' => 'required|in:in_progress,done,no_response'
            ]);

            $intervention->update($validated);

            return response()->json([
                'success' => true,
                'message' => 'Intervention updated successfully',
                'intervention' => $intervention->load(['student.section.program.department', 'recordedBy', 'responsibleStaff'])
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update intervention: ' . $e->getMessage()
            ], 500);
        }
    }

    public function destroyIntervention($id)
    {
        try {
            $intervention = \App\Models\Intervention::findOrFail($id);
            $intervention->delete();

            return redirect()->back()->with('success', 'Intervention deleted successfully');

        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Failed to delete intervention: ' . $e->getMessage());
        }
    }

    // Section Management Methods
    public function storeSection(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'year_level' => 'required|string|max:10',
                'academic_year' => 'required|string|max:10',
                'semester' => 'required|string|max:50',
                'adviser_name' => 'nullable|string|max:255',
                'department_id' => 'required|exists:departments,id',
                'program_id' => 'required|exists:programs,id',
                'max_students' => 'nullable|integer|min:1|max:100'
            ]);

            $section = \App\Models\Section::create($validated);
            $section->load(['program.department']);

            return response()->json([
                'success' => true,
                'message' => 'Section created successfully',
                'section' => $section
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create section: ' . $e->getMessage()
            ], 500);
        }
    }

    public function updateSection(Request $request, $id)
    {
        try {
            $section = \App\Models\Section::findOrFail($id);
            
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'year_level' => 'required|string|max:10',
                'academic_year' => 'required|string|max:10',
                'semester' => 'required|string|max:50',
                'adviser_name' => 'nullable|string|max:255',
                'department_id' => 'required|exists:departments,id',
                'program_id' => 'required|exists:programs,id',
                'max_students' => 'nullable|integer|min:1|max:100'
            ]);

            $section->update($validated);
            $section->load(['program.department']);

            return response()->json([
                'success' => true,
                'message' => 'Section updated successfully',
                'section' => $section
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update section: ' . $e->getMessage()
            ], 500);
        }
    }

    public function destroySection($id)
    {
        try {
            $section = \App\Models\Section::findOrFail($id);
            $section->delete();

            return response()->json([
                'success' => true,
                'message' => 'Section deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete section: ' . $e->getMessage()
            ], 500);
        }
    }

    public function sections()
    {
        $sections = \App\Models\Section::with(['program.department', 'teachers'])
            ->orderBy('program_id')
            ->orderBy('year_level')
            ->orderBy('name')
            ->get()
            ->map(function ($section) {
                // Handle sections created with old string-based approach
                if (!$section->program && !$section->program_id && !empty($section->getAttributes()['program'])) {
                    // Try to find program by code or name
                    $program = \App\Models\Program::where('code', $section->program)
                        ->orWhere('name', 'LIKE', '%' . $section->program . '%')
                        ->first();
                    
                    if ($program) {
                        $section->setRelation('program', $program);
                        // Update the section to use the new relationship
                        $section->update(['program_id' => $program->id]);
                    } else {
                        // Create a mock program object for display
                        $section->setRelation('program', (object) [
                            'id' => null,
                            'code' => $section->program,
                            'name' => $section->program,
                            'department' => (object) [
                                'name' => $section->department ?? 'Unknown Department'
                            ]
                        ]);
                    }
                } elseif (!$section->program && $section->program_id) {
                    // Ensure we have program data even if relationship is missing
                    $program = \App\Models\Program::find($section->program_id);
                    if ($program) {
                        $section->setRelation('program', $program);
                    }
                }
                return $section;
            });

        return Inertia::render('Super/SystemAdmin', [
            'activeTab' => 'sections',
            'users' => \App\Models\User::with('roles')->get(),
            'systemStats' => $this->getSystemStats(),
            'activityLogs' => $this->getRecentActivityLogs(),
            'integrations' => $this->getIntegrationStatus(),
            'systemTools' => $this->getSystemToolsData(),
            'auditLogs' => AuditLog::with('user')->orderBy('created_at', 'desc')->limit(50)->get(),
            'sections' => $sections,
            'departments' => \App\Models\Department::orderBy('name')->get(),
            'programs' => \App\Models\Program::with('department')->orderBy('name')->get(),
        ]);
    }

    private function getSystemStats()
    {
        // Get live attendance data
        $todayAttendance = \App\Models\AttendanceRecord::whereDate('date', today())->count();
        $totalAttendanceRecords = \App\Models\AttendanceRecord::count();
        $averageAttendanceRate = $this->getAverageAttendanceRate();
        
        // Get department and program counts
        $totalDepartments = \App\Models\Department::count();
        $totalPrograms = \App\Models\Program::count();
        
        // Get teacher count
        $totalTeachers = \App\Models\User::role('Teacher')->count();
        
        // Get intervention data
        $totalInterventions = \App\Models\Intervention::count();
        $activeInterventions = \App\Models\Intervention::where('status', 'in_progress')->count();
        
        // Get recent activity counts
        $recentStudents = \App\Models\Student::where('created_at', '>=', now()->subDays(7))->count();
        $recentAttendance = \App\Models\AttendanceRecord::where('created_at', '>=', now()->subDays(7))->count();
        
        return [
            'activeSessions' => \App\Models\User::where('updated_at', '>', now()->subMinutes(30))->count(),
            'totalUsers' => \App\Models\User::count(),
            'totalStudents' => \App\Models\Student::count(),
            'totalTeachers' => $totalTeachers,
            'totalSections' => \App\Models\Section::count(),
            'totalSubjects' => \App\Models\Subject::count(),
            'totalDepartments' => $totalDepartments,
            'totalPrograms' => $totalPrograms,
            'totalAttendanceRecords' => $totalAttendanceRecords,
            'todayAttendance' => $todayAttendance,
            'averageAttendanceRate' => $averageAttendanceRate,
            'totalInterventions' => $totalInterventions,
            'activeInterventions' => $activeInterventions,
            'recentStudents' => $recentStudents,
            'recentAttendance' => $recentAttendance,
            'databaseSize' => $this->getDatabaseSize(),
            'systemHealth' => $this->getSystemHealth(),
            'serverUptime' => $this->getServerUptime(),
            'memoryUsage' => $this->getMemoryUsage(),
        ];
    }

    private function getAverageAttendanceRate()
    {
        $totalRecords = \App\Models\AttendanceRecord::count();
        if ($totalRecords === 0) return 0;
        
        $presentRecords = \App\Models\AttendanceRecord::where('status', 'present')->count();
        return round(($presentRecords / $totalRecords) * 100, 1);
    }

    private function getIntegrationStatus()
    {
        return [
            'email' => [
                'smtp_server' => config('mail.mailers.smtp.host') ? 'Connected' : 'Not Configured',
                'templates' => 'Active',
                'status' => config('mail.mailers.smtp.host') ? 'success' : 'warning',
            ],
            'sms' => [
                'gateway' => 'Not Configured',
                'api_key' => 'Not Set',
                'status' => 'error',
            ],
            'calendar' => [
                'google_calendar' => 'Not Configured',
                'outlook' => 'Not Configured',
                'status' => 'warning',
            ],
            'api' => [
                'rest_api' => 'Active',
                'webhooks' => '0 Active',
                'status' => 'success',
            ],
            'database' => [
                'connection' => 'Connected',
                'status' => 'success',
            ],
            'storage' => [
                'local' => 'Available',
                'status' => 'success',
            ],
        ];
    }

    private function getSystemToolsData()
    {
        return [
            'backup' => [
                'last_backup' => $this->getLastBackupDate(),
                'backup_size' => $this->getBackupSize(),
                'status' => 'ready',
            ],
            'cache' => [
                'cache_size' => $this->getCacheSize(),
                'status' => 'active',
            ],
            'logs' => [
                'log_files' => $this->getLogFilesCount(),
                'total_size' => $this->getLogsSize(),
                'status' => 'active',
            ],
            'maintenance' => [
                'last_maintenance' => $this->getLastMaintenanceDate(),
                'status' => 'ready',
            ],
        ];
    }

    private function getDatabaseSize()
    {
        try {
            $databaseName = config('database.connections.mysql.database');
            $result = \DB::select("SELECT ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'size_mb' FROM information_schema.tables WHERE table_schema = ?", [$databaseName]);
            return isset($result[0]->size_mb) ? $result[0]->size_mb . 'MB' : 'Unknown';
        } catch (\Exception $e) {
            return 'Unknown';
        }
    }

    private function getSystemHealth()
    {
        try {
            \DB::connection()->getPdo();
            $dbHealth = 100;
        } catch (\Exception $e) {
            $dbHealth = 0;
        }

        try {
            \Storage::disk('local')->exists('test');
            $storageHealth = 100;
        } catch (\Exception $e) {
            $storageHealth = 0;
        }

        $overallHealth = ($dbHealth + $storageHealth) / 2;
        return round($overallHealth);
    }

    private function getRecentActivityLogs()
    {
        try {
            $recentUsers = \App\Models\User::orderBy('updated_at', 'desc')->limit(5)->get();
            $logs = [];

            foreach ($recentUsers as $user) {
                $logs[] = [
                    'id' => $user->id,
                    'type' => 'info',
                    'message' => 'User activity: ' . $user->name,
                    'user' => $user->email,
                    'timestamp' => $user->updated_at->format('Y-m-d H:i:s'),
                ];
            }

            $recentAttendance = \App\Models\AttendanceRecord::with('student')
                ->orderBy('created_at', 'desc')
                ->limit(3)
                ->get();

            foreach ($recentAttendance as $record) {
                $logs[] = [
                    'id' => 'attendance_' . $record->id,
                    'type' => 'info',
                    'message' => 'Attendance recorded: ' . ($record->student->first_name ?? 'Unknown') . ' - ' . $record->status,
                    'user' => 'system',
                    'timestamp' => $record->created_at->format('Y-m-d H:i:s'),
                ];
            }

            usort($logs, function($a, $b) {
                return strtotime($b['timestamp']) - strtotime($a['timestamp']);
            });

            return array_slice($logs, 0, 10);

        } catch (\Exception $e) {
            return [
                [
                    'id' => 1,
                    'type' => 'info',
                    'message' => 'System Admin accessed',
                    'user' => auth()->user()->email ?? 'system',
                    'timestamp' => now()->format('Y-m-d H:i:s'),
                ],
                [
                    'id' => 2,
                    'type' => 'info',
                    'message' => 'Database connection active',
                    'user' => 'system',
                    'timestamp' => now()->subMinutes(1)->format('Y-m-d H:i:s'),
                ],
            ];
        }
    }

    private function getServerUptime()
    {
        try {
            if (function_exists('sys_getloadavg')) {
                $load = sys_getloadavg();
                return [
                    'load_1min' => $load[0],
                    'load_5min' => $load[1],
                    'load_15min' => $load[2],
                ];
            }
            return ['load_1min' => 0, 'load_5min' => 0, 'load_15min' => 0];
        } catch (\Exception $e) {
            return ['load_1min' => 0, 'load_5min' => 0, 'load_15min' => 0];
        }
    }

    private function getMemoryUsage()
    {
        try {
            $memoryUsage = memory_get_usage(true);
            $memoryLimit = ini_get('memory_limit');
            $memoryLimitBytes = $this->convertToBytes($memoryLimit);
            
            return [
                'current' => $this->formatBytes($memoryUsage),
                'limit' => $memoryLimit,
                'percentage' => round(($memoryUsage / $memoryLimitBytes) * 100, 2),
            ];
        } catch (\Exception $e) {
            return ['current' => 'Unknown', 'limit' => 'Unknown', 'percentage' => 0];
        }
    }

    private function convertToBytes($value)
    {
        $value = trim($value);
        $last = strtolower($value[strlen($value) - 1]);
        $value = (int) $value;

        switch ($last) {
            case 'g':
                $value *= 1024;
            case 'm':
                $value *= 1024;
            case 'k':
                $value *= 1024;
        }

        return $value;
    }

    private function formatBytes($bytes, $precision = 2)
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        
        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }
        
        return round($bytes, $precision) . ' ' . $units[$i];
    }

    private function getLastBackupDate()
    {
        try {
            $backupPath = storage_path('app/backups');
            if (is_dir($backupPath)) {
                $files = glob($backupPath . '/*.sql');
                if (!empty($files)) {
                    $latestFile = max($files);
                    return date('Y-m-d H:i:s', filemtime($latestFile));
                }
            }
            return 'Never';
        } catch (\Exception $e) {
            return 'Unknown';
        }
    }

    private function getBackupSize()
    {
        try {
            $backupPath = storage_path('app/backups');
            if (is_dir($backupPath)) {
                $files = glob($backupPath . '/*.sql');
                $totalSize = 0;
                foreach ($files as $file) {
                    $totalSize += filesize($file);
                }
                return $this->formatBytes($totalSize);
            }
            return '0 MB';
        } catch (\Exception $e) {
            return 'Unknown';
        }
    }

    private function getCacheSize()
    {
        try {
            $cachePath = storage_path('framework/cache');
            if (is_dir($cachePath)) {
                $size = $this->getDirectorySize($cachePath);
                return $this->formatBytes($size);
            }
            return '0 MB';
        } catch (\Exception $e) {
            return 'Unknown';
        }
    }

    private function getLogFilesCount()
    {
        try {
            $logPath = storage_path('logs');
            if (is_dir($logPath)) {
                $files = glob($logPath . '/*.log');
                return count($files);
            }
            return 0;
        } catch (\Exception $e) {
            return 0;
        }
    }

    private function getLogsSize()
    {
        try {
            $logPath = storage_path('logs');
            if (is_dir($logPath)) {
                $size = $this->getDirectorySize($logPath);
                return $this->formatBytes($size);
            }
            return '0 MB';
        } catch (\Exception $e) {
            return 'Unknown';
        }
    }

    private function getLastMaintenanceDate()
    {
        try {
            $maintenanceFile = storage_path('app/maintenance.json');
            if (file_exists($maintenanceFile)) {
                $data = json_decode(file_get_contents($maintenanceFile), true);
                return $data['last_maintenance'] ?? 'Never';
            }
            return 'Never';
        } catch (\Exception $e) {
            return 'Unknown';
        }
    }

    private function getDirectorySize($directory)
    {
        $size = 0;
        if (is_dir($directory)) {
            foreach (new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($directory)) as $file) {
                if ($file->isFile()) {
                    $size += $file->getSize();
                }
            }
        }
        return $size;
    }

    public function clearCache()
    {
        try {
            \Log::info('Clear cache action triggered by user: ' . auth()->user()->email);
            
            \Artisan::call('cache:clear');
            \Artisan::call('config:clear');
            \Artisan::call('route:clear');
            \Artisan::call('view:clear');
            \Artisan::call('event:clear');
            
            \Cache::flush();
            
            AuditLogService::logSystemAdmin(
                AuditLog::TYPE_CACHE_CLEAR,
                'System cache cleared successfully',
                true,
                ['cache_types' => ['application', 'config', 'route', 'view', 'event']]
            );
            
            \Log::info('Cache cleared successfully');
            return response()->json([
                'success' => true,
                'message' => 'All caches cleared successfully',
                'timestamp' => now()->format('Y-m-d H:i:s')
            ]);
        } catch (\Exception $e) {
            AuditLogService::logSystemAdmin(
                AuditLog::TYPE_CACHE_CLEAR,
                'Failed to clear system cache: ' . $e->getMessage(),
                false,
                ['error' => $e->getMessage()]
            );
            
            \Log::error('Failed to clear cache: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to clear cache: ' . $e->getMessage()
            ], 500);
        }
    }

    public function optimizeSystem()
    {
        try {
            \Log::info('System optimization triggered by user: ' . auth()->user()->email);
            
            \Artisan::call('config:cache');
            \Artisan::call('route:cache');
            \Artisan::call('view:cache');
            \Artisan::call('event:cache');
            
            \Log::info('System optimized successfully');
            return response()->json([
                'success' => true,
                'message' => 'System optimized successfully',
                'timestamp' => now()->format('Y-m-d H:i:s')
            ]);
        } catch (\Exception $e) {
            \Log::error('Failed to optimize system: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to optimize system: ' . $e->getMessage()
            ], 500);
        }
    }

    public function createBackup()
    {
        try {
            \Log::info('Backup creation triggered by user: ' . auth()->user()->email);
            
            $backupPath = storage_path('app/backups');
            if (!is_dir($backupPath)) {
                mkdir($backupPath, 0755, true);
            }
            
            $filename = 'backup_' . date('Y-m-d_H-i-s') . '.sql';
            $filepath = $backupPath . '/' . $filename;
            
            $driver = config('database.default');
            $sqliteDbPath = database_path('database.sqlite');
            $isSqliteAvailable = file_exists($sqliteDbPath);
            
            if ($driver === 'sqlite' || $isSqliteAvailable) {
                $dbPath = $isSqliteAvailable ? $sqliteDbPath : config('database.connections.sqlite.database');
                
                if (file_exists($dbPath)) {
                    $copyResult = copy($dbPath, $filepath);
                    
                    if ($copyResult && file_exists($filepath)) {
                        $fileSize = filesize($filepath);
                        \Log::info('SQLite backup created successfully: ' . $filename . ' (Size: ' . $fileSize . ' bytes)');
                        return response()->json([
                            'success' => true,
                            'message' => 'SQLite database backup created successfully',
                            'filename' => $filename,
                            'size' => $this->formatBytes($fileSize),
                            'timestamp' => now()->format('Y-m-d H:i:s')
                        ]);
                    } else {
                        \Log::error('SQLite backup copy failed');
                        return response()->json([
                            'success' => false,
                            'message' => 'Failed to copy SQLite database file'
                        ], 500);
                    }
                } else {
                    \Log::error('SQLite database file not found at: ' . $dbPath);
                    return response()->json([
                        'success' => false,
                        'message' => 'SQLite database file not found at: ' . $dbPath
                    ], 500);
                }
            } else {
                $command = sprintf(
                    'mysqldump --user=%s --password=%s --host=%s %s > %s',
                    config('database.connections.mysql.username'),
                    config('database.connections.mysql.password'),
                    config('database.connections.mysql.host'),
                    config('database.connections.mysql.database'),
                    $filepath
                );
                
                exec($command, $output, $returnCode);
                
                if ($returnCode === 0) {
                    $fileSize = filesize($filepath);
                    \Log::info('MySQL backup created successfully: ' . $filename);
                    return response()->json([
                        'success' => true,
                        'message' => 'MySQL database backup created successfully',
                        'filename' => $filename,
                        'size' => $this->formatBytes($fileSize),
                        'timestamp' => now()->format('Y-m-d H:i:s')
                    ]);
                } else {
                    \Log::error('Failed to create backup - mysqldump returned code: ' . $returnCode);
                    return response()->json([
                        'success' => false,
                        'message' => 'Failed to create backup - database connection error'
                    ], 500);
                }
            }
        } catch (\Exception $e) {
            \Log::error('Failed to create backup: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to create backup: ' . $e->getMessage()
            ], 500);
        }
    }

    public function runMaintenance()
    {
        try {
            \Log::info('System maintenance triggered by user: ' . auth()->user()->email);
            
            $maintenanceData = [
                'last_maintenance' => now()->format('Y-m-d H:i:s'),
                'performed_by' => auth()->user()->email,
            ];
            
            file_put_contents(
                storage_path('app/maintenance.json'),
                json_encode($maintenanceData, JSON_PRETTY_PRINT)
            );
            
            \Artisan::call('migrate', ['--force' => true]);
            \Artisan::call('db:seed', ['--class' => 'DatabaseSeeder', '--force' => true]);
            
            AuditLogService::logSystemAdmin(
                AuditLog::TYPE_SYSTEM_MAINTENANCE,
                'System maintenance completed successfully',
                true,
                ['maintenance_tasks' => ['migrate', 'seed']]
            );
            
            \Log::info('System maintenance completed successfully');
            return response()->json([
                'success' => true,
                'message' => 'System maintenance completed successfully',
                'timestamp' => now()->format('Y-m-d H:i:s')
            ]);
        } catch (\Exception $e) {
            \Log::error('Failed to run maintenance: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to run maintenance: ' . $e->getMessage()
            ], 500);
        }
    }

    public function getSystemLogs()
    {
        try {
            $logPath = storage_path('logs/laravel.log');
            
            if (!file_exists($logPath)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Log file not found'
                ], 404);
            }
            
            $logs = file($logPath, FILE_IGNORE_NEW_LINES);
            $recentLogs = array_slice($logs, -50);
            
            $userFriendlyLogs = [];
            foreach ($recentLogs as $log) {
                $formattedLog = $this->formatLogEntry($log);
                
                if ($this->isUserRelevantEvent($formattedLog['message'])) {
                    $userFriendlyLogs[] = $formattedLog;
                }
            }
            
            return response()->json([
                'success' => true,
                'logs' => $userFriendlyLogs,
                'total_entries' => count($userFriendlyLogs),
                'last_updated' => date('Y-m-d H:i:s', filemtime($logPath))
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to read logs: ' . $e->getMessage()
            ], 500);
        }
    }

    private function formatLogEntry($logEntry)
    {
        preg_match('/\[(.*?)\]/', $logEntry, $timestampMatches);
        $timestamp = isset($timestampMatches[1]) ? $timestampMatches[1] : 'Unknown time';
        
        preg_match('/\] local\.(\w+):/', $logEntry, $levelMatches);
        $level = isset($levelMatches[1]) ? strtoupper($levelMatches[1]) : 'INFO';
        
        $message = preg_replace('/\[.*?\] local\.\w+:\s*/', '', $logEntry);
        $userFriendlyMessage = $this->convertToUserFriendlyMessage($message);
        $color = $this->getLogColor($level);
        
        return [
            'timestamp' => $timestamp,
            'level' => $level,
            'message' => $userFriendlyMessage,
            'color' => $color,
            'raw' => $logEntry
        ];
    }

    private function convertToUserFriendlyMessage($message)
    {
        // Remove file paths and project directory references
        $message = preg_replace('/\/[^\s]+\.php/', '', $message);
        $message = preg_replace('/\/[^\s]+\.js/', '', $message);
        $message = preg_replace('/\/[^\s]+\.css/', '', $message);
        $message = preg_replace('/\/[^\s]+\.json/', '', $message);
        $message = preg_replace('/\/[^\s]+\/[^\s]+/', '', $message);
        $message = preg_replace('/[A-Za-z]:\\\[^\s]+/', '', $message);
        $message = preg_replace('/\/home\/[^\s]+/', '', $message);
        $message = preg_replace('/\/var\/[^\s]+/', '', $message);
        $message = preg_replace('/\/usr\/[^\s]+/', '', $message);
        $message = preg_replace('/\/app\/[^\s]+/', '', $message);
        $message = preg_replace('/\/resources\/[^\s]+/', '', $message);
        $message = preg_replace('/\/storage\/[^\s]+/', '', $message);
        $message = preg_replace('/\/vendor\/[^\s]+/', '', $message);
        $message = preg_replace('/\/public\/[^\s]+/', '', $message);
        $message = preg_replace('/\/database\/[^\s]+/', '', $message);
        $message = preg_replace('/\/config\/[^\s]+/', '', $message);
        $message = preg_replace('/\/routes\/[^\s]+/', '', $message);
        $message = preg_replace('/\/tests\/[^\s]+/', '', $message);
        
        // Remove technical class names and method references
        $message = preg_replace('/Controller::[a-zA-Z]+/', '', $message);
        $message = preg_replace('/Model::[a-zA-Z]+/', '', $message);
        $message = preg_replace('/Service::[a-zA-Z]+/', '', $message);
        $message = preg_replace('/[A-Z][a-z]+Controller/', '', $message);
        $message = preg_replace('/[A-Z][a-z]+Model/', '', $message);
        $message = preg_replace('/[A-Z][a-z]+Service/', '', $message);
        
        // Remove line numbers and technical details
        $message = preg_replace('/line \d+/', '', $message);
        $message = preg_replace('/at line \d+/', '', $message);
        $message = preg_replace('/Stack trace:/', '', $message);
        $message = preg_replace('/#\d+/', '', $message);
        
        $conversions = [
            'Backup creation triggered by user' => 'Database backup started',
            'SQLite backup created successfully' => 'Database backup completed successfully',
            'System maintenance triggered by user' => 'System maintenance started',
            'System maintenance completed successfully' => 'System maintenance completed successfully',
            'System optimization triggered by user' => 'System optimization started',
            'System optimized successfully' => 'System optimization completed successfully',
            'Cache cleared successfully' => 'System cache cleared successfully',
            'Failed to create backup' => 'Database backup failed',
            'Failed to optimize system' => 'System optimization failed',
            'Failed to clear cache' => 'Cache clearing failed',
            'Failed to run maintenance' => 'System maintenance failed',
            'User login attempt' => 'User logged in',
            'User logout' => 'User logged out',
            'Attendance recorded' => 'Student attendance recorded',
            'Route error' => 'Navigation error',
            'Database connection' => 'Database status updated',
            'Storage system' => 'File storage updated',
            'Memory usage' => 'System memory updated',
            'CPU usage' => 'System performance updated',
        ];
        
        foreach ($conversions as $technical => $userFriendly) {
            if (stripos($message, $technical) !== false) {
                return str_ireplace($technical, $userFriendly, $message);
            }
        }
        
        // Clean up any remaining technical jargon
        $message = preg_replace('/Exception/', 'Error', $message);
        $message = preg_replace('/Error/', 'Issue', $message);
        $message = preg_replace('/\.[a-zA-Z0-9]+/', '', $message);
        
        return trim($message);
    }

    private function getInterventionsData()
    {
        $interventions = \App\Models\Intervention::with([
            'student.section.program.department',
            'recordedBy',
            'responsibleStaff'
        ])
        ->orderBy('created_at', 'desc')
        ->get();

        // Get statistics
        $stats = [
            'total' => $interventions->count(),
            'done' => $interventions->where('status', 'done')->count(),
            'in_progress' => $interventions->where('status', 'in_progress')->count(),
            'no_response' => $interventions->where('status', 'no_response')->count(),
            'high_priority' => $interventions->where('priority', 'high')->count(),
            'medium_priority' => $interventions->where('priority', 'medium')->count(),
            'low_priority' => $interventions->where('priority', 'low')->count(),
        ];

        return [
            'data' => $interventions,
            'stats' => $stats,
        ];
    }

    private function isUserRelevantEvent($message)
    {
        $userRelevantKeywords = [
            'User', 'Login', 'Logout', 'Authentication', 'Password', 'Account', 'Profile',
            'Attendance', 'Report', 'Section', 'Subject', 'Schedule', 'Department', 'Program',
            'Intervention', 'Backup', 'Maintenance', 'System', 'Email', 'SMS', 'Export', 'Import',
            'Security', 'Rate limit', 'Configuration', 'Settings', 'Health check', 'Data validation'
        ];
        
        foreach ($userRelevantKeywords as $keyword) {
            if (stripos($message, $keyword) !== false) {
                return true;
            }
        }
        
        return false;
    }

    private function getLogColor($level)
    {
        $colors = [
            'INFO' => 'text-blue-600',
            'ERROR' => 'text-red-600',
            'WARNING' => 'text-yellow-600',
            'DEBUG' => 'text-gray-600',
            'CRITICAL' => 'text-red-800',
            'ALERT' => 'text-red-800',
            'EMERGENCY' => 'text-red-800',
            'NOTICE' => 'text-green-600',
        ];
        
        return $colors[$level] ?? 'text-gray-600';
    }

    // Attendance helper methods for Super Admin
    private function getTodayAttendanceOverview()
    {
        $today = now()->format('Y-m-d');
        
        return [
            'total_students' => \App\Models\Student::count(),
            'present_today' => \App\Models\AttendanceRecord::byDate($today)->byStatus('present')->count(),
            'late_today' => \App\Models\AttendanceRecord::byDate($today)->byStatus('late')->count(),
            'absent_today' => \App\Models\AttendanceRecord::byDate($today)->byStatus('absent')->count(),
            'excused_today' => \App\Models\AttendanceRecord::byDate($today)->byStatus('excused')->count(),
        ];
    }

    private function getRecentAttendanceRecords($filters)
    {
        $query = \App\Models\AttendanceRecord::with(['student', 'schedule.subject', 'recordedBy'])
            ->recent(7);

        if (isset($filters['section_id'])) {
            $query->bySection($filters['section_id']);
        }
        if (isset($filters['department_id'])) {
            $query->byDepartment($filters['department_id']);
        }
        if (isset($filters['program_id'])) {
            $query->byProgram($filters['program_id']);
        }

        return $query->orderBy('created_at', 'desc')->limit(20)->get();
    }

    private function getAttendanceCalendarData($filters)
    {
        $startDate = now()->subDays(30);
        $endDate = now()->addDays(30);

        $query = \App\Models\AttendanceRecord::dateRange($startDate, $endDate);

        if (isset($filters['section_id'])) {
            $query->bySection($filters['section_id']);
        }

        return $query->selectRaw('DATE(date) as date, status, COUNT(*) as count')
            ->groupBy('date', 'status')
            ->get()
            ->groupBy('date');
    }

    // Department/Program Attendance Rate Tracker for Super Admin
    public function departmentAttendanceRates(Request $request)
    {
        $filters = [
            'date_range' => $request->get('date_range') ?: [now()->subDays(30)->format('Y-m-d'), now()->format('Y-m-d')],
            'department_id' => $request->get('department_id'),
        ];

        try {
            $departments = \App\Models\Department::with(['programs.sections.students'])
                ->when($filters['department_id'], function($query, $departmentId) {
                    return $query->where('id', $departmentId);
                })
                ->get()
                ->map(function($department) use ($filters) {
                    $programs = $department->programs->map(function($program) use ($filters) {
                        $sections = $program->sections;
                        $totalStudents = $sections->sum(function($section) {
                            return $section->students->count();
                        });

                        // Calculate attendance rates for this program
                        $attendanceStats = \App\Models\AttendanceRecord::getAttendanceStats([
                            'date_range' => $filters['date_range'],
                            'program_id' => $program->id,
                        ]);

                        return [
                            'id' => $program->id,
                            'name' => $program->name,
                            'code' => $program->code,
                            'total_students' => $totalStudents,
                            'attendance_rate' => $attendanceStats['present_percentage'],
                            'total_records' => $attendanceStats['total'],
                            'present' => $attendanceStats['present'],
                            'late' => $attendanceStats['late'],
                            'absent' => $attendanceStats['absent'],
                            'excused' => $attendanceStats['excused'],
                            'sections_count' => $sections->count(),
                        ];
                    });

                    // Calculate overall department attendance rate
                    $departmentStats = \App\Models\AttendanceRecord::getAttendanceStats([
                        'date_range' => $filters['date_range'],
                        'department_id' => $department->id,
                    ]);

                    return [
                        'id' => $department->id,
                        'name' => $department->name,
                        'code' => $department->code,
                        'attendance_rate' => $departmentStats['present_percentage'],
                        'total_records' => $departmentStats['total'],
                        'present' => $departmentStats['present'],
                        'late' => $departmentStats['late'],
                        'absent' => $departmentStats['absent'],
                        'excused' => $departmentStats['excused'],
                        'programs' => $programs,
                        'programs_count' => $programs->count(),
                    ];
                });

            return response()->json([
                'departments' => $departments,
                'filters' => $filters,
            ]);
        } catch (\Exception $e) {
            \Log::error('Department attendance rates error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to load department attendance rates'], 500);
        }
    }

    // Faculty Attendance Compliance Tracker for Super Admin
    public function facultyCompliance(Request $request)
    {
        $filters = [
            'date_range' => $request->get('date_range') ?: [now()->subDays(30)->format('Y-m-d'), now()->format('Y-m-d')],
            'department_id' => $request->get('department_id'),
        ];

        try {
            // Get all teachers and their assigned sections
            $teachers = \App\Models\User::role('Teacher')
                ->with(['sections.program.department'])
                ->get()
                ->map(function($teacher) use ($filters) {
                    $sections = $teacher->sections;
                    $totalSections = $sections->count();
                    
                    // Calculate expected attendance records for this teacher's sections
                    $expectedRecords = 0;
                    $actualRecords = 0;
                    $lateRecords = 0;
                    
                    foreach ($sections as $section) {
                        // Count expected attendance days in the date range
                        $startDate = \Carbon\Carbon::parse($filters['date_range'][0]);
                        $endDate = \Carbon\Carbon::parse($filters['date_range'][1]);
                        $daysDiff = $startDate->diffInDays($endDate);
                        $expectedRecords += $section->students->count() * $daysDiff;
                        
                        // Count actual attendance records recorded by this teacher
                        $actualRecords += \App\Models\AttendanceRecord::whereHas('student', function($query) use ($section) {
                                $query->where('section_id', $section->id);
                            })
                            ->where('recorded_by', $teacher->id)
                            ->whereBetween('date', $filters['date_range'])
                            ->count();
                        
                        // Count late submissions (records created more than 1 hour after class time)
                        $lateRecords += \App\Models\AttendanceRecord::whereHas('student', function($query) use ($section) {
                                $query->where('section_id', $section->id);
                            })
                            ->where('recorded_by', $teacher->id)
                            ->whereBetween('date', $filters['date_range'])
                            ->whereRaw('TIMESTAMPDIFF(HOUR, CONCAT(date, " ", TIME(schedules.time_start)), created_at) > 1')
                            ->join('schedules', 'attendance_records.schedule_id', '=', 'schedules.id')
                            ->count();
                    }
                    
                    $complianceRate = $expectedRecords > 0 ? round(($actualRecords / $expectedRecords) * 100, 2) : 0;
                    $timelinessRate = $actualRecords > 0 ? round((($actualRecords - $lateRecords) / $actualRecords) * 100, 2) : 0;
                    
                    return [
                        'id' => $teacher->id,
                        'name' => $teacher->name,
                        'email' => $teacher->email,
                        'total_sections' => $totalSections,
                        'expected_records' => $expectedRecords,
                        'actual_records' => $actualRecords,
                        'late_records' => $lateRecords,
                        'compliance_rate' => $complianceRate,
                        'timeliness_rate' => $timelinessRate,
                        'status' => $this->getComplianceStatus($complianceRate, $timelinessRate),
                        'departments' => $sections->pluck('program.department.name')->unique()->values(),
                    ];
                });

            return response()->json([
                'teachers' => $teachers,
                'filters' => $filters,
                'summary' => [
                    'total_teachers' => $teachers->count(),
                    'average_compliance' => $teachers->avg('compliance_rate'),
                    'average_timeliness' => $teachers->avg('timeliness_rate'),
                    'compliant_teachers' => $teachers->where('compliance_rate', '>=', 90)->count(),
                ],
            ]);
        } catch (\Exception $e) {
            \Log::error('Faculty compliance error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to load faculty compliance data'], 500);
        }
    }

    // Automated Reports Generation for Super Admin
    public function generateReport(Request $request)
    {
        $request->validate([
            'report_type' => 'required|in:weekly,monthly',
            'department_id' => 'nullable|exists:departments,id',
            'program_id' => 'nullable|exists:programs,id',
            'format' => 'required|in:pdf,excel',
            'date_range' => 'required|array|size:2',
            'date_range.*' => 'required|date',
        ]);

        try {
            $filters = [
                'date_range' => $request->date_range,
                'department_id' => $request->department_id,
                'program_id' => $request->program_id,
            ];

            // Generate report data
            $reportData = $this->prepareReportData($filters, $request->report_type);
            
            // Log audit event
            AuditLogService::logSystemAdmin(
                AuditLog::TYPE_DATA_EXPORT,
                "Generated {$request->report_type} attendance report",
                true,
                $filters
            );

            if ($request->format === 'pdf') {
                return $this->generatePdfReport($reportData, $request->report_type, $filters);
            } else {
                return $this->generateExcelReport($reportData, $request->report_type, $filters);
            }
        } catch (\Exception $e) {
            \Log::error('Report generation error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to generate report'], 500);
        }
    }

    private function getComplianceStatus($complianceRate, $timelinessRate)
    {
        if ($complianceRate >= 95 && $timelinessRate >= 90) {
            return 'excellent';
        } elseif ($complianceRate >= 85 && $timelinessRate >= 80) {
            return 'good';
        } elseif ($complianceRate >= 70 && $timelinessRate >= 70) {
            return 'fair';
        } else {
            return 'needs_improvement';
        }
    }

    private function prepareReportData($filters, $reportType)
    {
        $stats = \App\Models\AttendanceRecord::getAttendanceStats($filters);
        $trends = \App\Models\AttendanceRecord::getAttendanceTrends($filters);
        $topAbsentStudents = $this->getTopAbsentStudents($filters);
        
        // Get department/program breakdown
        $departments = \App\Models\Department::with(['programs.sections.students'])
            ->when($filters['department_id'], function($query, $departmentId) {
                return $query->where('id', $departmentId);
            })
            ->get()
            ->map(function($department) use ($filters) {
                $departmentStats = \App\Models\AttendanceRecord::getAttendanceStats([
                    'date_range' => $filters['date_range'],
                    'department_id' => $department->id,
                ]);

                $programs = $department->programs->map(function($program) use ($filters) {
                    $programStats = \App\Models\AttendanceRecord::getAttendanceStats([
                        'date_range' => $filters['date_range'],
                        'program_id' => $program->id,
                    ]);

                    return [
                        'name' => $program->name,
                        'code' => $program->code,
                        'attendance_rate' => $programStats['present_percentage'],
                        'total_records' => $programStats['total'],
                        'present' => $programStats['present'],
                        'absent' => $programStats['absent'],
                    ];
                });

                return [
                    'name' => $department->name,
                    'code' => $department->code,
                    'attendance_rate' => $departmentStats['present_percentage'],
                    'total_records' => $departmentStats['total'],
                    'present' => $departmentStats['present'],
                    'absent' => $departmentStats['absent'],
                    'programs' => $programs,
                ];
            });

        return [
            'report_type' => $reportType,
            'date_range' => $filters['date_range'],
            'generated_at' => now()->format('Y-m-d H:i:s'),
            'stats' => $stats,
            'trends' => $trends,
            'top_absent_students' => $topAbsentStudents,
            'departments' => $departments,
        ];
    }

    private function getTopAbsentStudents($filters)
    {
        $query = \App\Models\AttendanceRecord::byStatus('absent');

        if (isset($filters['date_range'])) {
            $query->dateRange($filters['date_range'][0], $filters['date_range'][1]);
        }
        if (isset($filters['section_id'])) {
            $query->bySection($filters['section_id']);
        }

        return $query->with('student')
            ->selectRaw('student_id, COUNT(*) as absent_count')
            ->groupBy('student_id')
            ->orderBy('absent_count', 'desc')
            ->limit(10)
            ->get();
    }

    private function generatePdfReport($data, $reportType, $filters)
    {
        // This would integrate with a PDF library like DomPDF or TCPDF
        // For now, return a placeholder response
        return response()->json([
            'success' => true,
            'message' => 'PDF report generation would be implemented here',
            'data' => $data,
        ]);
    }

    private function generateExcelReport($data, $reportType, $filters)
    {
        // This would integrate with a library like Laravel Excel
        // For now, return a placeholder response
        return response()->json([
            'success' => true,
            'message' => 'Excel report generation would be implemented here',
            'data' => $data,
        ]);
    }

    private function getDepartmentAttendanceTrends()
    {
        $departments = \App\Models\Department::all();
        $trends = [];
        
        // Get last 7 days of data
        for ($i = 6; $i >= 0; $i--) {
            $date = \Carbon\Carbon::now()->subDays($i);
            $dayTrends = [];
            
            foreach ($departments as $department) {
                // Get attendance records for this department on this date
                $totalRecords = \App\Models\AttendanceRecord::whereHas('student.section.program', function($query) use ($department) {
                    $query->where('department_id', $department->id);
                })->whereDate('date', $date)->count();
                
                $presentRecords = \App\Models\AttendanceRecord::whereHas('student.section.program', function($query) use ($department) {
                    $query->where('department_id', $department->id);
                })->whereDate('date', $date)->where('status', 'present')->count();
                
                $lateRecords = \App\Models\AttendanceRecord::whereHas('student.section.program', function($query) use ($department) {
                    $query->where('department_id', $department->id);
                })->whereDate('date', $date)->where('status', 'late')->count();
                
                $absentRecords = \App\Models\AttendanceRecord::whereHas('student.section.program', function($query) use ($department) {
                    $query->where('department_id', $department->id);
                })->whereDate('date', $date)->where('status', 'absent')->count();
                
                $attendanceRate = $totalRecords > 0 ? round(($presentRecords / $totalRecords) * 100, 1) : 0;
                
                $dayTrends[] = [
                    'department' => $department->name,
                    'attendance_rate' => $attendanceRate,
                    'total_records' => $totalRecords,
                    'present' => $presentRecords,
                    'late' => $lateRecords,
                    'absent' => $absentRecords,
                ];
            }
            
            $trends[] = [
                'date' => $date->format('Y-m-d'),
                'day' => $date->format('D'),
                'departments' => $dayTrends,
            ];
        }
        
        return $trends;
    }

    private function getFacultyComplianceTrends()
    {
        $teachers = \App\Models\User::role('Teacher')->with(['sections'])->get();
        $compliance = [];
        
        foreach ($teachers as $teacher) {
            // Get sections assigned to this teacher
            $assignedSections = $teacher->sections;
            
            if ($assignedSections->count() > 0) {
                // Count total attendance records taken by this teacher in the last 30 days
                $attendanceRecords = \App\Models\AttendanceRecord::where('recorded_by', $teacher->id)
                    ->where('created_at', '>=', now()->subDays(30))
                    ->count();
                
                // Estimate expected attendance records (assuming 1 record per section per day)
                $expectedRecords = $assignedSections->count() * 20; // 20 days in a month
                
                // Calculate compliance rate
                $complianceRate = $expectedRecords > 0 ? round(($attendanceRecords / $expectedRecords) * 100, 1) : 0;
                
                $compliance[] = [
                    'teacher' => $teacher->name,
                    'compliance_rate' => $complianceRate,
                    'assigned_sections' => $assignedSections->count(),
                    'attendance_records' => $attendanceRecords,
                    'expected_records' => $expectedRecords,
                ];
            } else {
                $compliance[] = [
                    'teacher' => $teacher->name,
                    'compliance_rate' => 0,
                    'assigned_sections' => 0,
                    'attendance_records' => 0,
                    'expected_records' => 0,
                ];
            }
        }
        
        // Sort by compliance rate descending
        usort($compliance, function($a, $b) {
            return $b['compliance_rate'] <=> $a['compliance_rate'];
        });
        
        return $compliance;
    }
}