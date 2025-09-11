<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAttendanceByScheduleRequest;
use App\Http\Requests\StoreAttendanceBySectionRequest;
use App\Http\Requests\AttendanceImportRequest;
use App\Models\AttendanceRecord;
use App\Models\AttendanceHistory;
use App\Models\Schedule;
use App\Models\Section;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AttendanceController extends Controller
{
	public function __construct()
	{
		$this->middleware(['auth', 'role:Admin|Super Admin']);
		$this->middleware('permission:capture attendance')->only(['bySection','storeSection','bySchedule','storeSchedule']);
		$this->middleware('permission:import attendance')->only(['importForm','importStore']);
	}

	public function index()
	{
		return Inertia::render('Admin/Attendance');
	}

	public function bySection(Request $request)
	{
		$sections = Section::query()->orderBy('name')->get(['id', 'name']);
		$sectionId = $request->integer('section_id');
		$students = collect();
		if ($sectionId) {
			$students = Student::query()
				->where('section_id', $sectionId)
				->orderBy('last_name')
				->get(['id', 'student_number', 'first_name', 'last_name']);
		}
		return Inertia::render('Admin/AttendanceBySection', [
			'sections' => $sections,
			'students' => $students,
			'filters' => ['section_id' => $sectionId],
		]);
	}

	public function storeSection(StoreAttendanceBySectionRequest $request)
	{
		$data = $request->validated();
		$userId = Auth::id();

		DB::transaction(function () use ($data, $userId) {
			foreach ($data['records'] as $record) {
				$existing = AttendanceRecord::where('student_id', $record['student_id'])
					->whereNull('schedule_id')
					->whereDate('date', $data['date'])
					->first();

				$updated = AttendanceRecord::updateOrCreate(
					[
						'student_id' => $record['student_id'],
						'date' => $data['date'],
						'schedule_id' => null,
					],
					[
						'status' => $record['status'],
						'remarks' => $record['remarks'] ?? null,
						'recorded_by' => $userId,
					]
				);

				AttendanceHistory::create([
					'attendance_record_id' => $updated->id,
					'student_id' => $updated->student_id,
					'date' => $updated->date,
					'schedule_id' => $updated->schedule_id,
					'old_status' => $existing?->status,
					'new_status' => $updated->status,
					'changed_by' => $userId,
					'changed_at' => now(),
					'remarks' => $updated->remarks,
				]);
			}
		});

		return redirect()->back()->with('success', 'Attendance saved.');
	}

	public function bySchedule(Request $request)
	{
		$schedules = Schedule::with('subject:id,name', 'section:id,name')
			->orderBy('day_of_week')
			->get(['id', 'subject_id', 'section_id', 'day_of_week', 'time_start', 'time_end']);
		$students = collect();
		if ($request->integer('schedule_id')) {
			$schedule = Schedule::find($request->integer('schedule_id'));
			if ($schedule) {
				$students = Student::where('section_id', $schedule->section_id)
					->orderBy('last_name')
					->get(['id', 'student_number', 'first_name', 'last_name']);
			}
		}
		return Inertia::render('Admin/AttendanceBySchedule', [
			'schedules' => $schedules,
			'students' => $students,
			'filters' => ['schedule_id' => $request->integer('schedule_id')],
		]);
	}

	public function storeSchedule(StoreAttendanceByScheduleRequest $request)
	{
		$data = $request->validated();
		$userId = Auth::id();

		DB::transaction(function () use ($data, $userId) {
			foreach ($data['records'] as $record) {
				$existing = AttendanceRecord::where('student_id', $record['student_id'])
					->where('schedule_id', $data['schedule_id'])
					->whereDate('date', $data['date'])
					->first();

				$updated = AttendanceRecord::updateOrCreate(
					[
						'student_id' => $record['student_id'],
						'date' => $data['date'],
						'schedule_id' => $data['schedule_id'],
					],
					[
						'status' => $record['status'],
						'remarks' => $record['remarks'] ?? null,
						'recorded_by' => $userId,
					]
				);

				AttendanceHistory::create([
					'attendance_record_id' => $updated->id,
					'student_id' => $updated->student_id,
					'date' => $updated->date,
					'schedule_id' => $updated->schedule_id,
					'old_status' => $existing?->status,
					'new_status' => $updated->status,
					'changed_by' => $userId,
					'changed_at' => now(),
					'remarks' => $updated->remarks,
				]);
			}
		});

		return redirect()->back()->with('success', 'Attendance saved.');
	}

	public function importForm()
	{
		return Inertia::render('Admin/AttendanceImport');
	}

	public function importStore(AttendanceImportRequest $request)
	{
		$userId = Auth::id();
		$file = $request->file('file');
		$handle = fopen($file->getRealPath(), 'r');
		$header = fgetcsv($handle);
		$normalized = array_map(fn($h) => strtolower(trim($h)), $header ?: []);
		$colIndex = [
			'student_number' => array_search('student_number', $normalized, true),
			'date' => array_search('date', $normalized, true),
			'status' => array_search('status', $normalized, true),
			'schedule_id' => array_search('schedule_id', $normalized, true),
			'remarks' => array_search('remarks', $normalized, true),
		];

		DB::transaction(function () use ($handle, $colIndex, $userId) {
			while (($row = fgetcsv($handle)) !== false) {
				$studentNumber = $row[$colIndex['student_number']] ?? null;
				$date = $row[$colIndex['date']] ?? null;
				$status = $row[$colIndex['status']] ?? null;
				$scheduleId = $colIndex['schedule_id'] !== false ? ($row[$colIndex['schedule_id']] ?: null) : null;
				$remarks = $colIndex['remarks'] !== false ? ($row[$colIndex['remarks']] ?: null) : null;

				if (!$studentNumber || !$date || !in_array($status, ['present','late','absent','excused'])) {
					continue;
				}
				$student = Student::where('student_number', $studentNumber)->first();
				if (!$student) {
					continue;
				}

				$existing = AttendanceRecord::where('student_id', $student->id)
					->when($scheduleId, fn($q) => $q->where('schedule_id', $scheduleId), fn($q) => $q->whereNull('schedule_id'))
					->whereDate('date', $date)
					->first();

				$updated = AttendanceRecord::updateOrCreate(
					[
						'student_id' => $student->id,
						'date' => $date,
						'schedule_id' => $scheduleId,
					],
					[
						'status' => $status,
						'remarks' => $remarks,
						'recorded_by' => $userId,
					]
				);

				AttendanceHistory::create([
					'attendance_record_id' => $updated->id,
					'student_id' => $student->id,
					'date' => $date,
					'schedule_id' => $scheduleId,
					'old_status' => $existing?->status,
					'new_status' => $updated->status,
					'changed_by' => $userId,
					'changed_at' => now(),
					'remarks' => $updated->remarks,
				]);
			}
			fclose($handle);
		});

		return redirect()->route('admin.attendance')->with('success', 'CSV imported.');
	}
}
