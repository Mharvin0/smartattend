<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\AttendanceRecord;
use App\Models\Student;
use App\Models\Section;
use Carbon\Carbon;

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
        $today = Carbon::today();
        $startOfWeek = $today->copy()->startOfWeek();
        $endOfWeek = $today->copy()->endOfWeek();
        $startOfMonth = $today->copy()->startOfMonth();
        $endOfMonth = $today->copy()->endOfMonth();

        // Get attendance statistics
        $stats = [
            'today' => [
                'present' => AttendanceRecord::whereDate('date', $today)->where('status', 'present')->count(),
                'absent' => AttendanceRecord::whereDate('date', $today)->where('status', 'absent')->count(),
                'late' => AttendanceRecord::whereDate('date', $today)->where('status', 'late')->count(),
                'total' => AttendanceRecord::whereDate('date', $today)->count(),
            ],
            'this_week' => [
                'present' => AttendanceRecord::whereBetween('date', [$startOfWeek, $endOfWeek])->where('status', 'present')->count(),
                'absent' => AttendanceRecord::whereBetween('date', [$startOfWeek, $endOfWeek])->where('status', 'absent')->count(),
                'late' => AttendanceRecord::whereBetween('date', [$startOfWeek, $endOfWeek])->where('status', 'late')->count(),
                'total' => AttendanceRecord::whereBetween('date', [$startOfWeek, $endOfWeek])->count(),
            ],
            'this_month' => [
                'present' => AttendanceRecord::whereBetween('date', [$startOfMonth, $endOfMonth])->where('status', 'present')->count(),
                'absent' => AttendanceRecord::whereBetween('date', [$startOfMonth, $endOfMonth])->where('status', 'absent')->count(),
                'late' => AttendanceRecord::whereBetween('date', [$startOfMonth, $endOfMonth])->where('status', 'late')->count(),
                'total' => AttendanceRecord::whereBetween('date', [$startOfMonth, $endOfMonth])->count(),
            ],
        ];

        // Get recent attendance records
        $recentRecords = AttendanceRecord::with(['student.section'])
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get()
            ->map(function ($record) {
                return [
                    'id' => $record->id,
                    'student_name' => $record->student->first_name . ' ' . $record->student->last_name,
                    'section' => $record->student->section?->name ?? 'No Section',
                    'status' => $record->status,
                    'date' => $record->date,
                    'time' => $record->created_at->format('H:i'),
                ];
            });

        // Get sections for filtering
        $sections = Section::with(['program.department'])
            ->orderBy('name')
            ->get()
            ->map(function ($section) {
                return [
                    'id' => $section->id,
                    'name' => $section->name,
                    'program' => $section->program?->name ?? 'No Program',
                    'department' => $section->program?->department?->name ?? 'No Department',
                ];
            });

        return Inertia::render('Teacher/Reports', [
            'stats' => $stats,
            'recentRecords' => $recentRecords,
            'sections' => $sections,
        ]);
    }
}
