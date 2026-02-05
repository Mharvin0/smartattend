<?php

namespace App\Http\Controllers\Super;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Notifications\AccountCreatedNotification;
use App\Services\AuditLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
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
        try {
            // Optimize queries - limit users and use chunking if needed
            $users = \App\Models\User::with('roles')->limit(100)->get();
            
            // Wrap potentially slow operations in try-catch
            $systemStats = null;
            $activityLogs = [];
            $weeklyStatusProgress = [];
            
            try {
                $systemStats = $this->getSystemStats();
            } catch (\Exception $e) {
                \Log::error('Error getting system stats: ' . $e->getMessage());
                $systemStats = $this->getDefaultSystemStats();
            }
            
            try {
                $activityLogs = $this->getRecentActivityLogs();
            } catch (\Exception $e) {
                \Log::error('Error getting activity logs: ' . $e->getMessage());
                $activityLogs = [];
            }
            
            try {
                $weeklyStatusProgress = $this->getWeeklyStatusProgress();
            } catch (\Exception $e) {
                \Log::error('Error getting weekly status progress: ' . $e->getMessage());
                $weeklyStatusProgress = [];
            }
            
            return Inertia::render('Super/SystemAdmin', [
                'activeTab' => 'dashboard',
                'pageTitle' => 'Dashboard',
                'users' => $users,
                'systemStats' => $systemStats,
                'activityLogs' => $activityLogs,
                'recentUserActivities' => $this->getRecentUserActivities(),
                'integrations' => $this->getIntegrationStatus(),
                'systemTools' => $this->getSystemToolsData(),
                'auditLogs' => AuditLog::with('user')->orderBy('created_at', 'desc')->limit(50)->get(),
                'weeklyStatusProgress' => $weeklyStatusProgress,
            ]);
        } catch (\Exception $e) {
            \Log::error('Error in SystemAdminController@index: ' . $e->getMessage());
            \Log::error($e->getTraceAsString());
            
            // Return a minimal response to prevent complete failure
            return Inertia::render('Super/SystemAdmin', [
                'activeTab' => 'dashboard',
                'pageTitle' => 'Dashboard',
                'users' => [],
                'systemStats' => $this->getDefaultSystemStats(),
                'activityLogs' => [],
                'recentUserActivities' => [],
                'integrations' => $this->getIntegrationStatus(),
                'systemTools' => $this->getSystemToolsData(),
                'auditLogs' => [],
                'weeklyStatusProgress' => [],
                'error' => 'Some data could not be loaded. Please refresh the page.',
            ]);
        }
    }
    
    private function getDefaultSystemStats()
    {
        return [
            'activeSessions' => 0,
            'totalUsers' => 0,
            'totalStudents' => 0,
            'totalCSDLUsers' => 0,
            'totalSections' => 0,
            'totalSubjects' => 0,
            'totalDepartments' => 0,
            'totalPrograms' => 0,
            'totalAttendanceRecords' => 0,
            'todayAttendance' => 0,
            'averageAttendanceRate' => 0,
            'totalInterventions' => 0,
            'activeInterventions' => 0,
            'recentStudents' => 0,
            'recentAttendance' => 0,
            'databaseSize' => 'Unknown',
            'systemHealth' => 0,
            'serverUptime' => ['load_1min' => 0, 'load_5min' => 0, 'load_15min' => 0],
            'memoryUsage' => ['current' => '0MB', 'limit' => 'Unknown', 'percentage' => 0],
        ];
    }

    public function interventions()
    {
        return Inertia::render('Super/SystemAdmin', [
            'activeTab' => 'interventions',
            'users' => \App\Models\User::with('roles')->get(),
            'systemStats' => $this->getSystemStats(),
            'activityLogs' => $this->getRecentActivityLogs(),
            'recentUserActivities' => $this->getRecentUserActivities(),
            'integrations' => $this->getIntegrationStatus(),
            'systemTools' => $this->getSystemToolsData(),
            'auditLogs' => AuditLog::with('user')->orderBy('created_at', 'desc')->limit(50)->get(),
            'interventions' => $this->getInterventionsData(),
            'departments' => \App\Models\Department::orderBy('name')->get(),
            'programs' => \App\Models\Program::with('department')->orderBy('name')->get(),
            'sections' => \App\Models\Section::with(['program.department'])->orderBy('name')->get(),
            'students' => \App\Models\Student::with(['section.program.department', 'department'])->orderBy('first_name')->get(),
        ]);
    }

    public function management(Request $request)
    {
        // Get students that need calls or home visits
        // Include students with priority 'Call Needed' or 'PNS', OR students with active pending or to_follow tracking records
        $studentsWithActiveTracking = \App\Models\StudentTracking::whereIn('status', ['pending', 'to_follow', 'processing'])
            ->where('archived', false)
            ->pluck('student_id')
            ->unique()
            ->values()
            ->toArray();
        
        $user = auth()->user();
        $studentsNeedingCalls = \App\Models\Student::forUser($user)
            ->whereNull('attention_archived_at')
            ->with(['section.program.department', 'department', 'program', 'studentTracking' => function($query) {
                // Only show "active" tracking statuses in the Students Needing Attention table
                // (Status dropdown should only be pending/processing/to_follow).
                $query->where('archived', false)
                    ->whereIn('status', ['pending', 'to_follow', 'processing'])
                    ->orderBy('date', 'desc')
                    ->orderBy('created_at', 'desc')
                    ->limit(1);
            }])
            ->get()
            ->map(function ($student) {
                // Refresh the model to get the latest saved values from database
                // DO NOT call updatePriority() here as it recalculates absence_count from attendance records
                // which would overwrite manually edited values
                $student->refresh();
                
                // Calculate attendance status (this is a computed value, doesn't modify the model)
                $attendanceStatus = $student->calculateAttendanceStatus();
                
                return $student;
            })
            ->filter(function ($student) use ($studentsWithActiveTracking) {
                // Filter students that need attention:
                // - Computed priority from absence_count (Call Needed/PNS)
                // - OR has active tracking records (pending/to_follow)
                $absenceCount = (int) ($student->absence_count ?? 0);
                $computedPriority = $absenceCount < 4 ? 'Safe' : ($absenceCount < 8 ? 'Call Needed' : 'PNS');
                $priorityMatch = in_array($computedPriority, ['Call Needed', 'PNS']);
                $hasActiveTracking = in_array($student->id, $studentsWithActiveTracking);
                
                return $priorityMatch || $hasActiveTracking;
            })
            ->map(function ($student) {
                $latestTracking = $student->studentTracking->first();
                $absenceCount = (int) ($student->absence_count ?? 0);
                $computedPriority = $absenceCount < 4 ? 'Safe' : ($absenceCount < 8 ? 'Call Needed' : 'PNS');
                return [
                    'id' => $student->id,
                    'name' => $student->first_name . ' ' . $student->last_name,
                    'student_number' => $student->student_number,
                    'email' => $student->email,
                    'section' => $student->section?->name ?? 'N/A',
                    'department' => $student->department?->name ?? $student->section?->program?->department?->name ?? 'N/A',
                    'program' => $student->program?->name ?? $student->section?->program?->name ?? 'N/A',
                    // Always compute Priority from absence_count for consistent display (e.g. 15 absences != Safe)
                    'priority' => $computedPriority,
                    'absence_count' => $absenceCount,
                    'attendance_status' => $student->calculateAttendanceStatus(),
                    'tracking_status' => $latestTracking?->status ?? 'No Status',
                    'last_tracking' => $latestTracking ? [
                        'id' => $latestTracking->id,
                        'type' => $latestTracking->type,
                        'date' => $latestTracking->date->format('Y-m-d'),
                        'status' => $latestTracking->status,
                    ] : null,
                ];
            })
            ->sortByDesc(function ($student) {
                // Sort by priority first (PNS > Call Needed > Safe), then by absence count
                $priorityOrder = ['PNS' => 3, 'Call Needed' => 2, 'Safe' => 1];
                return ($priorityOrder[$student['priority']] ?? 0) * 1000 + $student['absence_count'];
            })
            ->values();

        // Get recent tracking records - Filter by user's departments (Super Admin sees all)
        $departmentIds = $user->getAssignedDepartmentIds();
        $recentTracking = \App\Models\StudentTracking::with(['student.section.program.department', 'trackedBy'])
            ->whereHas('student', function($q) use ($user, $departmentIds) {
                if (!$user->hasRole('Super Admin') && !empty($departmentIds)) {
                    $q->where(function($subQ) use ($departmentIds) {
                        $subQ->whereIn('department_id', $departmentIds)
                             ->orWhereHas('section.program', function($progQ) use ($departmentIds) {
                                 $progQ->whereIn('department_id', $departmentIds);
                             });
                    });
                }
            })
            ->where('archived', false)
            ->orderBy('date', 'desc')
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($tracking) {
                return [
                    'id' => $tracking->id,
                    'type' => $tracking->type,
                    'date' => $tracking->date->format('Y-m-d'),
                    'time' => $tracking->time ? \Carbon\Carbon::parse($tracking->time)->format('H:i') : null,
                    'status' => $tracking->status,
                    'outcome' => $tracking->outcome,
                    'follow_up_required' => $tracking->follow_up_required,
                    'follow_up_date' => $tracking->follow_up_date ? $tracking->follow_up_date->format('Y-m-d') : null,
                    'student' => [
                        'id' => $tracking->student?->id ?? null,
                        'name' => ($tracking->student?->first_name ?? '') . ' ' . ($tracking->student?->last_name ?? ''),
                        'section' => $tracking->student?->section?->name ?? 'N/A',
                        'department' => $tracking->student?->section?->program?->department?->name ?? 'N/A',
                        'program' => $tracking->student?->section?->program?->name ?? 'N/A',
                    ],
                    'tracked_by' => $tracking->trackedBy?->name ?? 'Unknown',
                    'tracked_by_id' => $tracking->tracked_by,
                    'notes' => $tracking->notes,
                    'archived' => $tracking->archived,
                    'can_edit' => true, // Super Admin can edit all tracking records
                ];
            })
            ->filter(fn($tracking) => $tracking['student']['id'] !== null);

        // Statistics
        $stats = [
            // Derive counts from absence_count (priority should follow this)
            'students_needing_calls' => \App\Models\Student::where('absence_count', '>=', 4)->where('absence_count', '<', 8)->count(),
            'students_needing_visits' => \App\Models\Student::where('absence_count', '>=', 8)->count(),
            'total_tracked_today' => \App\Models\StudentTracking::where('archived', false)
                ->whereDate('date', \Carbon\Carbon::today())
                ->count(),
            'total_tracked_this_week' => \App\Models\StudentTracking::where('archived', false)
                ->whereBetween('date', [
                    \Carbon\Carbon::now()->startOfWeek(),
                    \Carbon\Carbon::now()->endOfWeek()
                ])
                ->count(),
        ];

        return Inertia::render('Super/SystemAdmin', [
            'activeTab' => 'management',
            'users' => \App\Models\User::with('roles')->get(),
            'systemStats' => $this->getSystemStats(),
            'activityLogs' => $this->getRecentActivityLogs(),
            'recentUserActivities' => $this->getRecentUserActivities(),
            'integrations' => $this->getIntegrationStatus(),
            'systemTools' => $this->getSystemToolsData(),
            'auditLogs' => AuditLog::with('user')->orderBy('created_at', 'desc')->limit(50)->get(),
            'studentsNeedingCalls' => $studentsNeedingCalls,
            'recentTracking' => $recentTracking,
            'stats' => $stats,
            'departments' => \App\Models\Department::orderBy('name')->get(),
            'programs' => \App\Models\Program::with('department')->orderBy('name')->get(),
            'sections' => \App\Models\Section::with(['program.department'])->orderBy('name')->get(),
            'students' => \App\Models\Student::with(['section.program.department'])->orderBy('first_name')->get(),
        ]);
    }

    public function trackStudent(Request $request)
    {
        $validated = $request->validate([
            'student_id' => 'required|exists:students,id',
            'type' => 'required|in:call,home_visit',
            'date' => 'required|date',
            'time' => 'nullable|date_format:H:i',
            'notes' => 'nullable|string',
            'status' => 'required|in:pending,to_follow,processing',
            'outcome' => 'nullable|string',
            'follow_up_required' => 'nullable|string',
            'follow_up_date' => 'nullable|date|after:today',
        ]);

        $tracking = \App\Models\StudentTracking::create([
            'student_id' => $validated['student_id'],
            'tracked_by' => auth()->id(),
            'type' => $validated['type'],
            'date' => $validated['date'],
            'time' => $validated['time'] ? \Carbon\Carbon::parse($validated['time'])->format('H:i:s') : null,
            'notes' => $validated['notes'] ?? null,
            'status' => $validated['status'],
            'outcome' => $validated['outcome'] ?? null,
            'follow_up_required' => $validated['follow_up_required'] ?? null,
            'follow_up_date' => $validated['follow_up_date'] ?? null,
        ]);

        // If the student was previously archived from the attention list, bring them back when we track them again.
        \App\Models\Student::where('id', $validated['student_id'])->update([
            'attention_archived_at' => null,
        ]);

        return redirect()->back()->with('success', 'Student tracking recorded successfully');
    }

    public function updateTracking(Request $request, $id)
    {
        $tracking = \App\Models\StudentTracking::findOrFail($id);

        // Status dropdown updates only send { status }.
        // Allow status-only updates without requiring other fields.
        if ($request->has('status') && ! $request->has('type') && ! $request->has('date')) {
            $validated = $request->validate([
                'status' => 'required|in:pending,to_follow,processing',
            ]);

            $tracking->update([
                'status' => $validated['status'],
            ]);

            // If a student was archived from the attention list, bring them back when a status is updated.
            \App\Models\Student::where('id', $tracking->student_id)->update([
                'attention_archived_at' => null,
            ]);

            return redirect()->back()->with('success', 'Tracking status updated successfully');
        }

        $validated = $request->validate([
            'type' => 'required|in:call,home_visit',
            'date' => 'required|date',
            'time' => 'nullable|date_format:H:i',
            'notes' => 'nullable|string',
            'status' => 'required|in:pending,to_follow,processing',
            'outcome' => 'nullable|string',
            'follow_up_required' => 'nullable|string',
            'follow_up_date' => 'nullable|date|after:today', // Only future dates allowed
        ]);

        $tracking->update([
            'type' => $validated['type'],
            'date' => $validated['date'],
            'time' => $validated['time'] ? \Carbon\Carbon::parse($validated['time'])->format('H:i:s') : null,
            'notes' => $validated['notes'] ?? null,
            'status' => $validated['status'],
            'outcome' => $validated['outcome'] ?? null,
            'follow_up_required' => $validated['follow_up_required'] ?? null,
            'follow_up_date' => $validated['follow_up_date'] ?? null,
        ]);

        return redirect()->back()->with('success', 'Tracking record updated successfully');
    }

    public function viewTracking($id)
    {
        $tracking = \App\Models\StudentTracking::with(['student.section.program.department', 'trackedBy'])
            ->whereHas('student')
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'tracking' => [
                'id' => $tracking->id,
                'type' => $tracking->type,
                'date' => $tracking->date->format('Y-m-d'),
                'time' => $tracking->time ? \Carbon\Carbon::parse($tracking->time)->format('H:i') : null,
                'status' => $tracking->status,
                'outcome' => $tracking->outcome,
                'follow_up_required' => $tracking->follow_up_required,
                'follow_up_date' => $tracking->follow_up_date ? $tracking->follow_up_date->format('Y-m-d') : null,
                'notes' => $tracking->notes,
                'student' => [
                    'id' => $tracking->student?->id ?? null,
                    'name' => ($tracking->student?->first_name ?? '') . ' ' . ($tracking->student?->last_name ?? ''),
                    'student_number' => $tracking->student?->student_number ?? 'N/A',
                    'section' => $tracking->student?->section?->name ?? 'N/A',
                    'department' => $tracking->student?->section?->program?->department?->name ?? 'N/A',
                    'program' => $tracking->student?->section?->program?->name ?? 'N/A',
                ],
                'tracked_by' => $tracking->trackedBy?->name ?? 'Unknown',
                'created_at' => $tracking->created_at->format('Y-m-d H:i'),
                'updated_at' => $tracking->updated_at->format('Y-m-d H:i'),
            ],
        ]);
    }

    public function archiveTracking($id)
    {
        $tracking = \App\Models\StudentTracking::findOrFail($id);
        $tracking->update([
            'archived' => true,
            'archived_at' => now(),
        ]);

        return redirect()->back()->with('success', 'Tracking record archived successfully');
    }

    public function deleteTracking($id)
    {
        $tracking = \App\Models\StudentTracking::findOrFail($id);
        $tracking->delete(); // Soft delete

        return redirect()->back()->with('success', 'Tracking record deleted successfully');
    }

    public function restoreTracking($id)
    {
        $tracking = \App\Models\StudentTracking::withTrashed()->findOrFail($id);
        $tracking->restore();

        return redirect()->back()->with('success', 'Tracking record restored successfully');
    }

    public function unarchiveTracking($id)
    {
        $tracking = \App\Models\StudentTracking::findOrFail($id);
        $tracking->update([
            'archived' => false,
            'archived_at' => null,
        ]);

        return redirect()->back()->with('success', 'Tracking record unarchived successfully');
    }

    public function getArchivedTracking(Request $request)
    {
        $query = \App\Models\StudentTracking::with(['student.section.program.department', 'trackedBy'])
            ->where('archived', true);

        // Apply filters
        if ($request->has('type') && $request->type) {
            $query->where('type', $request->type);
        }
        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }
        if ($request->has('department_id') && $request->department_id) {
            $query->whereHas('student.section.program', function($q) use ($request) {
                $q->where('department_id', $request->department_id);
            });
        }
        if ($request->has('date_from') && $request->date_from) {
            $query->whereDate('date', '>=', $request->date_from);
        }
        if ($request->has('date_to') && $request->date_to) {
            $query->whereDate('date', '<=', $request->date_to);
        }
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->whereHas('student', function($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('student_number', 'like', "%{$search}%");
            });
        }

        // Get total count before pagination
        $total = $query->count();
        
        // Pagination
        $perPage = $request->get('per_page', 10);
        $page = $request->get('page', 1);
        $offset = ($page - 1) * $perPage;

        $archivedTracking = $query->orderBy('archived_at', 'desc')
            ->orderBy('date', 'desc')
            ->skip($offset)
            ->take($perPage)
            ->get()
            ->map(function ($tracking) {
                return [
                    'id' => $tracking->id,
                    'type' => $tracking->type,
                    'date' => $tracking->date->format('Y-m-d'),
                    'time' => $tracking->time ? \Carbon\Carbon::parse($tracking->time)->format('H:i') : null,
                    'status' => $tracking->status,
                    'outcome' => $tracking->outcome,
                    'follow_up_required' => $tracking->follow_up_required,
                    'follow_up_date' => $tracking->follow_up_date ? $tracking->follow_up_date->format('Y-m-d') : null,
                    'student' => [
                        'id' => $tracking->student->id,
                        'name' => $tracking->student->first_name . ' ' . $tracking->student->last_name,
                        'section' => $tracking->student->section?->name ?? 'N/A',
                        'department' => $tracking->student->section?->program?->department?->name ?? 'N/A',
                        'program' => $tracking->student->section?->program?->name ?? 'N/A',
                    ],
                    'tracked_by' => $tracking->trackedBy?->name ?? 'Unknown',
                    'tracked_by_id' => $tracking->tracked_by,
                    'notes' => $tracking->notes,
                    'archived' => $tracking->archived,
                    'archived_at' => $tracking->archived_at ? $tracking->archived_at->format('Y-m-d H:i') : null,
                    'can_edit' => true,
                ];
            });

        return response()->json([
            'success' => true,
            'tracking' => $archivedTracking,
            'total' => $total,
            'per_page' => $perPage,
            'current_page' => $page,
            'last_page' => ceil($total / $perPage),
        ]);
    }

    public function getTrackingRecords(Request $request)
    {
        $user = auth()->user();
        $departmentIds = $user->getAssignedDepartmentIds();
        
        $query = \App\Models\StudentTracking::with(['student.section.program.department', 'trackedBy'])
            ->whereHas('student', function($q) use ($user, $departmentIds) {
                if (!$user->hasRole('Super Admin') && !empty($departmentIds)) {
                    $q->where(function($subQ) use ($departmentIds) {
                        $subQ->whereIn('department_id', $departmentIds)
                             ->orWhereHas('section.program', function($progQ) use ($departmentIds) {
                                 $progQ->whereIn('department_id', $departmentIds);
                             });
                    });
                }
            })
            ->where('archived', false);

        // Apply filters
        if ($request->has('type') && $request->type) {
            $query->where('type', $request->type);
        }
        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }
        if ($request->has('department_id') && $request->department_id) {
            $query->whereHas('student.section.program', function($q) use ($request) {
                $q->where('department_id', $request->department_id);
            });
        }
        if ($request->has('date_from') && $request->date_from) {
            $query->whereDate('date', '>=', $request->date_from);
        }
        if ($request->has('date_to') && $request->date_to) {
            $query->whereDate('date', '<=', $request->date_to);
        }
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->whereHas('student', function($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('student_number', 'like', "%{$search}%");
            });
        }

        // Get total count before pagination
        $total = $query->count();
        
        // Pagination
        $perPage = $request->get('per_page', 10);
        $page = $request->get('page', 1);
        $offset = ($page - 1) * $perPage;

        $tracking = $query->orderBy('date', 'desc')
            ->orderBy('created_at', 'desc')
            ->skip($offset)
            ->take($perPage)
            ->get()
            ->map(function ($tracking) {
                return [
                    'id' => $tracking->id,
                    'type' => $tracking->type,
                    'date' => $tracking->date->format('Y-m-d'),
                    'time' => $tracking->time ? \Carbon\Carbon::parse($tracking->time)->format('H:i') : null,
                    'status' => $tracking->status,
                    'outcome' => $tracking->outcome,
                    'follow_up_required' => $tracking->follow_up_required,
                    'follow_up_date' => $tracking->follow_up_date ? $tracking->follow_up_date->format('Y-m-d') : null,
                    'student' => [
                        'id' => $tracking->student?->id ?? null,
                        'name' => ($tracking->student?->first_name ?? '') . ' ' . ($tracking->student?->last_name ?? ''),
                        'section' => $tracking->student?->section?->name ?? 'N/A',
                        'department' => $tracking->student?->section?->program?->department?->name ?? 'N/A',
                        'program' => $tracking->student?->section?->program?->name ?? 'N/A',
                    ],
                    'tracked_by' => $tracking->trackedBy?->name ?? 'Unknown',
                    'tracked_by_id' => $tracking->tracked_by,
                    'notes' => $tracking->notes,
                    'archived' => $tracking->archived,
                    'can_edit' => true,
                ];
            })
            ->filter(fn($tracking) => $tracking['student']['id'] !== null);

        return response()->json([
            'success' => true,
            'tracking' => $tracking,
            'total' => $total,
            'per_page' => $perPage,
            'current_page' => $page,
            'last_page' => ceil($total / $perPage),
        ]);
    }

    public function getDeletedTracking(Request $request)
    {
        $user = auth()->user();
        $departmentIds = $user->getAssignedDepartmentIds();

        $query = \App\Models\StudentTracking::onlyTrashed()
            ->with(['student.section.program.department', 'trackedBy'])
            ->whereHas('student', function($q) use ($user, $departmentIds) {
                if (!$user->hasRole('Super Admin') && !empty($departmentIds)) {
                    $q->where(function($subQ) use ($departmentIds) {
                        $subQ->whereIn('department_id', $departmentIds)
                             ->orWhereHas('section.program', function($progQ) use ($departmentIds) {
                                 $progQ->whereIn('department_id', $departmentIds);
                             });
                    });
                }
            });

        // Apply filters
        if ($request->has('type') && $request->type) {
            $query->where('type', $request->type);
        }
        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }
        if ($request->has('department_id') && $request->department_id) {
            $query->whereHas('student.section.program', function($q) use ($request) {
                $q->where('department_id', $request->department_id);
            });
        }
        if ($request->has('date_from') && $request->date_from) {
            $query->whereDate('date', '>=', $request->date_from);
        }
        if ($request->has('date_to') && $request->date_to) {
            $query->whereDate('date', '<=', $request->date_to);
        }
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->whereHas('student', function($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('student_number', 'like', "%{$search}%");
            });
        }

        // Get total count before pagination
        $total = $query->count();

        // Pagination
        $perPage = (int) $request->get('per_page', 10);
        $page = (int) $request->get('page', 1);
        $offset = max(0, ($page - 1) * $perPage);

        $deletedTracking = $query->orderBy('deleted_at', 'desc')
            ->orderBy('date', 'desc')
            ->orderBy('created_at', 'desc')
            ->skip($offset)
            ->take($perPage)
            ->get()
            ->map(function ($tracking) {
                return [
                    'id' => $tracking->id,
                    'type' => $tracking->type,
                    'date' => $tracking->date->format('Y-m-d'),
                    'time' => $tracking->time ? \Carbon\Carbon::parse($tracking->time)->format('H:i') : null,
                    'status' => $tracking->status,
                    'outcome' => $tracking->outcome,
                    'follow_up_required' => $tracking->follow_up_required,
                    'follow_up_date' => $tracking->follow_up_date ? $tracking->follow_up_date->format('Y-m-d') : null,
                    'student' => [
                        'id' => $tracking->student?->id ?? null,
                        'name' => ($tracking->student?->first_name ?? '') . ' ' . ($tracking->student?->last_name ?? ''),
                        'section' => $tracking->student?->section?->name ?? 'N/A',
                        'department' => $tracking->student?->section?->program?->department?->name ?? 'N/A',
                        'program' => $tracking->student?->section?->program?->name ?? 'N/A',
                    ],
                    'tracked_by' => $tracking->trackedBy?->name ?? 'Unknown',
                    'tracked_by_id' => $tracking->tracked_by,
                    'notes' => $tracking->notes,
                    'deleted_at' => $tracking->deleted_at ? $tracking->deleted_at->format('Y-m-d H:i') : null,
                    'can_edit' => true,
                ];
            })
            ->filter(fn($tracking) => $tracking['student']['id'] !== null);

        return response()->json([
            'success' => true,
            'tracking' => $deletedTracking,
            'total' => $total,
            'per_page' => $perPage,
            'current_page' => $page,
            'last_page' => (int) ceil($total / max(1, $perPage)),
        ]);
    }

    public function attendance()
    {
        // Get student counts by attendance status (Normal, SLIP, PNS) - all departments
        $stats = $this->getStudentStatusCounts();
        
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
            'recentUserActivities' => $this->getRecentUserActivities(),
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
            'weeklyStatusProgress' => $this->getWeeklyStatusProgress(),
        ]);
    }

    /**
     * Get student counts by attendance status (Normal, SLIP, PNS) across all departments
     * 
     * This calculates OVERALL status based on ALL attendance records (not filtered by week or date).
     * Status is determined by:
     * - PNS: 8+ total absences across all time
     * - SLIP: 4-7 total absences OR at least one subject with 4-8 absences
     * - Normal: < 4 total absences
     */
    private function getStudentStatusCounts()
    {
        // Get all students from all departments with necessary relationships
        // Load ALL attendance records (not filtered by date/week) with schedule and subject for accurate OVERALL status calculation
        $students = \App\Models\Student::with([
            'section.program.department',
            'attendanceRecords' => function($query) {
                // IMPORTANT: No date filtering - get ALL attendance records for overall status calculation
                // This ensures we count absences across all time, not just recent weeks
                $query->with(['schedule.subject']);
            }
        ])->get();
        
        $normalCount = 0;
        $slipCount = 0;
        $pnsCount = 0;
        
        foreach ($students as $student) {
            // Ensure absence_count is up to date - counts ALL absences (overall, not by week)
            // This calculates the total absence count across all time, not just recent records
            $student->calculateAbsenceCount();
            
            // Get attendance status - check manual status first, then calculate
            $status = null;
            
            // Check if student has manually set status (Normal, SLIP, PNS)
            if (in_array($student->status, ['Normal', 'SLIP', 'PNS'])) {
                $status = $student->status;
            } else {
                // Calculate from ALL attendance records and absence count (overall status, not weekly)
                // The calculateAttendanceStatus method uses all attendance records to determine:
                // - PNS: 8+ total absences
                // - SLIP: 4-7 absences OR at least one subject with 4-8 absences
                // - Normal: < 4 absences
                $status = $student->calculateAttendanceStatus();
            }
            
            // Debug: Log if status is not one of the expected values
            if (!in_array($status, ['Normal', 'SLIP', 'PNS'])) {
                \Log::warning("Unexpected attendance status for student {$student->id}: {$status}", [
                    'student_id' => $student->id,
                    'status' => $status,
                    'absence_count' => $student->absence_count,
                    'manual_status' => $student->status,
                ]);
                // Default to Normal if status is unexpected
                $status = 'Normal';
            }
            
            // Count by status
            if ($status === 'Normal') {
                $normalCount++;
            } elseif ($status === 'SLIP') {
                $slipCount++;
            } elseif ($status === 'PNS') {
                $pnsCount++;
            }
        }
        
        return [
            'present_count' => $normalCount,  // Normal students
            'late_count' => $slipCount,       // SLIP students
            'absent_count' => $pnsCount,       // PNS students
            'total' => $normalCount + $slipCount + $pnsCount,
        ];
    }

    /**
     * Get real-time attendance stats for polling
     */
    public function getAttendanceLiveData()
    {
        try {
            $stats = $this->getStudentStatusCounts();
            
            return response()->json([
                'attendanceStats' => $stats,
                'timestamp' => now()->toISOString(),
            ]);
        } catch (\Exception $e) {
            \Log::error('Get attendance live data error: ' . $e->getMessage());
            return response()->json([
                'error' => 'Failed to fetch attendance data',
                'attendanceStats' => [
                    'present_count' => 0,
                    'late_count' => 0,
                    'absent_count' => 0,
                    'total' => 0,
                ],
                'timestamp' => now()->toISOString(),
            ], 500);
        }
    }

    public function refreshDashboard()
    {
        return response()->json([
            'departmentTrends' => $this->getDepartmentAttendanceTrends(),
            'systemStats' => $this->getSystemStats(),
            'weeklyStatusProgress' => $this->getWeeklyStatusProgress(),
            'timestamp' => now()->toISOString(),
        ]);
    }

    public function settings()
    {
        // Get students with their sections and programs
        // Explicitly select all fields including absence_count and priority to ensure they're included
        $students = \App\Models\Student::with(['section.program.department', 'department', 'weeklySummaries'])
            ->select('students.*') // Explicitly select all student fields
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->get();

        return Inertia::render('Super/SystemAdmin', [
            'activeTab' => 'settings',
            'users' => \App\Models\User::with('roles')->get(),
            'systemStats' => $this->getSystemStats(),
            'activityLogs' => $this->getRecentActivityLogs(),
            'recentUserActivities' => $this->getRecentUserActivities(),
            'integrations' => $this->getIntegrationStatus(),
            'systemTools' => $this->getSystemToolsData(),
            'auditLogs' => AuditLog::with('user')->orderBy('created_at', 'desc')->limit(50)->get(),
            'students' => $students,
            'departments' => \App\Models\Department::orderBy('name')->get(['id', 'name']),
            'programs' => \App\Models\Program::with('department')->orderBy('name')->get(['id', 'name', 'department_id']),
            'sections' => \App\Models\Section::with(['program.department'])->orderBy('name')->get(['id', 'name', 'program_id']),
        ]);
    }

    public function teachers()
    {
        $teachers = \App\Models\Teacher::with(['department', 'optionalDepartment'])
            ->orderBy('name')
            ->get()
            ->map(function ($teacher) {
                return [
                    'id' => $teacher->id,
                    'name' => $teacher->name,
                    'email' => $teacher->email,
                    'department_id' => $teacher->department_id,
                    'optional_department_id' => $teacher->optional_department_id,
                    'department' => $teacher->department ? [
                        'id' => $teacher->department->id,
                        'name' => $teacher->department->name,
                    ] : null,
                    'optional_department' => $teacher->optionalDepartment ? [
                        'id' => $teacher->optionalDepartment->id,
                        'name' => $teacher->optionalDepartment->name,
                    ] : null,
                ];
            });

        return Inertia::render('Super/SystemAdmin', [
            'activeTab' => 'teachers',
            'users' => \App\Models\User::with('roles')->get(),
            'systemStats' => $this->getSystemStats(),
            'activityLogs' => $this->getRecentActivityLogs(),
            'recentUserActivities' => $this->getRecentUserActivities(),
            'integrations' => $this->getIntegrationStatus(),
            'systemTools' => $this->getSystemToolsData(),
            'auditLogs' => AuditLog::with('user')->orderBy('created_at', 'desc')->limit(50)->get(),
            'teachers' => $teachers,
            'departments' => \App\Models\Department::orderBy('name')->get(['id', 'name']),
        ]);
    }

    // Teacher/Adviser Management Methods
    public function storeTeacher(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:teachers,email',
            'department_id' => 'required|exists:departments,id',
            'optional_department_id' => 'nullable|exists:departments,id|different:department_id',
        ]);

        try {
            $teacher = \App\Models\Teacher::create([
                'name' => $request->name,
                'email' => $request->email,
                'department_id' => $request->department_id,
                'optional_department_id' => $request->optional_department_id,
            ]);

            return back()->with('success', 'Teacher/Adviser created successfully');

        } catch (\Exception $e) {
            return back()->withErrors(['message' => 'Failed to create teacher: ' . $e->getMessage()]);
        }
    }

    public function updateTeacher(Request $request, $id)
    {
        try {
            $teacher = \App\Models\Teacher::findOrFail($id);

            $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|email|unique:teachers,email,' . $id,
                'department_id' => 'required|exists:departments,id',
                'optional_department_id' => 'nullable|exists:departments,id|different:department_id',
            ]);

            $teacher->update([
                'name' => $request->name,
                'email' => $request->email,
                'department_id' => $request->department_id,
                'optional_department_id' => $request->optional_department_id,
            ]);

            return back()->with('success', 'Teacher/Adviser updated successfully');

        } catch (\Illuminate\Validation\ValidationException $e) {
            return back()->withErrors($e->errors());
        } catch (\Exception $e) {
            return back()->withErrors(['message' => 'Failed to update teacher: ' . $e->getMessage()]);
        }
    }

    public function destroyTeacher($id)
    {
        try {
            $teacher = \App\Models\Teacher::findOrFail($id);
            $teacher->delete();

            return back()->with('success', 'Teacher/Adviser deleted successfully');

        } catch (\Exception $e) {
            return back()->withErrors(['message' => 'Failed to delete teacher: ' . $e->getMessage()]);
        }
    }

    // CSDL Management Methods
    public function storeCSDLUser(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
            'department_id' => 'nullable|exists:departments,id',
            'program_id' => 'nullable|exists:programs,id',
        ]);

        try {
            // Create the user
            $user = \App\Models\User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => \Hash::make($request->password),
                'department_id' => $request->department_id,
                'program_id' => $request->program_id,
                'password_changed_at' => null, // Force password change on first login
            ]);

            // Assign CSDL role
            $user->assignRole('CSDL');

            // Notify newly created user via email (do not block creation if mail fails)
            try {
                $user->load(['department', 'optionalDepartment', 'program']);
                $creator = auth()->user();
                $creatorRole = $creator?->roles?->first()?->name;
                $user->notify(new AccountCreatedNotification(
                    $request->password,
                    'CSDL',
                    $user->department?->name,
                    $user->optionalDepartment?->name,
                    $user->program?->name,
                    $creator?->name,
                    $creator?->email,
                    $creatorRole
                ));
            } catch (\Throwable $e) {
                \Log::warning('AccountCreatedNotification failed to send (CSDL user)', [
                    'user_id' => $user->id,
                    'email' => $user->email,
                    'error' => $e->getMessage(),
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'CSDL created successfully',
                'csdl_user' => $user->load(['department', 'program'])
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create CSDL: ' . $e->getMessage()
            ], 500);
        }
    }

    public function updateCSDLUser(Request $request, $id)
    {
        try {
            \Log::info('Update CSDL request', [
                'id' => $id,
                'data' => $request->all(),
                'department_id' => $request->department_id,
                'program_id' => $request->program_id,
            ]);

            $role = \Spatie\Permission\Models\Role::where('name', 'CSDL')->first();
            if (!$role) {
                return response()->json([
                    'success' => false,
                    'message' => 'CSDL role does not exist. Please run the database seeder.'
                ], 404);
            }
            $csdlUser = \App\Models\User::role('CSDL')->findOrFail($id);

            $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|email|unique:users,email,' . $id,
                'password' => 'nullable|string|min:8',
                'department_id' => 'nullable|integer|exists:departments,id',
                'program_id' => 'nullable|integer|exists:programs,id',
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

            $csdlUser->update($updateData);

            \Log::info('CSDL updated successfully', ['csdl_user_id' => $csdlUser->id]);

            return response()->json([
                'success' => true,
                'message' => 'CSDL updated successfully',
                'csdl_user' => $csdlUser->load(['department', 'program'])
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::error('Validation error updating CSDL', [
                'id' => $id,
                'errors' => $e->errors()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Error updating CSDL', [
                'id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to update CSDL: ' . $e->getMessage()
            ], 500);
        }
    }

    public function destroyCSDLUser($id)
    {
        try {
            $role = \Spatie\Permission\Models\Role::where('name', 'CSDL')->first();
            if (!$role) {
                return response()->json([
                    'success' => false,
                    'message' => 'CSDL role does not exist. Please run the database seeder.'
                ], 404);
            }
            $csdlUser = \App\Models\User::role('CSDL')->findOrFail($id);
            
            // Delete the CSDL
            $csdlUser->delete();

            return response()->json([
                'success' => true,
                'message' => 'CSDL deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete CSDL: ' . $e->getMessage()
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

            // Verify that the program belongs to the selected department
            $program = \App\Models\Program::findOrFail($validated['program_id']);
            if ($program->department_id != $validated['department_id']) {
                return response()->json([
                    'success' => false,
                    'message' => 'The selected program does not belong to the selected department.'
                ], 422);
            }

            $section->update($validated);
            $section->load(['program.department', 'adviser']);

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
        $sections = \App\Models\Section::with(['program.department', 'adviser', 'teachers'])
            ->orderBy('program_id')
            ->orderBy('year_level')
            ->orderBy('name')
            ->get()
            ->map(function ($section) {
                // Handle sections created with old string-based approach
                if (!$section->program && !$section->program_id && !empty($section->getAttributes()['program'])) {
                    // Try to find program by code or name
                    $program = \App\Models\Program::with('department')
                        ->where('code', $section->program)
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
                                'id' => null,
                                'name' => $section->department ?? 'Unknown Department'
                            ]
                        ]);
                    }
                } elseif (!$section->program && $section->program_id) {
                    // Ensure we have program data even if relationship is missing
                    $program = \App\Models\Program::with('department')->find($section->program_id);
                    if ($program) {
                        $section->setRelation('program', $program);
                    }
                } elseif ($section->program && !$section->program->relationLoaded('department')) {
                    // Ensure department is loaded if program exists but department isn't loaded
                    $section->program->load('department');
                }
                
                // Ensure we return the section with all relationships properly loaded
                if ($section->program && !$section->program->relationLoaded('department')) {
                    $section->program->load('department');
                }
                
                return $section;
            });

        return Inertia::render('Super/SystemAdmin', [
            'activeTab' => 'sections',
            'users' => \App\Models\User::with('roles')->get(),
            'systemStats' => $this->getSystemStats(),
            'activityLogs' => $this->getRecentActivityLogs(),
            'recentUserActivities' => $this->getRecentUserActivities(),
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
        
        // Get CSDL count
        try {
            $totalCSDLUsers = \App\Models\User::role('CSDL')->count();
        } catch (\Exception $e) {
            $totalCSDLUsers = 0;
        }
        
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
            'totalCSDLUsers' => $totalCSDLUsers,
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
            if (!$databaseName) {
                return 'Unknown';
            }
            // Use a simpler query that's faster and won't hang
            // Limit to prevent hanging on large databases
            $result = \DB::select("SELECT ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'size_mb' FROM information_schema.tables WHERE table_schema = ? LIMIT 1", [$databaseName]);
            return isset($result[0]->size_mb) ? $result[0]->size_mb . 'MB' : 'Unknown';
        } catch (\Exception $e) {
            \Log::warning('Could not get database size: ' . $e->getMessage());
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

    private function getRecentUserActivities()
    {
        try {
            $activities = [];
            
            // Get activities from AuditLog (CSDL and Admin actions)
            $auditLogs = AuditLog::whereNotNull('user_email')
                ->whereIn('event_category', [
                    AuditLog::CATEGORY_AUTHENTICATION,
                    AuditLog::CATEGORY_USER_MANAGEMENT,
                    AuditLog::CATEGORY_DATA_MANAGEMENT,
                    AuditLog::CATEGORY_ATTENDANCE,
                    AuditLog::CATEGORY_SYSTEM_ADMIN,
                ])
                ->orderBy('created_at', 'desc')
                ->limit(30)
                ->get();
            
            foreach ($auditLogs as $log) {
                $user = \App\Models\User::with('roles')->where('email', $log->user_email)->first();
                $userRole = $user && $user->roles ? $user->roles->pluck('name')->first() : 'Unknown';
                
                // Only include CSDL and Admin users
                if (in_array($userRole, ['CSDL', 'Admin', 'Super Admin'])) {
                    $activities[] = [
                        'id' => 'audit_' . $log->id,
                        'event_type' => $log->event_type,
                        'event_category' => $log->event_category,
                        'description' => $log->description ?: $this->formatAuditLogDescription($log),
                        'user_name' => $log->user_name ?: ($user ? $user->name : 'Unknown'),
                        'user_email' => $log->user_email,
                        'user_role' => $userRole,
                        'status' => $log->status,
                        'severity' => $log->severity,
                        'timestamp' => $log->created_at->format('Y-m-d H:i:s'),
                        'date' => $log->created_at->format('M d, Y'),
                        'time' => $log->created_at->format('h:i A'),
                        'time_ago' => $log->created_at->diffForHumans(),
                        'created_at' => $log->created_at->toIso8601String(),
                    ];
                }
            }
            
            // Get Student Tracking activities (CSDL user activities)
            $trackingActivities = \App\Models\StudentTracking::with(['trackedBy.roles', 'student'])
                ->whereNotNull('tracked_by')
                ->orderBy('created_at', 'desc')
                ->limit(30)
                ->get();
            
            foreach ($trackingActivities as $tracking) {
                $user = $tracking->trackedBy;
                if ($user) {
                    $userRole = $user->roles ? $user->roles->pluck('name')->first() : 'Unknown';
                    
                    // Only include CSDL and Admin users
                    if (in_array($userRole, ['CSDL', 'Admin', 'Super Admin'])) {
                        $studentName = $tracking->student ? $tracking->student->first_name . ' ' . $tracking->student->last_name : 'Unknown Student';
                        $activityType = $tracking->type === 'call' ? 'Made a call' : 'Conducted home visit';
                        $description = "{$activityType} for student {$studentName}";
                        if ($tracking->notes) {
                            $description .= " - " . \Illuminate\Support\Str::limit($tracking->notes, 50);
                        }
                        
                        $activities[] = [
                            'id' => 'tracking_' . $tracking->id,
                            'event_type' => 'student_tracking',
                            'event_category' => 'data_management',
                            'description' => $description,
                            'user_name' => $user->name,
                            'user_email' => $user->email,
                            'user_role' => $userRole,
                            'status' => 'success',
                            'severity' => 'info',
                            'timestamp' => $tracking->created_at->format('Y-m-d H:i:s'),
                            'date' => $tracking->created_at->format('M d, Y'),
                            'time' => $tracking->created_at->format('h:i A'),
                            'time_ago' => $tracking->created_at->diffForHumans(),
                            'created_at' => $tracking->created_at->toIso8601String(),
                        ];
                    }
                }
            }
            
            // Get Attendance Record activities (Admin activities)
            $attendanceActivities = \App\Models\AttendanceRecord::with(['student', 'recordedBy.roles'])
                ->whereNotNull('recorded_by')
                ->orderBy('created_at', 'desc')
                ->limit(30)
                ->get();
            
            foreach ($attendanceActivities as $attendance) {
                $user = $attendance->recordedBy;
                if ($user) {
                    $userRole = $user->roles ? $user->roles->pluck('name')->first() : 'Unknown';
                    
                    // Only include CSDL and Admin users
                    if (in_array($userRole, ['CSDL', 'Admin', 'Super Admin'])) {
                        $studentName = $attendance->student ? $attendance->student->first_name . ' ' . $attendance->student->last_name : 'Unknown Student';
                        $description = "Recorded attendance for {$studentName} - Status: " . ucfirst($attendance->status);
                        
                        $activities[] = [
                            'id' => 'attendance_' . $attendance->id,
                            'event_type' => 'attendance_record',
                            'event_category' => 'attendance',
                            'description' => $description,
                            'user_name' => $user->name,
                            'user_email' => $user->email,
                            'user_role' => $userRole,
                            'status' => 'success',
                            'severity' => 'info',
                            'timestamp' => $attendance->created_at->format('Y-m-d H:i:s'),
                            'date' => $attendance->created_at->format('M d, Y'),
                            'time' => $attendance->created_at->format('h:i A'),
                            'time_ago' => $attendance->created_at->diffForHumans(),
                            'created_at' => $attendance->created_at->toIso8601String(),
                        ];
                    }
                }
            }
            
            // Sort all activities by timestamp (most recent first)
            usort($activities, function($a, $b) {
                return strtotime($b['timestamp']) - strtotime($a['timestamp']);
            });
            
            // Return the 50 most recent activities
            return array_slice($activities, 0, 50);
            
        } catch (\Exception $e) {
            \Log::error('Error getting recent user activities: ' . $e->getMessage());
            return [];
        }
    }
    
    private function formatAuditLogDescription($log)
    {
        $category = ucfirst(str_replace('_', ' ', $log->event_category));
        $type = ucfirst(str_replace('_', ' ', $log->event_type));
        return "{$category}: {$type}";
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
                ->whereHas('student')
                ->orderBy('created_at', 'desc')
                ->limit(3)
                ->get();

            foreach ($recentAttendance as $record) {
                if ($record->student) {
                    $logs[] = [
                        'id' => 'attendance_' . $record->id,
                        'type' => 'info',
                        'message' => 'Attendance recorded: ' . ($record->student?->first_name ?? 'Unknown') . ' - ' . $record->status,
                        'user' => 'system',
                        'timestamp' => $record->created_at->format('Y-m-d H:i:s'),
                    ];
                }
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
                    // Get all students in this department
                    $departmentStudents = \App\Models\Student::whereHas('section.program', function($query) use ($department) {
                        $query->where('department_id', $department->id);
                    })->get();
                    
                    // Calculate status distribution for department
                    $deptStatusCounts = $this->calculateStudentStatusDistribution($departmentStudents);
                    
                    $programs = $department->programs->map(function($program) use ($filters) {
                        $sections = $program->sections;
                        $totalStudents = $sections->sum(function($section) {
                            return $section->students->count();
                        });

                        // Get all students in this program
                        $programStudents = \App\Models\Student::whereHas('section', function($query) use ($program) {
                            $query->where('program_id', $program->id);
                        })->get();
                        
                        // Calculate status distribution for program
                        $programStatusCounts = $this->calculateStudentStatusDistribution($programStudents);

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
                            // Status distribution
                            'normal_count' => $programStatusCounts['normal'],
                            'slip_count' => $programStatusCounts['slip'],
                            'pns_count' => $programStatusCounts['pns'],
                            'normal_percentage' => $programStatusCounts['normal_percentage'],
                            'slip_percentage' => $programStatusCounts['slip_percentage'],
                            'pns_percentage' => $programStatusCounts['pns_percentage'],
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
                        // Status distribution
                        'normal_count' => $deptStatusCounts['normal'],
                        'slip_count' => $deptStatusCounts['slip'],
                        'pns_count' => $deptStatusCounts['pns'],
                        'normal_percentage' => $deptStatusCounts['normal_percentage'],
                        'slip_percentage' => $deptStatusCounts['slip_percentage'],
                        'pns_percentage' => $deptStatusCounts['pns_percentage'],
                        'total_students' => $departmentStudents->count(),
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
    
    /**
     * Calculate student status distribution (Normal, SLIP, PNS)
     */
    private function calculateStudentStatusDistribution($students)
    {
        $normalCount = 0;
        $slipCount = 0;
        $pnsCount = 0;
        $totalStudents = $students->count();
        
        foreach ($students as $student) {
            // Load full student with relationships
            $fullStudent = \App\Models\Student::with(['attendanceRecords.schedule.subject'])->find($student->id);
            
            if (!$fullStudent) {
                continue;
            }
            
            // Check if student has manually set status
            $manualStatus = $fullStudent->status;
            $status = null;
            
            if (in_array($manualStatus, ['Normal', 'SLIP', 'PNS'])) {
                $status = $manualStatus;
            } else {
                // Calculate status based on attendance records
                $absenceCount = $fullStudent->absence_count ?? 0;
                
                // If absence_count is 0, calculate it
                if ($absenceCount === 0) {
                    $absenceCount = \App\Models\AttendanceRecord::where('student_id', $fullStudent->id)
                        ->where('status', 'absent')
                        ->count();
                }
                
                // PNS: >= 8 total absences
                if ($absenceCount >= 8) {
                    $status = 'PNS';
                } else {
                    // Check for SLIP: at least one subject has 4-8 absences
                    $attendanceRecords = \App\Models\AttendanceRecord::where('student_id', $fullStudent->id)
                        ->where('status', 'absent')
                        ->with('schedule.subject')
                        ->get();
                    
                    $absencesPerSubject = [];
                    foreach ($attendanceRecords as $record) {
                        if ($record->schedule && $record->schedule->subject) {
                            $subjectId = $record->schedule->subject_id;
                            if (!isset($absencesPerSubject[$subjectId])) {
                                $absencesPerSubject[$subjectId] = 0;
                            }
                            $absencesPerSubject[$subjectId]++;
                        }
                    }
                    
                    // Check if any subject has 4-8 absences (SLIP condition)
                    $hasSlip = false;
                    foreach ($absencesPerSubject as $subjectId => $subjectAbsenceCount) {
                        if ($subjectAbsenceCount >= 4 && $subjectAbsenceCount < 9) {
                            $hasSlip = true;
                            break;
                        }
                    }
                    
                    if ($hasSlip) {
                        $status = 'SLIP';
                    } else {
                        $status = 'Normal';
                    }
                }
            }
            
            // Count by status
            if ($status === 'PNS') {
                $pnsCount++;
            } elseif ($status === 'SLIP') {
                $slipCount++;
            } else {
                $normalCount++;
            }
        }
        
        // Calculate percentages
        $normalPercentage = $totalStudents > 0 ? round(($normalCount / $totalStudents) * 100, 1) : 0;
        $slipPercentage = $totalStudents > 0 ? round(($slipCount / $totalStudents) * 100, 1) : 0;
        $pnsPercentage = $totalStudents > 0 ? round(($pnsCount / $totalStudents) * 100, 1) : 0;
        
        return [
            'normal' => $normalCount,
            'slip' => $slipCount,
            'pns' => $pnsCount,
            'normal_percentage' => $normalPercentage,
            'slip_percentage' => $slipPercentage,
            'pns_percentage' => $pnsPercentage,
            'total' => $totalStudents,
        ];
    }

    // Faculty Attendance Compliance Tracker for Super Admin
    public function facultyCompliance(Request $request)
    {
        $filters = [
            'date_range' => $request->get('date_range') ?: [now()->subDays(30)->format('Y-m-d'), now()->format('Y-m-d')],
            'department_id' => $request->get('department_id'),
        ];

        try {
            // Check if CSDL role exists
            $role = \Spatie\Permission\Models\Role::where('name', 'CSDL')->first();
            if (!$role) {
                return response()->json([
                    'csdl_users' => [],
                    'filters' => $filters,
                    'summary' => [
                        'total_csdl_users' => 0,
                        'average_activity' => 0,
                        'active_csdl_users' => 0,
                    ],
                ]);
            }
            
            // Get all CSDL and their tracking activity
            $csdlUsers = \App\Models\User::role('CSDL')
                ->with(['department', 'program'])
                ->get()
                ->map(function($csdlUser) use ($filters) {
                    $startDate = \Carbon\Carbon::parse($filters['date_range'][0]);
                    $endDate = \Carbon\Carbon::parse($filters['date_range'][1]);
                    
                    // Count tracking records by this CSDL
                    $calls = \App\Models\StudentTracking::where('tracked_by', $csdlUser->id)
                        ->where('type', 'call')
                        ->whereBetween('date', $filters['date_range'])
                        ->count();
                    
                    $visits = \App\Models\StudentTracking::where('tracked_by', $csdlUser->id)
                        ->where('type', 'home_visit')
                        ->whereBetween('date', $filters['date_range'])
                        ->count();
                    
                    $totalTracking = $calls + $visits;
                    
                    // Get students needing attention in their department/program
                    $studentsNeedingAttention = \App\Models\Student::whereIn('priority', ['Call Needed', 'PNS'])
                        ->when($csdlUser->department_id, function($query) use ($csdlUser) {
                            return $query->whereHas('section.program', function($q) use ($csdlUser) {
                                $q->where('department_id', $csdlUser->department_id);
                            });
                        })
                        ->when($csdlUser->program_id, function($query) use ($csdlUser) {
                            return $query->whereHas('section', function($q) use ($csdlUser) {
                                $q->where('program_id', $csdlUser->program_id);
                            });
                        })
                        ->count();
                    
                    $activityRate = $studentsNeedingAttention > 0 
                        ? round(($totalTracking / max($studentsNeedingAttention, 1)) * 100, 2) 
                        : 0;
                    
                    return [
                        'id' => $csdlUser->id,
                        'name' => $csdlUser->name,
                        'email' => $csdlUser->email,
                        'calls' => $calls,
                        'visits' => $visits,
                        'total_tracking' => $totalTracking,
                        'students_needing_attention' => $studentsNeedingAttention,
                        'activity_rate' => $activityRate,
                        'status' => $this->getCSDLActivityStatus($activityRate),
                        'department' => $csdlUser->department?->name ?? 'N/A',
                    ];
                });

            return response()->json([
                'csdl_users' => $csdlUsers,
                'filters' => $filters,
                'summary' => [
                    'total_csdl_users' => $csdlUsers->count(),
                    'average_activity' => $csdlUsers->avg('activity_rate'),
                    'active_csdl_users' => $csdlUsers->where('activity_rate', '>=', 50)->count(),
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
        $role = \Spatie\Permission\Models\Role::where('name', 'CSDL')->first();
        if (!$role) {
            return [];
        }
        $csdlUsers = \App\Models\User::role('CSDL')->get();
        $activity = [];
        
        foreach ($csdlUsers as $csdlUser) {
            // Count tracking records by this CSDL user in the last 30 days
            $trackingRecords = \App\Models\StudentTracking::where('tracked_by', $csdlUser->id)
                ->where('created_at', '>=', now()->subDays(30))
                ->count();
            
            // Get students needing attention
            $studentsNeedingAttention = \App\Models\Student::whereIn('priority', ['Call Needed', 'PNS'])
                ->when($csdlUser->department_id, function($query) use ($csdlUser) {
                    return $query->whereHas('section.program', function($q) use ($csdlUser) {
                        $q->where('department_id', $csdlUser->department_id);
                    });
                })
                ->count();
            
            // Calculate activity rate
            $activityRate = $studentsNeedingAttention > 0 
                ? round(($trackingRecords / max($studentsNeedingAttention, 1)) * 100, 1) 
                : 0;
            
            $activity[] = [
                'csdl_user' => $csdlUser->name,
                'activity_rate' => $activityRate,
                'tracking_records' => $trackingRecords,
                'students_needing_attention' => $studentsNeedingAttention,
            ];
        }
        
        // Sort by activity rate descending
        usort($activity, function($a, $b) {
            return $b['activity_rate'] <=> $a['activity_rate'];
        });
        
        return $activity;
    }

    private function getCSDLActivityStatus($activityRate)
    {
        if ($activityRate >= 80) {
            return 'excellent';
        } elseif ($activityRate >= 50) {
            return 'good';
        } elseif ($activityRate >= 25) {
            return 'fair';
        } else {
            return 'needs_improvement';
        }
    }

    private function getWeeklyStatusProgress()
    {
        try {
            $today = \Carbon\CarbonImmutable::today();
            // Use Monday as start of week to match WeeklySummary generation
            $weeks = collect(range(0, 7))->map(fn($i) => $today->startOfWeek(\Carbon\CarbonImmutable::MONDAY)->subWeeks($i))->reverse()->values();
            
            // Get all students (we need to calculate status per week)
            $allStudents = \App\Models\Student::select('id')->get();
            $totalStudents = $allStudents->count();
            
            $weeklyStatusData = [];
            
            foreach ($weeks as $weekStart) {
                $weekEnd = $weekStart->endOfWeek(\Carbon\CarbonImmutable::SUNDAY);
                $rangeStart = $weekStart->toDateString();
                $rangeEnd = $weekEnd->toDateString();
                
                // Calculate status for each student up to this week (real-time)
                $normalCount = 0;
                $pnsCount = 0;
                $slipCount = 0;
                
                foreach ($allStudents as $student) {
                    // Load the student with necessary data
                    $fullStudent = \App\Models\Student::find($student->id);
                    
                    if (!$fullStudent) {
                        continue;
                    }
                    
                    // Calculate absence count up to the end of this week
                    $absenceCount = \App\Models\AttendanceRecord::where('student_id', $fullStudent->id)
                        ->where('status', 'absent')
                        ->whereDate('date', '<=', $rangeEnd)
                        ->count();
                    
                    // Check if student has manually set status (Normal, SLIP, PNS) in database
                    // If status is manually set, use it (but only if it's a valid attendance status)
                    $manualStatus = $fullStudent->status;
                    $status = null;
                    
                    if (in_array($manualStatus, ['Normal', 'SLIP', 'PNS'])) {
                        // Use manually set status
                        $status = $manualStatus;
                    } else {
                        // Calculate status based on attendance records up to this week
                        // PNS: >= 8 total absences
                        if ($absenceCount >= 8) {
                            $status = 'PNS';
                        } else {
                            // Check for SLIP: at least one subject has 4-8 absences (up to this week)
                            $weekAttendanceRecords = \App\Models\AttendanceRecord::where('student_id', $fullStudent->id)
                                ->whereDate('date', '<=', $rangeEnd)
                                ->where('status', 'absent')
                                ->with('schedule.subject')
                                ->get();
                            
                            // Group absences by subject
                            $absencesPerSubject = [];
                            foreach ($weekAttendanceRecords as $record) {
                                if ($record->schedule && $record->schedule->subject) {
                                    $subjectId = $record->schedule->subject_id;
                                    if (!isset($absencesPerSubject[$subjectId])) {
                                        $absencesPerSubject[$subjectId] = 0;
                                    }
                                    $absencesPerSubject[$subjectId]++;
                                }
                            }
                            
                            // Check if any subject has 4-8 absences (SLIP condition)
                            $hasSlip = false;
                            foreach ($absencesPerSubject as $subjectId => $subjectAbsenceCount) {
                                if ($subjectAbsenceCount >= 4 && $subjectAbsenceCount < 9) {
                                    $hasSlip = true;
                                    break;
                                }
                            }
                            
                            if ($hasSlip) {
                                $status = 'SLIP';
                            } else {
                                $status = 'Normal';
                            }
                        }
                    }
                    
                    // Ensure status is set (default to Normal if somehow still null)
                    if (!$status) {
                        $status = 'Normal';
                    }
                    
                    // Count by status
                    if ($status === 'PNS') {
                        $pnsCount++;
                    } elseif ($status === 'SLIP') {
                        $slipCount++;
                    } else {
                        $normalCount++;
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
        } catch (\Exception $e) {
            \Log::error('Error in getWeeklyStatusProgress: ' . $e->getMessage());
            \Log::error($e->getTraceAsString());
            
            // Return empty data structure on error
            $today = \Carbon\CarbonImmutable::today();
            $weeks = collect(range(0, 7))->map(fn($i) => $today->startOfWeek(\Carbon\CarbonImmutable::MONDAY)->subWeeks($i))->reverse()->values();
            
            return $weeks->map(function($weekStart) {
                $weekEnd = $weekStart->endOfWeek(\Carbon\CarbonImmutable::SUNDAY);
                return [
                    'week_start' => $weekStart->toDateString(),
                    'week_end' => $weekEnd->toDateString(),
                    'date_label' => $weekStart->format('M d') . ' - ' . $weekEnd->format('M d, Y'),
                    'week_label' => $weekStart->format('M d'),
                    'normal_percentage' => 0,
                    'pns_percentage' => 0,
                    'slip_percentage' => 0,
                    'normal_count' => 0,
                    'pns_count' => 0,
                    'slip_count' => 0,
                    'total_students' => 0,
                ];
            })->toArray();
        }
    }

    // Student Management Methods
    public function storeStudent(Request $request)
    {
        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'student_number' => 'required|string|regex:/^[0-9-]+$/|unique:students,student_number',
            'email' => 'required|email|unique:students,email',
            'phone' => 'nullable|digits:11',
            'department_id' => 'nullable|exists:departments,id',
            'program_id' => 'nullable|exists:programs,id',
            'section_id' => 'nullable|exists:sections,id',
            'teacher_id' => 'nullable|exists:users,id',
            'year_level' => 'nullable|string',
            'gender' => 'nullable|string',
            'birth_date' => 'nullable|date',
            'guardian_name' => 'nullable|string|max:255',
            'guardian_contact' => 'nullable|digits:11',
        ]);

        $student = \App\Models\Student::create([
            'first_name' => $validated['first_name'],
            'last_name' => $validated['last_name'],
            'student_number' => $validated['student_number'],
            'student_id' => $validated['student_number'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'department_id' => $validated['department_id'] ?? null,
            'program_id' => $validated['program_id'] ?? null,
            'section_id' => $validated['section_id'] ?? null,
            'year_level' => $validated['year_level'] ?? null,
            'gender' => $validated['gender'] ?? null,
            'birth_date' => $validated['birth_date'] ?? null,
            'guardian_name' => $validated['guardian_name'] ?? null,
            'guardian_contact' => $validated['guardian_contact'] ?? null,
            'status' => 'Active',
        ]);

        // Assign teacher to student if provided
        if (!empty($validated['teacher_id'])) {
            // The teacher_id is actually a User ID (from getDepartmentTeachers)
            $user = \App\Models\User::find($validated['teacher_id']);
            if ($user) {
                // Verify user belongs to the selected department
                if ($user->department_id == $validated['department_id']) {
                    // Attach teacher to student via student_teachers pivot table
                    $student->teachers()->syncWithoutDetaching([$validated['teacher_id']]);
                }
            }
        }

        $student->updatePriority();

        return redirect()->route('super.settings', ['#students'])->with('success', 'Student created successfully!');
    }

    public function getDepartmentTeachers($departmentId)
    {
        try {
            // Get all teachers that belong to this department (primary or optional)
            $teachers = \App\Models\Teacher::where(function($query) use ($departmentId) {
                    $query->where('department_id', $departmentId)
                          ->orWhere('optional_department_id', $departmentId);
                })
                ->orderBy('name')
                ->get()
                ->map(function ($teacher) {
                    // Find or create corresponding User by email (for student_teachers pivot table)
                    $user = \App\Models\User::firstOrCreate(
                        ['email' => $teacher->email],
                        [
                            'name' => $teacher->name,
                            'password' => \Hash::make('password'), // Default password, should be changed
                            'department_id' => $teacher->department_id,
                        ]
                    );
                    
                    // Assign Teacher role if not already assigned
                    if (!$user->hasRole('Teacher')) {
                        $teacherRole = \Spatie\Permission\Models\Role::firstOrCreate(['name' => 'Teacher']);
                        $user->assignRole($teacherRole);
                    }
                    
                    return [
                        'id' => $user->id,
                        'name' => $teacher->name,
                        'email' => $teacher->email,
                    ];
                });
            
            return response()->json([
                'success' => true,
                'teachers' => $teachers,
            ]);
        } catch (\Exception $e) {
            \Log::error('Failed to fetch department teachers: ' . $e->getMessage(), [
                'department_id' => $departmentId,
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch teachers: ' . $e->getMessage(),
                'teachers' => [],
            ], 500);
        }
    }

    public function updateStudent(Request $request, $id)
    {
        try {
            $student = \App\Models\Student::findOrFail($id);

            $validated = $request->validate([
                'first_name' => 'nullable|string|max:255',
                'last_name' => 'nullable|string|max:255',
                'email' => 'nullable|email|unique:students,email,' . $student->id,
                'phone' => 'nullable|string|max:11|regex:/^[0-9]*$/',
                'guardian_name' => 'nullable|string|max:255',
                'guardian_contact' => 'nullable|string|max:11|regex:/^[0-9]*$/',
                'year_level' => 'nullable|string',
                'status' => 'nullable|string|in:Normal,SLIP,PNS', // Attendance status
                'absence_count' => 'nullable|integer|min:0',
                'tracking_status' => 'nullable|string|in:pending,processing,to_follow',
            ]);

            // Only update fields that are provided
            if (isset($validated['first_name'])) {
                $student->first_name = $validated['first_name'];
            }
            if (isset($validated['last_name'])) {
                $student->last_name = $validated['last_name'];
            }
            if (isset($validated['email'])) {
                $student->email = $validated['email'];
            }
            if (isset($validated['phone'])) {
                $student->phone = !empty($validated['phone']) ? $validated['phone'] : null;
            }
            if (isset($validated['guardian_name'])) {
                $student->guardian_name = !empty($validated['guardian_name']) ? $validated['guardian_name'] : null;
            }
            if (isset($validated['guardian_contact'])) {
                $student->guardian_contact = !empty($validated['guardian_contact']) ? $validated['guardian_contact'] : null;
            }
            if (isset($validated['year_level'])) {
                $student->year_level = !empty($validated['year_level']) ? $validated['year_level'] : null;
            }
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
            
            // Save the student with all updates
            if (!$student->save()) {
                throw new \Exception('Failed to save student to database');
            }
            
            // Refresh the model to ensure we have the latest data from database
            $student->refresh();
            
            // Update tracking status if provided
            if (isset($validated['tracking_status'])) {
                $lastTracking = $student->studentTracking()
                    ->whereNull('archived_at')
                    ->whereNull('deleted_at')
                    ->latest()
                    ->first();
                
                if ($lastTracking) {
                    $lastTracking->status = $validated['tracking_status'];
                    $lastTracking->save();
                } else {
                    // Create a new tracking record if none exists
                    \App\Models\StudentTracking::create([
                        'student_id' => $student->id,
                        'tracked_by' => auth()->id(),
                        'type' => 'call',
                        'date' => now()->toDateString(),
                        'status' => $validated['tracking_status'],
                        'notes' => 'Status updated from student edit form',
                    ]);
                }
            }

            // Return success response - stay on current page
            return back()->with('success', 'Student updated successfully.');
        } catch (\Illuminate\Validation\ValidationException $e) {
            return back()->withErrors($e->errors())->withInput();
        } catch (\Exception $e) {
            \Log::error('Error updating student: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            return back()->with('error', 'Failed to update student: ' . $e->getMessage());
        }
    }

    public function sendStudentToCSDL(Request $request, $id)
    {
        $validated = $request->validate([
            'type' => 'nullable|in:home_visit',
            'csdl_user_id' => 'nullable|exists:users,id',
            'notes' => 'nullable|string',
        ]);

        $student = \App\Models\Student::findOrFail($id);

        // CSDL only handles home visits - always set to home_visit
        $type = 'home_visit';

        // Get CSDL - if not specified, use the first available CSDL
        $csdlUserId = $validated['csdl_user_id'] ?? \App\Models\User::role('CSDL')->first()?->id;

        if (!$csdlUserId) {
            return redirect()->back()->with('error', 'No CSDL available to assign this task.');
        }

        // Create tracking record
        \App\Models\StudentTracking::create([
            'student_id' => $student->id,
            'tracked_by' => $csdlUserId,
            'type' => $type,
            'date' => now()->toDateString(),
            'status' => 'pending',
            'notes' => $validated['notes'] ?? "Assigned by " . auth()->user()->name,
        ]);

        // Update student priority to PNS for home visits
        $student->priority = 'PNS';
        $student->save();
        $student->refresh();

        return redirect()->back()->with('success', "Student sent to CSDL for home visit.");
    }

    public function destroyStudent($id)
    {
        $student = \App\Models\Student::findOrFail($id);
        $student->delete(); // Soft delete
        
        // Return redirect back with success message for Inertia
        return back()->with('success', 'Student deleted successfully.');
    }

    public function getDeletedStudents()
    {
        $deletedStudents = \App\Models\Student::onlyTrashed()
            ->with(['section.program.department', 'department', 'program', 'studentTracking' => function($query) {
                $query->where('archived', false)
                    ->orderBy('date', 'desc')
                    ->orderBy('created_at', 'desc')
                    ->limit(1);
            }])
            ->orderBy('deleted_at', 'desc')
            ->get()
            ->map(function ($student) {
                $latestTracking = $student->studentTracking->first();
                return [
                    'id' => $student->id,
                    'name' => $student->first_name . ' ' . $student->last_name,
                    'student_number' => $student->student_number,
                    'email' => $student->email,
                    'phone' => $student->phone,
                    'section' => $student->section?->name ?? 'N/A',
                    'department' => $student->department?->name ?? $student->section?->program?->department?->name ?? 'N/A',
                    'program' => $student->program?->name ?? $student->section?->program?->name ?? 'N/A',
                    'year_level' => $student->year_level ?? 'N/A',
                    'priority' => $student->priority ?? 'Safe',
                    'absence_count' => $student->absence_count ?? 0,
                    'guardian_contact' => $student->guardian_contact ?? 'N/A',
                    'tracking_status' => $latestTracking?->status ?? 'No Status',
                    'deleted_at' => $student->deleted_at ? $student->deleted_at->format('Y-m-d H:i') : null,
                ];
            });

        return response()->json([
            'success' => true,
            'students' => $deletedStudents,
        ]);
    }

    public function restoreStudent($id)
    {
        $student = \App\Models\Student::onlyTrashed()->findOrFail($id);
        $student->restore();

        return redirect()->back()->with('success', 'Student restored successfully');
    }

    public function archiveStudentFromAttention($id)
    {
        $student = \App\Models\Student::findOrFail($id);
        
        // Archive from attention list without mutating Priority (Priority must reflect absences)
        $student->attention_archived_at = now();
        $student->save();
        
        // Archive all active tracking records for this student
        \App\Models\StudentTracking::where('student_id', $student->id)
            ->where('archived', false)
            ->update([
                'archived' => true,
                'archived_at' => now(),
            ]);
        
        return redirect()->back()->with('success', 'Student archived from attention list successfully.');
    }

    public function exportTracking(Request $request)
    {
        try {
            $tab = $request->get('tab', 'recent'); // 'recent', 'archived', 'deleted'
            
            // Build query based on tab
            $query = \App\Models\StudentTracking::with(['student.section.program.department', 'student.department', 'student.program', 'trackedBy']);
            
            if ($tab === 'archived') {
                $query->where('archived', true);
            } elseif ($tab === 'deleted') {
                $query->onlyTrashed();
            } else {
                $query->where('archived', false);
            }
            
            $trackings = $query->whereHas('student') // Only include tracking records with valid students
                ->orderBy('date', 'desc')
                ->orderBy('created_at', 'desc')
                ->get();
            
            // Generate CSV content
            $output = fopen('php://temp', 'r+');
            
            // Add BOM for UTF-8
            fwrite($output, chr(0xEF).chr(0xBB).chr(0xBF));
            
            // Headers
            fputcsv($output, [
                'ID',
                'Student Name',
                'Student Number',
                'Section',
                'Department',
                'Program',
                'Type',
                'Date',
                'Time',
                'Status',
                'Tracked By',
                'Notes',
                'Outcome',
                'Follow-up Required',
                'Follow-up Date',
                'Archived',
                'Archived At',
                'Deleted At',
                'Created At',
                'Updated At',
            ]);
            
            // Data rows
            foreach ($trackings as $tracking) {
                if (!$tracking->student) {
                    continue; // Skip tracking records without students
                }
                
                fputcsv($output, [
                    $tracking->id,
                    $tracking->student->first_name . ' ' . $tracking->student->last_name,
                    $tracking->student->student_number,
                    $tracking->student->section?->name ?? 'N/A',
                    $tracking->student->department?->name ?? $tracking->student->section?->program?->department?->name ?? 'N/A',
                    $tracking->student->program?->name ?? $tracking->student->section?->program?->name ?? 'N/A',
                    $tracking->type,
                    $tracking->date->format('Y-m-d'),
                    $tracking->time ? \Carbon\Carbon::parse($tracking->time)->format('H:i') : '',
                    $tracking->status,
                    $tracking->trackedBy?->name ?? 'Unknown',
                    $tracking->notes ?? '',
                    $tracking->outcome ?? '',
                    $tracking->follow_up_required ?? '',
                    $tracking->follow_up_date ? $tracking->follow_up_date->format('Y-m-d') : '',
                    $tracking->archived ? 'Yes' : 'No',
                    $tracking->archived_at ? $tracking->archived_at->format('Y-m-d H:i') : '',
                    $tracking->deleted_at ? $tracking->deleted_at->format('Y-m-d H:i') : '',
                    $tracking->created_at->format('Y-m-d H:i'),
                    $tracking->updated_at->format('Y-m-d H:i'),
                ]);
            }
            
            rewind($output);
            $csvContent = stream_get_contents($output);
            fclose($output);
            
            // Generate filename
            $filename = 'tracking_records_' . $tab . '_' . date('Y-m-d_His') . '.csv';
            
            // Return response with Content-Length header
            return response($csvContent, 200, [
                'Content-Type' => 'text/csv; charset=UTF-8',
                'Content-Disposition' => "attachment; filename=\"{$filename}\"",
                'Content-Length' => strlen($csvContent),
                'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
                'Pragma' => 'public',
            ]);
        } catch (\Exception $e) {
            \Log::error('Export tracking error: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Failed to export tracking records: ' . $e->getMessage());
        }
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
            $query = \App\Models\Student::with(['section.program.department']);

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
                    'Updated At'
                ]);

                // CSV Data
                foreach ($students as $student) {
                    try {
                        fputcsv($file, [
                            $student->id ?? '',
                            $student->student_number ?? '',
                            $student->first_name ?? '',
                            $student->last_name ?? '',
                            $student->email ?? '',
                            isset($student->phone) ? $student->phone : '',
                            $student->gender ?? '',
                            $student->birth_date ? ($student->birth_date instanceof \Carbon\Carbon ? $student->birth_date->format('Y-m-d') : $student->birth_date) : '',
                            $student->section?->program?->department?->name ?? 'N/A',
                            $student->section?->program?->name ?? 'N/A',
                            $student->section?->name ?? 'N/A',
                            $student->year_level ?? 'N/A',
                            $student->guardian_name ?? '',
                            $student->guardian_contact ?? '',
                            $student->status ?? 'Active',
                            $student->priority ?? 'Safe',
                            $student->absence_count ?? 0,
                            $student->created_at ? ($student->created_at instanceof \Carbon\Carbon ? $student->created_at->format('Y-m-d H:i:s') : $student->created_at) : '',
                            $student->updated_at ? ($student->updated_at instanceof \Carbon\Carbon ? $student->updated_at->format('Y-m-d H:i:s') : $student->updated_at) : ''
                        ]);
                    } catch (\Exception $e) {
                        \Log::error('Error exporting student: ' . $e->getMessage(), [
                            'student_id' => $student->id ?? 'unknown'
                        ]);
                        // Continue with next student
                        continue;
                    }
                }

                fclose($file);
            };

            return response()->stream($callback, 200, $headers);
        } catch (\Exception $e) {
            \Log::error('CSV Export failed: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
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
                    $studentNode = $xml->addChild('student');
                    $studentNode->addChild('id', htmlspecialchars((string)($student->id ?? '')));
                    $studentNode->addChild('student_number', htmlspecialchars((string)($student->student_number ?? '')));
                    $studentNode->addChild('first_name', htmlspecialchars((string)($student->first_name ?? '')));
                    $studentNode->addChild('last_name', htmlspecialchars((string)($student->last_name ?? '')));
                    $studentNode->addChild('email', htmlspecialchars((string)($student->email ?? '')));
                    $studentNode->addChild('phone', htmlspecialchars((string)($student->phone ?? '')));
                    $studentNode->addChild('gender', htmlspecialchars((string)($student->gender ?? '')));
                    
                    $birthDate = '';
                    if ($student->birth_date) {
                        if ($student->birth_date instanceof \Carbon\Carbon) {
                            $birthDate = $student->birth_date->format('Y-m-d');
                        } else {
                            $birthDate = (string) $student->birth_date;
                        }
                    }
                    $studentNode->addChild('birth_date', htmlspecialchars($birthDate));
                    
                    $studentNode->addChild('department', htmlspecialchars((string)($student->section?->program?->department?->name ?? 'N/A')));
                    $studentNode->addChild('program', htmlspecialchars((string)($student->section?->program?->name ?? 'N/A')));
                    $studentNode->addChild('section', htmlspecialchars((string)($student->section?->name ?? 'N/A')));
                    $studentNode->addChild('year_level', htmlspecialchars((string)($student->year_level ?? 'N/A')));
                    $studentNode->addChild('guardian_name', htmlspecialchars((string)($student->guardian_name ?? '')));
                    $studentNode->addChild('guardian_contact', htmlspecialchars((string)($student->guardian_contact ?? '')));
                    $studentNode->addChild('status', htmlspecialchars((string)($student->status ?? 'Active')));
                    $studentNode->addChild('priority', htmlspecialchars((string)($student->priority ?? 'Safe')));
                    $studentNode->addChild('absence_count', htmlspecialchars((string)($student->absence_count ?? 0)));
                    
                    $createdAt = '';
                    if ($student->created_at) {
                        if ($student->created_at instanceof \Carbon\Carbon) {
                            $createdAt = $student->created_at->format('Y-m-d H:i:s');
                        } else {
                            $createdAt = (string) $student->created_at;
                        }
                    }
                    $studentNode->addChild('created_at', htmlspecialchars($createdAt));
                    
                    $updatedAt = '';
                    if ($student->updated_at) {
                        if ($student->updated_at instanceof \Carbon\Carbon) {
                            $updatedAt = $student->updated_at->format('Y-m-d H:i:s');
                        } else {
                            $updatedAt = (string) $student->updated_at;
                        }
                    }
                    $studentNode->addChild('updated_at', htmlspecialchars($updatedAt));
                } catch (\Exception $e) {
                    \Log::error('Error exporting student to XML: ' . $e->getMessage(), [
                        'student_id' => $student->id ?? 'unknown'
                    ]);
                    // Continue with next student
                    continue;
                }
            }

            $headers = [
                'Content-Type' => 'application/xml; charset=UTF-8',
                'Content-Disposition' => 'attachment; filename="' . $filename . '"',
            ];

            return response($xml->asXML(), 200, $headers);
        } catch (\Exception $e) {
            \Log::error('XML Export failed: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        }
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