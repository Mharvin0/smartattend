<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Student;
use App\Models\Section;

class StudentController extends Controller
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
            
            // Check if user has admin role
            if (!$user->hasRole('Admin')) {
                // Redirect based on their actual role
                if ($user->hasRole('Super Admin')) {
                    return redirect()->route('super.dashboard');
                } elseif ($user->hasRole('Teacher')) {
                    return redirect()->route('teacher.dashboard');
                }
                // Otherwise, show 403 error
                abort(403, 'Access denied. Admin role required.');
            }
            
            return $next($request);
        });
    }

    public function index(Request $request)
    {
        // Get all students with their sections and priority information
        $studentsQuery = Student::with(['section.program.department'])
            ->orderBy('last_name')
            ->orderBy('first_name');

        // Apply filters
        if ($request->filled('section')) {
            $studentsQuery->where('section_id', $request->section);
        }

        if ($request->filled('priority')) {
            $studentsQuery->where('priority', $request->priority);
        }

        if ($request->filled('search')) {
            $searchTerm = $request->search;
            $studentsQuery->where(function ($query) use ($searchTerm) {
                $query->where('first_name', 'like', "%{$searchTerm}%")
                      ->orWhere('last_name', 'like', "%{$searchTerm}%")
                      ->orWhere('student_id', 'like', "%{$searchTerm}%")
                      ->orWhere('email', 'like', "%{$searchTerm}%");
            });
        }

        $students = $studentsQuery->get()->map(function ($student) {
            // Update priority for this student
            $student->updatePriority();
            
            return [
                'id' => $student->id,
                'student_id' => $student->student_id,
                'name' => $student->first_name . ' ' . $student->last_name,
                'email' => $student->email,
                'section' => $student->section?->name ?? 'No Section',
                'program' => $student->section?->program?->name ?? 'No Program',
                'department' => $student->section?->program?->department?->name ?? 'No Department',
                'year_level' => $student->section?->year_level ?? 'N/A',
                'status' => $student->status ?? 'Active',
                'priority' => $student->priority ?? 'Safe',
                'absence_count' => $student->absence_count ?? 0,
            ];
        });

        // Get sections for filter dropdown
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

        // Get priority options
        $priorities = ['Safe', 'Call Needed', 'PNS'];

        // Get statistics
        $stats = [
            'total_students' => Student::count(),
            'safe_count' => Student::where('priority', 'Safe')->count(),
            'call_needed_count' => Student::where('priority', 'Call Needed')->count(),
            'pns_count' => Student::where('priority', 'PNS')->count(),
        ];

        return Inertia::render('Admin/Students', [
            'students' => $students,
            'sections' => $sections,
            'priorities' => $priorities,
            'stats' => $stats,
            'filters' => $request->only(['section', 'priority', 'search']),
        ]);
    }

    public function show(Student $student)
    {
        // Update priority for this student
        $student->updatePriority();
        
        $studentData = [
            'id' => $student->id,
            'student_id' => $student->student_id,
            'name' => $student->first_name . ' ' . $student->last_name,
            'email' => $student->email,
            'section' => $student->section?->name ?? 'No Section',
            'program' => $student->section?->program?->name ?? 'No Program',
            'department' => $student->section?->program?->department?->name ?? 'No Department',
            'year_level' => $student->section?->year_level ?? 'N/A',
            'status' => $student->status ?? 'Active',
            'priority' => $student->priority ?? 'Safe',
            'absence_count' => $student->absence_count ?? 0,
        ];

        return Inertia::render('Admin/StudentProfile', [
            'student' => $studentData,
        ]);
    }

    public function updatePriority(Request $request)
    {
        $request->validate([
            'student_id' => 'required|exists:students,id',
        ]);

        $student = Student::findOrFail($request->student_id);
        $newPriority = $student->updatePriority();

        return response()->json([
            'success' => true,
            'priority' => $newPriority,
            'absence_count' => $student->absence_count,
            'message' => 'Student priority updated successfully'
        ]);
    }

    public function updateAllPriorities()
    {
        $students = Student::all();
        $updated = 0;

        foreach ($students as $student) {
            $student->updatePriority();
            $updated++;
        }

        return response()->json([
            'success' => true,
            'updated_count' => $updated,
            'message' => "Updated priorities for {$updated} students"
        ]);
    }
}