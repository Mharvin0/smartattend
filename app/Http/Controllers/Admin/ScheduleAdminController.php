<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Schedule;
use App\Models\Section;
use App\Models\Subject;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ScheduleAdminController extends Controller
{
	public function index()
	{
		$schedules = Schedule::with('subject:id,name', 'section:id,name')->orderBy('day_of_week')->get();
		$sections = Section::orderBy('name')->get(['id','name']);
		$subjects = Subject::orderBy('name')->get(['id','name']);
		return Inertia::render('Admin/Schedules', [
			'schedules' => $schedules,
			'sections' => $sections,
			'subjects' => $subjects,
		]);
	}

	public function store(Request $request)
	{
		$validated = $request->validate([
			'section_id' => ['required','integer','exists:sections,id'],
			'subject_id' => ['required','integer','exists:subjects,id'],
			'day_of_week' => ['required','integer','between:1,7'],
			'time_start' => ['required','date_format:H:i'],
			'time_end' => ['required','date_format:H:i','after:time_start'],
		]);
		Schedule::create($validated);
		return back()->with('success','Schedule created');
	}

	public function update(Request $request, Schedule $schedule)
	{
		$validated = $request->validate([
			'section_id' => ['required','integer','exists:sections,id'],
			'subject_id' => ['required','integer','exists:subjects,id'],
			'day_of_week' => ['required','integer','between:1,7'],
			'time_start' => ['required','date_format:H:i'],
			'time_end' => ['required','date_format:H:i','after:time_start'],
		]);
		$schedule->update($validated);
		return back()->with('success','Schedule updated');
	}

	public function destroy(Schedule $schedule)
	{
		$schedule->delete();
		return back()->with('success','Schedule deleted');
	}
}
