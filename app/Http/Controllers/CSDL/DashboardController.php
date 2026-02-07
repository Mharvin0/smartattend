<?php

namespace App\Http\Controllers\CSDL;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\StudentTracking;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class DashboardController extends Controller
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
            
            // Check if user has CSDL role
            if (!$user->hasRole('CSDL')) {
                // Redirect based on their actual role
                if ($user->hasRole('Super Admin')) {
                    return redirect()->route('super.dashboard');
                } elseif ($user->hasRole('Admin')) {
                    return redirect()->route('admin.dashboard');
                }
                // Otherwise, show 403 error
                abort(403, 'Access denied. CSDL role required.');
            }
            
            return $next($request);
        });
    }

    public function index()
    {
        try {
            $user = auth()->user();
            $today = Carbon::today();
            $startOfWeek = $today->copy()->startOfWeek();
            $endOfWeek = $today->copy()->endOfWeek();
            $startOfMonth = $today->copy()->startOfMonth();
            $departmentIds = $user->getAssignedDepartmentIds();
            
            $baseTrackingQuery = StudentTracking::where('type', 'home_visit')
                ->where('archived', false);
            $userTrackingQuery = (clone $baseTrackingQuery)->where('tracked_by', $user->id);
            $useAllTracking = !(clone $userTrackingQuery)->exists();
            $trackingQuery = $useAllTracking ? $baseTrackingQuery : $userTrackingQuery;

            // Helper function to build student query with department filtering
            $buildStudentQuery = function($query) use ($user, $departmentIds) {
                if (!$user->hasRole('Super Admin') && !empty($departmentIds)) {
                    $query->where(function($subQ) use ($departmentIds) {
                        $subQ->whereIn('department_id', $departmentIds)
                             ->orWhereHas('section.program', function($progQ) use ($departmentIds) {
                                 $progQ->whereIn('department_id', $departmentIds);
                             });
                    });
                }
            };

            // Get students with active home visit tracking records for stats
            $studentsWithActiveTrackingForStats = StudentTracking::where('type', 'home_visit')
                ->whereIn('status', ['pending', 'to_follow', 'processing', 'completed', 'no_answer'])
                ->where('archived', false)
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
                ->pluck('student_id')
                ->unique()
                ->values()
                ->toArray();
            
            // Get statistics - CSDL only sees home visits
            $stats = [
                'completed' => (clone $trackingQuery)->where('status', 'completed')->count(),
                'processing' => (clone $trackingQuery)->where('status', 'processing')->count(),
                'to_follow' => (clone $trackingQuery)->where('status', 'to_follow')->count(),
                'no_answer' => (clone $trackingQuery)->where('status', 'no_answer')->count(),
            ];

            // Get recent tracking records - CSDL only sees home visit records
            $recentTrackingQuery = StudentTracking::with(['student.section.program.department', 'trackedBy'])
                ->where('type', 'home_visit')
                ->where('archived', false);
            if (!$useAllTracking) {
                $recentTrackingQuery->where('tracked_by', $user->id);
            }
            $recentTracking = $recentTrackingQuery
                ->orderBy('date', 'desc')
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get()
                ->map(function ($tracking) {
                    return [
                        'id' => $tracking->id,
                        'type' => $tracking->type,
                        'date' => $tracking->date->format('Y-m-d'),
                        'time' => $tracking->time ? Carbon::parse($tracking->time)->format('H:i') : null,
                        'status' => $tracking->status,
                        'outcome' => $tracking->outcome,
                        'follow_up_required' => $tracking->follow_up_required,
                        'follow_up_date' => $tracking->follow_up_date ? $tracking->follow_up_date->format('Y-m-d') : null,
                        'student' => [
                            'id' => $tracking->student->id,
                            'name' => $tracking->student->first_name . ' ' . $tracking->student->last_name,
                            'section' => $tracking->student->section?->name ?? 'N/A',
                        ],
                        'tracked_by' => $tracking->trackedBy?->name ?? 'Unknown',
                        'tracked_by_id' => $tracking->tracked_by,
                        'notes' => $tracking->notes,
                        'can_edit' => true, // CSDL users can edit all tracking records
                    ];
                });

            $weeklyLabels = [];
            $studentsNeedingByWeek = [];
            $statusTrendByWeek = [
                'completed' => [],
                'processing' => [],
                'to_follow' => [],
                'no_answer' => [],
            ];
            $statusKeys = array_keys($statusTrendByWeek);

            for ($i = 6; $i >= 0; $i--) {
                $weekStart = $today->copy()->startOfWeek()->subWeeks($i);
                $weekEnd = $weekStart->copy()->endOfWeek();
                $weeklyLabels[] = $weekStart->format('M d');

                $studentsNeedingByWeek[] = (clone $trackingQuery)
                    ->whereBetween('date', [$weekStart->toDateString(), $weekEnd->toDateString()])
                    ->distinct('student_id')
                    ->count('student_id');

                foreach ($statusKeys as $statusKey) {
                    $statusTrendByWeek[$statusKey][] = (clone $trackingQuery)
                        ->where('status', $statusKey)
                        ->whereBetween('created_at', [$weekStart->startOfDay(), $weekEnd->endOfDay()])
                        ->count();
                }
            }

            // Get students needing attention - CSDL sees PNS students OR students with active home visit tracking records
            // Get students with active home visit tracking records (sent by admin/superadmin)
            $studentsWithActiveTracking = StudentTracking::where('type', 'home_visit')
                ->whereIn('status', ['pending', 'to_follow', 'processing', 'completed', 'no_answer'])
                ->where('archived', false)
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
                ->pluck('student_id')
                ->unique()
                ->values()
                ->toArray();
            
            $studentsNeedingAttention = Student::forUser($user)
                ->where(function($query) use ($studentsWithActiveTracking) {
                    // Show students with PNS priority (home visits needed)
                    $query->where('priority', 'PNS');
                    // OR students with active home visit tracking records (sent by admin/superadmin)
                    if (!empty($studentsWithActiveTracking)) {
                        $query->orWhereIn('id', $studentsWithActiveTracking);
                    }
                })
                ->with([
                    'section.program.department',
                    'studentTracking' => function($query) {
                        $query->where('type', 'home_visit')
                            ->where('archived', false)
                            ->orderBy('date', 'desc')
                            ->orderBy('created_at', 'desc');
                    }
                ])
                ->orderBy('priority', 'desc')
                ->orderBy('absence_count', 'desc')
                ->get()
                ->map(function ($student) use ($studentsWithActiveTracking) {
                    // Only update priority if student doesn't have active tracking
                    // This preserves manually set priorities for students sent to CSDL
                    if (!in_array($student->id, $studentsWithActiveTracking)) {
                        $student->updatePriority();
                    }
                    $lastVisit = $student->studentTracking->first();
                    
                    return [
                        'id' => $student->id,
                        'name' => $student->first_name . ' ' . $student->last_name,
                        'student_number' => $student->student_number,
                        'email' => $student->email,
                        'phone' => $student->phone,
                        'section' => $student->section?->name ?? 'N/A',
                        'program' => $student->section?->program?->name ?? 'N/A',
                        'department' => $student->section?->program?->department?->name ?? 'N/A',
                        'year_level' => $student->year_level ?? 'N/A',
                        'gender' => $student->gender ?? 'N/A',
                        'priority' => $student->priority ?? 'Safe',
                        'absence_count' => $student->absence_count ?? 0,
                        'guardian_name' => $student->guardian_name ?? 'N/A',
                        'guardian_contact' => $student->guardian_contact ?? 'N/A',
                        'birth_date' => $student->birth_date ? (is_string($student->birth_date) ? $student->birth_date : Carbon::parse($student->birth_date)->format('Y-m-d')) : null,
                        'last_visit_date' => $lastVisit ? Carbon::parse($lastVisit->date)->format('Y-m-d') : null,
                        'last_visit_status' => $lastVisit ? $lastVisit->status : null,
                        'total_visits' => $student->studentTracking->count(),
                        'status' => $student->status ?? 'active',
                    ];
                });

            return Inertia::render('CSDL/Dashboard', [
                'stats' => $stats,
                'recentTracking' => $recentTracking,
                'studentsNeedingAttention' => $studentsNeedingAttention,
                'visitsByWeek' => [
                    'labels' => $weeklyLabels,
                    'needing' => $studentsNeedingByWeek,
                ],
                'statusTrendByWeek' => [
                    'labels' => $weeklyLabels,
                    'series' => $statusTrendByWeek,
                ],
            ]);
        } catch (\Exception $e) {
            \Log::error('CSDL Dashboard Error: ' . $e->getMessage());
            
            return Inertia::render('CSDL/Dashboard', [
                'stats' => [
                    'completed' => 0,
                    'processing' => 0,
                    'to_follow' => 0,
                    'no_answer' => 0,
                ],
                'recentTracking' => [],
                'studentsNeedingAttention' => [],
                'visitsByWeek' => [
                    'labels' => [],
                    'needing' => [],
                ],
                'statusTrendByWeek' => [
                    'labels' => [],
                    'series' => [
                        'completed' => [],
                        'processing' => [],
                        'to_follow' => [],
                        'no_answer' => [],
                    ],
                ],
            ]);
        }
    }

    public function getLiveData()
    {
        try {
            $user = auth()->user();
            $today = Carbon::today();
            $startOfWeek = $today->copy()->startOfWeek();
            $endOfWeek = $today->copy()->endOfWeek();
            $startOfMonth = $today->copy()->startOfMonth();
            $baseTrackingQuery = StudentTracking::where('type', 'home_visit')
                ->where('archived', false);
            $userTrackingQuery = (clone $baseTrackingQuery)->where('tracked_by', $user->id);
            $useAllTracking = !(clone $userTrackingQuery)->exists();
            $trackingQuery = $useAllTracking ? $baseTrackingQuery : $userTrackingQuery;

            $assignedStudentIds = (clone $trackingQuery)
                ->pluck('student_id')
                ->unique()
                ->values()
                ->toArray();
            
            $studentsNeedingVisits = Student::whereIn('id', $assignedStudentIds)
                ->with([
                    'section.program.department',
                    'studentTracking' => function($query) use ($user, $useAllTracking) {
                        $query->where('type', 'home_visit')
                            ->where('archived', false)
                            ->orderBy('date', 'desc')
                            ->orderBy('created_at', 'desc');
                        if (!$useAllTracking) {
                            $query->where('tracked_by', $user->id);
                        }
                    }
                ])
                ->orderBy('priority', 'desc')
                ->orderBy('absence_count', 'desc')
                ->get()
                ->map(function ($student) {
                    $lastVisit = $student->studentTracking->first();
                    
                    return [
                        'id' => $student->id,
                        'name' => $student->first_name . ' ' . $student->last_name,
                        'student_number' => $student->student_number,
                        'email' => $student->email,
                        'phone' => $student->phone,
                        'section' => $student->section?->name ?? 'N/A',
                        'program' => $student->section?->program?->name ?? 'N/A',
                        'department' => $student->section?->program?->department?->name ?? 'N/A',
                        'year_level' => $student->year_level ?? 'N/A',
                        'gender' => $student->gender ?? 'N/A',
                        'priority' => $student->priority ?? 'Safe',
                        'absence_count' => $student->absence_count ?? 0,
                        'guardian_name' => $student->guardian_name ?? 'N/A',
                        'guardian_contact' => $student->guardian_contact ?? 'N/A',
                        'birth_date' => $student->birth_date ? (is_string($student->birth_date) ? $student->birth_date : Carbon::parse($student->birth_date)->format('Y-m-d')) : null,
                        'last_visit_date' => $lastVisit ? Carbon::parse($lastVisit->date)->format('Y-m-d') : null,
                        'last_visit_status' => $lastVisit ? $lastVisit->status : null,
                        'total_visits' => $student->studentTracking->count(),
                        'status' => $student->status ?? 'active',
                    ];
                });

            // Get statistics
            $stats = [
                'completed' => (clone $trackingQuery)->where('status', 'completed')->count(),
                'processing' => (clone $trackingQuery)->where('status', 'processing')->count(),
                'to_follow' => (clone $trackingQuery)->where('status', 'to_follow')->count(),
                'no_answer' => (clone $trackingQuery)->where('status', 'no_answer')->count(),
            ];

            $weeklyLabels = [];
            $studentsNeedingByWeek = [];
            $statusTrendByWeek = [
                'completed' => [],
                'processing' => [],
                'to_follow' => [],
                'no_answer' => [],
            ];
            $statusKeys = array_keys($statusTrendByWeek);

            for ($i = 6; $i >= 0; $i--) {
                $weekStart = $today->copy()->startOfWeek()->subWeeks($i);
                $weekEnd = $weekStart->copy()->endOfWeek();
                $weeklyLabels[] = $weekStart->format('M d');

                $studentsNeedingByWeek[] = (clone $trackingQuery)
                    ->whereBetween('date', [$weekStart->toDateString(), $weekEnd->toDateString()])
                    ->distinct('student_id')
                    ->count('student_id');

                foreach ($statusKeys as $statusKey) {
                    $statusTrendByWeek[$statusKey][] = (clone $trackingQuery)
                        ->where('status', $statusKey)
                        ->whereBetween('created_at', [$weekStart->startOfDay(), $weekEnd->endOfDay()])
                        ->count();
                }
            }

            return response()->json([
                'studentsNeedingVisits' => $studentsNeedingVisits,
                'stats' => $stats,
                'visitsByWeek' => [
                    'labels' => $weeklyLabels,
                    'needing' => $studentsNeedingByWeek,
                ],
                'statusTrendByWeek' => [
                    'labels' => $weeklyLabels,
                    'series' => $statusTrendByWeek,
                ],
                'timestamp' => now()->toISOString(),
            ]);
        } catch (\Exception $e) {
            \Log::error('CSDL Live Data Error: ' . $e->getMessage());
            return response()->json([
                'error' => 'Failed to fetch live data',
                'studentsNeedingVisits' => [],
                'stats' => [
                    'completed' => 0,
                    'processing' => 0,
                    'to_follow' => 0,
                    'no_answer' => 0,
                ],
                'visitsByWeek' => [
                    'labels' => [],
                    'needing' => [],
                ],
                'statusTrendByWeek' => [
                    'labels' => [],
                    'series' => [
                        'completed' => [],
                        'processing' => [],
                        'to_follow' => [],
                        'no_answer' => [],
                    ],
                ],
                'timestamp' => now()->toISOString(),
            ], 500);
        }
    }
}

