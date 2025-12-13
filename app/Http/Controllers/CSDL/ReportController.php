<?php

namespace App\Http\Controllers\CSDL;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\StudentTracking;
use App\Models\Department;
use App\Models\Program;
use App\Models\Section;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
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

    public function index(Request $request)
    {
        $tab = $request->get('tab', 'active'); // active, archived, deleted
        
        // Get filter parameters - convert empty strings to null
        $filters = [
            'department_id' => $request->get('department_id') ?: null,
            'program_id' => $request->get('program_id') ?: null,
            'section_id' => $request->get('section_id') ?: null,
            'type' => $request->get('type') ?: null,
            'status' => $request->get('status') ?: null,
            'tracked_by' => $request->get('tracked_by') ?: null,
            'date_from' => $request->get('date_from') ?: null,
            'date_to' => $request->get('date_to') ?: null,
            'search' => $request->get('search') ?: null,
        ];
        
        $today = Carbon::today();
        $startOfWeek = $today->copy()->startOfWeek();
        $endOfWeek = $today->copy()->endOfWeek();
        $startOfMonth = $today->copy()->startOfMonth();
        $endOfMonth = $today->copy()->endOfMonth();

        // Base query based on tab
        $query = StudentTracking::with(['student.section.program.department', 'trackedBy']);
        
        if ($tab === 'archived') {
            $query->where('archived', true);
        } elseif ($tab === 'deleted') {
            $query->onlyTrashed();
        } else {
            // Active: not archived and not deleted
            $query->where('archived', false);
        }

        // Apply filters
        if (!empty($filters['department_id'])) {
            $query->whereHas('student.section.program', function ($q) use ($filters) {
                $q->where('department_id', $filters['department_id']);
            });
        }

        if (!empty($filters['program_id'])) {
            $query->whereHas('student.section', function ($q) use ($filters) {
                $q->where('program_id', $filters['program_id']);
            });
        }

        if (!empty($filters['section_id'])) {
            $query->whereHas('student', function ($q) use ($filters) {
                $q->where('section_id', $filters['section_id']);
            });
        }

        if (!empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['tracked_by'])) {
            $query->where('tracked_by', $filters['tracked_by']);
        }

        if (!empty($filters['date_from']) && !empty($filters['date_to'])) {
            $query->whereBetween('date', [$filters['date_from'], $filters['date_to']]);
        } elseif (!empty($filters['date_from'])) {
            $query->where('date', '>=', $filters['date_from']);
        } elseif (!empty($filters['date_to'])) {
            $query->where('date', '<=', $filters['date_to']);
        }

        if (!empty($filters['search'])) {
            $searchTerm = $filters['search'];
            $query->where(function ($q) use ($searchTerm) {
                $q->where('notes', 'like', "%{$searchTerm}%")
                  ->orWhere('outcome', 'like', "%{$searchTerm}%")
                  ->orWhere('follow_up_required', 'like', "%{$searchTerm}%")
                  ->orWhereHas('student', function ($studentQuery) use ($searchTerm) {
                      $studentQuery->where(DB::raw("CONCAT(first_name, ' ', last_name)"), 'like', "%{$searchTerm}%")
                                   ->orWhere('student_number', 'like', "%{$searchTerm}%");
                  })
                  ->orWhereHas('trackedBy', function ($userQuery) use ($searchTerm) {
                      $userQuery->where('name', 'like', "%{$searchTerm}%")
                                ->orWhere('email', 'like', "%{$searchTerm}%");
                  });
            });
        }

        // Get tracking statistics (only for active records)
        $stats = [
            'today' => [
                'calls' => StudentTracking::where('archived', false)->whereDate('date', $today)->where('type', 'call')->count(),
                'visits' => StudentTracking::where('archived', false)->whereDate('date', $today)->where('type', 'home_visit')->count(),
                'total' => StudentTracking::where('archived', false)->whereDate('date', $today)->count(),
            ],
            'this_week' => [
                'calls' => StudentTracking::where('archived', false)->whereBetween('date', [$startOfWeek, $endOfWeek])->where('type', 'call')->count(),
                'visits' => StudentTracking::where('archived', false)->whereBetween('date', [$startOfWeek, $endOfWeek])->where('type', 'home_visit')->count(),
                'total' => StudentTracking::where('archived', false)->whereBetween('date', [$startOfWeek, $endOfWeek])->count(),
            ],
            'this_month' => [
                'calls' => StudentTracking::where('archived', false)->whereBetween('date', [$startOfMonth, $endOfMonth])->where('type', 'call')->count(),
                'visits' => StudentTracking::where('archived', false)->whereBetween('date', [$startOfMonth, $endOfMonth])->where('type', 'home_visit')->count(),
                'total' => StudentTracking::where('archived', false)->whereBetween('date', [$startOfMonth, $endOfMonth])->count(),
            ],
        ];

        // Get filter options
        $departments = Department::select('id', 'name')->orderBy('name')->get();
        $programs = Program::select('id', 'name', 'department_id')
            ->when($filters['department_id'], function($q) use ($filters) {
                $q->where('department_id', $filters['department_id']);
            })
            ->orderBy('name')->get();
        $sections = Section::select('id', 'name', 'program_id')
            ->when($filters['program_id'], function($q) use ($filters) {
                $q->where('program_id', $filters['program_id']);
            })
            ->orderBy('name')->get();
        // Get all users who can track (CSDL Users, Admins, Super Admins)
        $trackedByUsers = User::whereHas('roles', function($q) {
                $q->whereIn('name', ['CSDL', 'Admin', 'Super Admin']);
            })
            ->select('id', 'name', 'email')
            ->orderBy('name')
            ->get();

        // Get recent tracking records
        $recentTracking = $query
            ->orderBy('date', 'desc')
            ->orderBy('created_at', 'desc')
            ->limit(50)
            ->get()
            ->map(function ($tracking) use ($tab) {
                return [
                    'id' => $tracking->id,
                    'type' => $tracking->type,
                    'date' => $tracking->date->format('Y-m-d'),
                    'time' => $tracking->time ? Carbon::parse($tracking->time)->format('H:i') : null,
                    'status' => $tracking->status,
                    'outcome' => $tracking->outcome,
                    'follow_up_required' => $tracking->follow_up_required,
                    'follow_up_date' => $tracking->follow_up_date ? $tracking->follow_up_date->format('Y-m-d') : null,
                    'archived' => $tracking->archived ?? false,
                    'archived_at' => $tracking->archived_at ? $tracking->archived_at->format('Y-m-d H:i') : null,
                    'deleted_at' => $tracking->deleted_at ? $tracking->deleted_at->format('Y-m-d H:i') : null,
                    'student' => [
                        'id' => $tracking->student->id,
                        'name' => $tracking->student->first_name . ' ' . $tracking->student->last_name,
                        'student_number' => $tracking->student->student_number,
                        'section' => $tracking->student->section?->name ?? 'No Section',
                    ],
                    'tracked_by' => $tracking->trackedBy?->name ?? 'Unknown',
                    'tracked_by_id' => $tracking->tracked_by,
                    'notes' => $tracking->notes,
                    'can_edit' => $tab !== 'deleted', // Can't edit deleted records
                ];
            });

        return Inertia::render('CSDL/Reports', [
            'stats' => $stats,
            'recentTracking' => $recentTracking,
            'filters' => $filters,
            'tab' => $tab,
            'filterOptions' => [
                'departments' => $departments,
                'programs' => $programs,
                'sections' => $sections,
                'trackedByUsers' => $trackedByUsers,
            ],
        ]);
    }

    public function show($id)
    {
        $tracking = StudentTracking::withTrashed()
            ->with(['student.section.program.department', 'trackedBy'])
            ->findOrFail($id);

        return Inertia::render('CSDL/ViewTracking', [
            'tracking' => [
                'id' => $tracking->id,
                'type' => $tracking->type,
                'date' => $tracking->date->format('Y-m-d'),
                'time' => $tracking->time ? Carbon::parse($tracking->time)->format('H:i') : null,
                'status' => $tracking->status,
                'outcome' => $tracking->outcome,
                'follow_up_required' => $tracking->follow_up_required,
                'follow_up_date' => $tracking->follow_up_date ? $tracking->follow_up_date->format('Y-m-d') : null,
                'archived' => $tracking->archived ?? false,
                'archived_at' => $tracking->archived_at ? $tracking->archived_at->format('Y-m-d H:i') : null,
                'deleted_at' => $tracking->deleted_at ? $tracking->deleted_at->format('Y-m-d H:i') : null,
                'notes' => $tracking->notes,
                'student' => [
                    'id' => $tracking->student->id,
                    'name' => $tracking->student->first_name . ' ' . $tracking->student->last_name,
                    'student_number' => $tracking->student->student_number,
                    'section' => $tracking->student->section?->name ?? 'No Section',
                    'department' => $tracking->student->section?->program?->department?->name ?? 'No Department',
                ],
                'tracked_by' => $tracking->trackedBy?->name ?? 'Unknown',
                'tracked_by_id' => $tracking->tracked_by,
                'created_at' => $tracking->created_at->format('Y-m-d H:i'),
                'updated_at' => $tracking->updated_at->format('Y-m-d H:i'),
            ],
        ]);
    }

    public function archive($id)
    {
        $tracking = StudentTracking::findOrFail($id);
        $tracking->update([
            'archived' => true,
            'archived_at' => now(),
        ]);

        return redirect()->back()->with('success', 'Tracking record archived successfully');
    }

    public function unarchive($id)
    {
        $tracking = StudentTracking::findOrFail($id);
        $tracking->update([
            'archived' => false,
            'archived_at' => null,
        ]);

        return redirect()->back()->with('success', 'Tracking record unarchived successfully');
    }

    public function destroy($id)
    {
        $tracking = StudentTracking::findOrFail($id);
        $tracking->delete();

        return redirect()->back()->with('success', 'Tracking record deleted successfully');
    }

    public function restore($id)
    {
        $tracking = StudentTracking::withTrashed()->findOrFail($id);
        $tracking->restore();

        return redirect()->back()->with('success', 'Tracking record restored successfully');
    }

    public function export(Request $request)
    {
        $tab = $request->get('tab', 'active');
        
        // Get filter parameters - convert empty strings to null (same as index)
        $filters = [
            'department_id' => $request->get('department_id') ?: null,
            'program_id' => $request->get('program_id') ?: null,
            'section_id' => $request->get('section_id') ?: null,
            'type' => $request->get('type') ?: null,
            'status' => $request->get('status') ?: null,
            'tracked_by' => $request->get('tracked_by') ?: null,
            'date_from' => $request->get('date_from') ?: null,
            'date_to' => $request->get('date_to') ?: null,
            'search' => $request->get('search') ?: null,
        ];

        // Build query (same as index)
        $query = StudentTracking::with(['student.section.program.department', 'trackedBy']);
        
        if ($tab === 'archived') {
            $query->where('archived', true);
        } elseif ($tab === 'deleted') {
            $query->onlyTrashed();
        } else {
            $query->where('archived', false);
        }

        // Apply filters (same as index)
        if (!empty($filters['department_id'])) {
            $query->whereHas('student.section.program', function ($q) use ($filters) {
                $q->where('department_id', $filters['department_id']);
            });
        }

        if (!empty($filters['program_id'])) {
            $query->whereHas('student.section', function ($q) use ($filters) {
                $q->where('program_id', $filters['program_id']);
            });
        }

        if (!empty($filters['section_id'])) {
            $query->whereHas('student', function ($q) use ($filters) {
                $q->where('section_id', $filters['section_id']);
            });
        }

        if (!empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['tracked_by'])) {
            $query->where('tracked_by', $filters['tracked_by']);
        }

        if (!empty($filters['date_from']) && !empty($filters['date_to'])) {
            $query->whereBetween('date', [$filters['date_from'], $filters['date_to']]);
        } elseif (!empty($filters['date_from'])) {
            $query->where('date', '>=', $filters['date_from']);
        } elseif (!empty($filters['date_to'])) {
            $query->where('date', '<=', $filters['date_to']);
        }

        if (!empty($filters['search'])) {
            $searchTerm = $filters['search'];
            $query->where(function ($q) use ($searchTerm) {
                $q->where('notes', 'like', "%{$searchTerm}%")
                  ->orWhere('outcome', 'like', "%{$searchTerm}%")
                  ->orWhere('follow_up_required', 'like', "%{$searchTerm}%")
                  ->orWhereHas('student', function ($studentQuery) use ($searchTerm) {
                      $studentQuery->where(DB::raw("CONCAT(first_name, ' ', last_name)"), 'like', "%{$searchTerm}%")
                                   ->orWhere('student_number', 'like', "%{$searchTerm}%");
                  })
                  ->orWhereHas('trackedBy', function ($userQuery) use ($searchTerm) {
                      $userQuery->where('name', 'like', "%{$searchTerm}%")
                                ->orWhere('email', 'like', "%{$searchTerm}%");
                  });
            });
        }

        $trackings = $query->orderBy('date', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();

        // Generate CSV
        $filename = 'csdl_tracking_report_' . date('Y-m-d_His') . '.csv';
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        $callback = function() use ($trackings) {
            $file = fopen('php://output', 'w');
            
            // Add BOM for UTF-8
            fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF));
            
            // Headers
            fputcsv($file, [
                'ID',
                'Student Name',
                'Student Number',
                'Section',
                'Department',
                'Type',
                'Date',
                'Time',
                'Status',
                'Tracked By',
                'Notes',
                'Outcome',
                'Follow-up Required',
                'Follow-up Date',
                'Created At',
            ]);

            // Data rows
            foreach ($trackings as $tracking) {
                fputcsv($file, [
                    $tracking->id,
                    $tracking->student->first_name . ' ' . $tracking->student->last_name,
                    $tracking->student->student_number ?? '',
                    $tracking->student->section?->name ?? 'N/A',
                    $tracking->student->section?->program?->department?->name ?? 'N/A',
                    ucfirst(str_replace('_', ' ', $tracking->type)),
                    $tracking->date->format('Y-m-d'),
                    $tracking->time ? Carbon::parse($tracking->time)->format('H:i') : '',
                    ucfirst($tracking->status),
                    $tracking->trackedBy?->name ?? 'Unknown',
                    $tracking->notes ?? '',
                    $tracking->outcome ?? '',
                    $tracking->follow_up_required ?? '',
                    $tracking->follow_up_date ? $tracking->follow_up_date->format('Y-m-d') : '',
                    $tracking->created_at->format('Y-m-d H:i:s'),
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}

