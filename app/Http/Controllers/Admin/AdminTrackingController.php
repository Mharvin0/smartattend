<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\StudentTracking;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class AdminTrackingController extends Controller
{
    public function __construct()
    {
        $this->middleware(['auth']);
        $this->middleware(function ($request, $next) {
            $user = auth()->user();
            
            if (!$user) {
                return redirect()->route('login');
            }
            
            if (!$user->hasRole('Admin') && !$user->hasRole('Super Admin')) {
                if ($user->hasRole('Super Admin')) {
                    return redirect()->route('super.dashboard');
                } elseif ($user->hasRole('CSDL')) {
                    return redirect()->route('csdl.dashboard');
                }
                abort(403, 'Access denied. Admin role required.');
            }
            
            return $next($request);
        });
    }

    public function index()
    {
        $user = auth()->user();
        
        // Get programs from admin's assigned department(s) - fixed filter
        $departmentIds = $user->getAssignedDepartmentIds();
        $programIds = \App\Models\Program::whereIn('department_id', $departmentIds)
            ->pluck('id')
            ->toArray();
        
        // Admin only handles calls - get students that need calls
        $studentsWithActiveCallTracking = StudentTracking::where('type', 'call')
            ->whereIn('status', ['pending', 'to_follow', 'processing', 'completed', 'cancelled', 'no_answer'])
            ->where('archived', false)
            ->whereHas('student', function($q) use ($programIds) {
                if (!empty($programIds)) {
                    $q->whereHas('section', function($sectionQ) use ($programIds) {
                        $sectionQ->whereIn('program_id', $programIds);
                    });
                }
            })
            ->pluck('student_id')
            ->unique()
            ->values()
            ->toArray();
        
        // Filter students by programs from admin's assigned department(s)
        $studentsNeedingCalls = Student::query()
            ->when(!empty($programIds), function($query) use ($programIds) {
                $query->whereHas('section', function($q) use ($programIds) {
                    $q->whereIn('program_id', $programIds);
                });
            })
            ->when(empty($programIds), function($query) {
                // If no programs, return empty result
                $query->whereRaw('1 = 0');
            })
            ->where(function($query) use ($studentsWithActiveCallTracking) {
                // Only show students with 'Call Needed' priority (admin handles calls)
                $query->where('priority', 'Call Needed');
                if (!empty($studentsWithActiveCallTracking)) {
                    $query->orWhereIn('id', $studentsWithActiveCallTracking);
                }
            })
            ->with(['section.program.department', 'department', 'program', 'studentTracking' => function($query) {
                $query->where('type', 'call') // Only get call tracking records
                    ->where('archived', false)
                    ->orderBy('date', 'desc')
                    ->orderBy('created_at', 'desc')
                    ->limit(1);
            }])
            ->orderBy('priority', 'desc')
            ->orderBy('absence_count', 'desc')
            ->get()
            ->map(function ($student) use ($studentsWithActiveCallTracking) {
                // Only update priority if student doesn't have active tracking
                if (!in_array($student->id, $studentsWithActiveCallTracking)) {
                    $student->updatePriority();
                }
                $latestTracking = $student->studentTracking->first();
                return [
                    'id' => $student->id,
                    'name' => $student->first_name . ' ' . $student->last_name,
                    'student_number' => $student->student_number,
                    'email' => $student->email,
                    'section' => $student->section?->name ?? 'N/A',
                    'department' => $student->department?->name ?? $student->section?->program?->department?->name ?? 'N/A',
                    'program' => $student->program?->name ?? $student->section?->program?->name ?? 'N/A',
                    'priority' => $student->priority ?? 'Safe',
                    'absence_count' => $student->absence_count ?? 0,
                    'guardian_contact' => $student->guardian_contact,
                    'tracking_status' => $latestTracking?->status ?? 'No Status',
                    'last_tracking' => $this->getLastTracking($student->id),
                ];
            });

        // Get students sent to CSDL for home visits (view only) - filtered by programs
        $studentsSentToCSDL = Student::query()
            ->when(!empty($programIds), function($query) use ($programIds) {
                $query->whereHas('section', function($q) use ($programIds) {
                    $q->whereIn('program_id', $programIds);
                });
            })
            ->when(empty($programIds), function($query) {
                $query->whereRaw('1 = 0');
            })
            ->where('priority', 'PNS')
            ->whereHas('studentTracking', function($query) {
                $query->where('type', 'home_visit')
                    ->where('archived', false);
            })
            ->with(['section.program.department', 'department', 'program', 'studentTracking' => function($query) {
                $query->where('type', 'home_visit')
                    ->where('archived', false)
                    ->orderBy('date', 'desc')
                    ->orderBy('created_at', 'desc')
                    ->limit(1);
            }])
            ->orderBy('absence_count', 'desc')
            ->get()
            ->map(function ($student) {
                $latestTracking = $student->studentTracking->first();
                return [
                    'id' => $student->id,
                    'name' => $student->first_name . ' ' . $student->last_name,
                    'student_number' => $student->student_number,
                    'email' => $student->email,
                    'section' => $student->section?->name ?? 'N/A',
                    'department' => $student->department?->name ?? $student->section?->program?->department?->name ?? 'N/A',
                    'program' => $student->program?->name ?? $student->section?->program?->name ?? 'N/A',
                    'priority' => $student->priority ?? 'Safe',
                    'absence_count' => $student->absence_count ?? 0,
                    'guardian_contact' => $student->guardian_contact,
                    'tracking_status' => $latestTracking?->status ?? 'No Status',
                    'last_tracking' => $this->getLastTracking($student->id, 'home_visit'),
                    'sent_to_csdl' => true,
                ];
            });

        // Get recent tracking records - Admin sees both calls (they handle) and home visits (view only)
        // Filter by programs from admin's assigned department(s)
        $recentTracking = StudentTracking::with(['student.section.program.department', 'trackedBy'])
            ->whereHas('student', function($q) use ($programIds) {
                if (!empty($programIds)) {
                    $q->whereHas('section', function($sectionQ) use ($programIds) {
                        $sectionQ->whereIn('program_id', $programIds);
                    });
                } else {
                    $q->whereRaw('1 = 0'); // No programs = no results
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
                    'time' => $tracking->time ? Carbon::parse($tracking->time)->format('H:i') : null,
                    'status' => $tracking->status,
                    'outcome' => $tracking->outcome,
                    'follow_up_required' => $tracking->follow_up_required,
                    'follow_up_date' => $tracking->follow_up_date ? $tracking->follow_up_date->format('Y-m-d') : null,
                    'student' => [
                        'id' => $tracking->student?->id ?? null,
                        'name' => $tracking->student ? ($tracking->student->first_name . ' ' . $tracking->student->last_name) : 'Unknown Student',
                        'section' => $tracking->student?->section?->name ?? 'N/A',
                    ],
                    'tracked_by' => $tracking->trackedBy?->name ?? 'Unknown',
                    'tracked_by_id' => $tracking->tracked_by,
                    'notes' => $tracking->notes,
                    'can_edit' => $tracking->type === 'call', // Admin can only edit call records
                ];
            })
            ->filter(function ($tracking) {
                return $tracking['student']['id'] !== null; // Filter out any records with null student IDs
            })
            ->values();

        // Statistics - filtered by programs from admin's assigned department(s)
        $stats = [
            'students_needing_calls' => Student::query()
                ->when(!empty($programIds), function($query) use ($programIds) {
                    $query->whereHas('section', function($q) use ($programIds) {
                        $q->whereIn('program_id', $programIds);
                    });
                })
                ->when(empty($programIds), function($query) {
                    $query->whereRaw('1 = 0');
                })
                ->where('priority', 'Call Needed')
                ->count(),
            'students_needing_visits' => Student::query()
                ->when(!empty($programIds), function($query) use ($programIds) {
                    $query->whereHas('section', function($q) use ($programIds) {
                        $q->whereIn('program_id', $programIds);
                    });
                })
                ->when(empty($programIds), function($query) {
                    $query->whereRaw('1 = 0');
                })
                ->where('priority', 'PNS')
                ->count(),
            'total_tracked_today' => StudentTracking::whereHas('student', function($q) use ($programIds) {
                    if (!empty($programIds)) {
                        $q->whereHas('section', function($sectionQ) use ($programIds) {
                            $sectionQ->whereIn('program_id', $programIds);
                        });
                    } else {
                        $q->whereRaw('1 = 0');
                    }
                })
                ->where('archived', false)
                ->whereDate('date', Carbon::today())
                ->count(),
            'total_tracked_this_week' => StudentTracking::whereHas('student', function($q) use ($programIds) {
                    if (!empty($programIds)) {
                        $q->whereHas('section', function($sectionQ) use ($programIds) {
                            $sectionQ->whereIn('program_id', $programIds);
                        });
                    } else {
                        $q->whereRaw('1 = 0');
                    }
                })
                ->where('archived', false)
                ->whereBetween('date', [
                    Carbon::now()->startOfWeek(),
                    Carbon::now()->endOfWeek()
                ])
                ->count(),
        ];

        // Get programs for display (fixed based on admin's department)
        $programs = \App\Models\Program::whereIn('department_id', $departmentIds)
            ->with('department')
            ->orderBy('name')
            ->get()
            ->map(function($program) {
                return [
                    'id' => $program->id,
                    'name' => $program->name,
                    'department' => $program->department?->name ?? 'N/A',
                ];
            });

        return Inertia::render('Admin/AdminTrackingPage', [
            'studentsNeedingCalls' => $studentsNeedingCalls,
            'studentsSentToCSDL' => $studentsSentToCSDL,
            'recentTracking' => $recentTracking,
            'stats' => $stats,
            'programs' => $programs, // Fixed programs based on admin's department
        ]);
    }

    public function trackStudent(Request $request)
    {
        $validated = $request->validate([
            'student_id' => 'required|exists:students,id',
            'type' => 'required|in:call', // Admin can only create call records
            'date' => 'required|date',
            'time' => 'nullable|date_format:H:i',
            'notes' => 'nullable|string',
            'status' => 'required|in:completed,cancelled,no_answer', // Admin can only set these statuses for calls
            'outcome' => 'nullable|string',
            'follow_up_required' => 'nullable|string',
            'follow_up_date' => 'nullable|date|after:today',
        ]);

        $tracking = StudentTracking::create([
            'student_id' => $validated['student_id'],
            'tracked_by' => auth()->id(),
            'type' => 'call', // Force call type for admin
            'date' => $validated['date'],
            'time' => $validated['time'] ? Carbon::parse($validated['time'])->format('H:i:s') : null,
            'notes' => $validated['notes'] ?? null,
            'status' => $validated['status'],
            'outcome' => $validated['outcome'] ?? null,
            'follow_up_required' => $validated['follow_up_required'] ?? null,
            'follow_up_date' => $validated['follow_up_date'] ?? null,
        ]);

        return redirect()->back()->with('success', 'Student tracking recorded successfully');
    }

    public function updateTracking(Request $request, $id)
    {
        $tracking = StudentTracking::findOrFail($id);
        
        // Admin can only update call records, not home visits
        if ($tracking->type !== 'call') {
            abort(403, 'Admin users can only modify call records. Home visits are handled by CSDL.');
        }

        $validated = $request->validate([
            'type' => 'required|in:call', // Admin can only update call records
            'date' => 'required|date',
            'time' => 'nullable|date_format:H:i',
            'notes' => 'nullable|string',
            'status' => 'required|in:completed,cancelled,no_answer', // Admin can only set these statuses for calls
            'outcome' => 'nullable|string',
            'follow_up_required' => 'nullable|string',
            'follow_up_date' => 'nullable|date',
        ]);

        $tracking->update([
            'type' => 'call', // Force call type
            'date' => $validated['date'],
            'time' => $validated['time'] ? Carbon::parse($validated['time'])->format('H:i:s') : null,
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
        $tracking = StudentTracking::with(['student.section.program.department', 'trackedBy'])
            ->findOrFail($id);

        if (!$tracking->student) {
            return response()->json([
                'success' => false,
                'message' => 'Student not found for this tracking record',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'tracking' => [
                'id' => $tracking->id,
                'type' => $tracking->type,
                'date' => $tracking->date->format('Y-m-d'),
                'time' => $tracking->time ? Carbon::parse($tracking->time)->format('H:i') : null,
                'status' => $tracking->status,
                'outcome' => $tracking->outcome,
                'follow_up_required' => $tracking->follow_up_required,
                'follow_up_date' => $tracking->follow_up_date ? $tracking->follow_up_date->format('Y-m-d') : null,
                'notes' => $tracking->notes,
                'student' => [
                    'id' => $tracking->student->id,
                    'name' => $tracking->student->first_name . ' ' . $tracking->student->last_name,
                    'student_number' => $tracking->student->student_number,
                    'section' => $tracking->student->section?->name ?? 'N/A',
                    'department' => $tracking->student->department?->name ?? $tracking->student->section?->program?->department?->name ?? 'N/A',
                    'program' => $tracking->student->program?->name ?? $tracking->student->section?->program?->name ?? 'N/A',
                ],
                'tracked_by' => $tracking->trackedBy?->name ?? 'Unknown',
                'created_at' => $tracking->created_at->format('Y-m-d H:i'),
                'updated_at' => $tracking->updated_at->format('Y-m-d H:i'),
            ],
        ]);
    }

    public function getArchivedTracking()
    {
        $user = auth()->user();
        $departmentIds = $user->getAssignedDepartmentIds();
        $programIds = \App\Models\Program::whereIn('department_id', $departmentIds)
            ->pluck('id')
            ->toArray();
        
        $archivedTracking = StudentTracking::with(['student.section.program.department', 'trackedBy'])
            ->whereHas('student', function($q) use ($programIds) {
                if (!empty($programIds)) {
                    $q->whereHas('section', function($sectionQ) use ($programIds) {
                        $sectionQ->whereIn('program_id', $programIds);
                    });
                } else {
                    $q->whereRaw('1 = 0');
                }
            })
            ->where('archived', true)
            ->orderBy('archived_at', 'desc')
            ->orderBy('date', 'desc')
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
                        'id' => $tracking->student?->id ?? null,
                        'name' => $tracking->student ? ($tracking->student->first_name . ' ' . $tracking->student->last_name) : 'Unknown Student',
                        'section' => $tracking->student?->section?->name ?? 'N/A',
                    ],
                    'tracked_by' => $tracking->trackedBy?->name ?? 'Unknown',
                    'tracked_by_id' => $tracking->tracked_by,
                    'notes' => $tracking->notes,
                    'archived' => $tracking->archived,
                    'archived_at' => $tracking->archived_at ? $tracking->archived_at->format('Y-m-d H:i') : null,
                    'can_edit' => $tracking->type === 'call', // Admin can only edit call records
                ];
            })
            ->filter(function ($tracking) {
                return $tracking['student']['id'] !== null; // Filter out any records with null student IDs
            })
            ->values();

        return response()->json([
            'success' => true,
            'tracking' => $archivedTracking,
        ]);
    }

    public function getDeletedTracking()
    {
        $user = auth()->user();
        $departmentIds = $user->getAssignedDepartmentIds();
        $programIds = \App\Models\Program::whereIn('department_id', $departmentIds)
            ->pluck('id')
            ->toArray();
        
        $deletedTracking = StudentTracking::withTrashed()
            ->with(['student.section.program.department', 'trackedBy'])
            ->whereHas('student', function($q) use ($programIds) {
                if (!empty($programIds)) {
                    $q->whereHas('section', function($sectionQ) use ($programIds) {
                        $sectionQ->whereIn('program_id', $programIds);
                    });
                } else {
                    $q->whereRaw('1 = 0');
                }
            })
            ->whereNotNull('deleted_at')
            ->orderBy('deleted_at', 'desc')
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
                        'id' => $tracking->student?->id ?? null,
                        'name' => $tracking->student ? ($tracking->student->first_name . ' ' . $tracking->student->last_name) : 'Unknown Student',
                        'section' => $tracking->student?->section?->name ?? 'N/A',
                    ],
                    'tracked_by' => $tracking->trackedBy?->name ?? 'Unknown',
                    'tracked_by_id' => $tracking->tracked_by,
                    'notes' => $tracking->notes,
                    'deleted_at' => $tracking->deleted_at ? $tracking->deleted_at->format('Y-m-d H:i') : null,
                    'can_edit' => $tracking->type === 'call', // Admin can only edit call records
                ];
            })
            ->filter(function ($tracking) {
                return $tracking['student']['id'] !== null; // Filter out any records with null student IDs
            })
            ->values();

        return response()->json([
            'success' => true,
            'tracking' => $deletedTracking,
        ]);
    }

    public function unarchiveTracking($id)
    {
        $tracking = StudentTracking::findOrFail($id);
        $tracking->update([
            'archived' => false,
            'archived_at' => null,
        ]);

        return redirect()->back()->with('success', 'Tracking record unarchived successfully');
    }

    public function restoreTracking($id)
    {
        $tracking = StudentTracking::withTrashed()->findOrFail($id);
        $tracking->restore();

        return redirect()->back()->with('success', 'Tracking record restored successfully');
    }

    public function archiveTracking($id)
    {
        $tracking = StudentTracking::findOrFail($id);
        $tracking->update([
            'archived' => true,
            'archived_at' => now(),
        ]);

        return redirect()->back()->with('success', 'Tracking record archived successfully');
    }

    public function deleteTracking($id)
    {
        $tracking = StudentTracking::findOrFail($id);
        $tracking->delete(); // Soft delete

        return redirect()->back()->with('success', 'Tracking record deleted successfully');
    }

    public function archiveStudentFromAttention($id)
    {
        $student = Student::findOrFail($id);
        
        // Change priority to Safe to remove from "Students Needing Attention" table
        $student->priority = 'Safe';
        $student->save();
        
        // Archive all active tracking records for this student
        StudentTracking::where('student_id', $student->id)
            ->where('archived', false)
            ->update([
                'archived' => true,
                'archived_at' => now(),
            ]);
        
        return redirect()->back()->with('success', 'Student archived from attention list successfully.');
    }

    public function destroyStudent($id)
    {
        $student = Student::findOrFail($id);
        $student->delete(); // Soft delete
        
        return redirect()->back()->with('success', 'Student deleted successfully.');
    }

    public function getDeletedStudents()
    {
        $deletedStudents = Student::onlyTrashed()
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
        $student = Student::onlyTrashed()->findOrFail($id);
        $student->restore();

        return redirect()->back()->with('success', 'Student restored successfully');
    }

    public function exportTracking(Request $request)
    {
        try {
            $tab = $request->get('tab', 'recent'); // 'recent', 'archived', 'deleted'
            
            // Build query based on tab
            $query = StudentTracking::with(['student.section.program.department', 'student.department', 'student.program', 'trackedBy']);
            
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
                    $tracking->time ? Carbon::parse($tracking->time)->format('H:i') : '',
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
            
            $filename = 'student_tracking_' . $tab . '_' . date('Y-m-d_His') . '.csv';
            
            return response($csvContent, 200, [
                'Content-Type' => 'text/csv; charset=UTF-8',
                'Content-Disposition' => 'attachment; filename="' . $filename . '"',
                'Content-Length' => strlen($csvContent),
                'Cache-Control' => 'no-cache, must-revalidate',
                'Pragma' => 'no-cache',
            ]);
        } catch (\Exception $e) {
            \Log::error('Export tracking failed: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Failed to export tracking records: ' . $e->getMessage());
        }
    }

    private function getLastTracking($studentId, $type = 'call')
    {
        $tracking = StudentTracking::where('student_id', $studentId)
            ->where('type', $type)
            ->where('archived', false)
            ->orderBy('date', 'desc')
            ->orderBy('created_at', 'desc')
            ->first();
        
        if (!$tracking) {
            return null;
        }
        
        return [
            'id' => $tracking->id,
            'type' => $tracking->type,
            'date' => $tracking->date->format('Y-m-d'),
            'status' => $tracking->status,
        ];
    }
}

