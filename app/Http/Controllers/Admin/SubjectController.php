<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Section;
use App\Models\Subject;
use App\Models\Department;
use App\Models\Program;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SubjectController extends Controller
{
	public function index()
	{
		$subjects = Subject::with(['section:id,name', 'department:id,name', 'program:id,name,code'])
			->orderBy('name')
			->get();
		
		$sections = Section::with(['department', 'program'])
			->orderBy('name')
			->get(['id','name','department','program','year_level','semester','adviser_name']);
		
		$departments = Department::where('is_active', true)->get(['id','name']);
		$programs = Program::where('is_active', true)->get(['id','name','code','department_id']);
		
		return Inertia::render('Admin/Subjects', [ 
			'subjects' => $subjects, 
			'sections' => $sections,
			'departments' => $departments,
			'programs' => $programs,
			'yearLevels' => Section::getYearLevels(),
			'semesters' => Section::getSemesters(),
		]);
	}

	public function store(Request $request)
	{
		$validated = $request->validate([
			'code' => ['required','string','max:50'],
			'name' => ['required','string','max:255'],
			'department' => ['required','string','max:255'],
			'program' => ['required','string','max:255'],
			'year_level' => ['required','string','max:255'],
			'semester' => ['required','string','max:255'],
			'adviser' => ['required','string','max:255'],
			'section_id' => ['nullable','integer','exists:sections,id'],
			'department_id' => ['nullable','integer','exists:departments,id'],
			'program_id' => ['nullable','integer','exists:programs,id'],
		]);
		Subject::create($validated);
		return back()->with('success','Subject created');
	}

	public function update(Request $request, Subject $subject)
	{
		$validated = $request->validate([
			'code' => ['required','string','max:50'],
			'name' => ['required','string','max:255'],
			'department' => ['required','string','max:255'],
			'program' => ['required','string','max:255'],
			'year_level' => ['required','string','max:255'],
			'semester' => ['required','string','max:255'],
			'adviser' => ['required','string','max:255'],
			'section_id' => ['nullable','integer','exists:sections,id'],
			'department_id' => ['nullable','integer','exists:departments,id'],
			'program_id' => ['nullable','integer','exists:programs,id'],
		]);
		$subject->update($validated);
		return back()->with('success','Subject updated');
	}

	public function destroy(Subject $subject)
	{
		$subject->delete();
		return back()->with('success','Subject deleted');
	}
}
