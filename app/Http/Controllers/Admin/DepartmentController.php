<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\Program;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DepartmentController extends Controller
{
    public function __construct()
    {
        $this->middleware(['auth', 'role:Super Admin']);
    }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $departments = Department::with('programs')->orderBy('name')->get();
        
        return Inertia::render('Admin/Departments', [
            'departments' => $departments,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:10', 'unique:departments,code'],
            'description' => ['nullable', 'string'],
            'is_active' => ['boolean'],
        ]);

        Department::create($validated);
        return back()->with('success', 'Department created successfully');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Department $department)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:10', 'unique:departments,code,' . $department->id],
            'description' => ['nullable', 'string'],
            'is_active' => ['boolean'],
        ]);

        $department->update($validated);
        return back()->with('success', 'Department updated successfully');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Department $department)
    {
        try {
            // Check if department has any sections
            if ($department->sections()->count() > 0) {
                return back()->with('error', 'Cannot delete department. It has associated sections. Please reassign or delete the sections first.');
            }

            // Check if department has any subjects
            $subjectsCount = \App\Models\Subject::where('department', $department->name)->count();
            if ($subjectsCount > 0) {
                return back()->with('error', 'Cannot delete department. It has associated subjects. Please reassign or delete the subjects first.');
            }

            // Delete associated programs first
            $department->programs()->delete();
            
            // Then delete the department
            $department->delete();
            
            return back()->with('success', 'Department and all associated programs deleted successfully');
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to delete department: ' . $e->getMessage());
        }
    }

    /**
     * Store a new program for a department
     */
    public function storeProgram(Request $request)
    {
        $validated = $request->validate([
            'department_id' => ['required', 'exists:departments,id'],
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:10', 'unique:programs,code'],
            'description' => ['nullable', 'string'],
            'duration_years' => ['required', 'integer', 'min:1', 'max:10'],
            'is_active' => ['boolean'],
        ]);

        Program::create($validated);
        return back()->with('success', 'Program created successfully');
    }

    /**
     * Update a program
     */
    public function updateProgram(Request $request, Program $program)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:10', 'unique:programs,code,' . $program->id],
            'description' => ['nullable', 'string'],
            'duration_years' => ['required', 'integer', 'min:1', 'max:10'],
            'is_active' => ['boolean'],
        ]);

        $program->update($validated);
        return back()->with('success', 'Program updated successfully');
    }

    /**
     * Delete a program
     */
    public function destroyProgram(Program $program)
    {
        try {
            // Check if program has any sections
            if ($program->sections()->count() > 0) {
                return back()->with('error', 'Cannot delete program. It has associated sections. Please reassign or delete the sections first.');
            }

            // Check if program has any subjects
            $subjectsCount = \App\Models\Subject::where('program', $program->code)->count();
            if ($subjectsCount > 0) {
                return back()->with('error', 'Cannot delete program. It has associated subjects. Please reassign or delete the subjects first.');
            }

            $program->delete();
            return back()->with('success', 'Program deleted successfully');
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to delete program: ' . $e->getMessage());
        }
    }
}
