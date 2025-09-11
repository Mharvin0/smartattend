<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Section;
use App\Models\Subject;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SubjectController extends Controller
{
	public function index()
	{
		$subjects = Subject::with('section:id,name')->orderBy('name')->get();
		$sections = Section::orderBy('name')->get(['id','name']);
		return Inertia::render('Admin/Subjects', [ 'subjects' => $subjects, 'sections' => $sections ]);
	}

	public function store(Request $request)
	{
		$validated = $request->validate([
			'code' => ['required','string','max:50'],
			'name' => ['required','string','max:255'],
			'section_id' => ['nullable','integer','exists:sections,id'],
		]);
		Subject::create($validated);
		return back()->with('success','Subject created');
	}

	public function update(Request $request, Subject $subject)
	{
		$validated = $request->validate([
			'code' => ['required','string','max:50'],
			'name' => ['required','string','max:255'],
			'section_id' => ['nullable','integer','exists:sections,id'],
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
