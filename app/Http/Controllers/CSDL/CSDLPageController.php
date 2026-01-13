<?php

namespace App\Http\Controllers\CSDL;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\StudentTracking;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class CSDLPageController extends Controller
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
        $user = auth()->user();
        
        // CSDL users only see students who need home visits (PNS priority)
        // Get students with priority 'PNS' OR students with active home visit tracking records
        $studentsWithActiveTracking = StudentTracking::where('type', 'home_visit')
            ->whereIn('status', ['pending', 'to_follow', 'processing', 'completed', 'no_answer'])
            ->where('archived', false)
            ->pluck('student_id')
            ->unique()
            ->values()
            ->toArray();
        
        $studentsNeedingCalls = Student::forUser($user)
            ->where(function($query) use ($studentsWithActiveTracking) {
                // Only show students with PNS priority (home visits needed)
                $query->where('priority', 'PNS');
                if (!empty($studentsWithActiveTracking)) {
                    $query->orWhereIn('id', $studentsWithActiveTracking);
                }
            })
            ->with(['section.program.department', 'department', 'program', 'studentTracking' => function($query) {
                $query->where('type', 'home_visit')
                    ->where('archived', false)
                    ->orderBy('date', 'desc')
                    ->orderBy('created_at', 'desc')
                    ->limit(1);
            }])
            ->orderBy('priority', 'desc')
            ->orderBy('absence_count', 'desc')
            ->get()
            ->map(function ($student) use ($studentsWithActiveTracking) {
                // Only update priority if student doesn't have active scheduled tracking
                // This preserves manually set priorities for students sent to CSDL
                if (!in_array($student->id, $studentsWithActiveTracking)) {
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

        // Get recent tracking records - Filter by user's departments and only home visits
        $departmentIds = $user->getAssignedDepartmentIds();
        $recentTracking = StudentTracking::with(['student.section.program.department', 'trackedBy'])
            ->where('type', 'home_visit') // CSDL only sees home visit records
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
                    'time' => $tracking->time ? Carbon::parse($tracking->time)->format('H:i') : null,
                    'status' => $tracking->status,
                    'outcome' => $tracking->outcome,
                    'follow_up_required' => $tracking->follow_up_required,
                    'follow_up_date' => $tracking->follow_up_date ? $tracking->follow_up_date->format('Y-m-d') : null,
                    'student' => [
                        'id' => $tracking->student?->id ?? null,
                        'name' => ($tracking->student?->first_name ?? '') . ' ' . ($tracking->student?->last_name ?? ''),
                        'section' => $tracking->student?->section?->name ?? 'N/A',
                    ],
                    'tracked_by' => $tracking->trackedBy?->name ?? 'Unknown',
                    'tracked_by_id' => $tracking->tracked_by,
                    'notes' => $tracking->notes,
                    'can_edit' => true, // CSDL users can edit all tracking records
                ];
            })
            ->filter(fn($tracking) => $tracking['student']['id'] !== null);

        // Statistics - filtered by user's departments and only home visits
        $stats = [
            'students_needing_calls' => 0, // CSDL doesn't see call-needed students
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
                ->where('archived', false)
                ->whereDate('date', Carbon::today())
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
                ->where('archived', false)
                ->whereBetween('date', [
                    Carbon::now()->startOfWeek(),
                    Carbon::now()->endOfWeek()
                ])
                ->count(),
        ];

        return Inertia::render('CSDL/CSDLPage', [
            'studentsNeedingCalls' => $studentsNeedingCalls,
            'recentTracking' => $recentTracking,
            'stats' => $stats,
        ]);
    }

    public function trackStudent(Request $request)
    {
        $validated = $request->validate([
            'student_id' => 'required|exists:students,id',
            'type' => 'required|in:home_visit', // CSDL can only create home visit records
            'date' => 'required|date',
            'time' => 'nullable|date_format:H:i',
            'notes' => 'nullable|string',
            'status' => 'required|in:completed,no_answer', // CSDL can only set completed or no_answer
            'outcome' => 'nullable|string',
            'follow_up_required' => 'nullable|string',
            'follow_up_date' => 'nullable|date|after:today',
        ]);

        $tracking = StudentTracking::create([
            'student_id' => $validated['student_id'],
            'tracked_by' => auth()->id(),
            'type' => 'home_visit', // Force home_visit for CSDL
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
        
        // Ensure CSDL can only update home visit records
        if ($tracking->type !== 'home_visit') {
            abort(403, 'CSDL users can only modify home visit records');
        }

        $validated = $request->validate([
            'type' => 'required|in:home_visit', // CSDL can only update home visit records
            'date' => 'required|date',
            'time' => 'nullable|date_format:H:i',
            'notes' => 'nullable|string',
            'status' => 'required|in:completed,no_answer', // CSDL can only set completed or no_answer
            'outcome' => 'nullable|string',
            'follow_up_required' => 'nullable|string',
            'follow_up_date' => 'nullable|date|after:today', // Only future dates allowed
        ]);

        $tracking->update([
            'type' => 'home_visit', // Force home_visit for CSDL
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
        
        $archivedTracking = StudentTracking::with(['student.section.program.department', 'trackedBy'])
            ->where('type', 'home_visit') // CSDL only sees home visit records
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
                        'id' => $tracking->student->id,
                        'name' => $tracking->student->first_name . ' ' . $tracking->student->last_name,
                        'section' => $tracking->student->section?->name ?? 'N/A',
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
        ]);
    }

    public function getDeletedTracking()
    {
        $user = auth()->user();
        $departmentIds = $user->getAssignedDepartmentIds();
        
        $deletedTracking = StudentTracking::withTrashed()
            ->with(['student.section.program.department', 'trackedBy'])
            ->where('type', 'home_visit') // CSDL only sees home visit records
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
                        'id' => $tracking->student->id,
                        'name' => $tracking->student->first_name . ' ' . $tracking->student->last_name,
                        'section' => $tracking->student->section?->name ?? 'N/A',
                    ],
                    'tracked_by' => $tracking->trackedBy?->name ?? 'Unknown',
                    'tracked_by_id' => $tracking->tracked_by,
                    'notes' => $tracking->notes,
                    'deleted_at' => $tracking->deleted_at ? $tracking->deleted_at->format('Y-m-d H:i') : null,
                    'can_edit' => true,
                ];
            });

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
            
            // Build query based on tab - CSDL only exports home visit records
            $query = StudentTracking::with(['student.section.program.department', 'student.department', 'student.program', 'trackedBy'])
                ->where('type', 'home_visit'); // CSDL only sees home visit records
            
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
            
            // Generate filename
            $filename = 'csdl_tracking_records_' . $tab . '_' . date('Y-m-d_His') . '.csv';
            
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

    private function getLastTracking($studentId)
    {
        // CSDL only sees home visit tracking records
        $lastTracking = StudentTracking::where('student_id', $studentId)
            ->where('type', 'home_visit')
            ->orderBy('date', 'desc')
            ->orderBy('created_at', 'desc')
            ->first();

        if ($lastTracking) {
            return [
                'id' => $lastTracking->id,
                'type' => $lastTracking->type,
                'date' => $lastTracking->date->format('Y-m-d'),
                'status' => $lastTracking->status,
            ];
        }

        return null;
    }
}

