<?php

namespace App\Http\Controllers\Teacher;

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

    public function index(Request $request)
    {
        $teacher = auth()->user();
        
        // Get students from teacher's assigned sections only
        $studentsQuery = Student::whereIn('section_id', $teacher->sections()->pluck('sections.id'))
            ->with(['section.program.department'])
            ->orderBy('last_name')
            ->orderBy('first_name');

        // Apply filters
        if ($request->filled('section')) {
            $studentsQuery->where('section_id', $request->section);
        }

        if ($request->filled('search')) {
            $searchTerm = $request->search;
            $studentsQuery->where(function ($query) use ($searchTerm) {
                $query->where('first_name', 'like', "%{$searchTerm}%")
                      ->orWhere('last_name', 'like', "%{$searchTerm}%")
                      ->orWhere('student_id', 'like', "%{$searchTerm}%");
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

        // Get sections for filter dropdown (only teacher's assigned sections)
        $sections = $teacher->sections()
            ->with(['program.department'])
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

        return Inertia::render('Teacher/Students', [
            'students' => $students,
            'sections' => $sections,
            'filters' => $request->only(['section', 'search']),
        ]);
    }
}
