<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Department;
use App\Models\Program;
use App\Services\AuditLogService;
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
            'name' => ['required', 'string', 'max:255', 'unique:departments,name,NULL,id,deleted_at,NULL'],
            'code' => ['required', 'string', 'max:10', 'unique:departments,code,NULL,id,deleted_at,NULL'],
            'description' => ['nullable', 'string'],
            'is_active' => ['boolean'],
        ]);

        try {
            // Create the department
            $department = Department::create($validated);

            AuditLogService::logDataManagement(
                AuditLog::TYPE_DATA_CREATE,
                "Department created: {$department->name}",
                [
                    'department_id' => $department->id,
                    'department_name' => $department->name,
                    'department_code' => $department->code,
                ]
            );

            return back()->with('success', "Department '{$validated['name']}' created successfully!");
        } catch (\Illuminate\Database\QueryException $e) {
            // Handle database constraint violations
            if ($e->getCode() == 23000) { // MySQL duplicate entry error
                if (str_contains($e->getMessage(), 'departments_code_unique')) {
                    return back()->with('error', "Department with code '{$validated['code']}' already exists. Please choose a different code.");
                } elseif (str_contains($e->getMessage(), 'departments_name_unique')) {
                    return back()->with('error', "Department with name '{$validated['name']}' already exists. Please choose a different name.");
                }
            }
            return back()->with('error', 'Failed to create department: ' . $e->getMessage());
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to create department: ' . $e->getMessage());
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Department $department)
    {
        $original = $department->only(['name', 'code', 'description', 'is_active']);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:departments,name,' . $department->id . ',id,deleted_at,NULL'],
            'code' => ['required', 'string', 'max:10', 'unique:departments,code,' . $department->id . ',id,deleted_at,NULL'],
            'description' => ['nullable', 'string'],
            'is_active' => ['boolean'],
        ]);

        $department->update($validated);

        AuditLogService::logDataManagement(
            AuditLog::TYPE_DATA_UPDATE,
            "Department updated: {$department->name}",
            [
                'department_id' => $department->id,
                'old_values' => $original,
                'new_values' => $department->only(['name', 'code', 'description', 'is_active']),
            ]
        );

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

            AuditLogService::logDataManagement(
                AuditLog::TYPE_DATA_DELETE,
                "Department deleted: {$department->name}",
                [
                    'department_id' => $department->id,
                    'department_name' => $department->name,
                ]
            );
            
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
            'code' => ['required', 'string', 'max:10', 'unique:programs,code,NULL,id,deleted_at,NULL'],
            'description' => ['nullable', 'string'],
            'duration_years' => ['required', 'integer', 'min:1', 'max:10'],
            'is_active' => ['boolean'],
        ]);

        try {
            // Create the program
            $program = Program::create($validated);

            AuditLogService::logDataManagement(
                AuditLog::TYPE_DATA_CREATE,
                "Program created: {$program->name}",
                [
                    'program_id' => $program->id,
                    'program_name' => $program->name,
                    'program_code' => $program->code,
                    'department_id' => $program->department_id,
                ]
            );

            return back()->with('success', "Program '{$validated['name']}' created successfully!");
        } catch (\Illuminate\Database\QueryException $e) {
            // Handle database constraint violations
            if ($e->getCode() == 23000) { // MySQL duplicate entry error
                if (str_contains($e->getMessage(), 'programs_code_unique')) {
                    return back()->with('error', "Program with code '{$validated['code']}' already exists. Please choose a different code.");
                }
            }
            return back()->with('error', 'Failed to create program: ' . $e->getMessage());
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to create program: ' . $e->getMessage());
        }
    }

    /**
     * Update a program
     */
    public function updateProgram(Request $request, Program $program)
    {
        $original = $program->only(['name', 'code', 'description', 'duration_years', 'is_active']);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:10', 'unique:programs,code,' . $program->id . ',id,deleted_at,NULL'],
            'description' => ['nullable', 'string'],
            'duration_years' => ['required', 'integer', 'min:1', 'max:10'],
            'is_active' => ['boolean'],
        ]);

        $program->update($validated);

        AuditLogService::logDataManagement(
            AuditLog::TYPE_DATA_UPDATE,
            "Program updated: {$program->name}",
            [
                'program_id' => $program->id,
                'old_values' => $original,
                'new_values' => $program->only(['name', 'code', 'description', 'duration_years', 'is_active']),
            ]
        );

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

            $programName = $program->name;
            $programId = $program->id;
            $program->delete();

            AuditLogService::logDataManagement(
                AuditLog::TYPE_DATA_DELETE,
                "Program deleted: {$programName}",
                [
                    'program_id' => $programId,
                    'program_name' => $programName,
                ]
            );

            return back()->with('success', 'Program deleted successfully');
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to delete program: ' . $e->getMessage());
        }
    }
}
