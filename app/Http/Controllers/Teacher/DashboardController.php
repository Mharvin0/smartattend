<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Models\AttendanceRecord;
use App\Models\Student;
use App\Models\Section;
use App\Models\Subject;
use App\Models\Schedule;
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
            
            // Check if user has teacher role
            if (!$user->hasRole('Teacher')) {
                // Redirect based on their actual role
                if ($user->hasRole('Super Admin')) {
                    return redirect()->route('super.dashboard');
                } elseif ($user->hasRole('Admin')) {
                    return redirect()->route('admin.dashboard');
                }
                // Otherwise, show 403 error
                abort(403, 'Access denied. Teacher role required.');
            }
            
            return $next($request);
        });
    }

    public function index()
    {
        try {
            // Get today's date
            $today = Carbon::today();
            
            // Get teacher's assigned sections
            $teacher = auth()->user();
            $teacherSections = $teacher->sections()->with(['program.department'])->get();
            $teacherSectionIds = $teacherSections->pluck('id');
            $teacherStudentIds = Student::whereIn('section_id', $teacherSectionIds)->pluck('id');
            
            // Get basic statistics for the teacher (only for their assigned sections)
            $todayStats = [
                'total_students' => $teacherStudentIds->count(),
                'present_today' => AttendanceRecord::whereDate('date', $today)
                    ->whereIn('student_id', $teacherStudentIds)
                    ->where('status', 'present')->count(),
                'absent_today' => AttendanceRecord::whereDate('date', $today)
                    ->whereIn('student_id', $teacherStudentIds)
                    ->where('status', 'absent')->count(),
                'late_today' => AttendanceRecord::whereDate('date', $today)
                    ->whereIn('student_id', $teacherStudentIds)
                    ->where('status', 'late')->count(),
            ];

            // Get recent attendance records for teacher's students only
            $recentRecords = AttendanceRecord::with(['student.section'])
                ->whereIn('student_id', $teacherStudentIds)
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get()
                ->map(function ($record) {
                    return [
                        'id' => $record->id,
                        'status' => $record->status,
                        'date' => $record->date,
                        'time' => $record->created_at->format('H:i'),
                        'student' => [
                            'name' => $record->student->first_name . ' ' . $record->student->last_name,
                            'section' => $record->student->section?->name ?? 'N/A',
                        ],
                    ];
                });

            // Get sections assigned to this teacher only
            $sections = $teacherSections->map(function ($section) {
                return [
                    'id' => $section->id,
                    'name' => $section->name,
                    'program' => $section->program?->name ?? 'N/A',
                    'department' => $section->program?->department?->name ?? 'N/A',
                ];
            });

            // Get subjects that this teacher is teaching (from schedules)
            $teacherSubjects = Schedule::whereHas('section', function($query) use ($teacherSectionIds) {
                $query->whereIn('id', $teacherSectionIds);
            })
            ->with('subject')
            ->get()
            ->pluck('subject')
            ->unique('id')
            ->filter()
            ->values();

            $subjects = $teacherSubjects->map(function ($subject) {
                return [
                    'id' => $subject->id,
                    'name' => $subject->name,
                    'code' => $subject->code ?? 'No code',
                ];
            });

            return Inertia::render('Teacher/Dashboard', [
                'todayStats' => $todayStats,
                'recentRecords' => $recentRecords,
                'sections' => $sections,
                'subjects' => $subjects,
            ]);
        } catch (\Exception $e) {
            \Log::error('Teacher Dashboard Error: ' . $e->getMessage());
            
            return Inertia::render('Teacher/Dashboard', [
                'todayStats' => [
                    'total_students' => 0,
                    'present_today' => 0,
                    'absent_today' => 0,
                    'late_today' => 0,
                ],
                'recentRecords' => [],
                'sections' => [],
                'subjects' => [],
            ]);
        }
    }
}
