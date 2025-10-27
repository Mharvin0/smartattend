<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Section;
use App\Models\Subject;
use App\Models\Schedule;

class ClassController extends Controller
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
        
        // Get only sections assigned to this teacher
        $sectionsQuery = $teacher->sections()
            ->with(['program.department', 'students', 'department'])
            ->orderBy('name');

        // Apply filters
        if ($request->filled('department')) {
            $sectionsQuery->whereHas('program.department', function ($query) use ($request) {
                $query->where('name', $request->department);
            });
        }

        if ($request->filled('year_level')) {
            $sectionsQuery->where('year_level', $request->year_level);
        }


        $sections = $sectionsQuery->get()->map(function ($section) {
            // Manually load program and department data
            $program = \App\Models\Program::find($section->program_id);
            $department = $program ? \App\Models\Department::find($program->department_id) : null;
            
            // Get students for this section
            $students = $section->students->map(function ($student) {
                // Update priority for this student
                $student->updatePriority();
                
                return [
                    'id' => $student->id,
                    'student_id' => $student->student_id,
                    'name' => $student->first_name . ' ' . $student->last_name,
                    'email' => $student->email,
                    'status' => $student->status ?? 'Active',
                    'priority' => $student->priority ?? 'Safe',
                    'absence_count' => $student->absence_count ?? 0,
                ];
            });
            
            return [
                'id' => $section->id,
                'name' => $section->name,
                'year_level' => $section->year_level ?? 'Not Specified',
                'program' => $program ? $program->name : 'No Program',
                'department' => $department ? $department->name : 'No Department',
                'student_count' => $section->students->count(),
                'adviser_name' => $section->adviser_name ?? 'TBA',
                'semester' => $section->semester ?? 'Not Specified',
                'academic_year' => $section->academic_year ?? 'Not Specified',
                'subject' => $section->pivot->subject ?? 'General',
                'students' => $students,
            ];
        });


        // Get filter options
        $departments = $teacher->sections()
            ->with('program.department')
            ->get()
            ->pluck('program.department.name')
            ->filter()
            ->unique()
            ->values();

        $yearLevels = $teacher->sections()
            ->pluck('year_level')
            ->unique()
            ->filter()
            ->values();

        return Inertia::render('Teacher/Classes', [
            'sections' => $sections,
            'departments' => $departments,
            'yearLevels' => $yearLevels,
            'filters' => $request->only(['department', 'year_level']),
        ]);
    }
}
