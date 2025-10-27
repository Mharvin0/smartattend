<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\Program;
use App\Models\Section;
use App\Models\Student;
use App\Models\Subject;
use App\Models\Schedule;
use App\Models\AttendanceRecord;
use App\Models\Intervention;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class TeacherPageController extends Controller
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
        return Inertia::render('Teacher/TeacherPage');
    }

    public function getLiveData()
    {
        $today = Carbon::today();
        
        // Real-time statistics
        $stats = [
            'present' => AttendanceRecord::whereDate('date', $today)->where('status', 'present')->count(),
            'absent' => AttendanceRecord::whereDate('date', $today)->where('status', 'absent')->count(),
            'late' => AttendanceRecord::whereDate('date', $today)->where('status', 'late')->count(),
            'excused' => AttendanceRecord::whereDate('date', $today)->where('status', 'excused')->count(),
            'total' => AttendanceRecord::whereDate('date', $today)->count(),
        ];

        // Recent activity
        $recentActivity = AttendanceRecord::with(['student.section.program.department'])
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($record) {
                return [
                    'id' => $record->id,
                    'status' => $record->status,
                    'time' => $record->created_at->format('H:i'),
                    'student' => [
                        'name' => $record->student->first_name . ' ' . $record->student->last_name,
                        'section' => $record->student->section?->name ?? 'N/A',
                        'department' => $record->student->section?->program?->department?->name ?? 'N/A',
                    ],
                ];
            });

        return response()->json([
            'stats' => $stats,
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

    private function getAttendanceBySection()
    {
        return Section::with(['program.department'])
            ->get()
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
        return Student::with(['section.program.department'])
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
            'high_priority' => Intervention::where('priority', 'high')->count(),
        ];
    }
}
