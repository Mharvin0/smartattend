<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Inertia\Inertia;

class AdminPageController extends Controller
{
    public function index()
    {
        // Get all sections with their programs
        $sections = \App\Models\Section::with('program')->get();
        
        // Get all students with their sections
        $students = \App\Models\Student::with(['section.program'])->get();
        
        // Get all subjects with teachers
        $subjects = \App\Models\Subject::with('teacher')->get();
        
        // Get all schedules
        $schedules = \App\Models\Schedule::with(['section', 'subject', 'teacher'])->get();

        // Get today's attendance statistics
        $today = \Carbon\Carbon::today();
        $todayStats = [
            'present' => \App\Models\AttendanceRecord::whereDate('date', $today)
                ->where('status', 'present')->count(),
            'absent' => \App\Models\AttendanceRecord::whereDate('date', $today)
                ->where('status', 'absent')->count(),
            'late' => \App\Models\AttendanceRecord::whereDate('date', $today)
                ->where('status', 'late')->count(),
            'total' => \App\Models\AttendanceRecord::whereDate('date', $today)->count(),
        ];

        // Calculate overall attendance rate
        $totalRecords = \App\Models\AttendanceRecord::count();
        $presentRecords = \App\Models\AttendanceRecord::where('status', 'present')->count();
        $attendanceRate = $totalRecords > 0 ? round(($presentRecords / $totalRecords) * 100, 1) : 0;

        // Get recent attendance records
        $recentRecords = \App\Models\AttendanceRecord::with(['student.section'])
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($record) {
                return [
                    'id' => $record->id,
                    'status' => $record->status,
                    'date' => $record->date,
                    'student' => [
                        'first_name' => $record->student->first_name ?? '',
                        'last_name' => $record->student->last_name ?? '',
                        'section' => [
                            'name' => $record->student->section->name ?? '',
                        ],
                    ],
                ];
            });

        return Inertia::render('Admin/AdminPage', [
            'sections' => $sections,
            'students' => $students,
            'subjects' => $subjects,
            'schedules' => $schedules,
            'todayStats' => $todayStats,
            'attendanceRate' => $attendanceRate,
            'recentRecords' => $recentRecords,
        ]);
    }
}
