<?php

namespace App\Http\Controllers\Super;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Services\AuditLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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
            'weeklyStatusProgress' => $this->getWeeklyStatusProgress(),
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

    public function management()
    {
        $management = $this->getManagementData();

        return Inertia::render('Super/SystemAdmin', [
            'activeTab' => 'management',
            'users' => \App\Models\User::with('roles')->get(),
            'systemStats' => $this->getSystemStats(),
            'activityLogs' => $this->getRecentActivityLogs(),
            'integrations' => $this->getIntegrationStatus(),
            'systemTools' => $this->getSystemToolsData(),
            'auditLogs' => AuditLog::with('user')->orderBy('created_at', 'desc')->limit(50)->get(),
            'management' => $management,
            'departments' => \App\Models\Department::orderBy('name')->get(),
            'programs' => \App\Models\Program::with('department')->orderBy('name')->get(),
            'sections' => \App\Models\Section::with(['program.department'])->orderBy('name')->get(),
            'students' => \App\Models\Student::with(['section.program.department'])->orderBy('first_name')->get(),
            'availableMonths' => $management['available_months'] ?? [],
        ]);
    }

    public function storeManagementRemark(\Illuminate\Http\Request $request)
    {
        // Explicitly check for Super Admin role
        if (!auth()->user()->hasRole('Super Admin')) {
            return back()->withErrors(['message' => 'Unauthorized: Only Super Admins can add remarks.']);
        }

        $request->validate([
            'student_id' => 'required|exists:students,id',
            'week_start' => 'required|date',
            'week_end' => 'required|date',
            'remark' => 'required|string',
        ]);

        $remark = \App\Models\ManagementRemark::updateOrCreate(
            [
                'student_id' => $request->student_id,
                'week_start' => $request->week_start,
                'week_end' => $request->week_end,
            ],
            [
                'remark' => $request->remark,
                'created_by' => auth()->id(),
            ]
        );

        // Return redirect back with success message for Inertia
        return back()->with('success', 'Remark saved successfully.');
    }

    public function destroyManagementRemark($id)
    {
        $remark = \App\Models\ManagementRemark::findOrFail($id);
        $remark->delete();
        
        // Return redirect back with success message for Inertia
        return back()->with('success', 'Remark deleted successfully.');
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
            'weeklyStatusProgress' => $this->getWeeklyStatusProgress(),
        ]);
    }

    public function refreshDashboard()
    {
        return response()->json([
            'departmentTrends' => $this->getDepartmentAttendanceTrends(),
            'facultyCompliance' => $this->getFacultyComplianceTrends(),
            'systemStats' => $this->getSystemStats(),
            'weeklyStatusProgress' => $this->getWeeklyStatusProgress(),
            'timestamp' => now()->toISOString(),
        ]);
    }

    public function settings()
    {
        // Get students with their sections and programs
        $students = \App\Models\Student::with(['section.program.department', 'weeklySummaries'])
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->get()
            ->map(function ($student) {
                $student->updatePriority(); // Ensure priority is up-to-date
                // Calculate attendance status (Normal, SLIP, PNS)
                $student->attendance_status = $student->calculateAttendanceStatus();
                return $student;
            });

        return Inertia::render('Super/SystemAdmin', [
            'activeTab' => 'settings',
            'users' => \App\Models\User::with('roles')->get(),
            'systemStats' => $this->getSystemStats(),
            'activityLogs' => $this->getRecentActivityLogs(),
            'integrations' => $this->getIntegrationStatus(),
            'systemTools' => $this->getSystemToolsData(),
            'auditLogs' => AuditLog::with('user')->orderBy('created_at', 'desc')->limit(50)->get(),
            'students' => $students,
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
                'department_id' => 'required|integer|exists:departments,id',
                'program_id' => 'required|integer|exists:programs,id',
                'max_students' => 'nullable|integer|min:1|max:100'
            ]);

            // Verify that the program belongs to the selected department
            $program = \App\Models\Program::findOrFail($validated['program_id']);
            if ($program->department_id != $validated['department_id']) {
                return response()->json([
                    'success' => false,
                    'message' => 'The selected program does not belong to the selected department.'
                ], 422);
            }

            // Convert string IDs to integers
            $validated['department_id'] = (int) $validated['department_id'];
            $validated['program_id'] = (int) $validated['program_id'];
            
            if (isset($validated['max_students'])) {
                $validated['max_students'] = (int) $validated['max_students'];
            }

            $section = \App\Models\Section::create($validated);
            $section->load(['program.department']);

            return response()->json([
                'success' => true,
                'message' => 'Section created successfully',
                'section' => $section
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Section creation error: ' . $e->getMessage());
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
            'student.section.program.department'
        ])
        ->orderBy('created_at', 'desc')
        ->get();

        // Get statistics
        $stats = [
            'total' => $interventions->count(),
            'done' => $interventions->where('status', 'done')->count(),
            'in_progress' => $interventions->where('status', 'in_progress')->count(),
            'no_response' => $interventions->where('status', 'no_response')->count(),
        ];

        return [
            'data' => $interventions,
            'stats' => $stats,
        ];
    }

    private function getManagementData($month = null, $week = null)
    {
        $startOfWeek = now()->startOfWeek();
        $endOfWeek = now()->endOfWeek();
        
        // If month and week are provided, calculate the specific week
        if ($month && $week) {
            // Parse month (format: "January 2025" or "2025-01")
            try {
                if (strpos($month, '-') !== false) {
                    // Format: "2025-01"
                    $date = \Carbon\Carbon::createFromFormat('Y-m', $month)->startOfMonth();
                } else {
                    // Format: "January 2025"
                    $date = \Carbon\Carbon::parse($month)->startOfMonth();
                }
                // Get the start of the specified week within that month
                $weeks = [];
                $current = $date->copy();
                while ($current->month == $date->month) {
                    $weekStart = $current->copy()->startOfWeek();
                    $weekEnd = $current->copy()->endOfWeek();
                    if ($weekStart->month == $date->month || $weekEnd->month == $date->month) {
                        $weeks[] = [
                            'start' => $weekStart,
                            'end' => $weekEnd,
                            'number' => count($weeks) + 1,
                        ];
                    }
                    $current->addWeek();
                }
                if (isset($weeks[$week - 1])) {
                    $startOfWeek = $weeks[$week - 1]['start'];
                    $endOfWeek = $weeks[$week - 1]['end'];
                }
            } catch (\Exception $e) {
                // Fallback to current week if parsing fails
            }
        }

        $summaries = \App\Models\WeeklySummary::with(['student.section.program.department'])
            ->whereBetween('week_start', [$startOfWeek->toDateString(), $endOfWeek->toDateString()])
            ->get();

        $data = $summaries->map(function ($summary) use ($startOfWeek, $endOfWeek) {
            $student = $summary->student;
            $total = (int)$summary->present_count + (int)$summary->late_count + (int)$summary->absent_count;
            $status = 'Normal';
            if (($summary->present_count + $summary->late_count) === 0 && $summary->absent_count > 0) {
                $status = 'PNS';
            } elseif ($total > 0 && $summary->absent_count > ($total / 2)) {
                $status = 'SLIP';
            }

            // Aggregate specific reasons from absent remarks within the week
            $reasons = \App\Models\AttendanceRecord::where('student_id', $student->id)
                ->whereBetween('date', [$startOfWeek->toDateString(), $endOfWeek->toDateString()])
                ->where('status', 'absent')
                ->whereNotNull('remarks')
                ->pluck('remarks')
                ->filter()
                ->unique()
                ->values()
                ->implode(', ');

            $existingRemark = \App\Models\ManagementRemark::where('student_id', $student->id)
                ->where('week_start', $startOfWeek->toDateString())
                ->where('week_end', $endOfWeek->toDateString())
                ->first();

            // Calculate month name and week number
            $monthName = $startOfWeek->format('F Y'); // e.g., "January 2025"
            $weekNumber = $startOfWeek->weekOfMonth; // Week number within the month
            $weekName = 'Week ' . $weekNumber . ' of ' . $startOfWeek->format('F Y');
            $dateRange = $startOfWeek->format('M d') . ' - ' . $endOfWeek->format('M d, Y');

            return [
                'id' => $student->id,
                'student' => [
                    'first_name' => $student->first_name,
                    'last_name' => $student->last_name,
                    'student_number' => $student->student_number,
                    'email' => $student->email ?? null,
                ],
                'section' => $student->section->name ?? null,
                'department' => optional(optional($student->section)->program)->department->name ?? null,
                'status' => $status,
                'specific_reasons' => $reasons,
                'remarks' => $existingRemark->remark ?? '',
                'month' => $monthName,
                'week' => [
                    'start' => $startOfWeek->toDateString(),
                    'end' => $endOfWeek->toDateString(),
                    'label' => $weekName,
                    'number' => $weekNumber,
                    'date_range' => $dateRange,
                ],
            ];
        });

        // Get available months and weeks for filters
        $availableMonths = \App\Models\WeeklySummary::selectRaw('DATE_FORMAT(week_start, "%Y-%m") as month, DATE_FORMAT(week_start, "%M %Y") as month_name')
            ->distinct()
            ->orderBy('month', 'desc')
            ->get()
            ->map(function ($item) {
                return [
                    'value' => $item->month,
                    'label' => $item->month_name,
                ];
            });

        return [
            'data' => $data,
            'week' => [
                'start' => $startOfWeek->toDateString(),
                'end' => $endOfWeek->toDateString(),
                'label' => 'Week ' . $startOfWeek->weekOfMonth . ' of ' . $startOfWeek->format('F Y'),
                'number' => $startOfWeek->weekOfMonth,
                'date_range' => $startOfWeek->format('M d') . ' - ' . $endOfWeek->format('M d, Y'),
            ],
            'month' => $startOfWeek->format('F Y'),
            'available_months' => $availableMonths,
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

    private function getWeeklyStatusProgress()
    {
        $today = \Carbon\CarbonImmutable::today();
        // Use Monday as start of week to match WeeklySummary generation
        $weeks = collect(range(0, 7))->map(fn($i) => $today->startOfWeek(\Carbon\CarbonImmutable::MONDAY)->subWeeks($i))->reverse()->values();
        
        $weeklyStatusData = [];
        
        foreach ($weeks as $weekStart) {
            $weekEnd = $weekStart->endOfWeek(\Carbon\CarbonImmutable::SUNDAY);
            $rangeStart = $weekStart->toDateString();
            $rangeEnd = $weekEnd->toDateString();
            
            // Get all weekly summaries for this week (where week_start matches this week)
            $summaries = \App\Models\WeeklySummary::where('week_start', $rangeStart)
                ->get();
            
            // Calculate status for each student based on their weekly summary
            $normalCount = 0;
            $pnsCount = 0;
            $slipCount = 0;
            $totalStudents = 0;
            
            foreach ($summaries as $summary) {
                $total = (int)$summary->present_count + (int)$summary->late_count + (int)$summary->absent_count;
                
                // Only count students with attendance records
                if ($total > 0) {
                    $totalStudents++;
                    
                    // Determine status based on the same logic used in management
                    if (($summary->present_count + $summary->late_count) === 0 && $summary->absent_count > 0) {
                        $pnsCount++;
                    } elseif ($total > 0 && $summary->absent_count > ($total / 2)) {
                        $slipCount++;
                    } else {
                        $normalCount++;
                    }
                }
            }
            
            // Calculate percentages
            $normalPercentage = $totalStudents > 0 ? round(($normalCount / $totalStudents) * 100, 1) : 0;
            $pnsPercentage = $totalStudents > 0 ? round(($pnsCount / $totalStudents) * 100, 1) : 0;
            $slipPercentage = $totalStudents > 0 ? round(($slipCount / $totalStudents) * 100, 1) : 0;
            
            $weeklyStatusData[] = [
                'week_start' => $rangeStart,
                'week_end' => $rangeEnd,
                'date_label' => $weekStart->format('M d') . ' - ' . $weekEnd->format('M d, Y'),
                'week_label' => $weekStart->format('M d'),
                'normal_percentage' => $normalPercentage,
                'pns_percentage' => $pnsPercentage,
                'slip_percentage' => $slipPercentage,
                'normal_count' => $normalCount,
                'pns_count' => $pnsCount,
                'slip_count' => $slipCount,
                'total_students' => $totalStudents,
            ];
        }
        
        return $weeklyStatusData;
    }

    // Student Management Methods
    public function storeStudent(Request $request)
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

        $student = \App\Models\Student::create([
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

        return redirect()->route('super.settings', ['#students'])->with('success', 'Student created successfully!');
    }

    public function destroyStudent($id)
    {
        $student = \App\Models\Student::findOrFail($id);
        $student->delete(); // Soft delete
        
        // Return redirect back with success message for Inertia
        return back()->with('success', 'Student deleted successfully.');
    }

    // Student Import/Export Methods
    public function importStudents(Request $request)
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
                        $student = \App\Models\Student::create([
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
                        $student = \App\Models\Student::create([
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

            return redirect()->route('super.settings', ['#students'])->with('success', $message)->with('errors', $errors);
        } catch (\Exception $e) {
            return redirect()->route('super.settings', ['#students'])->with('error', 'Import failed: ' . $e->getMessage());
        }
    }

    public function exportStudents(Request $request)
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

            // Build query with filters
            $query = \App\Models\Student::with(['section.program.department']);

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
                return $this->exportStudentsToCsv($students, $validated['student_id'] ?? null);
            } else {
                return $this->exportStudentsToXml($students, $validated['student_id'] ?? null);
            }

        } catch (\Exception $e) {
            \Log::error('Export failed: ' . $e->getMessage(), [
                'request_data' => $request->all(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Export failed: ' . $e->getMessage()
            ], 500);
        }
    }

    private function exportStudentsToCsv($students, $studentId = null)
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
                'Email',
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
                'Updated At'
            ]);

            // CSV Data
            foreach ($students as $student) {
                fputcsv($file, [
                    $student->id,
                    $student->student_number,
                    $student->first_name,
                    $student->last_name,
                    $student->email,
                    $student->gender,
                    $student->birth_date,
                    $student->section?->program?->department?->name ?? 'N/A',
                    $student->section?->program?->name ?? 'N/A',
                    $student->section?->name ?? 'N/A',
                    $student->year_level ?? 'N/A',
                    $student->guardian_name,
                    $student->guardian_contact,
                    $student->status ?? 'Active',
                    $student->priority ?? 'Safe',
                    $student->absence_count ?? 0,
                    $student->created_at?->format('Y-m-d H:i:s'),
                    $student->updated_at?->format('Y-m-d H:i:s')
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    private function exportStudentsToXml($students, $studentId = null)
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
            $studentNode->addChild('email', htmlspecialchars($student->email));
            $studentNode->addChild('gender', htmlspecialchars($student->gender));
            $studentNode->addChild('birth_date', htmlspecialchars($student->birth_date));
            $studentNode->addChild('department', htmlspecialchars($student->section?->program?->department?->name ?? 'N/A'));
            $studentNode->addChild('program', htmlspecialchars($student->section?->program?->name ?? 'N/A'));
            $studentNode->addChild('section', htmlspecialchars($student->section?->name ?? 'N/A'));
            $studentNode->addChild('year_level', htmlspecialchars($student->year_level ?? 'N/A'));
            $studentNode->addChild('guardian_name', htmlspecialchars($student->guardian_name));
            $studentNode->addChild('guardian_contact', htmlspecialchars($student->guardian_contact));
            $studentNode->addChild('status', htmlspecialchars($student->status ?? 'Active'));
            $studentNode->addChild('priority', htmlspecialchars($student->priority ?? 'Safe'));
            $studentNode->addChild('absence_count', htmlspecialchars($student->absence_count ?? 0));
            $studentNode->addChild('created_at', htmlspecialchars($student->created_at?->format('Y-m-d H:i:s')));
            $studentNode->addChild('updated_at', htmlspecialchars($student->updated_at?->format('Y-m-d H:i:s')));
        }

        $headers = [
            'Content-Type' => 'application/xml',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ];

        return response($xml->asXML(), 200, $headers);
    }

    // Cleanup Duplicate Departments and Programs
    public function cleanupDuplicates()
    {
        try {
            $deletedDepartments = 0;
            $deletedPrograms = 0;

            // Remove duplicate departments (by code, keeping the first one)
            $departmentDuplicates = DB::table('departments')
                ->select('code', DB::raw('COUNT(*) as count'))
                ->whereNull('deleted_at')
                ->groupBy('code')
                ->having('count', '>', 1)
                ->get();

            foreach ($departmentDuplicates as $dup) {
                $departments = \App\Models\Department::where('code', $dup->code)
                    ->whereNull('deleted_at')
                    ->orderBy('created_at', 'asc')
                    ->get();
                
                // Keep the first one, delete the rest
                if ($departments->count() > 1) {
                    $keep = $departments->first();
                    $toDelete = $departments->skip(1);
                    
                    foreach ($toDelete as $dept) {
                        // Move any programs from deleted department to the kept one
                        \App\Models\Program::where('department_id', $dept->id)
                            ->update(['department_id' => $keep->id]);
                        
                        // Update code to make it unique before soft deleting
                        $dept->code = $dept->code . '_deleted_' . $dept->id;
                        $dept->save();
                        $dept->delete(); // Soft delete
                        $deletedDepartments++;
                    }
                }
            }

            // Remove duplicate programs (by code within same department, keeping the first one)
            $programDuplicates = DB::table('programs')
                ->select('code', 'department_id', DB::raw('COUNT(*) as count'))
                ->whereNull('deleted_at')
                ->groupBy('code', 'department_id')
                ->having('count', '>', 1)
                ->get();

            foreach ($programDuplicates as $dup) {
                $programs = \App\Models\Program::where('code', $dup->code)
                    ->where('department_id', $dup->department_id)
                    ->whereNull('deleted_at')
                    ->orderBy('created_at', 'asc')
                    ->get();
                
                // Keep the first one, delete the rest
                if ($programs->count() > 1) {
                    $keep = $programs->first();
                    $toDelete = $programs->skip(1);
                    
                    foreach ($toDelete as $program) {
                        // Move any sections from deleted program to the kept one
                        \App\Models\Section::where('program_id', $program->id)
                            ->update(['program_id' => $keep->id]);
                        
                        // Update code to make it unique before soft deleting
                        $program->code = $program->code . '_deleted_' . $program->id;
                        $program->save();
                        $program->delete(); // Soft delete
                        $deletedPrograms++;
                    }
                }
            }

            return response()->json([
                'success' => true,
                'message' => "Cleanup completed: {$deletedDepartments} duplicate departments and {$deletedPrograms} duplicate programs removed.",
                'deleted_departments' => $deletedDepartments,
                'deleted_programs' => $deletedPrograms,
            ]);
        } catch (\Exception $e) {
            \Log::error('Cleanup duplicates failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Cleanup failed: ' . $e->getMessage()
            ], 500);
        }
    }
}