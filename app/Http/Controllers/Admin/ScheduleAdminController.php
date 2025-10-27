<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Schedule;
use App\Models\Section;
use App\Models\Subject;
use App\Models\Department;
use App\Models\Program;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ScheduleAdminController extends Controller
{
	public function index(Request $request)
	{
		// Get filter parameters
		$filters = [
			'department_id' => $request->get('department_id'),
			'program_id' => $request->get('program_id'),
			'section_id' => $request->get('section_id'),
			'subject_id' => $request->get('subject_id'),
			'day' => $request->get('day'),
			'search' => $request->get('search'),
		];

		// Build query with filters
		$query = Schedule::with(['subject:id,name,code', 'section:id,name', 'department:id,name', 'program:id,name']);

		// Apply filters
		if ($filters['department_id']) {
			$query->where('department_id', $filters['department_id']);
		}
		if ($filters['program_id']) {
			$query->where('program_id', $filters['program_id']);
		}
		if ($filters['section_id']) {
			$query->where('section_id', $filters['section_id']);
		}
		if ($filters['subject_id']) {
			$query->where('subject_id', $filters['subject_id']);
		}
		if ($filters['day']) {
			$query->where('day', $filters['day']);
		}
		if ($filters['search']) {
			$query->where(function($q) use ($filters) {
				$q->whereHas('subject', function($sq) use ($filters) {
					$sq->where('name', 'like', '%' . $filters['search'] . '%')
					  ->orWhere('code', 'like', '%' . $filters['search'] . '%');
				})
				->orWhereHas('section', function($sq) use ($filters) {
					$sq->where('name', 'like', '%' . $filters['search'] . '%');
				})
				->orWhere('day', 'like', '%' . $filters['search'] . '%');
			});
		}

		$schedules = $query->orderBy('day_of_week')->orderBy('time_start')->get();

		// Get filter options
		$departments = Department::orderBy('name')->get(['id', 'name']);
		$programs = Program::with('department')->orderBy('name')->get(['id', 'name', 'department_id']);
		$sections = Section::with('program')->orderBy('name')->get(['id', 'name', 'program_id']);
		$subjects = Subject::with('program')->orderBy('name')->get(['id', 'name', 'code', 'program_id']);
		$days = Schedule::getDays();

		return Inertia::render('Admin/Schedules', [
			'schedules' => $schedules,
			'departments' => $departments,
			'programs' => $programs,
			'sections' => $sections,
			'subjects' => $subjects,
			'days' => $days,
			'filters' => $filters,
		]);
	}

	public function store(Request $request)
	{
		$validated = $request->validate([
			'department_id' => ['required','integer','exists:departments,id'],
			'program_id' => ['required','integer','exists:programs,id'],
			'section_id' => ['required','integer','exists:sections,id'],
			'subject_id' => ['required','integer','exists:subjects,id'],
			'day' => ['required','string','in:Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday'],
			'time_start' => ['required','date_format:H:i'],
			'time_end' => ['required','date_format:H:i','after:time_start'],
		]);

		// Convert day name to day_of_week number
		$dayMap = [
			'Monday' => 1, 'Tuesday' => 2, 'Wednesday' => 3, 'Thursday' => 4,
			'Friday' => 5, 'Saturday' => 6, 'Sunday' => 7
		];
		$validated['day_of_week'] = $dayMap[$validated['day']];

		// Get department and program names
		$department = Department::find($validated['department_id']);
		$program = Program::find($validated['program_id']);
		$validated['department'] = $department->name;
		$validated['program'] = $program->name;

		Schedule::create($validated);
		return back()->with('success','Schedule created successfully');
	}

	public function update(Request $request, Schedule $schedule)
	{
		$validated = $request->validate([
			'department_id' => ['required','integer','exists:departments,id'],
			'program_id' => ['required','integer','exists:programs,id'],
			'section_id' => ['required','integer','exists:sections,id'],
			'subject_id' => ['required','integer','exists:subjects,id'],
			'day' => ['required','string','in:Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday'],
			'time_start' => ['required','date_format:H:i'],
			'time_end' => ['required','date_format:H:i','after:time_start'],
		]);

		// Convert day name to day_of_week number
		$dayMap = [
			'Monday' => 1, 'Tuesday' => 2, 'Wednesday' => 3, 'Thursday' => 4,
			'Friday' => 5, 'Saturday' => 6, 'Sunday' => 7
		];
		$validated['day_of_week'] = $dayMap[$validated['day']];

		// Get department and program names
		$department = Department::find($validated['department_id']);
		$program = Program::find($validated['program_id']);
		$validated['department'] = $department->name;
		$validated['program'] = $program->name;

		$schedule->update($validated);
		return back()->with('success','Schedule updated successfully');
	}

	public function destroy(Schedule $schedule)
	{
		$schedule->delete();
		return back()->with('success','Schedule deleted');
	}
}
