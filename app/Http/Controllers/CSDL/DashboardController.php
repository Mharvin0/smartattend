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
            $departmentIds = $user->getAssignedDepartmentIds();

            // Get statistics - CSDL only sees home visits
            $stats = [
                'students_needing_visits' => Student::forUser($user)->where('priority', 'PNS')->count(),
                'total_tracked_today' => StudentTracking::where('type', 'home_visit')
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
                    ->whereDate('date', $today)
                    ->count(),
                'total_tracked_this_week' => StudentTracking::where('type', 'home_visit')
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
                    ->whereBetween('date', [$startOfWeek, $endOfWeek])
                    ->count(),
                'visits_today' => StudentTracking::where('type', 'home_visit')
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
                    ->whereDate('date', $today)
                    ->count(),
            ];

            // Get recent tracking records - CSDL only sees home visit records
            $recentTracking = StudentTracking::with(['student.section.program.department', 'trackedBy'])
                ->where('type', 'home_visit')
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

            // Get students needing attention - CSDL only sees PNS students (home visits needed)
            $studentsNeedingAttention = Student::forUser($user)
                ->where('priority', 'PNS')
                ->with(['section.program.department'])
                ->orderBy('priority', 'desc')
                ->orderBy('absence_count', 'desc')
                ->limit(10)
                ->get()
                ->map(function ($student) {
                    $student->updatePriority();
                    return [
                        'id' => $student->id,
                        'name' => $student->first_name . ' ' . $student->last_name,
                        'student_number' => $student->student_number,
                        'section' => $student->section?->name ?? 'N/A',
                        'department' => $student->section?->program?->department?->name ?? 'N/A',
                        'priority' => $student->priority ?? 'Safe',
                        'absence_count' => $student->absence_count ?? 0,
                    ];
                });

            return Inertia::render('CSDL/Dashboard', [
                'stats' => $stats,
                'recentTracking' => $recentTracking,
                'studentsNeedingAttention' => $studentsNeedingAttention,
            ]);
        } catch (\Exception $e) {
            \Log::error('CSDL Dashboard Error: ' . $e->getMessage());
            
            return Inertia::render('CSDL/Dashboard', [
                'stats' => [
                    'students_needing_visits' => 0,
                    'total_tracked_today' => 0,
                    'total_tracked_this_week' => 0,
                    'visits_today' => 0,
                ],
                'recentTracking' => [],
                'studentsNeedingAttention' => [],
            ]);
        }
    }
}

